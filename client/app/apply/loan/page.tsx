'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get, post } from '@/lib/api';
import type { BorrowerProfile, Loan, LoanApplyPayload } from '@/types';
import { formatCurrency, calculateSI, calculateTotalRepayment } from '@/lib/utils';
import Slider from '@/components/ui/Slider';
import Button from '@/components/ui/Button';
import LoanCalculator from '@/components/loan/LoanCalculator';
import { PageSpinner } from '@/components/ui/Spinner';

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_AMOUNT  = 50_000;
const MAX_AMOUNT  = 5_00_000;
const STEP_AMOUNT = 1_000;

const MIN_TENURE  = 30;
const MAX_TENURE  = 365;
const STEP_TENURE = 1;

const INTEREST_RATE = 12;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile]         = useState<BorrowerProfile | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [amount, setAmount]   = useState(1_00_000);
  const [tenure, setTenure]   = useState(180);
  const [isApplying, setIsApplying]   = useState(false);
  const [apiError, setApiError]       = useState('');

  // ── Guard: slip must be uploaded ─────────────────────────────────

  const loadProfile = useCallback(async () => {
    try {
      const res = await get<BorrowerProfile>('/borrower/profile');
      if (!res.data || res.data.breStatus !== 'passed') {
        router.replace('/apply/personal');
        return;
      }
      if (!res.data.salarySlipUrl) {
        router.replace('/apply/upload');
        return;
      }
      setProfile(res.data);
    } catch {
      router.replace('/apply/personal');
    } finally {
      setIsPageLoading(false);
    }
  }, [router]);

  // Also check if loan already applied
  const checkExistingLoan = useCallback(async () => {
    try {
      const res = await get<Loan>('/borrower/loan');
      if (res.data?.status) {
        router.replace('/apply/status');
      }
    } catch {
      // No loan yet — stay on this page
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      Promise.all([loadProfile(), checkExistingLoan()]);
    }
  }, [authLoading, isAuthenticated, loadProfile, checkExistingLoan]);

  // ── Apply ────────────────────────────────────────────────────────

  async function handleApply() {
    setApiError('');
    setIsApplying(true);
    try {
      const payload: LoanApplyPayload = { amount, tenure };
      const res = await post<Loan>('/borrower/apply', payload);
      if (!res.data) throw new Error(res.message ?? 'Application failed.');
      router.push('/apply/status');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Application failed. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  if (isPageLoading) return <PageSpinner />;

  const si             = calculateSI(amount, tenure);
  const totalRepayment = calculateTotalRepayment(amount, tenure);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loan Application</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your loan amount and tenure. The summary updates in real time.
        </p>
      </div>

      {/* Profile summary strip */}
      {profile && (
        <div className="flex flex-wrap items-center gap-4 bg-green-50 border border-green-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-green-800">BRE Passed</span>
          </div>
          <span className="hidden sm:block text-gray-300">|</span>
          <span className="text-sm text-green-700 font-medium">{profile.fullName}</span>
          <span className="hidden sm:block text-gray-300">|</span>
          <span className="text-sm text-green-700">
            Salary: <span className="font-semibold">{formatCurrency(profile.monthlySalary)}</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left: Sliders ─────────────────────────────────────── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-8">

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-5">Loan Configuration</p>

            {/* Amount slider */}
            <Slider
              label="Loan Amount"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={STEP_AMOUNT}
              value={amount}
              onChange={setAmount}
              formatValue={(v) => formatCurrency(v)}
              hint={`Range: ${formatCurrency(MIN_AMOUNT)} – ${formatCurrency(MAX_AMOUNT)}`}
            />
          </div>

          <div>
            {/* Tenure slider */}
            <Slider
              label="Tenure"
              min={MIN_TENURE}
              max={MAX_TENURE}
              step={STEP_TENURE}
              value={tenure}
              onChange={setTenure}
              formatValue={(v) => `${v} day${v !== 1 ? 's' : ''}`}
              hint={`Range: ${MIN_TENURE} days – ${MAX_TENURE} days`}
            />
          </div>

          {/* Key numbers at a glance */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Interest Amount</p>
              <p className="text-lg font-bold text-orange-600 font-mono">
                {formatCurrency(Math.round(si))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Payable</p>
              <p className="text-lg font-bold text-blue-700 font-mono">
                {formatCurrency(Math.round(totalRepayment))}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Calculator + Apply ──────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Live loan calculator */}
          <LoanCalculator
            amount={amount}
            tenure={tenure}
            interestRate={INTEREST_RATE}
          />

          {/* API error */}
          {apiError && (
            <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          {/* Apply button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleApply}
            isLoading={isApplying}
            disabled={isApplying}
          >
            {isApplying ? 'Submitting application…' : 'Apply Now'}
          </Button>

          <p className="text-xs text-center text-gray-400 leading-relaxed">
            By clicking Apply Now, you confirm that all provided information is accurate.
            Your application will be reviewed by our team.
          </p>
        </div>
      </div>
    </div>
  );
}