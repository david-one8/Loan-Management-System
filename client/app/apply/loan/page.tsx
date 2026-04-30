'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loan Application</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your loan amount and tenure. The summary updates in real time.
        </p>
      </div>

      {profile && (
        <div className="flex flex-wrap items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
          <span className="text-sm font-medium text-green-800">BRE Passed</span>
          <span className="text-sm text-green-700 font-medium">{profile.fullName}</span>
          <span className="text-sm text-green-700">
            Salary: <span className="font-semibold">{formatCurrency(profile.monthlySalary)}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-card p-6 space-y-8">
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
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-700 font-medium">{apiError}</p>
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
            {isApplying ? 'Submitting...' : 'Submit Loan Application'}
          </Button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <LoanCalculator amount={amount} tenure={tenure} />
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
              Repayment Snapshot
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Interest</span>
                <span className="font-mono font-semibold">{formatCurrency(Math.round(simpleInterest))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total</span>
                <span className="font-mono font-bold">{formatCurrency(Math.round(totalRepayment))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
