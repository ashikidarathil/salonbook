import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

interface LoaderProps {
  size?: LoaderSize;
  /** Read by screen readers */
  label?: string;
  /** White shades, for use on a coloured background */
  inverse?: boolean;
  className?: string;
}

const sideFromPath = (pathname: string) => {
  if (/^\/admin(\/|$)/.test(pathname)) return 'admin';
  // Not /stylists/..., which is the customer's public stylist page
  if (/^\/stylist(\/|$)/.test(pathname)) return 'stylist';
  return 'user';
};

/** The one loading animation for the whole site: pink (customer), blue (stylist), green (admin). */
export function Loader({ size = 'md', label = 'Loading', inverse, className }: LoaderProps) {
  const { pathname } = useLocation();

  return (
    <span
      role="status"
      aria-label={label}
      data-loader={sideFromPath(pathname)}
      data-loader-size={size}
      data-loader-inverse={inverse ? 'true' : undefined}
      className={cn('sb-loader', className)}
    >
      <span className="sb-loader__box" />
      <span className="sb-loader__box" />
      <span className="sb-loader__box" />
      <span className="sb-loader__box" />
      <span className="sb-loader__box" />
    </span>
  );
}
