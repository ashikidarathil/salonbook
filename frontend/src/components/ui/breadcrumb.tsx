import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const homeFor = (pathname: string) => {
  if (/^\/admin(\/|$)/.test(pathname)) return '/admin';
  if (/^\/stylist(\/|$)/.test(pathname)) return '/stylist';
  return '/';
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <li className="flex items-center">
          <Link
            to={homeFor(pathname)}
            aria-label="Home"
            className="transition-colors hover:text-primary"
          >
            <Icon icon="solar:home-2-bold" className="size-4" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
            <Icon icon="solar:alt-arrow-right-linear" className="size-3 shrink-0" />
            {item.href ? (
              <Link
                to={item.href}
                className="truncate font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
