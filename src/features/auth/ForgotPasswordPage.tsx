import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { ApiError } from '@/lib/http';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';

type Step = 'email' | 'otp' | 'done';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('school_admin');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authService.sendResetOtp(email.trim(), userType);
      toast.success('Check your inbox for the code.');
      setStep('otp');
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(new ApiError('Passwords do not match.', 422));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authService.resetPassword({
        email: email.trim(),
        otp,
        password,
        password_confirmation: confirm,
      });
      setStep('done');
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-5 py-12">
      <div className="w-full max-w-[400px]">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-500 transition-colors hover:text-navy-900"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>

        {step === 'done' ? (
          <div className="rounded-[var(--radius-card)] bg-white p-8 text-center hairline shadow-[var(--shadow-card)]">
            <CheckCircle2 className="mx-auto size-10 text-[var(--color-success)]" />
            <h2 className="mt-4 text-[22px] text-ink-900">Password updated</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              You can sign in with your new password now.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Go to sign in
            </Button>
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] bg-white p-7 hairline shadow-[var(--shadow-card)]">
            <h2 className="text-[22px] text-ink-900">
              {step === 'email' ? 'Reset your password' : 'Enter the code'}
            </h2>
            <p className="mt-1.5 text-sm text-ink-500">
              {step === 'email'
                ? 'We will email you a one-time code.'
                : `Sent to ${email}. The code expires shortly.`}
            </p>

            {step === 'email' ? (
              <form onSubmit={sendOtp} className="mt-6 space-y-4">
                <Select
                  label="Account type"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  options={[
                    { value: 'school_admin', label: 'Administrator' },
                    { value: 'teacher', label: 'Teacher' },
                    { value: 'parent', label: 'Parent' },
                  ]}
                />
                <Input
                  type="email"
                  label="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error?.fieldError('email') ?? (error && !error.errors ? error.message : undefined)}
                />
                <Button type="submit" className="w-full" loading={busy}>
                  Send code
                </Button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="mt-6 space-y-4">
                <Input
                  label="One-time code"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="tracking-[0.35em] text-center font-medium"
                  error={error?.fieldError('otp')}
                />
                <Input
                  type="password"
                  label="New password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hint="8+ characters"
                  error={error?.fieldError('password')}
                />
                <Input
                  type="password"
                  label="Confirm new password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={error && !error.errors ? error.message : undefined}
                />
                <Button type="submit" className="w-full" loading={busy}>
                  Update password
                </Button>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-center text-[13px] text-ink-500 hover:text-navy-900"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
