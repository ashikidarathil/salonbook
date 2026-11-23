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
import { Edit, Power, Ban, RotateCcw, CheckCircle2, XCircle, Search, Trash2 } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

const displayName = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

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

  const getStatusBadge = (status: 'ACTIVE' | 'INACTIVE') => (
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category Management"
        description="Manage all salon service categories"
        breadcrumbs={[{ label: 'Categories' }]}
        actions={
          <Button asChild className="h-10 w-full sm:w-auto">
            <Link to="new">Add New Category</Link>
          </Button>
        }
      />

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => list.update({ q: e.target.value })}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-full justify-between gap-2 sm:w-auto sm:min-w-[160px]"
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
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            All Categories <span className="text-muted-foreground">({pagination.totalItems})</span>
          </h2>

          {/* Phones, tablets and small laptops */}
          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{displayName(cat.name)}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {cat.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {getStatusBadge(cat.status)}
                    {cat.isDeleted && <Badge variant="destructive">Deleted</Badge>}
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2">
                  <Button variant="outline" className="h-10 min-w-0 px-2" asChild>
                    <Link to={`${cat.id}/edit`} state={{ from: location.search }}>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 min-w-0 px-2"
                    onClick={() => handleToggleStatus(cat.id, cat.status)}
                  >
                    {cat.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                  </Button>
                  {cat.isDeleted ? (
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 border-green-200 px-2 text-green-700 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleRestore(cat.id)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 border-red-200 px-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleSoftDelete(cat.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Laptops and desktops */}
          <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm xl:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%] pl-4">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[170px]">Status</TableHead>
                  <TableHead className="w-[210px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="truncate pl-4 font-medium" title={cat.name}>
                      {displayName(cat.name)}
                    </TableCell>
                    <TableCell
                      className="truncate text-muted-foreground"
                      title={cat.description}
                    >
                      {cat.description || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(cat.status)}
                        {cat.isDeleted && <Badge variant="destructive">Deleted</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-9" asChild>
                                <Link
                                  to={`${cat.id}/edit`}
                                  state={{ from: location.search }}
                                  aria-label={`Edit ${cat.name}`}
                                >
                                  <Edit className="size-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              Edit Category
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-9"
                                aria-label={`${cat.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} ${cat.name}`}
                                onClick={() => handleToggleStatus(cat.id, cat.status)}
                              >
                                {cat.status === 'ACTIVE' ? (
                                  <Ban className="size-4 text-red-600" />
                                ) : (
                                  <Power className="size-4 text-green-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              {cat.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Category
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {cat.isDeleted ? (
                          <Button
                            variant="outline"
                            className="ml-1 h-9 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleRestore(cat.id)}
                          >
                            <RotateCcw className="mr-1.5 size-3.5" />
                            Restore
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="ml-1 h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleSoftDelete(cat.id)}
                          >
                            <Trash2 className="mr-1.5 size-3.5" />
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
