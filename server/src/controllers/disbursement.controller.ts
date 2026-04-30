import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Loan } from '../models/Loan.model';

function getPagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit ?? '10'), 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// GET /api/disbursement/loans?page=1&limit=10
export const getSanctionedLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = { status: 'sanctioned' };

    const [items, total] = await Promise.all([
      Loan.find(query)
        .populate('borrowerId', 'email role')
        .populate('profileId', 'fullName pan monthlySalary employmentMode')
        .sort({ sanctionedAt: -1 })
        .skip(skip)
        .limit(limit),
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

// PATCH /api/disbursement/loans/:id/disburse
export const disburseLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid loan ID' });
      return;
    }

    const loan = await Loan.findById(id);

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }

    if (loan.status !== 'sanctioned') {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: loan is '${loan.status}'. Only 'sanctioned' loans can be disbursed.`,
      });
      return;
    }

    loan.status = 'disbursed';
    loan.disbursedBy = new mongoose.Types.ObjectId(req.user!._id);
    loan.disbursedAt = new Date();

    await loan.save();

    res.status(200).json({
      success: true,
      data: {
        loan,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
