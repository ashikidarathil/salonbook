'use client';

import { Loader } from '@/components/common/Loader';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reviewService } from '../../features/review/review.service';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { TopService } from '@/features/review/review.types';

export function PopularServices() {
  const [services, setServices] = useState<TopService[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopServices = async () => {
      try {
        const data = await reviewService.getTopServices(6);
        setServices(data);
      } catch (error) {
        console.error('Failed to fetch top services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopServices();
  }, []);

  if (loading) {
    return (
      <section className="container flex min-h-[420px] items-center justify-center px-4 py-16 mx-auto">
        <Loader size="lg" label="Loading services" />
      </section>
    );
  }

  if (services.length === 0) return null;

  return (
    <section className="container px-4 py-16 mx-auto md:py-24">
      <div className="mb-12 text-center">
        <h2 className="mb-3 text-3xl font-semibold tracking-tight font-heading md:text-4xl">
          Popular Services
        </h2>
        <p className="text-muted-foreground">Discover our most-booked services</p>
      </div>
      {/* Phones swipe through the services; wider screens show a grid */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {services.map((service) => (
          <Card
            key={service.serviceId}
            className="group flex w-[82%] shrink-0 snap-start flex-col overflow-hidden border-border/60 transition-colors hover:border-primary/50 sm:w-[45%] md:w-auto"
          >
            {/* Service Image */}
            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-muted/30 p-6 sm:h-64 sm:p-8">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.serviceName}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-white rounded-lg shadow-sm opacity-50">
                  <Icon
                    icon="solar:scissors-square-bold-duotone"
                    className="size-16 text-muted-foreground/30"
                  />
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="p-6 pt-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold">
                  {service.serviceName.charAt(0).toUpperCase() + service.serviceName.slice(1)}
                </h3>
                {service.categoryName && (
                  <Badge className="px-2 font-normal rounded-sm" variant="outline">
                    {service.categoryName.charAt(0).toUpperCase() + service.categoryName.slice(1)}
                  </Badge>
                )}
              </div>

              {service.description && (
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      icon="solar:star-bold"
                      className={cn(
                        'size-4',
                        i < Math.floor(service.averageRating || 0)
                          ? 'text-yellow-400'
                          : 'text-muted-foreground/30',
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold">
                  {service.averageRating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({service.totalReviews || 0} reviews)
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">
                  {service.bookingCount} {service.bookingCount === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <span className="text-sm font-medium text-muted-foreground">
                  Price varies by branch
                </span>
                <Button
                  className="shadow-md bg-primary hover:bg-primary/90 shadow-primary/20"
                  onClick={() => navigate('/services')}
                >
                  View Services
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
