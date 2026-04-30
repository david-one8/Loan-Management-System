import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BorrowerProfile, IBorrowerProfile } from '../models/BorrowerProfile.model';
import { Loan } from '../models/Loan.model';
import { Payment } from '../models/Payment.model';
import { runBRE } from '../services/bre.service';

type EmploymentMode = IBorrowerProfile['employmentMode'];

const ACTIVE_LOAN_STATUSES = ['applied', 'sanctioned', 'disbursed'];

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

// GET /api/borrower/profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const profile = await BorrowerProfile.findOne({ userId });

    res.status(200).json({
      success: true,
      data: {
        profile: profile ?? null,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/borrower/profile
export const saveProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body as {
      fullName?: string;
      pan?: string;
      dob?: string;
      monthlySalary?: number | string;
      employmentMode?: EmploymentMode;
    };

    if (!fullName || !pan || !dob || monthlySalary === undefined || !employmentMode) {
      res.status(400).json({
        success: false,
        message: 'fullName, pan, dob, monthlySalary, and employmentMode are all required',
      });
      return;
    }

    const existingProfile = await BorrowerProfile.findOne({ userId });
    const profile =
      existingProfile ??
      new BorrowerProfile({
        userId: toObjectId(userId),
      });

    profile.fullName = String(fullName).trim();
    profile.pan = String(pan).toUpperCase().trim();
    profile.dob = new Date(dob);
    profile.monthlySalary = Number(monthlySalary);
    profile.employmentMode = employmentMode;

    const bre = runBRE(profile);
    profile.breStatus = bre.passed ? 'passed' : 'failed';
    profile.breFailReason = bre.reason;

    await profile.save();

    if (!bre.passed) {
      res.status(422).json({
        success: false,
        message: 'BRE check failed',
        data: {
          profile,
          bre: {
            passed: false,
            reason: bre.reason,
          },
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        profile,
        bre,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/borrower/upload-slip
export const uploadSlip = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const profile = await BorrowerProfile.findOne({ userId });

    if (!profile || profile.breStatus !== 'passed') {
      res.status(422).json({
        success: false,
        message: 'BRE check must pass before uploading salary slip',
      });
      return;
    }

    profile.salarySlipUrl = `/uploads/${req.file.filename}`;
    profile.salarySlipFileName = req.file.originalname;
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        salarySlipUrl: profile.salarySlipUrl,
        salarySlipFileName: profile.salarySlipFileName,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// POST /api/borrower/apply
export const applyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { amount, tenure } = req.body as {
      amount?: number | string;
      tenure?: number | string;
    };

    if (amount === undefined || tenure === undefined) {
      res.status(400).json({ success: false, message: 'amount and tenure are required' });
      return;
    }

    const numAmount = Number(amount);
    const numTenure = Number(tenure);

    if (Number.isNaN(numAmount) || numAmount < 50000 || numAmount > 500000) {
      res.status(400).json({
        success: false,
        message: 'amount must be between 50000 and 500000',
      });
      return;
    }

    if (
      Number.isNaN(numTenure) ||
      !Number.isInteger(numTenure) ||
      numTenure < 30 ||
      numTenure > 365
    ) {
      res.status(400).json({
        success: false,
        message: 'tenure must be an integer between 30 and 365 days',
      });
      return;
    }

    const profile = await BorrowerProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Borrower profile not found. Please complete your profile first.',
      });
      return;
    }

    if (profile.breStatus !== 'passed') {
      res.status(422).json({
        success: false,
        message: `BRE has not passed (current: '${profile.breStatus}'). Update your profile to re-run BRE.`,
      });
      return;
    }

    if (!profile.salarySlipUrl) {
      res.status(422).json({
        success: false,
        message: 'Salary slip not uploaded. Use POST /api/borrower/upload-slip.',
      });
      return;
    }

    const activeLoan = await Loan.findOne({
      borrowerId: userId,
      status: { $in: ACTIVE_LOAN_STATUSES },
    });

    if (activeLoan) {
      res.status(409).json({
        success: false,
        message: `Active loan already exists (status: '${activeLoan.status}'). One active loan per borrower.`,
      });
      return;
    }

    const interestRate = 12;
    const simpleInterest = (numAmount * interestRate * numTenure) / (365 * 100);
    const totalRepayment = numAmount + simpleInterest;

    const loan = await Loan.create({
      borrowerId: toObjectId(userId),
      profileId: profile._id,
      amount: numAmount,
      tenure: numTenure,
      interestRate,
      simpleInterest,
      totalRepayment,
      totalPaid: 0,
      outstandingBalance: totalRepayment,
      status: 'applied',
    });

    res.status(201).json({
      success: true,
      data: {
        loan,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/borrower/loan
export const getLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const loan = await Loan.findOne({ borrowerId: userId }).sort({ createdAt: -1 });

    if (!loan) {
      res.status(404).json({ success: false, message: 'No loan found for this borrower' });
      return;
    }

    const payments = await Payment.find({ loanId: loan._id }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        loan,
        payments,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/borrower/loan/:loanId/payments
export const getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { loanId } = req.params;

    const loan = await Loan.findOne({ _id: loanId, borrowerId: userId });

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }

    const payments = await Payment.find({ loanId: loan._id }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        payments,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
