import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Copy } from 'lucide-react';
import * as z from 'zod';
import { useAppDispatch } from '@/app/hooks';
import { createStylistInvite } from '@/features/stylistInvite/stylistInviteThunks';
import { clearError, clearInviteLink } from '@/features/stylistInvite/stylistInviteSlice';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { showError } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LIST_PATH = '/admin/stylists';
const BREADCRUMBS = [{ label: 'Stylists', href: LIST_PATH }, { label: 'Invite Stylist' }];

const inviteSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  specialization: z.string().trim().min(2, 'Specialization is required'),
  experience: z.number({ message: 'Enter years of experience' }).min(0, 'Cannot be negative'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function StylistInvitePage() {
  const dispatch = useAppDispatch();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', specialization: '', experience: 0 },
  });

  const onSubmit = async (data: InviteFormData) => {
    const result = await dispatch(createStylistInvite(data));
    if (createStylistInvite.fulfilled.match(result)) {
      setInviteLink(result.payload.inviteLink);
      dispatch(clearInviteLink());
    } else {
      // The list page shows this store error, so it must not follow the admin back there
      dispatch(clearError());
      showError(
        'Failed to Send Invite',
        (result.payload as string) || ERROR_MESSAGES.CREATE_FAILED,
      );
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Could not copy', 'Select the link and copy it manually.');
    }
  };

  if (inviteLink) {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Invitation Sent" breadcrumbs={BREADCRUMBS} backTo={LIST_PATH} />
        <Card>
          <CardContent className="space-y-4 p-4 !pt-4 sm:p-6 sm:!pt-6">
            <p className="font-medium text-green-700">The stylist has been invited by email.</p>
            <p className="break-all rounded-lg bg-muted p-3 font-mono text-sm">{inviteLink}</p>
            <p className="text-sm text-muted-foreground">This link expires in 24 hours.</p>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={copyLink}>
              {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </CardContent>
        </Card>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setInviteLink(null);
              reset();
            }}
          >
            Invite Another
          </Button>
          <Button asChild>
            <Link to={LIST_PATH}>Back to Stylists</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPage
      title="Invite Stylist"
      description="Send an invitation link to a stylist's email"
      breadcrumbs={BREADCRUMBS}
      backTo={LIST_PATH}
      submitLabel={isSubmitting ? 'Sending...' : 'Send Invitation'}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="invite-email">Email *</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="stylist@salon.com"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-specialization">Specialization *</Label>
          <Input
            id="invite-specialization"
            placeholder="Hair Cutting, Coloring..."
            {...register('specialization')}
          />
          {errors.specialization && (
            <p className="text-sm text-red-600">{errors.specialization.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-experience">Experience (years) *</Label>
          <Input
            id="invite-experience"
            type="number"
            min={0}
            {...register('experience', { valueAsNumber: true })}
          />
          {errors.experience && <p className="text-sm text-red-600">{errors.experience.message}</p>}
        </div>
      </div>
    </FormPage>
  );
}
