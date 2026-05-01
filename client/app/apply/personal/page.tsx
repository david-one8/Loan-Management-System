'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Info,
  UserCircle,
  UserX,
} from 'lucide-react';
import { ApiError, get, post } from '@/lib/api';
import { calculateAge } from '@/lib/utils';
import type {
  BorrowerProfile,
  ProfilePayload,
  ProfileResponse,
  SaveProfileResponse,
} from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

interface FormState {
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: string;
  employmentMode: ProfilePayload['employmentMode'] | '';
}

interface FormErrors {
  fullName?: string;
  pan?: string;
  dob?: string;
  monthlySalary?: string;
  employmentMode?: string;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const EMPLOYMENT_OPTIONS: Array<{
  value: ProfilePayload['employmentMode'];
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { value: 'salaried', label: 'Salaried', description: 'Employed with fixed income', icon: <Briefcase className="h-8 w-8" /> },
  { value: 'self-employed', label: 'Self-Employed', description: 'Business or freelance income', icon: <Building2 className="h-8 w-8" /> },
  { value: 'unemployed', label: 'Unemployed', description: 'Currently not employed', icon: <UserX className="h-8 w-8" /> },
];

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const salary = Number(form.monthlySalary);

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
  }

  if (!form.monthlySalary) {
    errors.monthlySalary = 'Monthly salary is required.';
  } else if (Number.isNaN(salary) || salary <= 0) {
    errors.monthlySalary = 'Enter a valid salary amount.';
  }

  if (!form.employmentMode) {
    errors.employmentMode = 'Please select an employment mode.';
  }

  return errors;
}

function profileToForm(profile: BorrowerProfile): FormState {
  return {
    fullName: profile.fullName,
    pan: profile.pan,
    dob: profile.dob ? profile.dob.slice(0, 10) : '',
    monthlySalary: String(profile.monthlySalary),
    employmentMode: profile.employmentMode,
  };
}

export default function PersonalPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    pan: '',
    dob: '',
    monthlySalary: '',
    employmentMode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [breError, setBreError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<BorrowerProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await get<ProfileResponse>('/borrower/profile');
      const profile = response.data?.profile ?? null;

      if (profile) {
        setExistingProfile(profile);
        setForm(profileToForm(profile));

        if (profile.breStatus === 'passed') {
          router.replace('/apply/upload');
          return;
        }

        if (profile.breStatus === 'failed') {
          setBreError(profile.breFailReason ?? 'You do not meet the eligibility criteria.');
        }
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not load your profile.');
    } finally {
      setIsPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProfile]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const nextValue = name === 'pan' ? value.toUpperCase() : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError('');
    setBreError('');
  }

  function handleEmploymentChange(value: ProfilePayload['employmentMode']) {
    setForm((prev) => ({ ...prev, employmentMode: value }));
    setErrors((prev) => ({ ...prev, employmentMode: undefined }));
    setApiError('');
    setBreError('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError('');
    setBreError('');

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ProfilePayload = {
        fullName: form.fullName.trim(),
        pan: form.pan.trim(),
        dob: form.dob,
        monthlySalary: Number(form.monthlySalary),
        employmentMode: form.employmentMode as ProfilePayload['employmentMode'],
      };
      const response = await post<SaveProfileResponse>('/borrower/profile', payload);
      const result = response.data;

      if (!result?.profile || !result.bre) {
        throw new Error(response.message ?? 'Failed to save profile. Please try again.');
      }

      setExistingProfile(result.profile);

      if (result.bre.passed) {
        router.push('/apply/upload');
      } else {
        setBreError(result.bre.reason ?? 'You do not meet the eligibility criteria.');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as SaveProfileResponse | undefined;

        if (data?.bre) {
          setExistingProfile(data.profile);
          setBreError(data.bre.reason ?? err.message);
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPageLoading) return <PageSpinner />;

  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 18);
  const maxDobStr = maxDob.toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/50">
          <UserCircle className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Personal Details</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Tell us about yourself so we can check your eligibility.
          </p>
        </div>
      </div>

      {breError && (
        <div role="alert" className="mb-6 flex animate-shake items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 dark:border-danger-500/20 dark:bg-danger-500/10">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-danger-600 dark:text-danger-400" />
          <div>
            <p className="text-sm font-semibold text-danger-800 dark:text-danger-300">Not Eligible</p>
            <p className="mt-0.5 text-sm leading-relaxed text-danger-700 dark:text-danger-400">{breError}</p>
          </div>
        </div>
      )}

      {existingProfile && !breError && (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 dark:border-brand-900 dark:bg-brand-950/40">
          <Info className="mt-0.5 h-4 w-4 text-brand-600 dark:text-brand-400" />
          <p className="text-sm text-brand-700 dark:text-brand-300">
            Your existing profile has been loaded. You can update and resubmit.
          </p>
        </div>
      )}

      {apiError && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 dark:border-danger-500/20 dark:bg-danger-500/10">
          <AlertCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />
          <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{apiError}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
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

          <div className="border-t border-slate-100 dark:border-[#1e293b]" />

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
            hint="Format: 5 letters, 4 digits, 1 letter"
            className="font-mono uppercase tracking-widest"
          />

          <div className="border-t border-slate-100 dark:border-[#1e293b]" />

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
            hint={form.dob ? `Age: ${calculateAge(form.dob)} years` : 'Date of birth is required'}
          />

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
            min="1"
            prefix="Rs."
            hint="Your net take-home salary per month"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Employment Mode <span className="text-danger-500">*</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {EMPLOYMENT_OPTIONS.map((option) => {
                const isSelected = form.employmentMode === option.value;

                return (
                  <label
                    key={option.value}
                    className={[
                      'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-150',
                      isSelected
                        ? 'border-brand-500 bg-brand-50 shadow-glow-sm dark:border-brand-400 dark:bg-brand-950/40'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-[#1e293b] dark:bg-[#0A0F1E] dark:hover:border-slate-700',
                      isSubmitting ? 'cursor-not-allowed opacity-60' : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="employmentMode"
                      value={option.value}
                      checked={isSelected}
                      onChange={() => handleEmploymentChange(option.value)}
                      disabled={isSubmitting}
                      className="sr-only"
                    />
                    <span className={isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-600'} aria-hidden="true">
                      {option.icon}
                    </span>
                    <span className={`text-xs font-medium ${isSelected ? 'text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {option.label}
                    </span>
                    <span className="text-2xs text-slate-400 dark:text-slate-600">{option.description}</span>
                  </label>
                );
              })}
            </div>
            {errors.employmentMode && (
              <p role="alert" className="mt-1 flex items-center gap-1.5 text-xs text-danger-600 dark:text-danger-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.employmentMode}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            <span>Check Eligibility & Continue</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
