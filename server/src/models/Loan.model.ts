import mongoose, { Document, Schema, Types } from 'mongoose';

export type LoanStatus =
  | 'applied'
  | 'sanctioned'
  | 'disbursed'
  | 'closed'
  | 'rejected';

export interface ILoan extends Document {
  borrowerId: Types.ObjectId;
  profileId: Types.ObjectId;
  amount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  sanctionRemark?: string;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User',            required: true },
    profileId:  { type: Schema.Types.ObjectId, ref: 'BorrowerProfile', required: true },
    amount:     { type: Number, required: true },
    tenure:     { type: Number, required: true },
    interestRate:      { type: Number, default: 12 },
    simpleInterest:    { type: Number, required: true },
    totalRepayment:    { type: Number, required: true },
    totalPaid:         { type: Number, default: 0 },
    outstandingBalance:{ type: Number, required: true },
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'disbursed', 'closed', 'rejected'],
      default: 'applied',
    },
    sanctionedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt:    { type: Date },
    sanctionRemark:  { type: String },
    rejectedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt:      { type: Date },
    rejectionReason: { type: String },
    disbursedBy:     { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt:     { type: Date },
    closedAt:        { type: Date },
  },
  { timestamps: true }
);

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);