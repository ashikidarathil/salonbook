'use client';

import { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAllCoupons, toggleCouponStatus, deleteCoupon } from '@/features/coupon/coupon.thunks';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { DiscountType, type Coupon } from '@/features/coupon/coupon.types';
import { showSuccess, showError, showConfirm } from '@/common/utils/swal.utils';
import { format } from 'date-fns';
import Pagination from '@/components/pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { PageHeader } from '@/components/common/PageHeader';
import { Loader } from '@/components/common/Loader';

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const discountLabel = (coupon: Coupon) =>
  coupon.discountType === DiscountType.PERCENTAGE
    ? `${coupon.discountValue}%`
    : rupees(coupon.discountValue);

function CouponStatus({ coupon }: { coupon: Coupon }) {
  if (coupon.isDeleted) return <Badge variant="destructive">Deleted</Badge>;
  return (
    <Badge
      variant="outline"
      className={
        coupon.isActive
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }
    >
      {coupon.isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}

function UsageBar({ coupon }: { coupon: Coupon }) {
  const percent = coupon.maxUsage ? Math.min(100, (coupon.usedCount / coupon.maxUsage) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function CouponManagementPage() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const list = useListParams();
  const statusParam = list.value('status');
  const statusFilter = (
    ['ACTIVE', 'INACTIVE', 'DELETED'].includes(statusParam) ? statusParam : 'ALL'
  ) as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'DELETED';
  const searchTerm = list.search;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const currentPage = list.page;
  const itemsPerPage = 10;
  const { coupons, loading, pagination } = useAppSelector((state) => state.coupon);

  const loadCoupons = useCallback(() => {
    dispatch(
      fetchAllCoupons({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
    );
  }, [dispatch, currentPage, itemsPerPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    const action = !currentActive ? 'activate' : 'deactivate';

    const isConfirmed = await showConfirm(
      'Are you sure?',
      `Do you want to ${action} this coupon?`,
      `Yes, ${action}`,
    );

    if (isConfirmed) {
      const result = await dispatch(toggleCouponStatus(id));
      if (toggleCouponStatus.fulfilled.match(result)) {
        showSuccess('Success', `Coupon ${action}d successfully`, 1500);
      } else {
        showError('Error', (result.payload as string) || 'Failed to update status');
      }
    }
  };

  const handleToggleDelete = async (coupon: Coupon) => {
    const action = coupon.isDeleted ? 'restore' : 'delete';

    const isConfirmed = await showConfirm(
      'Are you sure?',
      `Do you want to ${action} this coupon?`,
      `Yes, ${action} it!`,
      'Cancel',
      action === 'delete' ? '#d33' : '#3085d6',
    );

    if (isConfirmed) {
      const result = await dispatch(deleteCoupon(coupon.id));
      if (deleteCoupon.fulfilled.match(result)) {
        showSuccess(
          'Success',
          `Coupon has been ${action === 'delete' ? 'deleted' : 'restored'}.`,
          1500,
        );
      } else {
        showError('Error', (result.payload as string) || `Failed to ${action} coupon`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupon Management"
        description="Create and manage discount coupons for your customers."
        breadcrumbs={[{ label: 'Coupons' }]}
        actions={
          <Button asChild className="h-10 w-full gap-2 sm:w-auto">
            <Link to="new">
              <Icon icon="solar:add-circle-bold" className="size-5" />
              Create Coupon
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search coupons"
            placeholder="Search by code..."
            value={searchTerm}
            onChange={(e) => list.update({ q: e.target.value })}
            className="h-10 pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: string) => list.update({ status: value })}
        >
          <SelectTrigger aria-label="Filter by status" className="h-10 bg-white sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ALL">All Coupons</SelectItem>
            <SelectItem value="ACTIVE">Active Only</SelectItem>
            <SelectItem value="INACTIVE">Inactive Only</SelectItem>
            <SelectItem value="DELETED">Deleted Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && coupons.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader label="Loading coupons" />
        </div>
      ) : coupons.length === 0 ? (
        <p className="rounded-2xl border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
          No coupons found.
        </p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            All Coupons{' '}
            <span className="text-muted-foreground">
              ({pagination?.totalItems ?? coupons.length})
            </span>
          </h2>

          {/* Phones, tablets and small laptops */}
          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'break-all font-bold tracking-wide',
                        coupon.isDeleted && 'text-muted-foreground line-through',
                      )}
                    >
                      {coupon.code}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-semibold text-primary">
                        {discountLabel(coupon)} off
                      </span>
                      {' · '}Min {rupees(coupon.minBookingAmount)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <CouponStatus coupon={coupon} />
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Used</dt>
                    <dd className="mt-0.5 break-words font-semibold">
                      {coupon.usedCount.toLocaleString('en-IN')} /{' '}
                      {coupon.maxUsage.toLocaleString('en-IN')}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Max off</dt>
                    <dd className="mt-0.5 break-words font-semibold">
                      {coupon.maxDiscountAmount ? rupees(coupon.maxDiscountAmount) : '—'}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-muted-foreground">Expires</dt>
                    <dd className="mt-0.5 break-words font-semibold">
                      {format(new Date(coupon.expiryDate), 'd MMM yyyy')}
                    </dd>
                  </div>
                  <div className="col-span-3">
                    <UsageBar coupon={coupon} />
                  </div>
                </dl>
                {coupon.isDeleted ? (
                  <Button
                    variant="outline"
                    className="mt-auto h-10 w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleToggleDelete(coupon)}
                  >
                    Restore
                  </Button>
                ) : (
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    <Button variant="outline" className="h-10 min-w-0 px-2" asChild>
                      <Link to={`${coupon.id}/edit`} state={{ from: location.search }}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 px-2"
                      onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 border-red-200 px-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleToggleDelete(coupon)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Laptops and desktops */}
          <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm xl:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Code</TableHead>
                  <TableHead className="w-[90px]">Discount</TableHead>
                  <TableHead className="w-[100px]">Min. Amount</TableHead>
                  <TableHead className="w-[105px]">Max Discount</TableHead>
                  <TableHead className="w-[120px]">Usage</TableHead>
                  <TableHead className="w-[115px]">Expiry</TableHead>
                  <TableHead className="w-[95px]">Status</TableHead>
                  <TableHead className="w-[160px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id} className={coupon.isDeleted ? 'bg-muted/30' : ''}>
                    <TableCell
                      className={cn(
                        'truncate pl-4 font-bold',
                        coupon.isDeleted && 'text-muted-foreground line-through',
                      )}
                      title={coupon.code}
                    >
                      {coupon.code}
                    </TableCell>
                    <TableCell>{discountLabel(coupon)}</TableCell>
                    <TableCell>{rupees(coupon.minBookingAmount)}</TableCell>
                    <TableCell>
                      {coupon.maxDiscountAmount ? rupees(coupon.maxDiscountAmount) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs">
                          {coupon.usedCount.toLocaleString('en-IN')} /{' '}
                          {coupon.maxUsage.toLocaleString('en-IN')}
                        </span>
                        <UsageBar coupon={coupon} />
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(coupon.expiryDate), 'd MMM yyyy')}</TableCell>
                    <TableCell>
                      <CouponStatus coupon={coupon} />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        {!coupon.isDeleted && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                coupon.isActive
                                  ? 'text-amber-500 hover:bg-amber-500/10'
                                  : 'text-green-500 hover:bg-green-500/10'
                              }
                              onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                              aria-label={`${coupon.isActive ? 'Deactivate' : 'Activate'} ${coupon.code}`}
                              title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                            >
                              <Icon
                                icon={
                                  coupon.isActive
                                    ? 'solar:close-circle-bold'
                                    : 'solar:check-circle-bold'
                                }
                                className="size-5"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-primary/10 hover:text-primary"
                              title="Edit Coupon"
                              asChild
                            >
                              <Link
                                to={`${coupon.id}/edit`}
                                state={{ from: location.search }}
                                aria-label={`Edit ${coupon.code}`}
                              >
                                <Icon icon="solar:pen-bold" className="size-5" />
                              </Link>
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={
                            coupon.isDeleted
                              ? 'text-primary hover:bg-primary/10'
                              : 'text-destructive hover:bg-destructive/10'
                          }
                          onClick={() => handleToggleDelete(coupon)}
                          aria-label={`${coupon.isDeleted ? 'Restore' : 'Delete'} ${coupon.code}`}
                          title={coupon.isDeleted ? 'Restore Coupon' : 'Delete Coupon'}
                        >
                          <Icon
                            icon={
                              coupon.isDeleted ? 'solar:refresh-bold' : 'solar:trash-bin-trash-bold'
                            }
                            className="size-5"
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          className="mt-2"
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => list.update({}, page)}
        />
      )}
    </div>
  );
}
