import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { BorrowerProfile } from '../models/BorrowerProfile.model';
import { Loan } from '../models/Loan.model';

// GET /api/sales/leads?page=1&limit=10
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(String(req.query['page']  ?? '1'))  || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query['limit'] ?? '10')) || 10));
    const skip  = (page - 1) * limit;

    // Borrowers who have NOT yet applied for any loan
    const usersWithLoans = await Loan.distinct('borrowerId');

    const [borrowers, total] = await Promise.all([
      User.find({ role: 'borrower', _id: { $nin: usersWithLoans } })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ role: 'borrower', _id: { $nin: usersWithLoans } }),
    ]);

    const borrowerIds = borrowers.map((b) => b._id);
    const profiles    = await BorrowerProfile.find({ userId: { $in: borrowerIds } }).lean();
    const profileMap  = new Map(profiles.map((p) => [String(p.userId), p]));

    const leads = borrowers.map((b) => ({
      user:    b,
      profile: profileMap.get(String(b._id)) ?? null,
    }));

    res.status(200).json({
      success: true,
      leads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', errors: err });
  }
};