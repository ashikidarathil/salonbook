import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle } from 'lucide-react';
import * as z from 'zod';
import { useAppDispatch } from '@/app/hooks';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { applyAsStylist } from '@/features/stylistInvite/stylistInviteThunks';
import { FormPage } from '@/components/common/FormPage';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomerPage } from '@/components/user/CustomerPage';

const CONTACT = '/contact';
const TITLE = 'Apply to Become a Stylist';
const BREADCRUMBS = [{ label: 'Contact', href: CONTACT }, { label: 'Become a Stylist' }];

const applySchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  specialization: z.string().trim().min(2, 'Specialization is required'),
  experience: z
    .number({ message: 'Enter years of experience' })
    .min(0, 'Cannot be negative')
    .max(50, 'Must be 50 years or less'),
});

type ApplyFormData = z.infer<typeof applySchema>;

export default function StylistApplyPage() {
  const dispatch = useAppDispatch();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: { email: '', specialization: '' },
  });

  const onSubmit = async (data: ApplyFormData) => {
    setSubmitError(undefined);
    const result = await dispatch(applyAsStylist(data));
    if (applyAsStylist.fulfilled.match(result)) {
      setSubmitted(true);
    } else {
      setSubmitError((result.payload as string) || ERROR_MESSAGES.CREATE_FAILED);
    }
  };

  if (submitted) {
    return (
      <CustomerPage>
        <PageHeader title="Application Submitted" breadcrumbs={BREADCRUMBS} backTo={CONTACT} />
        <Card>
          <CardContent className="space-y-4 p-6 !pt-8 text-center">
            <CheckCircle className="mx-auto size-16 text-green-600" />
            <p className="text-muted-foreground">
              Thank you for your interest. Our team will review your application and send you an
              invitation link if approved.
            </p>
            <Button asChild variant="outline">
              <Link to={CONTACT}>Back to Contact</Link>
            </Button>
          </CardContent>
        </Card>
      </CustomerPage>
    );
  }

  return (
    <CustomerPage>
      <FormPage
        title={TITLE}
        description="Join SalonBook and grow your career with us"
        breadcrumbs={BREADCRUMBS}
        backTo={CONTACT}
        submitLabel={isSubmitting ? 'Submitting...' : 'Submit Application'}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="apply-email">Email *</Label>
            <Input
              id="apply-email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="apply-specialization">Specialization *</Label>
            <Input
              id="apply-specialization"
              placeholder="Hair Cutting, Coloring, Makeup..."
              {...register('specialization')}
            />
            {errors.specialization && (
              <p className="text-sm text-red-600">{errors.specialization.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="apply-experience">Years of Experience *</Label>
            <Input
              id="apply-experience"
              type="number"
              min={0}
              max={50}
              placeholder="5"
              {...register('experience', { valueAsNumber: true })}
            />
            {errors.experience && (
              <p className="text-sm text-red-600">{errors.experience.message}</p>
            )}
          </div>
        </div>
        {submitError && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          >
            {submitError}
          </p>
        )}
      </FormPage>
    </CustomerPage>
  );
}
