'use client';

import { RouteBreadcrumbs } from '@/components/common/RouteBreadcrumbs';
import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  fetchNearestBranches,
  fetchPublicPaginatedBranches,
} from '@/features/branch/branch.thunks';
import { setBranchSelected } from '@/features/branch/branch.slice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify/react';
import { showSuccess } from '@/common/utils/swal.utils';
import { Header } from '@/components/user/Header';
import { Footer } from '@/components/user/Footer';
import Pagination from '@/components/pagination/Pagination';
import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/branch/branch.slice';
import type { Branch, NearestBranch } from '@/features/branch/branch.types';

export default function BranchesListingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { nearestBranches, branches, loading, pagination } = useAppSelector(
    (state) => state.branch,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [hasLocation, setHasLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setTimeout(() => {
        setLocationError(
          "This browser can't share your location, so branches are listed in the usual order.",
        );
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`User location: ${latitude}, ${longitude}`);

        dispatch(fetchNearestBranches({ latitude, longitude })).then(() => {
          setHasLocation(true);
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Plain words instead of the browser's own error text
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location is turned off, so branches are listed in the usual order. Turn it on to see the nearest branch first.'
            : "We couldn't find your location, so branches are listed in the usual order.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [dispatch]);

  // Effect for fetching branches when search or page changes (if not using location)
  useEffect(() => {
    if (!hasLocation) {
      dispatch(
        fetchPublicPaginatedBranches({
          page: currentPage,
          limit: 9,
          search: search || undefined,
        }),
      );
    }
  }, [dispatch, currentPage, search, hasLocation]);

  const filteredBranches = useMemo(() => {
    const branchesToFilter = hasLocation && nearestBranches.length > 0 ? nearestBranches : branches;

    if (!search.trim()) {
      return branchesToFilter;
    }

    const searchLower = search.toLowerCase();
    return branchesToFilter.filter((branch) => {
      return (
        branch.name.toLowerCase().includes(searchLower) ||
        branch.address?.toLowerCase().includes(searchLower) ||
        (branch.phone && branch.phone.includes(search))
      );
    });
  }, [search, hasLocation, nearestBranches, branches]);

  const handleSelectBranch = (branch: Branch) => {
    dispatch(setBranchSelected(branch));

    showSuccess('Success!', `${branch.name} has been selected`, 1500);

    setTimeout(() => {
      const returnPath = localStorage.getItem('returnPath');
      if (returnPath) {
        localStorage.removeItem('returnPath');
        navigate(returnPath);
      } else {
        navigate('/');
      }
    }, 500);
  };

  const branchError = useAppSelector((state) => state.branch.error);
  const selectedBranch = useAppSelector((state) => state.branch.selectedBranch);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <RouteBreadcrumbs className="w-full px-4 pt-4 sm:px-6 lg:px-8" />

      <main className="flex-1">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="break-words text-2xl font-bold sm:text-3xl">Find Our Branches</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasLocation ? '📍 Showing branches nearest to you' : 'Browse our salons'}
            </p>
            {locationError && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Icon icon="solar:map-point-linear" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{locationError}</span>
              </p>
            )}
          </div>

          {/* Search Input */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Icon
                icon="solar:magnifer-linear"
                className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search by name, address, or phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="py-2 pl-10 h-11"
              />
            </div>
          </div>

          <LoadingGate
            loading={loading}
            error={branchError}
            data={filteredBranches}
            resetError={() => dispatch(clearError())}
            backPath="/"
            emptyMessage={
              search ? 'No branches found matching your search' : 'No branches available'
            }
            emptyIcon="solar:map-point-bold"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBranches.map((branch: Branch, index: number) => (
                <Card
                  key={branch.id || index}
                  className={cn(
                    'flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg',
                    selectedBranch?.id === branch.id && 'border-primary ring-1 ring-primary',
                  )}
                >
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {'distance' in branch && (
                      <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold w-fit">
                        <Icon icon="solar:map-point-bold" className="size-4" />
                        {((branch as NearestBranch).distance / 1000).toFixed(1)} km away
                      </div>
                    )}

                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="min-w-0 break-words text-xl font-bold text-gray-900">
                        {branch.name}
                      </h3>
                      {selectedBranch?.id === branch.id && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Selected
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex gap-3 mb-4 text-sm text-muted-foreground">
                      <Icon icon="solar:home-bold" className="flex-shrink-0 size-5 text-primary" />
                      <p className="line-clamp-2">{branch.address}</p>
                    </div>

                    {/* Phone */}
                    {branch.phone && (
                      <div className="flex gap-3 mb-6 text-sm text-muted-foreground">
                        <Icon
                          icon="solar:phone-bold"
                          className="flex-shrink-0 size-5 text-primary"
                        />
                        <p>{branch.phone}</p>
                      </div>
                    )}

                    {/* Spacer */}
                    <div className="flex-1"></div>

                    {/* Select Button */}
                    <Button
                      onClick={() => handleSelectBranch(branch)}
                      className="w-full font-semibold text-white bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Icon icon="solar:check-circle-bold" className="mr-2 size-5" />
                      {selectedBranch?.id === branch.id
                        ? 'Continue with this branch'
                        : 'Select Branch'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </LoadingGate>

          {/* Results Count */}
          {filteredBranches.length > 0 && (
            <div className="mt-8 text-sm text-center text-muted-foreground">
              Showing {filteredBranches.length} branch
              {filteredBranches.length !== 1 ? 'es' : ''}
              {!hasLocation && pagination && ` of ${pagination.totalItems}`}
            </div>
          )}

          {/* Pagination */}
          {!hasLocation && pagination && pagination.totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
