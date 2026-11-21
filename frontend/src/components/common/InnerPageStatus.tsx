import { Link } from 'react-router-dom';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Loader } from './Loader';
import { PageHeader } from './PageHeader';

interface InnerPageStatusProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  backTo: string;
  /** Leave empty while loading */
  message?: string;
}

/** The loading or "cannot open" state of an inner page. */
export function InnerPageStatus({ title, breadcrumbs, backTo, message }: InnerPageStatusProps) {
  return (
    <div className="w-full space-y-6">
      <PageHeader title={title} breadcrumbs={breadcrumbs} backTo={backTo} />
      {message ? (
        <div className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">{message}</p>
          <Button asChild variant="outline">
            <Link to={backTo}>Go back</Link>
          </Button>
        </div>
      ) : (
        <div className="flex justify-center py-16">
          <Loader label="Loading" />
        </div>
      )}
    </div>
  );
}
