import mongoose, { Document, Schema, Types } from 'mongoose';

export type BreStatus = 'pending' | 'passed' | 'failed';
export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export interface IBorrowerProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  salarySlipFileName?: string;
  breStatus: BreStatus;
  breFailReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BorrowerProfileSchema = new Schema<IBorrowerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true, trim: true },
    pan:      { type: String, required: true, trim: true, uppercase: true },
    dob:      { type: Date,   required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
      required: true,
    },
    salarySlipUrl:      { type: String },
    salarySlipFileName: { type: String },
    breStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
    breFailReason: { type: String },
  },
  { timestamps: true }
);

export const BorrowerProfile = mongoose.model<IBorrowerProfile>(
  'BorrowerProfile',
  BorrowerProfileSchema
);