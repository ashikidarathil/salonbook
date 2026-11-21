'use client';

import { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAllCoupons, toggleCouponStatus, deleteCoupon } from '@/features/coupon/coupon.thunks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
          <Button asChild className="w-full gap-2 sm:w-auto">
            <Link to="new">
              <Icon icon="solar:add-circle-bold" className="size-5" />
              Create Coupon
            </Link>
          </Button>
        }
      />

      {/* Filters Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute -translate-y-1/2 left-3 top-1/2 size-4 text-slate-400"
          />
          <Input
            placeholder="Search by coupon code..."
            value={searchTerm}
            onChange={(e) => list.update({ q: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: string) => list.update({ status: value })}
        >
          <SelectTrigger className="bg-white">
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

      <Card>
        <CardHeader>
          <CardTitle>Coupons List</CardTitle>
          <CardDescription>
            Manage all your discount coupons, include active, inactive and archived ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 lg:p-6 lg:pt-0">
          {loading && coupons.length === 0 && (
            <div className="flex justify-center py-10 lg:hidden">
              <Loader label="Loading coupons" />
            </div>
          )}
          {!loading && coupons.length === 0 && (
            <p className="py-10 text-center text-muted-foreground lg:hidden">No coupons found.</p>
          )}
          <ul className="divide-y border-t lg:hidden">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'break-all font-bold',
                        coupon.isDeleted && 'text-slate-400 line-through',
                      )}
                    >
                      {coupon.code}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {coupon.discountType === DiscountType.PERCENTAGE
                        ? `${coupon.discountValue}% off`
                        : `₹${coupon.discountValue} off`}
                      {' · '}Min ₹{coupon.minBookingAmount}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'shrink-0 cursor-default text-white',
                      coupon.isDeleted
                        ? 'bg-yellow-500 hover:bg-yellow-500'
                        : coupon.isActive
                          ? 'bg-green-500 hover:bg-green-500'
                          : 'bg-red-500 hover:bg-red-500',
                    )}
                  >
                    {coupon.isDeleted ? 'DELETED' : coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Used</dt>
                    <dd className="font-medium">
                      {coupon.usedCount} / {coupon.maxUsage}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Max off</dt>
                    <dd className="font-medium">
                      {coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Expires</dt>
                    <dd className="font-medium">
                      {format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}
                    </dd>
                  </div>
                </dl>
                {coupon.isDeleted ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleDelete(coupon)}
                  >
                    Restore
                  </Button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${coupon.id}/edit`} state={{ from: location.search }}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={() => handleToggleDelete(coupon)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. Amount</TableHead>
                  <TableHead>Max Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No coupons found.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id} className={coupon.isDeleted ? 'bg-slate-50/50' : ''}>
                      <TableCell className="font-bold">
                        <div className="flex flex-col">
                          <span className={coupon.isDeleted ? 'text-slate-400 line-through' : ''}>
                            {coupon.code}
                          </span>
                          {coupon.isDeleted && (
                            <span className="text-[10px] text-destructive font-normal italic">
                              Archived
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.discountType === DiscountType.PERCENTAGE
                          ? `${coupon.discountValue}%`
                          : `₹${coupon.discountValue}`}
                      </TableCell>
                      <TableCell>₹{coupon.minBookingAmount}</TableCell>
                      <TableCell>
                        {coupon.maxDiscountAmount ? `₹${coupon.maxDiscountAmount}` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs">
                            {coupon.usedCount} / {coupon.maxUsage}
                          </span>
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${Math.min(100, (coupon.usedCount / coupon.maxUsage) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {coupon.isDeleted ? (
                          <Badge className="text-white bg-yellow-500 cursor-default hover:bg-yellow-500">
                            DELETED
                          </Badge>
                        ) : (
                          <Badge
                            className={cn(
                              'cursor-default',
                              coupon.isActive
                                ? 'bg-green-500 text-white hover:bg-green-500'
                                : 'bg-red-500 text-white hover:bg-red-500',
                            )}
                          >
                            {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {coupon.isDeleted ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!coupon.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                coupon.isActive
                                  ? 'text-amber-500 hover:bg-amber-500/10'
                                  : 'text-green-500 hover:bg-green-500/10'
                              }
                              onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
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
                          )}
                          {!coupon.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:text-primary hover:bg-primary/10"
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
                            title={coupon.isDeleted ? 'Restore Coupon' : 'Delete Coupon'}
                          >
                            <Icon
                              icon={
                                coupon.isDeleted
                                  ? 'solar:refresh-bold'
                                  : 'solar:trash-bin-trash-bold'
                              }
                              className="size-5"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={(page) => list.update({}, page)}
        />
      )}
    </div>
  );
}
