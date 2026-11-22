import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { loaderSide } from '@/common/utils/loaderSide';

type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

interface LoaderProps {
  size?: LoaderSize;
  /** Read by screen readers */
  label?: string;
  /** White shades, for use on a coloured background */
  inverse?: boolean;
  className?: string;
}

/** The one loading animation for the whole site, in shades of each side's primary color. */
export function Loader({ size = 'md', label = 'Loading', inverse, className }: LoaderProps) {
  const { pathname } = useLocation();

  return (
    <span
      role="status"
      aria-label={label}
      data-loader={loaderSide(pathname)}
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
