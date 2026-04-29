'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get, post } from '@/lib/api';
import type { BorrowerProfile, ProfilePayload } from '@/types';
import { calculateAge } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: string;
  employmentMode: 'salaried' | 'self-employed' | 'unemployed' | '';
}

interface FormErrors {
  fullName?: string;
  pan?: string;
  dob?: string;
  monthlySalary?: string;
  employmentMode?: string;
}

// ─── Validators ───────────────────────────────────────────────────────────────

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  } else if (form.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters.';
  }

  if (!form.pan.trim()) {
    errors.pan = 'PAN number is required.';
  } else if (!PAN_REGEX.test(form.pan.trim())) {
    errors.pan = 'Invalid PAN format. Example: ABCDE1234F';
  }

  if (!form.dob) {
    errors.dob = 'Date of birth is required.';
  } else {
    const age = calculateAge(form.dob);
    if (age < 18) errors.dob = 'You must be at least 18 years old.';
    if (age > 65) errors.dob = 'Applicants must be under 65 years old.';
  }

  const salary = Number(form.monthlySalary);
  if (!form.monthlySalary) {
    errors.monthlySalary = 'Monthly salary is required.';
  } else if (isNaN(salary) || salary <= 0) {
    errors.monthlySalary = 'Enter a valid salary amount.';
  } else if (salary < 5000) {
    errors.monthlySalary = 'Minimum salary is ₹5,000.';
  }

  if (!form.employmentMode) {
    errors.employmentMode = 'Please select an employment mode.';
  }

  return errors;
}

// ─── Employment options ───────────────────────────────────────────────────────

const EMPLOYMENT_OPTIONS: { value: FormState['employmentMode']; label: string; description: string }[] = [
  { value: 'salaried',      label: 'Salaried',      description: 'Employed with a fixed monthly salary' },
  { value: 'self-employed', label: 'Self-Employed',  description: 'Running your own business or freelancing' },
  { value: 'unemployed',    label: 'Unemployed',     description: 'Currently not employed' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PersonalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    pan: '',
    dob: '',
    monthlySalary: '',
    employmentMode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError]   = useState('');
  const [breFailReason, setBreFailReason] = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<BorrowerProfile | null>(null);

  // ── Pre-fill if profile already exists ───────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await get<BorrowerProfile>('/borrower/profile');
      if (res.data) {
        const p = res.data;
        setExistingProfile(p);
        setForm({
          fullName:       p.fullName,
          pan:            p.pan,
          dob:            p.dob ? p.dob.slice(0, 10) : '',
          monthlySalary:  String(p.monthlySalary),
          employmentMode: p.employmentMode,
        });
        // If BRE already passed, skip ahead
        if (p.breStatus === 'passed') {
          router.replace('/apply/upload');
          return;
        }
        // If BRE failed, show the reason
        if (p.breStatus === 'failed' && p.breFailReason) {
          setBreFailReason(p.breFailReason);
        }
      }
    } catch {
      // No profile yet — that's fine, start fresh
    } finally {
      setIsPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated, fetchProfile]);

  // ── Field handlers ────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const next = name === 'pan' ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: next }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    setApiError('');
    setBreFailReason('');
  }

  function handleEmploymentChange(value: FormState['employmentMode']) {
    setForm((prev) => ({ ...prev, employmentMode: value }));
    setErrors((prev) => ({ ...prev, employmentMode: undefined }));
    setBreFailReason('');
  }

  // ── Submit ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError('');
    setBreFailReason('');

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ProfilePayload = {
        fullName:       form.fullName.trim(),
        pan:            form.pan.trim(),
        dob:            form.dob,
        monthlySalary:  Number(form.monthlySalary),
        employmentMode: form.employmentMode as ProfilePayload['employmentMode'],
      };

      const res = await post<BorrowerProfile>('/borrower/profile', payload);

      if (!res.data) {
        throw new Error(res.message ?? 'Failed to save profile. Please try again.');
      }

      const profile = res.data;

      if (profile.breStatus === 'passed') {
        router.push('/apply/upload');
      } else if (profile.breStatus === 'failed') {
        setBreFailReason(profile.breFailReason ?? 'You do not meet the eligibility criteria.');
      } else {
        // Pending — treat as failure for now
        setApiError('BRE check is pending. Please try again shortly.');
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────

  if (isPageLoading) return <PageSpinner />;

  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);
  const maxDobStr = maxDob.toISOString().split('T')[0];

  const minDob = new Date();
  minDob.setFullYear(minDob.getFullYear() - 65);
  const minDobStr = minDob.toISOString().split('T')[0];

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personal Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about yourself so we can check your eligibility.
        </p>
      </div>

      {/* BRE failure alert */}
      {breFailReason && (
        <div
          role="alert"
          className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-xl p-5"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">You are not eligible for a loan</p>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">{breFailReason}</p>
            <p className="text-xs text-red-500 mt-2">
              Please update your details and resubmit if you believe this is incorrect.
            </p>
          </div>
        </div>
      )}

      {/* Existing profile note */}
      {existingProfile && !breFailReason && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <svg
            className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700">
            Your existing profile has been loaded. You can update and resubmit.
          </p>
        </div>
      )}

      {/* General API error */}
      {apiError && (
        <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-red-700 font-medium">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* Full Name */}
          <Input
            label="Full Name"
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            placeholder="As per your PAN card"
            required
            disabled={isSubmitting}
            autoComplete="name"
          />

          {/* PAN Number */}
          <Input
            label="PAN Number"
            name="pan"
            type="text"
            value={form.pan}
            onChange={handleChange}
            error={errors.pan}
            placeholder="ABCDE1234F"
            required
            disabled={isSubmitting}
            maxLength={10}
            hint="Format: 5 letters · 4 digits · 1 letter (e.g. ABCDE1234F)"
            className="font-mono uppercase tracking-widest"
          />

          {/* Date of Birth */}
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            value={form.dob}
            onChange={handleChange}
            error={errors.dob}
            required
            disabled={isSubmitting}
            max={maxDobStr}
            min={minDobStr}
            hint={
              form.dob
                ? `Age: ${calculateAge(form.dob)} years`
                : 'Must be between 18 and 65 years old'
            }
          />

          {/* Monthly Salary */}
          <Input
            label="Monthly Salary"
            name="monthlySalary"
            type="number"
            value={form.monthlySalary}
            onChange={handleChange}
            error={errors.monthlySalary}
            placeholder="e.g. 50000"
            required
            disabled={isSubmitting}
            min="5000"
            prefix="₹"
            hint="Your net take-home salary per month"
          />

          {/* Employment Mode */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Employment Mode <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EMPLOYMENT_OPTIONS.map((opt) => {
                const isSelected = form.employmentMode === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={[
                      'flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer',
                      'transition-all duration-150 select-none',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white',
                      isSubmitting ? 'cursor-not-allowed opacity-60' : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="employmentMode"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => handleEmploymentChange(opt.value as FormState['employmentMode'])}
                      disabled={isSubmitting}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      {/* Custom radio circle */}
                      <span
                        className={[
                          'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                          isSelected ? 'border-blue-500' : 'border-gray-300',
                        ].join(' ')}
                      >
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </span>
                      <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{opt.description}</p>
                  </label>
                );
              })}
            </div>
            {errors.employmentMode && (
              <p role="alert" className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.employmentMode}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Checking eligibility…' : 'Check Eligibility & Continue'}
            </Button>
            <p className="text-xs text-center text-gray-400 mt-2">
              We&apos;ll run a quick BRE check on your details before proceeding.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
}