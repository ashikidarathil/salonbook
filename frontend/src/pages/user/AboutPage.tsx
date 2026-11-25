import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { RouteBreadcrumbs } from '@/components/common/RouteBreadcrumbs';
import { Header } from '@/components/user/Header';
import { Footer } from '@/components/user/Footer';
import { HowItWorks } from '@/components/user/HowItWorks';
import { TopStylists } from '@/components/user/TopStylists';
import { Button } from '@/components/ui/button';
import { branchService } from '@/services/branch.service';
import { stylistInviteService } from '@/services/stylistInvite.service';
import { BOOKING_RULES } from '@/features/booking/booking.constants';

/** What booking through SalonBook actually gives a customer (all features the app has). */
const FEATURES = [
  {
    icon: 'solar:user-check-rounded-bold-duotone',
    title: 'Pick your stylist',
    text: 'See each stylist’s speciality and reviews, then book the one you trust.',
  },
  {
    icon: 'solar:calendar-mark-bold-duotone',
    title: 'Live time slots',
    text: 'Only free times are shown, so the slot you pick is really yours.',
  },
  {
    icon: 'solar:wallet-money-bold-duotone',
    title: 'Pay 20% to book',
    text: 'Secure your slot with a small advance and pay the rest at the salon.',
  },
  {
    icon: 'solar:calendar-search-bold-duotone',
    title: 'Plans change? Reschedule',
    text: `Move your appointment ${BOOKING_RULES.MAX_RESCHEDULES === 1 ? 'once' : `up to ${BOOKING_RULES.MAX_RESCHEDULES} times`}, up to 24 hours before it starts.`,
  },
  {
    icon: 'solar:chat-round-dots-bold-duotone',
    title: 'Chat with your stylist',
    text: 'Share a photo or a quick note about the look you want before you arrive.',
  },
  {
    icon: 'solar:card-recive-bold-duotone',
    title: 'Wallet for refunds',
    text: 'Refunds land in your SalonBook wallet, ready for your next booking.',
  },
];

export default function AboutPage() {
  const [counts, setCounts] = useState<{ branches?: number; stylists?: number }>({});

  useEffect(() => {
    let active = true;
    // Live numbers; if either call fails that figure is simply left out
    Promise.allSettled([
      branchService.listPublicPaginated({ page: 1, limit: 1 }),
      stylistInviteService.getPublicStylists({ page: 1, limit: 1 }),
    ]).then(([branches, stylists]) => {
      if (!active) return;
      setCounts({
        branches:
          branches.status === 'fulfilled'
            ? branches.value.data.data.pagination.totalItems
            : undefined,
        stylists:
          stylists.status === 'fulfilled'
            ? stylists.value.data.data.pagination.totalItems
            : undefined,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: 'Branches', value: counts.branches, icon: 'solar:map-point-wave-bold-duotone' },
    { label: 'Stylists', value: counts.stylists, icon: 'solar:scissors-bold-duotone' },
  ].filter((item) => item.value !== undefined && item.value > 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background pb-14 pt-4 md:pb-20">
          <div className="container mx-auto mb-10 px-4 md:mb-14">
            <RouteBreadcrumbs />
          </div>
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              About SalonBook
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Your salon visit, booked in a few taps
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              SalonBook lets you choose a branch near you, pick the stylist you want and book a time
              that suits you, without phone calls or waiting at the counter.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 font-semibold">
                <Link to="/services">Book a service</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 bg-white px-8 font-semibold"
              >
                <Link to="/branches">Find a branch</Link>
              </Button>
            </div>
          </div>
        </section>

        {stats.length > 0 && (
          <section className="container mx-auto px-4">
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:gap-6">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:p-6"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon icon={item.icon} className="size-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold sm:text-3xl">
                      {item.value?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Why book with us
            </h2>
            <p className="mt-2 text-muted-foreground">Everything you need, in one place</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon icon={feature.icon} className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-muted/30">
          <HowItWorks />
        </div>

        <TopStylists />

        <section className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground md:flex-row md:justify-between md:px-12 md:text-left">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Are you a stylist?</h2>
              <p className="mt-2 text-primary-foreground/80">
                Join SalonBook to fill your calendar and get paid straight to your wallet.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 shrink-0 bg-white px-8 font-semibold text-primary hover:bg-white/90"
            >
              <Link to="/contact/apply">Become a stylist</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
