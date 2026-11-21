'use client';

import { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  toggleCategoryStatus,
  softDeleteCategory,
  restoreCategory,
  fetchPaginatedCategories,
} from '@/features/category/categoryThunks';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';
import Pagination from '@/components/pagination/Pagination';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import {
  showSuccess,
  showError,
  showConfirm,
  showLoading,
  closeLoading,
} from '@/common/utils/swal.utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/category/categorySlice';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { Edit, Power, Ban, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { categories, loading, error, pagination } = useAppSelector((state) => state.category);

  const location = useLocation();
  const list = useListParams();
  const searchTerm = list.search;
  const debouncedSearch = useDebounce(searchTerm, 500);
  const statusParam = list.value('status');
  const statusFilter: StatusFilter =
    statusParam === 'ACTIVE' || statusParam === 'INACTIVE' ? statusParam : 'ALL';
  const currentPage = list.page;

  const loadCategories = useCallback(() => {
    dispatch(
      fetchPaginatedCategories({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
    );
  }, [dispatch, currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleToggleStatus = async (id: string, currentStatus: 'ACTIVE' | 'INACTIVE') => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate';

    const confirmed = await showConfirm(
      `${action} Category?`,
      `Are you sure you want to ${action.toLowerCase()} this category?`,
      'Yes, ' + action,
      'Cancel',
    );

    if (!confirmed) return;

    showLoading(`${action}ing...`);
    const result = await dispatch(toggleCategoryStatus({ id, status: newStatus }));
    closeLoading();

    if (toggleCategoryStatus.fulfilled.match(result)) {
      showSuccess('Success', `Category ${action.toLowerCase()}d`);
      loadCategories();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Soft Delete Category?',
      'This will mark the category as deleted (can be restored later). Continue?',
      'Delete',
      'Cancel',
      '#ef4444',
    );

    if (!confirmed) return;

    showLoading('Deleting...');
    const result = await dispatch(softDeleteCategory(id));
    closeLoading();

    if (softDeleteCategory.fulfilled.match(result)) {
      showSuccess('Deleted', 'Category soft-deleted');
      loadCategories();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  const handleRestore = async (id: string) => {
    showLoading('Restoring...');
    const result = await dispatch(restoreCategory(id));
    closeLoading();

    if (restoreCategory.fulfilled.match(result)) {
      showSuccess('Restored', 'Category restored successfully');
      loadCategories();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => {
    return (
      <Badge className={status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Manage all salon service categories"
        breadcrumbs={[{ label: 'Categories' }]}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link to="new">Add New Category</Link>
          </Button>
        }
      />

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="flex-1 sm:max-w-md">
          <Input
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => list.update({ q: e.target.value })}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between gap-2 sm:w-auto sm:min-w-[140px]"
            >
              {statusFilter === 'ALL' && (
                <>
                  <span>All Categories</span>
                </>
              )}
              {statusFilter === 'ACTIVE' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Active</span>
                </>
              )}
              {statusFilter === 'INACTIVE' && (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Inactive</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white focus:outline-none">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => list.update({ status: 'ALL' })}
              className={statusFilter === 'ALL' ? 'bg-accent' : ''}
            >
              All Categories
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => list.update({ status: 'ACTIVE' })}
              className={statusFilter === 'ACTIVE' ? 'bg-accent' : ''}
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
              Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => list.update({ status: 'INACTIVE' })}
              className={statusFilter === 'INACTIVE' ? 'bg-accent' : ''}
            >
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={categories}
        resetError={() => {
          dispatch(clearError());
          loadCategories();
        }}
        emptyMessage={searchTerm ? 'No matches' : 'Add your first category above'}
        emptyIcon="hugeicons:service"
      >
        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Categories ({pagination.totalItems})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Phones and small tablets */}
            <ul className="divide-y lg:hidden">
              {categories.map((cat) => (
                <li key={cat.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                      </p>
                      <p className="mt-1 break-words text-sm text-muted-foreground">
                        {cat.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {getStatusBadge(cat.status)}
                      {cat.isDeleted && <Badge variant="destructive">Deleted</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`${cat.id}/edit`} state={{ from: location.search }}>
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(cat.id, cat.status)}
                    >
                      {cat.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </Button>
                    {cat.isDeleted ? (
                      <Button
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        onClick={() => handleRestore(cat.id)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleSoftDelete(cat.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                      </TableCell>
                      <TableCell>{cat.description || '—'}</TableCell>
                      <TableCell>{getStatusBadge(cat.status)}</TableCell>
                      <TableCell>
                        {cat.isDeleted ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <TooltipProvider>
                            {/* Edit */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                  <Link
                                    to={`${cat.id}/edit`}
                                    state={{ from: location.search }}
                                    aria-label={`Edit ${cat.name}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="theme-admin">
                                Edit Category
                              </TooltipContent>
                            </Tooltip>

                            {/* Toggle Activate/Deactivate */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 "
                                  onClick={() => handleToggleStatus(cat.id, cat.status)}
                                >
                                  {cat.status === 'ACTIVE' ? (
                                    <Ban className="w-4 h-4 text-red-600" />
                                  ) : (
                                    <Power className="w-4 h-4 text-green-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="theme-admin">
                                {cat.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Category
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Delete / Restore – always visible on desktop */}
                          {cat.isDeleted ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-2 text-white bg-green-600 hover:bg-green-700 hover:text-white"
                              onClick={() => handleRestore(cat.id)}
                            >
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Restore
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-2 text-white bg-red-600 hover:bg-red-700 hover:text-white"
                              onClick={() => handleSoftDelete(cat.id)}
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
