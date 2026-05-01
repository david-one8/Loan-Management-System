'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { post } from '@/lib/api';
import type { AuthTokenResponse, RegisterPayload } from '@/types';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;

    if (user.role === 'borrower') {
      router.replace('/apply/personal');
      return;
    }

    router.replace('/dashboard');
  }, [authLoading, isAuthenticated, router, user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: RegisterPayload = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      const response = await post<AuthTokenResponse>('/auth/register', payload);
      const token = response.data?.token;

      if (!token) {
        throw new Error(response.message ?? 'Registration failed. Please try again.');
      }

      login(token);
      router.replace('/apply/personal');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) return null;

  const strength = getPasswordStrength(form.password);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0A0F1E] via-[#111827] to-[#0f172a] lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-gradient-radial from-violet-600 to-transparent opacity-20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[420px] w-[420px] rounded-full bg-gradient-radial from-brand-600 to-transparent opacity-10 blur-3xl" />

        <div className="relative z-10 flex h-full w-full flex-col p-12">
          <div className="mb-auto flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-base font-bold text-white shadow-sm">
              L
            </div>
            <span className="text-2xl font-bold text-white">LMS</span>
          </div>

          <div>
            <h1 className="max-w-lg text-4xl font-bold leading-tight text-white">
              Start your loan journey
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
              Join thousands who trust LMS for their financing needs.
            </p>

            <div className="mt-10 space-y-4">
              {[
                ['1', 'Create your account', 'Quick and secure registration'],
                ['2', 'Complete your profile', 'Basic KYC and eligibility check'],
                ['3', 'Get your loan', 'Apply and track in real-time'],
              ].map(([number, title, desc]) => (
                <div key={number} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                    {number}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-8 text-sm text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-success-500" />
            Secure borrower onboarding with role-aware access.
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6 sm:p-10 dark:bg-[#0A0F1E]">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              L
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-50">LMS</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Create an account
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Apply for a loan in minutes
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
            {apiError && (
              <div role="alert" className="mb-5 flex animate-shake items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 p-3.5 dark:border-danger-500/20 dark:bg-danger-500/10">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-danger-600 dark:text-danger-400" />
                <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                required
                disabled={isSubmitting}
                prefix={<Mail />}
              />

              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                prefix={<Lock />}
                suffix={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={[
                      'h-1 rounded-full transition-colors',
                      strength >= bar
                        ? strength === 1
                          ? 'bg-danger-500'
                          : strength === 2
                          ? 'bg-warning-500'
                          : strength === 3
                          ? 'bg-yellow-400'
                          : 'bg-success-500'
                        : 'bg-slate-100 dark:bg-slate-800',
                    ].join(' ')}
                  />
                ))}
              </div>

              <Input
                label="Confirm password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                prefix={<Lock />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Create account
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
