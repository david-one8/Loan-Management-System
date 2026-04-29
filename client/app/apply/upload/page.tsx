'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { get, postForm } from '@/lib/api';
import type { BorrowerProfile } from '@/types';
import { formatCurrency, formatFileSize } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── File validation ──────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }
  if (file.size > MAX_BYTES) {
    return `File too large. Maximum size is 5 MB (yours: ${formatFileSize(file.size)}).`;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]         = useState<BorrowerProfile | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [fileError, setFileError]         = useState('');
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [apiError, setApiError]           = useState('');
  const [isDragging, setIsDragging]       = useState(false);

  // ── Load profile — guard BRE ──────────────────────────────────────

  const loadProfile = useCallback(async () => {
    try {
      const res = await get<BorrowerProfile>('/borrower/profile');
      if (!res.data) {
        router.replace('/apply/personal');
        return;
      }
      const p = res.data;
      if (p.breStatus !== 'passed') {
        router.replace('/apply/personal');
        return;
      }
      setProfile(p);
      // If slip already uploaded, mark success so Next is enabled immediately
      if (p.salarySlipUrl) {
        setUploadSuccess(true);
      }
    } catch {
      router.replace('/apply/personal');
    } finally {
      setIsPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) loadProfile();
  }, [authLoading, isAuthenticated, loadProfile]);

  // ── File selection ────────────────────────────────────────────────

  function processFile(file: File) {
    const err = validateFile(file);
    if (err) {
      setFileError(err);
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

  // ── Drag & drop ───────────────────────────────────────────────────

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

  // ── Upload ────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!selectedFile) return;
    setApiError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('salarySlip', selectedFile);
      const res = await postForm<BorrowerProfile>('/borrower/upload-slip', formData);
      if (!res.data) throw new Error(res.message ?? 'Upload failed.');
      setProfile(res.data);
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
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Render ────────────────────────────────────────────────────────

  if (isPageLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Salary Slip Upload</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your latest salary slip for income verification.
        </p>
      </div>

      {/* Profile summary card */}
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

      {/* Upload card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-6 sm:p-8 space-y-5">

        {/* Previously uploaded indicator */}
        {profile?.salarySlipUrl && !selectedFile && (
          <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Salary slip already uploaded</p>
                {profile.salarySlipFileName && (
                  <p className="text-xs text-green-600 font-mono mt-0.5">{profile.salarySlipFileName}</p>
                )}
              </div>
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

        {/* Drop zone */}
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
              /* Selected file preview */
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 break-all max-w-xs">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                </div>
                <p className="text-xs text-blue-500">Click to change file</p>
              </div>
            ) : (
              /* Empty drop zone */
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    <span className="text-blue-600">Click to browse</span>
                    {' '}or drag & drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, JPG or PNG · Max 5 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File error */}
        {fileError && (
          <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{fileError}</p>
          </div>
        )}

        {/* API error */}
        {apiError && (
          <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{apiError}</p>
          </div>
        )}

        {/* Upload success */}
        {uploadSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-800">
              {selectedFile
                ? `"${selectedFile.name}" uploaded successfully.`
                : 'Salary slip verified.'}
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

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Upload button — only shown when file selected and not yet uploaded */}
          {selectedFile && !uploadSuccess && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={isUploading}
              fullWidth
            >
              {isUploading ? 'Uploading…' : 'Upload Salary Slip'}
            </Button>
          )}

          {/* Next step button */}
          <Button
            variant={uploadSuccess ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => router.push('/apply/loan')}
            disabled={!uploadSuccess}
            fullWidth
          >
            Next: Loan Application →
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