'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BranchPageHeader } from '@/components/branch/BranchPageHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  assignStylist,
  unassignStylist,
  fetchBranchStylistsPaginated,
  fetchUnassignedStylistsPaginated,
} from '@/features/stylistBranch/stylistBranch.thunks';
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
import Pagination from '@/components/pagination/Pagination';
import { LoadingGate } from '@/components/common/LoadingGate';
import { clearError } from '@/features/stylistBranch/stylistBranch.slice';
import { useDebounce } from '@/hooks/useDebounce';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ITEMS_PER_PAGE = 5;

export default function BranchStylistsPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const dispatch = useAppDispatch();

  const {
    assignedStylists,
    unassignedOptions,
    loading,
    error,
    assignedPagination,
    unassignedPagination,
  } = useAppSelector((state) => state.stylistBranch);

  const [searchAssigned, setSearchAssigned] = useState('');
  const debouncedSearchAssigned = useDebounce(searchAssigned, 500);
  const [currentPageAssigned, setCurrentPageAssigned] = useState(1);

  const [searchUnassigned, setSearchUnassigned] = useState('');
  const debouncedSearchUnassigned = useDebounce(searchUnassigned, 500);
  const [currentPageUnassigned, setCurrentPageUnassigned] = useState(1);

  const loadAssignedStylists = useCallback(() => {
    if (branchId) {
      dispatch(
        fetchBranchStylistsPaginated({
          branchId,
          page: currentPageAssigned,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearchAssigned || undefined,
        }),
      );
    }
  }, [branchId, dispatch, currentPageAssigned, debouncedSearchAssigned]);

  const loadUnassignedStylists = useCallback(() => {
    if (branchId) {
      dispatch(
        fetchUnassignedStylistsPaginated({
          branchId,
          page: currentPageUnassigned,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearchUnassigned || undefined,
        }),
      );
    }
  }, [branchId, dispatch, currentPageUnassigned, debouncedSearchUnassigned]);

  useEffect(() => {
    loadAssignedStylists();
  }, [loadAssignedStylists]);

  useEffect(() => {
    loadUnassignedStylists();
  }, [loadUnassignedStylists]);

  const handleSearchAssignedChange = (value: string) => {
    setSearchAssigned(value);
    setCurrentPageAssigned(1);
  };

  const handleSearchUnassignedChange = (value: string) => {
    setSearchUnassigned(value);
    setCurrentPageUnassigned(1);
  };

  const handleAssignClick = async (stylistId: string, stylistName: string) => {
    if (!branchId) return;
    const confirmed = await showConfirm(
      'Assign Stylist?',
      `Assign ${stylistName} to this branch?`,
      'Assign',
      'Cancel',
      '#10B981',
    );

    if (!confirmed) return;

    showLoading('Assigning...');
    const result = await dispatch(assignStylist({ branchId, stylistId }));
    closeLoading();

    if (result.meta.requestStatus === 'fulfilled') {
      showSuccess('Assigned', 'Stylist assigned successfully');
      loadAssignedStylists();
      loadUnassignedStylists();
    } else {
      showError('Failed', 'Could not assign stylist');
    }
  };

  const handleUnassignClick = async (stylistId: string, stylistName: string) => {
    if (!branchId) return;
    const confirmed = await showConfirm(
      'Unassign Stylist?',
      `Remove ${stylistName} from this branch?`,
      'Unassign',
      'Cancel',
      '#ef4444',
    );

    if (!confirmed) return;

    showLoading('Unassigning...');
    const result = await dispatch(unassignStylist({ branchId, stylistId }));
    closeLoading();

    if (result.meta.requestStatus === 'fulfilled') {
      showSuccess('Unassigned', 'Stylist removed successfully');
      loadAssignedStylists();
      loadUnassignedStylists();
    } else {
      showError('Failed', 'Could not unassign stylist');
    }
  };

  return (
    <div className="w-full space-y-6 theme-admin">
      <BranchPageHeader branchId={branchId} title="Manage Stylists" />

      <div className="grid grid-cols-1 gap-8">
        {/* Available Stylists Section */}
        <Card className="shadow-none border-border/60">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" />
                  Available Stylists
                </CardTitle>
                <CardDescription>Stylists available to be assigned to this branch</CardDescription>
              </div>
              <Input
                placeholder="Search available stylists..."
                value={searchUnassigned}
                onChange={(e) => handleSearchUnassignedChange(e.target.value)}
                className="w-full md:max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <LoadingGate
              loading={loading}
              error={error}
              data={unassignedOptions}
              resetError={() => {
                dispatch(clearError());
                loadUnassignedStylists();
                loadAssignedStylists();
              }}
              emptyMessage={
                searchUnassigned
                  ? 'No matching stylists found'
                  : 'No stylists available for assignment'
              }
              emptyIcon="hugeicons:user-group"
            >
              <ul className="divide-y rounded-lg border lg:hidden">
                {unassignedOptions.map((stylist) => (
                  <li
                    key={stylist.stylistId}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium">{stylist.name}</p>
                      <p className="break-words text-sm text-muted-foreground">
                        {stylist.specialization} · {stylist.experience} yrs
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleAssignClick(stylist.stylistId, stylist.name)}
                    >
                      Assign
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto rounded-lg border lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedOptions.map((stylist) => (
                      <TableRow key={stylist.stylistId}>
                        <TableCell className="font-medium">{stylist.name}</TableCell>
                        <TableCell>{stylist.specialization}</TableCell>
                        <TableCell>{stylist.experience} yrs</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAssignClick(stylist.stylistId, stylist.name)}
                          >
                            Assign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {unassignedPagination.totalPages > 1 && (
                <div className="pt-4 flex justify-center">
                  <Pagination
                    currentPage={unassignedPagination.currentPage}
                    totalPages={unassignedPagination.totalPages}
                    onPageChange={setCurrentPageUnassigned}
                  />
                </div>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                Showing {unassignedOptions.length} of {unassignedPagination.totalItems} available
                stylists
              </div>
            </LoadingGate>
          </CardContent>
        </Card>

        {/* Assigned Stylists Section */}
        <Card className="shadow-none border-border/60">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary" />
                  Assigned Stylists
                </CardTitle>
                <CardDescription>Stylists currently working at this branch</CardDescription>
              </div>
              <Input
                placeholder="Search assigned stylists..."
                value={searchAssigned}
                onChange={(e) => handleSearchAssignedChange(e.target.value)}
                className="w-full md:max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <LoadingGate
              loading={loading}
              error={error}
              data={assignedStylists}
              resetError={() => {
                dispatch(clearError());
                loadAssignedStylists();
                loadUnassignedStylists();
              }}
              emptyMessage={
                searchAssigned ? 'No matching stylists found' : 'No stylists assigned yet'
              }
              emptyIcon="hugeicons:user-group"
            >
              <ul className="divide-y rounded-lg border lg:hidden">
                {assignedStylists.map((stylist) => (
                  <li
                    key={stylist.stylistId}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium">{stylist.name}</p>
                      <p className="break-words text-sm text-muted-foreground">
                        {stylist.specialization} · {stylist.experience} yrs
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleUnassignClick(stylist.stylistId, stylist.name)}
                    >
                      Unassign
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto rounded-lg border lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedStylists.map((stylist) => (
                      <TableRow key={stylist.stylistId}>
                        <TableCell className="font-medium">{stylist.name}</TableCell>
                        <TableCell>{stylist.specialization}</TableCell>
                        <TableCell>{stylist.experience} yrs</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUnassignClick(stylist.stylistId, stylist.name)}
                          >
                            Unassign
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {assignedPagination.totalPages > 1 && (
                <div className="pt-4 flex justify-center">
                  <Pagination
                    currentPage={assignedPagination.currentPage}
                    totalPages={assignedPagination.totalPages}
                    onPageChange={setCurrentPageAssigned}
                  />
                </div>
              )}
              <div className="mt-4 text-xs text-muted-foreground">
                Total: {assignedPagination.totalItems} stylists assigned to this branch
              </div>
            </LoadingGate>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
