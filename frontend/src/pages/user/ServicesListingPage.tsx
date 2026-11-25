'use client';

import { RouteBreadcrumbs } from '@/components/common/RouteBreadcrumbs';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBranchServicesPublicPaginated } from '@/features/branchService/branchService.thunks';
import { fetchPublicCategories } from '@/features/category/categoryThunks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { Header } from '@/components/user/Header';
import { Footer } from '@/components/user/Footer';
import { cn } from '@/lib/utils';
import Pagination from '@/components/pagination/Pagination';
import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/branchService/branchService.slice';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { addToCart, removeFromCart } from '@/features/cart/cart.slice';
import { useDebounce } from '@/hooks/useDebounce';

export default function ServicesListingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { selectedBranch } = useAppSelector((state) => state.branch);
  const { services, pagination, loading } = useAppSelector((state) => state.branchService);
  const { categories } = useAppSelector((state) => state.category);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const cart = useAppSelector((state) => state.cart);

  useEffect(() => {
    const savedBranch = localStorage.getItem('selectedBranch');

    if (!savedBranch) {
      localStorage.setItem('returnPath', '/services');
      navigate('/branches');
    }
  }, [navigate]);

  useEffect(() => {
    dispatch(fetchPublicCategories());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBranch?.id) {
      dispatch(
        fetchBranchServicesPublicPaginated({
          branchId: selectedBranch.id,
          page: currentPage,
          limit: 9,
          search: debouncedSearch || undefined,
          categoryId: selectedCategory || undefined,
        }),
      );
    }
  }, [dispatch, selectedBranch, debouncedSearch, selectedCategory, currentPage]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId === 'all' ? '' : categoryId);
    setCurrentPage(1);
  };

  const detailsPath = (service: { serviceId: string; serviceSlug?: string }) => {
    const branch = selectedBranch!;
    return `/branches/${branch.slug || branch.id}/services/${service.serviceSlug || service.serviceId}`;
  };

  const branchServiceError = useAppSelector((state) => state.branchService.error);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background pb-16 pt-4 text-center md:pb-20">
          <div className="absolute top-0 w-full h-full -translate-x-1/2 pointer-events-none left-1/2 bg-gradient-to-b from-white/50 to-transparent" />
          {/* Breadcrumbs sit inside the header band, lined up with the content below */}
          <div className="container relative z-10 mx-auto mb-10 px-4 text-left md:mb-12">
            <RouteBreadcrumbs />
          </div>
          <div className="container relative z-10 flex flex-col items-center px-4 mx-auto">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl text-foreground font-heading">
              Our Services
            </h1>
            <p className="max-w-2xl mx-auto mb-10 text-lg text-muted-foreground">
              {selectedBranch?.name
                ? `Available at ${selectedBranch.name}`
                : 'Discover premium salon services tailored to enhance your style and beauty.'}
            </p>
            <div className="flex flex-row items-center w-full max-w-2xl gap-1 sm:gap-2 p-1.5 sm:p-2 mx-auto border rounded-full shadow-sm bg-background border-border">
              <div className="pl-3 sm:pl-4 text-muted-foreground">
                <Icon icon="solar:magnifer-linear" className="size-4 sm:size-5" />
              </div>
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 h-10 w-full min-w-0 text-xs sm:text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/70"
              />
              <div className="hidden sm:block w-px h-6 mx-1 sm:mx-2 bg-border shrink-0" />
              <div className="hidden sm:block">
                <Select value={selectedCategory || 'all'} onValueChange={handleCategoryFilter}>
                  <SelectTrigger className="w-[130px] sm:w-[180px] px-2 sm:px-3 text-xs sm:text-sm border-none shadow-none focus:ring-0 bg-transparent h-10 text-muted-foreground font-normal shrink-0">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000] bg-white">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories && categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        No categories available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <div className="container px-4 py-12 mx-auto space-y-12">
          {/* Category Filter */}
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-3 px-4 pb-2 overflow-x-auto md:hidden scrollbar-hide">
              <Button
                variant={!selectedCategory ? 'default' : 'ghost'}
                className={
                  !selectedCategory
                    ? 'rounded-full px-6 shadow-md shadow-primary/20 shrink-0'
                    : 'rounded-full px-6 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0'
                }
                onClick={() => handleCategoryFilter('all')}
              >
                All Services
              </Button>
              {categories &&
                categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                    className={
                      selectedCategory === cat.id
                        ? 'rounded-full px-6 shadow-md shadow-primary/20 shrink-0'
                        : 'rounded-full px-6 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0'
                    }
                    onClick={() => handleCategoryFilter(cat.id)}
                  >
                    {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                  </Button>
                ))}
            </div>

            {/* Desktop View: Carousel */}
            <div className="hidden px-12 md:block">
              <Carousel
                opts={{
                  align: 'start',
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  <CarouselItem className="pl-4 basis-auto sm:basis-auto">
                    <Button
                      variant={!selectedCategory ? 'default' : 'ghost'}
                      className={
                        !selectedCategory
                          ? 'rounded-full px-6 shadow-md shadow-primary/20'
                          : 'rounded-full px-6 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                      onClick={() => handleCategoryFilter('all')}
                    >
                      All Services
                    </Button>
                  </CarouselItem>
                  {categories &&
                    categories.map((cat) => (
                      <CarouselItem key={cat.id} className="pl-4 basis-auto sm:basis-auto">
                        <Button
                          variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                          className={
                            selectedCategory === cat.id
                              ? 'rounded-full px-6 shadow-md shadow-primary/20'
                              : 'rounded-full px-6 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }
                          onClick={() => handleCategoryFilter(cat.id)}
                        >
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        </Button>
                      </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="-left-12" />
                <CarouselNext className="-right-12" />
              </Carousel>
            </div>
          </div>

          <LoadingGate
            loading={loading}
            error={branchServiceError}
            data={services}
            emptyMessage="No services match your search criteria"
            emptyIcon="solar:bag-smile-bold-duotone"
            resetError={() => dispatch(clearError())}
            backPath="/services"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {services.map((service) => (
                <Card
                  key={service.serviceId}
                  className="group relative flex cursor-pointer flex-col overflow-hidden border-border/60 transition-colors hover:border-primary/50"
                >
                  {/* Service Image */}
                  <div className="relative flex items-center justify-center overflow-hidden bg-muted/30 p-4 sm:p-6 md:p-8">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-white opacity-50 shadow-sm">
                        <Icon
                          icon="solar:scissors-square-bold-duotone"
                          className="size-16 text-muted-foreground/30"
                        />
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="flex min-w-0 flex-1 flex-col p-4 md:p-6">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <h3 className="min-w-0 break-words text-base font-bold md:text-lg">
                        {/* Stretched link: the whole card opens the service page */}
                        <Link
                          to={detailsPath(service)}
                          className="outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-primary"
                        >
                          {service.name.charAt(0).toUpperCase() + service.name.slice(1)}
                        </Link>
                      </h3>
                      {service.categoryName && (
                        <Badge className="px-2 font-normal rounded-sm" variant="outline">
                          {service.categoryName.charAt(0).toUpperCase() +
                            service.categoryName.slice(1)}
                        </Badge>
                      )}
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Icon
                            key={i}
                            icon="solar:star-bold"
                            className={cn(
                              'size-4',
                              i < Math.floor(service.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-muted-foreground/30',
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold">
                        {service.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({service.reviewCount || 0} reviews)
                      </span>
                    </div>

                    {service.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground md:mb-4">
                        {service.description}
                      </p>
                    )}

                    {service.duration && (
                      <div className="mb-3 flex items-center text-sm text-muted-foreground md:mb-4">
                        <Icon icon="solar:clock-circle-linear" className="mr-2 size-4" />
                        <span>{service.duration} minutes</span>
                      </div>
                    )}

                    <div className="mt-auto flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-xl font-bold text-foreground md:text-2xl">
                        {service.price
                          ? `₹${service.price.toLocaleString('en-IN')}`
                          : 'Price on request'}
                      </span>
                      <div className="relative z-10 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 md:flex md:items-center">
                        <Button
                          variant="outline"
                          className={cn(
                            'h-9 min-w-0 px-2 md:h-10 md:flex-1 md:px-4',
                            cart.items.some((i) => i.serviceId === service.serviceId)
                              ? 'bg-primary/10 border-primary text-primary'
                              : '',
                          )}
                          onClick={() => {
                            if (!isAuthenticated) {
                              localStorage.setItem('returnPath', window.location.pathname);
                              navigate('/login');
                              return;
                            }
                            if (cart.items.some((i) => i.serviceId === service.serviceId)) {
                              dispatch(removeFromCart(service.serviceId));
                            } else {
                              dispatch(
                                addToCart({
                                  item: {
                                    serviceId: service.serviceId,
                                    name: service.name,
                                    price: service.price,
                                    duration: service.duration,
                                    imageUrl: service.imageUrl,
                                  },
                                  branchId: selectedBranch!.id,
                                }),
                              );
                            }
                          }}
                        >
                          {cart.items.some((i) => i.serviceId === service.serviceId)
                            ? 'Added'
                            : 'Add to Cart'}
                        </Button>
                        <Button
                          className="h-9 min-w-0 bg-primary px-2 shadow-md shadow-primary/20 hover:bg-primary/90 md:h-10 md:px-4"
                          onClick={() => navigate(detailsPath(service))}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </LoadingGate>

          {/* Pagination */}
          {pagination && services && services.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
