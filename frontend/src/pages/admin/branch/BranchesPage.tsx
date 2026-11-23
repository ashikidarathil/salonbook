'use client';

import { useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  softDeleteBranch,
  restoreBranch,
  fetchPaginatedBranches,
} from '@/features/branch/branch.thunks';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit, Users, Tags, Scissors, Ban, RotateCcw, Clock, Search } from 'lucide-react';
import Pagination from '@/components/pagination/Pagination';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import {
  showSuccess,
  showError,
  showConfirm,
  showLoading,
  closeLoading,
} from '@/common/utils/swal.utils';
import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/branch/branch.slice';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { PageHeader } from '@/components/common/PageHeader';

const ITEMS_PER_PAGE = 5;

export default function BranchesPage() {
  const location = useLocation();
  const list = useListParams();
  const dispatch = useAppDispatch();
  const { branches, loading, error, pagination } = useAppSelector((state) => state.branch);

  const searchTerm = list.search;
  const debouncedSearch = useDebounce(searchTerm, 500);
  const currentPage = list.page;

  const loadBranches = useCallback(() => {
    dispatch(
      fetchPaginatedBranches({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearch || undefined,
      }),
    );
  }, [dispatch, currentPage, debouncedSearch]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleDisable = async (id: string) => {
    const confirmed = await showConfirm(
      'Disable Branch?',
      'This will soft-delete the branch (can be restored later). Continue?',
      'Disable',
      'Cancel',
      '#ef4444',
    );

    if (!confirmed) return;

    showLoading('Disabling...');
    const result = await dispatch(softDeleteBranch(id));
    closeLoading();

    if (softDeleteBranch.fulfilled.match(result)) {
      showSuccess('Disabled', 'Branch disabled successfully');
      loadBranches();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  const handleRestore = async (id: string) => {
    showLoading('Restoring...');
    const result = await dispatch(restoreBranch(id));
    closeLoading();

    if (restoreBranch.fulfilled.match(result)) {
      showSuccess('Restored', 'Branch restored successfully');
      loadBranches();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Management"
        description="Manage all salon branches"
        breadcrumbs={[{ label: 'Branches' }]}
        actions={
          <Button asChild className="h-10 w-full sm:w-auto">
            <Link to="new">Add New Branch</Link>
          </Button>
        }
      />

      {/* Stays outside the loader, so typing never loses focus */}
      <div className="relative sm:max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search branches"
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(e) => list.update({ q: e.target.value })}
          className="h-10 w-full pl-9"
        />
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={branches}
        resetError={() => {
          dispatch(clearError());
          loadBranches();
        }}
        emptyMessage={searchTerm ? 'No matches' : 'Add your first branch above'}
        emptyIcon="solar:map-point-bold"
      >
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            All Branches{' '}
            <span className="text-muted-foreground">({pagination?.totalItems || 0})</span>
          </h2>

          {/* Phones, tablets and small laptops */}
          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {branches.map((branch) => (
              <li
                key={branch.id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{branch.name}</p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {branch.address}
                    </p>
                    {branch.phone && <p className="mt-1 text-sm">{branch.phone}</p>}
                  </div>
                  {branch.isDeleted && (
                    <Badge variant="destructive" className="shrink-0">
                      Disabled
                    </Badge>
                  )}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2">
                  {[
                    ['edit', 'Edit'],
                    ['stylists', 'Stylists'],
                    ['categories', 'Categories'],
                    ['services', 'Services'],
                    ['breaks', 'Breaks'],
                  ].map(([path, label]) => (
                    <Button
                      key={path}
                      variant="outline"
                      className="h-10 min-w-0 px-1 text-xs"
                      asChild
                    >
                      <Link to={`${branch.id}/${path}`} state={{ from: location.search }}>
                        {label}
                      </Link>
                    </Button>
                  ))}
                  {branch.isDeleted ? (
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 border-green-200 px-1 text-xs text-green-700 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleRestore(branch.id)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 px-1 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDisable(branch.id)}
                    >
                      Disable
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm xl:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[22%] pl-4">Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[140px]">Phone</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[310px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="truncate pl-4 font-medium" title={branch.name}>
                      {branch.name}
                    </TableCell>
                    <TableCell title={branch.address}>
                      <p className="truncate">{branch.address}</p>
                      {branch.latitude != null && branch.longitude != null && (
                        <p className="truncate text-xs text-muted-foreground">
                          {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="truncate">{branch.phone || '—'}</TableCell>
                    <TableCell>
                      {branch.isDeleted ? (
                        <Badge variant="destructive">Disabled</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700"
                        >
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TooltipProvider>
                          {/* Edit */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                <Link
                                  to={`${branch.id}/edit`}
                                  state={{ from: location.search }}
                                  aria-label={`Edit for ${branch.name}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              Edit Branch
                            </TooltipContent>
                          </Tooltip>

                          {/* Stylists */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                <Link
                                  to={`${branch.id}/stylists`}
                                  state={{ from: location.search }}
                                  aria-label={`Stylists for ${branch.name}`}
                                >
                                  <Users className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              Manage Stylists
                            </TooltipContent>
                          </Tooltip>

                          {/* Categories */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                <Link
                                  to={`${branch.id}/categories`}
                                  state={{ from: location.search }}
                                  aria-label={`Categories for ${branch.name}`}
                                >
                                  <Tags className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              Manage Categories
                            </TooltipContent>
                          </Tooltip>

                          {/* Services */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                <Link
                                  to={`${branch.id}/services`}
                                  state={{ from: location.search }}
                                  aria-label={`Services for ${branch.name}`}
                                >
                                  <Scissors className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              Manage Services
                            </TooltipContent>
                          </Tooltip>

                          {/* Breaks */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="w-8 h-8" asChild>
                                <Link
                                  to={`${branch.id}/breaks`}
                                  state={{ from: location.search }}
                                  aria-label={`Breaks for ${branch.name}`}
                                >
                                  <Clock className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="theme-admin">
                              Manage Global Breaks
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {branch.isDeleted ? (
                          <Button
                            variant="outline"
                            className="ml-1 h-9 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleRestore(branch.id)}
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Restore
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="ml-1 h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDisable(branch.id)}
                          >
                            <Ban className="mr-1.5 h-3.5 w-3.5" />
                            Disable
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
            currentPage={pagination?.currentPage || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={(page) => list.update({}, page)}
          />
        </div>
      </LoadingGate>
    </div>
  );
}
