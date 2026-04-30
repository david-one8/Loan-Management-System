'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Salary Slip Upload</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your latest salary slip for income verification.
        </p>
      </div>

      {profile && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Your Profile
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{profile.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">PAN Number</p>
              <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5 tracking-wider">
                {profile.pan}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Monthly Salary</p>
              <p className="text-sm font-semibold text-green-700 mt-0.5">
                {formatCurrency(profile.monthlySalary)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-5">
        {profile?.salarySlipUrl && !selectedFile && (
          <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-green-800">Salary slip already uploaded</p>
              {profile.salarySlipFileName && (
                <p className="text-xs text-green-600 font-mono mt-0.5">{profile.salarySlipFileName}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReUpload}
              className="text-xs text-green-700 hover:text-green-900 font-medium underline underline-offset-2 shrink-0"
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
              'border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4',
              'cursor-pointer transition-colors duration-150',
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : selectedFile
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50',
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
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-sm font-semibold text-gray-900 break-all max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                <p className="text-xs text-blue-500">Click to change file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-medium text-gray-700">
                  <span className="text-blue-600">Click to browse</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PDF, JPG or PNG. Max 5 MB</p>
              </div>
            )}
          </div>
        )}

        {fileError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{fileError}</p>
          </div>
        )}

        {apiError && (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 font-medium">{apiError}</p>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              {selectedFile ? `"${selectedFile.name}" uploaded successfully.` : 'Salary slip verified.'}
            </p>
            <button
              type="button"
              onClick={handleReUpload}
              className="ml-auto text-xs text-green-700 hover:text-green-900 font-medium underline underline-offset-2 shrink-0"
            >
              Re-upload
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
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
          <p className="text-xs text-center text-gray-400">
            You must upload your salary slip before proceeding.
          </p>
        )}
      </div>
    </div>
  );
}
