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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
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
import { Trash2, Edit, Power, Ban, RotateCcw, ImagePlus, Eye } from 'lucide-react';

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
    if (isDeleted) {
      return <Badge className="bg-yellow-500 text-white">DELETED</Badge>;
    }
    return (
      <Badge className={status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
        {status}
      </Badge>
    );
  };

  const capitalizeFirst = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

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
          <Button asChild className="w-full sm:w-auto">
            <Link to="new">Add New Service</Link>
          </Button>
        }
      />

      {/* Search & Filters - UPDATED WITH DROPDOWNS */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search Input */}
          <div className="w-full flex-1 sm:min-w-[200px]">
            <Label htmlFor="search" className="block mb-2 text-sm font-medium">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => list.update({ q: e.target.value })}
            />
          </div>

          {/* Category Filter Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <Label htmlFor="category-filter" className="block mb-2 text-sm font-medium">
              Category
            </Label>
            <div className="relative">
              <Select
                value={categoryFilter}
                onValueChange={(value) => list.update({ category: value })}
              >
                <SelectTrigger id="category-filter">
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
            </div>
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[150px]">
            <Label htmlFor="status-filter" className="block mb-2 text-sm font-medium">
              Status
            </Label>
            <div className="relative">
              <Select
                value={statusFilter}
                onValueChange={(value) => list.update({ status: value })}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
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
        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Services ({pagination.totalItems})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y lg:hidden">
              {services.map((svc) => (
                <li key={svc.id} className={`space-y-3 p-4 ${svc.isDeleted ? 'bg-red-50/40' : ''}`}>
                  <div className="flex items-start gap-3">
                    {svc.imageUrl ? (
                      <img
                        src={svc.imageUrl}
                        alt=""
                        className="size-14 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted">
                        <ImagePlus className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">{capitalizeFirst(svc.name)}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {capitalizeFirst(getCategoryName(svc.categoryId))}
                        {' · '}
                        {svc.whatIncluded?.length ?? 0} included
                      </p>
                    </div>
                    <div className="shrink-0">{getStatusBadge(svc.status, svc.isDeleted)}</div>
                  </div>
                  {svc.isDeleted ? (
                    <Button
                      size="sm"
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                      onClick={() => handleRestore(svc.id)}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`${svc.id}/edit`} state={{ from: location.search }}>
                          <Edit className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(svc.id, svc.status)}
                      >
                        {svc.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleSoftDelete(svc.id)}
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
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>What's Included</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((svc) => (
                    <TableRow
                      key={svc.id}
                      className={svc.isDeleted ? 'bg-red-50/40 opacity-80' : ''}
                    >
                      <TableCell>
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
                      <TableCell className="font-medium">
                        {svc.name.charAt(0).toUpperCase() + svc.name.slice(1).toLowerCase()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {capitalizeFirst(getCategoryName(svc.categoryId))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {svc.whatIncluded && svc.whatIncluded.length > 0 ? (
                          <div className="space-y-2">
                            {/* Show first 2 items only */}
                            {svc.whatIncluded.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-gray-400">•</span>
                                <span className="text-xs truncate">{item.split(':')[0]}</span>
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
                      <TableCell>
                        {svc.isDeleted ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
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
                              variant="default"
                              size="sm"
                              className="ml-2 text-white bg-green-600 hover:bg-green-700"
                              onClick={() => handleRestore(svc.id)}
                            >
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-2 text-white bg-red-600 hover:bg-red-700"
                              onClick={() => handleSoftDelete(svc.id)}
                            >
                              <Ban className="mr-1.5 h-3.5 w-3.5" />
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

            <div className="p-4 border-t">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={(page) => list.update({}, page)}
              />
            </div>
          </CardContent>
        </Card>
      </LoadingGate>
    </div>
  );
}
