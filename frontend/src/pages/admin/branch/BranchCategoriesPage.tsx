'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BranchPageHeader } from '@/components/branch/BranchPageHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  toggleBranchCategory,
  fetchBranchCategoriesPaginated,
} from '@/features/branchCategory/branchCategory.thunks';
import Pagination from '@/components/pagination/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/branchCategory/branchCategory.slice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  showSuccess,
  showError,
  showConfirm,
  showLoading,
  closeLoading,
} from '@/common/utils/swal.utils';
import { Tags } from 'lucide-react';
import { BranchStatusBadge } from '@/components/branch/BranchStatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ITEMS_PER_PAGE = 5;

export default function BranchCategoriesPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const dispatch = useAppDispatch();

  const { categories, loading, error, pagination } = useAppSelector(
    (state) => state.branchCategory,
  );

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const loadBranchCategories = useCallback(() => {
    if (branchId) {
      dispatch(
        fetchBranchCategoriesPaginated({
          branchId,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch || undefined,
          isActive: filterActive === 'all' ? undefined : filterActive === 'active',
        }),
      );
    }
  }, [branchId, dispatch, currentPage, debouncedSearch, filterActive]);

  useEffect(() => {
    loadBranchCategories();
  }, [loadBranchCategories]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterActive(value as 'all' | 'active' | 'inactive');
    setCurrentPage(1);
  };

  const handleToggleClick = async (
    categoryId: string,
    currentActive: boolean,
    categoryName: string,
  ) => {
    if (!branchId) return;
    const newActive = !currentActive;
    const action = newActive ? 'Enable' : 'Disable';

    const confirmed = await showConfirm(
      `${action} Category?`,
      `${action} ${categoryName} for this branch?`,
      action,
      'Cancel',
      newActive ? '#10B981' : '#ef4444',
    );

    if (!confirmed) return;

    showLoading(`${action === 'Enable' ? 'Enabling' : 'Disabling'}...`);
    const result = await dispatch(
      toggleBranchCategory({
        branchId,
        categoryId,
        isActive: newActive,
      }),
    );
    closeLoading();

    if (result.meta.requestStatus === 'fulfilled') {
      showSuccess('Success', `${categoryName} ${newActive ? 'enabled' : 'disabled'}`);
      loadBranchCategories();
    } else {
      showError('Failed', 'Could not update category');
    }
  };

  return (
    <div className="w-full space-y-6 theme-admin">
      <BranchPageHeader branchId={branchId} title="Manage Categories" />

      <Card className="border-0 bg-transparent shadow-none sm:border sm:border-border/60 sm:bg-white">
        <CardHeader className="p-0 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1 space-y-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Tags className="w-5 h-5" />
                Branch Categories
              </CardTitle>
              <CardDescription>
                Enable or disable categories available at this branch.
              </CardDescription>

              <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="search-categories">Search</Label>
                  <Input
                    id="search-categories"
                    className="h-10"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-active">Filter by Status</Label>
                  <Select value={filterActive} onValueChange={handleFilterChange}>
                    <SelectTrigger id="filter-active" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Disabled Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-4 sm:p-6 sm:pt-0">
          <LoadingGate
            loading={loading}
            error={error}
            data={categories}
            resetError={() => {
              dispatch(clearError());
              loadBranchCategories();
            }}
            emptyMessage={
              search || filterActive !== 'all'
                ? 'No categories match your filters.'
                : 'No categories available for this branch.'
            }
            emptyIcon="hugeicons:service"
          >
            <ul className="grid gap-3 lg:grid-cols-2 xl:hidden [&_a]:h-10 [&_button]:h-10">
              {categories.map((cat) => (
                <li
                  key={cat.categoryId}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="break-words font-medium">
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </p>
                    <BranchStatusBadge active={cat.isActive} />
                  </div>
                  <Button
                    variant={cat.isActive ? 'outline' : 'default'}
                    className={
                      cat.isActive
                        ? 'shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600'
                        : 'shrink-0'
                    }
                    onClick={() => handleToggleClick(cat.categoryId, cat.isActive, cat.name)}
                  >
                    {cat.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-hidden rounded-2xl border xl:block">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.categoryId}>
                      <TableCell className="truncate text-base font-medium">
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                      </TableCell>
                      <TableCell>
                        <BranchStatusBadge active={cat.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={cat.isActive ? 'outline' : 'default'}
                          size="sm"
                          className={
                            cat.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600'
                              : undefined
                          }
                          onClick={() => handleToggleClick(cat.categoryId, cat.isActive, cat.name)}
                        >
                          {cat.isActive ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {categories.length} of {pagination.totalItems} categories
            </div>
          </LoadingGate>
        </CardContent>
      </Card>
    </div>
  );
}
