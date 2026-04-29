import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BorrowerProfile, IBorrowerProfile } from '../models/BorrowerProfile.model';
import { Loan } from '../models/Loan.model';
import { Payment } from '../models/Payment.model';
import { runBRE } from '../services/bre.service';

// POST /api/borrower/profile
export const saveProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { fullName, pan, dob, monthlySalary, employmentMode } = req.body as {
      fullName?: string;
      pan?: string;
      dob?: string;
      monthlySalary?: number | string;
      employmentMode?: string;
    };

    if (!fullName || !pan || !dob || monthlySalary === undefined || !employmentMode) {
      res.status(400).json({
        success: false,
        message: 'fullName, pan, dob, monthlySalary, and employmentMode are all required',
      });
      return;
    }

    const existingProfile = await BorrowerProfile.findOne({ userId });
    let profile: IBorrowerProfile;

    if (existingProfile) {
      existingProfile.fullName       = String(fullName).trim();
      existingProfile.pan            = String(pan).toUpperCase().trim();
      existingProfile.dob            = new Date(dob);
      existingProfile.monthlySalary  = Number(monthlySalary);
      existingProfile.employmentMode = employmentMode as IBorrowerProfile['employmentMode'];
      profile = existingProfile;
    } else {
      profile = new BorrowerProfile({
        userId: new mongoose.Types.ObjectId(userId),
        fullName:       String(fullName).trim(),
        pan:            String(pan).toUpperCase().trim(),
        dob:            new Date(dob),
        monthlySalary:  Number(monthlySalary),
        employmentMode,
      });
    }

    const breResult       = runBRE(profile);
    profile.breStatus     = breResult.passed ? 'passed' : 'failed';
    profile.breFailReason = breResult.reason;

    await profile.save();

    if (!breResult.passed) {
      res.status(422).json({
        success: false,
        message: 'BRE check failed — profile saved with failed status',
        profile,
        bre: breResult,
      });
      return;
    }

    res.status(200).json({ success: true, profile, bre: breResult });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', errors: err });
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
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Borrower profile not found. Please create your profile first.',
      });
      return;
    }

    profile.salarySlipUrl      = `/uploads/${req.file.filename}`;
    profile.salarySlipFileName = req.file.originalname;
    await profile.save();

    res.status(200).json({
      success: true,
      salarySlipUrl:      profile.salarySlipUrl,
      salarySlipFileName: profile.salarySlipFileName,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', errors: err });
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

    if (isNaN(numAmount) || numAmount < 50000 || numAmount > 500000) {
      res.status(400).json({
        success: false,
        message: 'amount must be between ₹50,000 and ₹5,00,000',
      });
      return;
    }

    if (isNaN(numTenure) || !Number.isInteger(numTenure) || numTenure < 30 || numTenure > 365) {
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
      status: { $in: ['applied', 'sanctioned', 'disbursed'] },
    });

    if (activeLoan) {
      res.status(409).json({
        success: false,
        message: `Active loan already exists (status: '${activeLoan.status}'). One active loan per borrower.`,
      });
      return;
    }

    // SI = (P × R × T) / (365 × 100)
    const R              = 12;
    const simpleInterest = (numAmount * R * numTenure) / (365 * 100);
    const totalRepayment = numAmount + simpleInterest;

    const loan = await Loan.create({
      borrowerId:        new mongoose.Types.ObjectId(userId),
      profileId:         profile._id,
      amount:            numAmount,
      tenure:            numTenure,
      interestRate:      R,
      simpleInterest,
      totalRepayment,
      totalPaid:         0,
      outstandingBalance: totalRepayment,
      status:            'applied',
    });

    res.status(201).json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', errors: err });
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
    res.status(200).json({ success: true, loan, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error', errors: err });
  }
};