'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, BadgeCheck, SlidersHorizontal } from 'lucide-react';
import { get, post } from '@/lib/api';
import type {
  BorrowerLoanResponse,
  BorrowerProfile,
  LoanApplyPayload,
  LoanApplyResponse,
  ProfileResponse,
} from '@/types';
import { calculateSI, calculateTotalRepayment, formatCurrency } from '@/lib/utils';
import Slider from '@/components/ui/Slider';
import Button from '@/components/ui/Button';
import LoanCalculator from '@/components/loan/LoanCalculator';
import { PageSpinner } from '@/components/ui/Spinner';

const MIN_AMOUNT = 50000;
const MAX_AMOUNT = 500000;
const STEP_AMOUNT = 1000;
const MIN_TENURE = 30;
const MAX_TENURE = 365;
const STEP_TENURE = 1;

export default function LoanPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [amount, setAmount] = useState(100000);
  const [tenure, setTenure] = useState(180);
  const [isApplying, setIsApplying] = useState(false);
  const [apiError, setApiError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const response = await get<ProfileResponse>('/borrower/profile');
      const loadedProfile = response.data?.profile ?? null;

      if (!loadedProfile || loadedProfile.breStatus !== 'passed') {
        router.replace('/apply/personal');
        return;
      }

      if (!loadedProfile.salarySlipUrl) {
        router.replace('/apply/upload');
        return;
      }

      setProfile(loadedProfile);
    } catch {
      router.replace('/apply/personal');
    } finally {
      setIsPageLoading(false);
    }
  }, [router]);

  const checkExistingLoan = useCallback(async () => {
    try {
      const response = await get<BorrowerLoanResponse>('/borrower/loan');

      if (response.data?.loan?.status) {
        router.replace('/apply/status');
      }
    } catch {
      // No existing loan yet.
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void Promise.all([loadProfile(), checkExistingLoan()]);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkExistingLoan, loadProfile]);

  async function handleApply() {
    setApiError('');
    setIsApplying(true);

    try {
      const payload: LoanApplyPayload = { amount, tenure };
      const response = await post<LoanApplyResponse>('/borrower/apply', payload);

      if (!response.data?.loan) {
        throw new Error(response.message ?? 'Application failed.');
      }

      router.push('/apply/status');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Application failed. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }

  if (isPageLoading) return <PageSpinner />;

  const simpleInterest = calculateSI(amount, tenure);
  const totalRepayment = calculateTotalRepayment(amount, tenure);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/50">
          <SlidersHorizontal className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Loan Application</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Configure your loan amount and tenure. The summary updates in real time.
          </p>
        </div>
      </div>

      {profile && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-success-200 bg-success-50 px-5 py-3 dark:border-success-500/20 dark:bg-success-500/10">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success-800 dark:text-success-300">
            <BadgeCheck className="h-4 w-4" />
            BRE Passed
          </span>
          <span className="text-sm font-medium text-success-700 dark:text-success-400">{profile.fullName}</span>
          <span className="text-sm text-success-700 dark:text-success-400">
            Salary: <span className="font-semibold">{formatCurrency(profile.monthlySalary)}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827] lg:col-span-3">
          <Slider
            label="Loan Amount"
            value={amount}
            min={MIN_AMOUNT}
            max={MAX_AMOUNT}
            step={STEP_AMOUNT}
            onChange={setAmount}
            formatValue={formatCurrency}
          />

          <Slider
            label="Tenure"
            value={tenure}
            min={MIN_TENURE}
            max={MAX_TENURE}
            step={STEP_TENURE}
            onChange={setTenure}
            formatValue={(value) => `${value} days`}
          />

          {apiError && (
            <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 dark:border-danger-500/20 dark:bg-danger-500/10">
              <AlertCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />
              <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{apiError}</p>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleApply}
            isLoading={isApplying}
            disabled={isApplying}
          >
            <span>Apply for {formatCurrency(amount)} Loan</span>
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <LoanCalculator amount={amount} tenure={tenure} />
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/40">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
              Repayment Snapshot
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-700 dark:text-brand-400">Interest</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(Math.round(simpleInterest))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-700 dark:text-brand-400">Total</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatCurrency(Math.round(totalRepayment))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
