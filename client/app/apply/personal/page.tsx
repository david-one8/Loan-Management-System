'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
}> = [
  { value: 'salaried', label: 'Salaried', description: 'Employed with fixed income' },
  { value: 'self-employed', label: 'Self-Employed', description: 'Business or freelance income' },
  { value: 'unemployed', label: 'Unemployed', description: 'Currently not employed' },
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
    fetchProfile();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personal Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about yourself so we can check your eligibility.
        </p>
      </div>

      {breError && (
        <div role="alert" className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-xl p-5">
          <div>
            <p className="text-sm font-bold text-red-800">You are not eligible for a loan</p>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">{breError}</p>
          </div>
        </div>
      )}

      {existingProfile && !breError && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-700">
            Your existing profile has been loaded. You can update and resubmit.
          </p>
        </div>
      )}

      {apiError && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-700 font-medium">{apiError}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8">
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
            <p className="text-sm font-medium text-gray-700">
              Employment Mode <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EMPLOYMENT_OPTIONS.map((option) => {
                const isSelected = form.employmentMode === option.value;

                return (
                  <label
                    key={option.value}
                    className={[
                      'flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150',
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white',
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
                    <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500">{option.description}</span>
                  </label>
                );
              })}
            </div>
            {errors.employmentMode && (
              <p role="alert" className="text-xs text-red-600 mt-1">
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
            {isSubmitting ? 'Checking eligibility...' : 'Check Eligibility & Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
