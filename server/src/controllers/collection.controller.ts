import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Loan } from '../models/Loan.model';
import { Payment } from '../models/Payment.model';

function getPagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit ?? '10'), 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// GET /api/collection/loans?page=1&limit=10
export const getDisbursedLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = { status: 'disbursed' };

    const [items, total] = await Promise.all([
      Loan.find(query)
        .populate('borrowerId', 'email role')
        .populate('profileId', 'fullName pan')
        .sort({ disbursedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('borrowerId profileId amount tenure totalRepayment totalPaid outstandingBalance disbursedAt status'),
      Loan.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/collection/loans/:id/payment
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { utrNumber, amount, paymentDate } = req.body as {
      utrNumber?: string;
      amount?: number | string;
      paymentDate?: string;
    };

    if (!utrNumber || amount === undefined || !paymentDate) {
      res.status(400).json({
        success: false,
        message: 'utrNumber, amount, and paymentDate are all required',
      });
      return;
    }

    const numAmount = Number(amount);

    if (Number.isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'amount must be a positive number' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid loan ID' });
      return;
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }

    if (loan.status !== 'disbursed') {
      res.status(400).json({
        success: false,
        message: `Loan must be 'disbursed' to record a payment. Current status: '${loan.status}'.`,
      });
      return;
    }

    const cleanUtrNumber = String(utrNumber).trim();
    const existingPayment = await Payment.findOne({ utrNumber: cleanUtrNumber });

    if (existingPayment) {
      res.status(409).json({
        success: false,
        message: `UTR '${cleanUtrNumber}' already exists. Duplicate payments are not allowed.`,
      });
      return;
    }

    if (numAmount > loan.outstandingBalance) {
      res.status(400).json({
        success: false,
        message: `Amount (${numAmount.toFixed(2)}) exceeds outstanding balance (${loan.outstandingBalance.toFixed(2)}).`,
      });
      return;
    }

    const payment = await Payment.create({
      loanId: loan._id,
      utrNumber: cleanUtrNumber,
      amount: numAmount,
      paymentDate: new Date(paymentDate),
      recordedBy: new mongoose.Types.ObjectId(req.user!._id),
    });

    loan.totalPaid += numAmount;
    loan.outstandingBalance = loan.totalRepayment - loan.totalPaid;

    let isClosed = false;

    if (loan.outstandingBalance <= 0) {
      loan.status = 'closed';
      loan.closedAt = new Date();
      loan.outstandingBalance = 0;
      isClosed = true;
    }

    await loan.save();

    res.status(201).json({
      success: true,
      data: {
        payment,
        loan,
        isClosed,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
