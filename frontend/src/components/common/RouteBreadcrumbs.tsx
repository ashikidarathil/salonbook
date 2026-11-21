import { matchPath, useLocation } from 'react-router-dom';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';

type Params = Record<string, string | undefined>;
type CrumbRoute = [pattern: string, crumbs: (params: Params) => BreadcrumbItem[]];

const fromSlug = (slug = '') =>
  slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const single = (label: string) => () => [{ label }];

/**
 * Breadcrumbs for pages without their own PageHeader. Chat stays out on purpose:
 * it fills the whole screen height like a messaging app.
 */
const ROUTES: CrumbRoute[] = [
  ['/admin', single('Dashboard')],
  ['/admin/users', single('Customers')],
  [
    '/admin/bookings/:id',
    ({ id }) => [{ label: 'Bookings', href: '/admin/bookings' }, { label: id ?? 'Booking' }],
  ],
  ['/admin/off-days', single('Leave Requests')],
  ['/admin/notifications', single('Notifications')],
  ['/admin/wallet', single('Platform Wallet')],
  ['/admin/reviews', single('Reviews')],

  ['/stylist', single('Dashboard')],
  ['/stylist/profile', single('Profile')],
  ['/stylist/off-days', single('Leave Requests')],
  ['/stylist/appointments', single('Appointments')],
  [
    '/stylist/appointments/:id',
    ({ id }) => [
      { label: 'Appointments', href: '/stylist/appointments' },
      { label: id ?? 'Appointment' },
    ],
  ],
  ['/stylist/wallet', single('Wallet')],
  ['/stylist/notifications', single('Notifications')],
  ['/stylist/reviews', single('Reviews')],

  ['/profile', single('Profile Settings')],
  ['/profile/favorites', single('Favorites')],
  ['/profile/notifications', single('Notifications')],
  ['/profile/bookings', single('My Bookings')],
  [
    '/profile/bookings/:id',
    ({ id }) => [{ label: 'My Bookings', href: '/profile/bookings' }, { label: id ?? 'Booking' }],
  ],
  ['/profile/wallet', single('Wallet')],

  ['/branches', single('Branches')],
  ['/services', single('Services')],
  [
    '/branches/:branchId/services/:serviceId',
    ({ serviceId }) => [{ label: 'Services', href: '/services' }, { label: fromSlug(serviceId) }],
  ],
  ['/stylists', single('Stylists')],
  [
    '/stylists/:stylistId',
    ({ stylistId }) => [{ label: 'Stylists', href: '/stylists' }, { label: fromSlug(stylistId) }],
  ],
  ['/contact', single('Contact')],
  ['/cart', single('Cart')],
  ['/checkout/:bookingId', () => [{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]],
  ['/payment/success/:bookingId', single('Payment Successful')],
  ['/payment/failure/:bookingId', single('Payment Failed')],
];

export function RouteBreadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation();
  for (const [pattern, crumbs] of ROUTES) {
    const match = matchPath({ path: pattern, end: true }, pathname);
    if (match) {
      return (
        <div className={className}>
          <Breadcrumb items={crumbs(match.params)} />
        </div>
      );
    }
  }
  return null;
}
