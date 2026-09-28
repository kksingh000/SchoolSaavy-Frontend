import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { profileService } from '@/services/auth';
import { useAuth } from '@/app/auth-context';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Avatar, PageHeader } from '@/components/ui/Primitives';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/http';
import { titleCase } from '@/lib/utils';

export function ProfilePage() {
  const { user, school } = useAuth();

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.show,
    retry: false,
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState<ApiError | null>(null);

  const changePassword = useMutation({
    mutationFn: () => profileService.changePassword(passwords),
    onSuccess: () => {
      toast.success('Password updated.');
      setPasswords({ current_password: '', password: '', password_confirmation: '' });
      setError(null);
    },
    onError: (err: ApiError) => {
      setError(err);
      if (!err.errors) toast.error(err.message);
    },
  });

  const details = (profile.data ?? {}) as Record<string, unknown>;
  const err = (field: string) => error?.fieldError(field);

  return (
    <>
      <PageHeader title="My profile" description="Your account details and sign-in security." />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardBody className="text-center">
            <Avatar
              name={user?.name}
              src={details.profile_photo_url as string | undefined}
              size={84}
              className="mx-auto"
            />
            <p className="mt-3 text-[17px] font-semibold text-ink-900">{user?.name}</p>
            <p className="mt-0.5 text-[13px] text-ink-500">{user?.email}</p>
            <div className="mt-2.5 flex justify-center gap-2">
              <Badge tone="navy">{titleCase(user?.user_type ?? '')}</Badge>
              {school?.name && <Badge tone="gold">{school.name}</Badge>}
            </div>
          </CardBody>

          {profile.isLoading ? (
            <CardBody className="space-y-2 hairline-t">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </CardBody>
          ) : (
            <dl className="divide-y divide-[var(--hairline)] hairline-t text-[13px]">
              {Object.entries(details)
                .filter(
                  ([key, value]) =>
                    typeof value !== 'object' &&
                    value !== null &&
                    value !== '' &&
                    !['id', 'user_id', 'profile_photo', 'profile_photo_url'].includes(key),
                )
                .slice(0, 10)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-3 px-5 py-2.5">
                    <dt className="text-ink-500">{titleCase(key)}</dt>
                    <dd className="text-right font-medium text-ink-800">{String(value)}</dd>
                  </div>
                ))}
            </dl>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Change password"
              description="You stay signed in on this device after changing it."
            />
            <CardBody>
              <form
                className="max-w-md space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  if (passwords.password !== passwords.password_confirmation) {
                    setError(new ApiError('The two new passwords do not match.', 422));
                    return;
                  }
                  changePassword.mutate();
                }}
              >
                <Input
                  type="password"
                  label="Current password"
                  required
                  autoComplete="current-password"
                  value={passwords.current_password}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, current_password: e.target.value }))
                  }
                  error={err('current_password')}
                />
                <Input
                  type="password"
                  label="New password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  hint="8+ characters"
                  value={passwords.password}
                  onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                  error={err('password')}
                />
                <Input
                  type="password"
                  label="Confirm new password"
                  required
                  autoComplete="new-password"
                  value={passwords.password_confirmation}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, password_confirmation: e.target.value }))
                  }
                  error={error && !error.errors ? error.message : undefined}
                />
                <Button
                  type="submit"
                  loading={changePassword.isPending}
                  icon={<KeyRound className="size-4" />}
                >
                  Update password
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Session" description="How this device is authenticated." />
            <CardBody>
              <div className="flex items-start gap-3 rounded-[var(--radius-field)] bg-ink-50 px-4 py-3.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" />
                <div>
                  <p className="text-[13px] font-medium text-ink-800">
                    Signed in with a bearer token
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    Your token carries the school context — every request is scoped to{' '}
                    {school?.name ?? 'your school'} automatically. Signing out revokes it.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
