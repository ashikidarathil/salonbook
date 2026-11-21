import type { FormEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';
import { PageHeader } from './PageHeader';

interface FormPageProps {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  /** Where Back and Cancel go */
  backTo: string;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

/** A full inner page for a create or edit form. Replaces form popups. */
export function FormPage({
  title,
  description,
  breadcrumbs,
  backTo,
  submitLabel,
  isSubmitting,
  onSubmit,
  children,
}: FormPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        backTo={backTo}
      />
      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardContent className="space-y-6 p-4 !pt-4 sm:p-6 sm:!pt-6">{children}</CardContent>
        </Card>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to={backTo}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
