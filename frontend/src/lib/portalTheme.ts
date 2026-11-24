import { loaderSide } from '@/common/utils/loaderSide';

/**
 * Popups (menus, selects, popovers, dialogs) render at the end of <body>, outside the page's
 * theme wrapper. This gives them the same side colours as the page they open from.
 */
export function portalTheme() {
  if (typeof window === 'undefined') return '';
  const side = loaderSide(window.location.pathname);
  if (side === 'admin') return 'theme-admin';
  if (side === 'stylist') return 'theme-stylist';
  return '';
}
