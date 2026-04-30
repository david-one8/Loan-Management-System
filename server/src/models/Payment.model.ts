import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  loanId: Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loanId:      { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    utrNumber:   { type: String, required: true, unique: true, trim: true }, 
    amount:      { type: Number, required: true },
    paymentDate: { type: Date,   required: true },
    recordedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);