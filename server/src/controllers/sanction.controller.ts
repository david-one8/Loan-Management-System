import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Loan } from '../models/Loan.model';

function getPagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit ?? '10'), 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// GET /api/sanction/loans?page=1&limit=10
export const getAppliedLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const query = { status: 'applied' };

    const [items, total] = await Promise.all([
      Loan.find(query)
        .populate('borrowerId', 'email role createdAt')
        .populate('profileId', 'fullName pan monthlySalary employmentMode salarySlipUrl breStatus')
        .sort({ createdAt: -1 })
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

// PATCH /api/sanction/loans/:id
export const sanctionLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body as { action?: string; reason?: string };

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
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

    if (loan.status !== 'applied') {
      res.status(400).json({
        success: false,
        message: `Invalid state transition: loan is '${loan.status}'. Only 'applied' loans can be sanctioned/rejected.`,
      });
      return;
    }

    if (action === 'approve') {
      loan.status = 'sanctioned';
      loan.sanctionedBy = new mongoose.Types.ObjectId(req.user!._id);
      loan.sanctionedAt = new Date();

      if (reason?.trim()) {
        loan.sanctionRemark = reason.trim();
      }
    } else {
      if (!reason?.trim()) {
        res.status(400).json({ success: false, message: 'reason is required when rejecting a loan' });
        return;
      }

      loan.status = 'rejected';
      loan.rejectedBy = new mongoose.Types.ObjectId(req.user!._id);
      loan.rejectedAt = new Date();
      loan.rejectionReason = reason.trim();
    }

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
