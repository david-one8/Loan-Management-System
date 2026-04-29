// ─── Core Domain Entities ────────────────────────────────────────────────────

export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection' | 'borrower';
}

export interface BorrowerProfile {
  _id: string;
  userId: string;
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: 'salaried' | 'self-employed' | 'unemployed';
  salarySlipUrl?: string;
  salarySlipFileName?: string;
  breStatus: 'pending' | 'passed' | 'failed';
  breFailReason?: string;
}

export interface Loan {
  _id: string;
  borrowerId: User;
  profileId: BorrowerProfile;
  amount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'applied' | 'sanctioned' | 'disbursed' | 'closed' | 'rejected';
  sanctionRemark?: string;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  loanId: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy: User;
  createdAt: string;
}

export interface Lead {
  _id: string;
  email: string;
  createdAt: string;
  profile?: BorrowerProfile;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ─── Paginated Response ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  token: string;
  user: User;
}

// ─── Borrower ─────────────────────────────────────────────────────────────────

export interface ProfilePayload {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: 'salaried' | 'self-employed' | 'unemployed';
}

export interface LoanApplyPayload {
  amount: number;
  tenure: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface SanctionActionPayload {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface RecordPaymentPayload {
  utrNumber: string;
  amount: number;
  paymentDate: string;
}

export interface RecordPaymentResponse {
  payment: Payment;
  isClosed: boolean;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// ─── Table ────────────────────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

// ─── Step Progress ────────────────────────────────────────────────────────────

export type ApplyStep = 1 | 2 | 3;