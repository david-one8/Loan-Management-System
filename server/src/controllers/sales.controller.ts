import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { BorrowerProfile } from '../models/BorrowerProfile.model';
import { Loan } from '../models/Loan.model';

function getPagination(query: Request['query']): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit ?? '10'), 10) || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// GET /api/sales/leads?page=1&limit=10
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const usersWithLoans = await Loan.distinct('borrowerId');
    const borrowerQuery = { role: 'borrower', _id: { $nin: usersWithLoans } };

    const [borrowers, total] = await Promise.all([
      User.find(borrowerQuery)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(borrowerQuery),
    ]);

    const borrowerIds = borrowers.map((borrower) => borrower._id);
    const profiles = await BorrowerProfile.find({ userId: { $in: borrowerIds } }).lean();
    const profileMap = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    const items = borrowers.map((borrower) => ({
      _id: borrower._id,
      email: borrower.email,
      createdAt: borrower.createdAt,
      profile: profileMap.get(String(borrower._id)) ?? null,
    }));

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
