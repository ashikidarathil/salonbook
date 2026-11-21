import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  /** Shows a back arrow beside the title */
  backTo?: string;
  actions?: ReactNode;
}

/** The top of every inner page: breadcrumbs, optional back arrow, title and actions. */
export function PageHeader({ title, description, breadcrumbs, backTo, actions }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      <Breadcrumb items={breadcrumbs} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          {backTo && (
            <Link
              to={backTo}
              aria-label="Go back"
              className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <Icon icon="solar:arrow-left-linear" className="size-5" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
