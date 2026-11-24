'use client';

import { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchPaginatedServices,
  toggleServiceStatus,
  deleteServiceImage,
  softDeleteService,
  restoreService,
} from '@/features/service/serviceThunks';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Pagination from '@/components/pagination/Pagination';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import {
  showSuccess,
  showError,
  showConfirm,
  showLoading,
  closeLoading,
} from '@/common/utils/swal.utils';
import { fetchCategories } from '@/features/category/categoryThunks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Edit, Power, Ban, RotateCcw, ImagePlus, Eye, Search } from 'lucide-react';

import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/service/service.slice';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { PageHeader } from '@/components/common/PageHeader';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ITEMS_PER_PAGE = 5;

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const { services, loading, error, pagination } = useAppSelector((state) => state.service);
  const { categories } = useAppSelector((state) => state.category);

  const location = useLocation();
  const list = useListParams();
  const searchTerm = list.search;
  const debouncedSearch = useDebounce(searchTerm, 500);
  const categoryFilter = list.value('category');
  const statusParam = list.value('status');
  const statusFilter = (
    statusParam === 'ACTIVE' || statusParam === 'INACTIVE' ? statusParam : 'ALL'
  ) as 'ACTIVE' | 'INACTIVE' | 'ALL';
  const currentPage = list.page;

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const loadServices = useCallback(() => {
    dispatch(
      fetchPaginatedServices({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
    );
  }, [dispatch, currentPage, debouncedSearch, categoryFilter, statusFilter]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleDeleteImage = async (serviceId: string) => {
    const confirmed = await showConfirm(
      'Delete Image?',
      'Are you sure you want to delete this service image?',
      'Delete',
      'Cancel',
      '#ef4444',
    );

    if (!confirmed) return;

    showLoading('Deleting image...');
    const result = await dispatch(deleteServiceImage(serviceId));
    closeLoading();

    if (deleteServiceImage.fulfilled.match(result)) {
      showSuccess('Deleted', 'Image deleted successfully');
      loadServices();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate';

    const confirmed = await showConfirm(
      `${action} Service?`,
      `Are you sure you want to ${action.toLowerCase()} this service?`,
      `Yes, ${action}`,
      'Cancel',
    );

    if (!confirmed) return;

    showLoading(`${action}ing...`);
    const result = await dispatch(toggleServiceStatus({ id, status: newStatus }));
    closeLoading();

    if (toggleServiceStatus.fulfilled.match(result)) {
      showSuccess('Success', `Service ${action.toLowerCase()}d`);
      loadServices();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPDATE_FAILED);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Soft Delete Service?',
      'This will mark the service as deleted (can be restored later). Continue?',
      'Delete',
      'Cancel',
      '#ef4444',
    );

    if (!confirmed) return;

    showLoading('Deleting...');
    const result = await dispatch(softDeleteService(id));
    closeLoading();

    if (softDeleteService.fulfilled.match(result)) {
      showSuccess('Deleted', 'Service soft-deleted');
      loadServices();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  const handleRestore = async (id: string) => {
    showLoading('Restoring...');
    const result = await dispatch(restoreService(id));
    closeLoading();

    if (restoreService.fulfilled.match(result)) {
      showSuccess('Restored', 'Service restored successfully');
      loadServices();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE', isDeleted: boolean) => {
    if (isDeleted) return <Badge variant="destructive">Deleted</Badge>;
    return (
      <Badge
        variant="outline"
        className={
          status === 'ACTIVE'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }
      >
        {status === 'ACTIVE' ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const capitalizeFirst = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Management"
        description="Manage services with search, filters, and detailed information"
        breadcrumbs={[{ label: 'Services' }]}
        actions={
          <Button asChild className="h-10 w-full sm:w-auto">
            <Link to="new">Add New Service</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:flex">
        <div className="relative min-w-0 sm:col-span-2 xl:max-w-md xl:flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search services"
            className="h-10 pl-9"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => list.update({ q: e.target.value })}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(value) => list.update({ category: value })}>
          <SelectTrigger aria-label="Filter by category" className="h-10 min-w-0 xl:w-52">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {capitalizeFirst(cat.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => list.update({ status: value })}>
          <SelectTrigger aria-label="Filter by status" className="h-10 min-w-0 xl:w-40">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={services}
        resetError={() => {
          dispatch(clearError());
          loadServices();
        }}
        emptyMessage={searchTerm ? 'No matches for your search' : 'Add your first service above'}
        emptyIcon="hugeicons:service"
      >
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            All Services <span className="text-muted-foreground">({pagination.totalItems})</span>
          </h2>

          {/* Phones, tablets and small laptops */}
          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {services.map((svc) => (
              <li
                key={svc.id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {svc.imageUrl ? (
                    <img
                      src={svc.imageUrl}
                      alt=""
                      className="size-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <Link
                      to={`${svc.id}/edit#photo`}
                      state={{ from: location.search }}
                      aria-label={`Add photo to ${svc.name}`}
                      className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted"
                    >
                      <ImagePlus className="size-5 text-muted-foreground" />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-semibold">
                        {capitalizeFirst(svc.name)}
                      </p>
                      <div className="shrink-0">{getStatusBadge(svc.status, svc.isDeleted)}</div>
                    </div>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {capitalizeFirst(getCategoryName(svc.categoryId))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {svc.whatIncluded?.length ?? 0} included
                    </p>
                  </div>
                </div>
                {svc.isDeleted ? (
                  <Button
                    variant="outline"
                    className="mt-auto h-10 w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                    onClick={() => handleRestore(svc.id)}
                  >
                    <RotateCcw className="mr-1.5 size-3.5" />
                    Restore
                  </Button>
                ) : (
                  <div className="mt-auto grid grid-cols-3 gap-2">
                    <Button variant="outline" className="h-10 min-w-0 px-2" asChild>
                      <Link to={`${svc.id}/edit`} state={{ from: location.search }}>
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 px-2"
                      onClick={() => handleToggleStatus(svc.id, svc.status)}
                    >
                      {svc.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 border-red-200 px-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleSoftDelete(svc.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>

            <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm xl:block">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[76px] pl-4">Image</TableHead>
                    <TableHead className="w-[24%]">Name</TableHead>
                    <TableHead className="w-[15%]">Category</TableHead>
                    <TableHead>What's Included</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[240px] pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((svc) => (
                    <TableRow
                      key={svc.id}
                      className={svc.isDeleted ? 'bg-red-50/40 opacity-80' : ''}
                    >
                      <TableCell className="pl-4">
                        {svc.imageUrl ? (
                          <div className="relative group">
                            <img
                              src={svc.imageUrl}
                              alt={svc.name}
                              className="object-cover w-12 h-12 rounded"
                            />
                            <div className="absolute top-0 right-0 flex gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                              {/* Edit Image Button */}
                              {!svc.isDeleted && (
                                <>
                                  <Link
                                    to={`${svc.id}/edit#photo`}
                                    state={{ from: location.search }}
                                    aria-label={`Change photo of ${svc.name}`}
                                    className="bg-blue-500 text-white rounded-full p-0.5 hover:bg-blue-600"
                                    title="Edit Image"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Link>
                                  {/* Delete Image Button */}
                                  <button
                                    onClick={() => handleDeleteImage(svc.id)}
                                    className="bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                    title="Delete Image"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                    <Link
                                      to={`${svc.id}/edit#photo`}
                                      state={{ from: location.search }}
                                      aria-label={`Add photo to ${svc.name}`}
                                    >
                                      <ImagePlus className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="theme-admin">
                                  Upload Image
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="truncate font-medium" title={svc.name}>
                        {capitalizeFirst(svc.name)}
                      </TableCell>
                      <TableCell className="truncate text-sm">
                        {capitalizeFirst(getCategoryName(svc.categoryId))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {svc.whatIncluded && svc.whatIncluded.length > 0 ? (
                          <div className="space-y-2">
                            {/* Show first 2 items only */}
                            {svc.whatIncluded.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex min-w-0 items-start gap-1">
                                <span className="text-gray-400">•</span>
                                <span className="min-w-0 truncate text-xs">{item.split(':')[0]}</span>
                              </div>
                            ))}
                            {/* Show More Button */}
                            {svc.whatIncluded.length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 p-0 text-xs text-blue-600 hover:text-blue-700"
                                asChild
                              >
                                <Link to={`${svc.id}/edit`} state={{ from: location.search }}>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Show All ({svc.whatIncluded.length})
                                </Link>
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(svc.status, svc.isDeleted)}</TableCell>
                      <TableCell className="whitespace-nowrap pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!svc.isDeleted && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                    <Link
                                      to={`${svc.id}/edit`}
                                      state={{ from: location.search }}
                                      aria-label={`Edit ${svc.name}`}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="theme-admin">
                                  Edit Service
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                    <Link
                                      to={`${svc.id}/edit#photo`}
                                      state={{ from: location.search }}
                                      aria-label={`Upload photo for ${svc.name}`}
                                    >
                                      <ImagePlus className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="theme-admin">
                                  Upload Image
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8"
                                    aria-label={`${svc.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${svc.name}`}
                                    onClick={() => handleToggleStatus(svc.id, svc.status)}
                                  >
                                    {svc.status === 'ACTIVE' ? (
                                      <Ban className="w-4 h-4 text-red-600" />
                                    ) : (
                                      <Power className="w-4 h-4 text-green-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="theme-admin">
                                  {svc.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Service
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}

                          {svc.isDeleted ? (
                            <Button
                              variant="outline"
                              className="ml-1 h-9 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                              onClick={() => handleRestore(svc.id)}
                            >
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="ml-1 h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleSoftDelete(svc.id)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          <Pagination
            className="mt-2"
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => list.update({}, page)}
          />
        </div>
      </LoadingGate>
    </div>
  );
}
