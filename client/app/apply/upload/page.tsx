'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  FileText,
  Image as ImageIcon,
  UploadCloud,
  X,
} from 'lucide-react';
import { get, postForm } from '@/lib/api';
import { formatCurrency, formatFileSize } from '@/lib/utils';
import type { BorrowerProfile, ProfileResponse, UploadSlipResponse } from '@/types';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_BYTES = 5 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }

  if (file.size > MAX_BYTES) {
    return `File too large. Maximum size is 5 MB (yours: ${formatFileSize(file.size)}).`;
  }

  return null;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await get<ProfileResponse>('/borrower/profile');
      const loadedProfile = response.data?.profile ?? null;

      if (!loadedProfile) {
        router.replace('/apply/personal');
        return;
      }

      if (loadedProfile.breStatus !== 'passed') {
        router.replace('/apply/personal');
        return;
      }

      setProfile(loadedProfile);
      setUploadSuccess(Boolean(loadedProfile.salarySlipUrl));
    } catch {
      router.replace('/apply/personal');
    } finally {
      setIsPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  function processFile(file: File) {
    const validationError = validateFile(file);

    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
    setUploadSuccess(false);
    setApiError('');
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setApiError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('salarySlip', selectedFile);

      const response = await postForm<UploadSlipResponse>('/borrower/upload-slip', formData);
      const upload = response.data;

      if (!upload) {
        throw new Error(response.message ?? 'Upload failed.');
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              salarySlipUrl: upload.salarySlipUrl,
              salarySlipFileName: upload.salarySlipFileName,
            }
          : prev
      );
      setUploadSuccess(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleReUpload() {
    setSelectedFile(null);
    setUploadSuccess(false);
    setFileError('');
    setApiError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  if (isPageLoading) return <PageSpinner />;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/50">
          <UploadCloud className="h-6 w-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Salary Slip Upload</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Upload your latest salary slip for income verification.
          </p>
        </div>
      </div>

      {profile && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
            Your Profile
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Full Name</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">PAN Number</p>
              <p className="mt-0.5 text-sm font-semibold tracking-wider text-slate-900 font-mono dark:text-slate-100">
                {profile.pan}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Salary</p>
              <p className="mt-0.5 text-sm font-semibold text-success-700 dark:text-success-400">
                {formatCurrency(profile.monthlySalary)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-[#1e293b] dark:bg-[#111827]">
        {profile?.salarySlipUrl && !selectedFile && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/20 dark:bg-success-500/10">
            <div>
              <p className="text-sm font-medium text-success-800 dark:text-success-300">Salary slip already uploaded</p>
              {profile.salarySlipFileName && (
                <p className="mt-0.5 text-xs text-success-600 font-mono dark:text-success-400">{profile.salarySlipFileName}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReUpload}
              className="shrink-0 text-xs font-medium text-success-700 underline underline-offset-2 hover:text-success-900 dark:text-success-400"
            >
              Replace
            </button>
          </div>
        )}

        {!uploadSuccess && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'group rounded-2xl border-2 border-dashed p-10 text-center',
              'cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-brand-400 bg-brand-50/30 dark:border-brand-500 dark:bg-brand-950/20'
                : selectedFile
                  ? 'border-slate-300 bg-slate-50 dark:border-[#1e293b] dark:bg-[#0A0F1E]'
                  : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/30 dark:border-[#1e293b] dark:bg-[#0A0F1E] dark:hover:border-brand-500 dark:hover:bg-brand-950/20',
            ].join(' ')}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={handleFileInput}
              className="sr-only"
              aria-label="Upload salary slip"
            />

            {selectedFile ? (
              <div className="flex w-full animate-fade-up items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-[#1e293b] dark:bg-[#0A0F1E]">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selectedFile.type === 'application/pdf' ? 'bg-danger-50 text-danger-600 dark:bg-danger-500/10' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10'}`}>
                  {selectedFile.type === 'application/pdf' ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReUpload();
                  }}
                  className="ml-auto rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-card transition-colors group-hover:border-brand-300 dark:border-[#1e293b] dark:bg-[#111827]">
                  <UploadCloud className="h-7 w-7 text-slate-400 transition-colors group-hover:text-brand-500 group-hover:animate-bounce-sm dark:text-slate-600" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">Drop your salary slip here</p>
                <p className="mt-1 text-sm text-slate-400 dark:text-slate-600">or click to browse files</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-400 dark:border-[#1e293b] dark:bg-[#111827]">
                  <FileText className="h-3.5 w-3.5" />
                  PDF, JPG, PNG - Max 5MB
                </div>
              </div>
            )}
          </div>
        )}

        {fileError && (
          <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 dark:border-danger-500/20 dark:bg-danger-500/10">
            <AlertCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />
            <p className="text-sm text-danger-700 dark:text-danger-400">{fileError}</p>
          </div>
        )}

        {apiError && (
          <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 dark:border-danger-500/20 dark:bg-danger-500/10">
            <AlertCircle className="h-4 w-4 text-danger-600 dark:text-danger-400" />
            <p className="text-sm font-medium text-danger-700 dark:text-danger-400">{apiError}</p>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex animate-scale-in items-center gap-4 rounded-2xl border border-success-200 bg-success-50 p-5 dark:border-success-500/20 dark:bg-success-500/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-500">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-success-800 dark:text-success-300">Uploaded successfully</p>
              <p className="text-sm text-success-600 dark:text-success-400">
                {selectedFile ? selectedFile.name : profile?.salarySlipFileName ?? 'Salary slip verified.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReUpload}
              className="ml-auto shrink-0 text-xs font-medium text-success-700 underline underline-offset-2 hover:text-success-900 dark:text-success-400"
            >
              Re-upload
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          {selectedFile && !uploadSuccess && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={isUploading}
              fullWidth
            >
              {isUploading ? 'Uploading...' : 'Upload Salary Slip'}
            </Button>
          )}

          <Button
            variant={uploadSuccess ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => router.push('/apply/loan')}
            disabled={!uploadSuccess}
            fullWidth
          >
            Next: Loan Application
          </Button>
        </div>

        {!uploadSuccess && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-600">
            You must upload your salary slip before proceeding.
          </p>
        )}
      </div>
    </div>
  );
}
