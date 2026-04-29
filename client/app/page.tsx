import { redirect } from 'next/navigation';

/**
 * Root route — always redirect to /login.
 * Middleware will catch authenticated users and redirect them
 * to their correct home (/apply/personal or /dashboard).
 */
export default function RootPage() {
  redirect('/login');
}