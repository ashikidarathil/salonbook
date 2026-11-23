import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchHolidays, deleteHoliday } from '@/features/holiday/holiday.thunks';
import { clearError } from '@/features/holiday/holiday.slice';
import { fetchBranches } from '@/features/branch/branch.thunks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Icon } from '@iconify/react';
import { LoadingGate } from '@/components/common/LoadingGate';
import { PageHeader } from '@/components/common/PageHeader';
import { showSuccess, showConfirm, showLoading, closeLoading } from '@/common/utils/swal.utils';
import { format } from 'date-fns';

export default function HolidayManagementPage() {
  const dispatch = useAppDispatch();
  const { holidays, loading, error } = useAppSelector((state) => state.holiday);
  const { branches } = useAppSelector((state) => state.branch);

  useEffect(() => {
    dispatch(fetchHolidays());
    dispatch(fetchBranches());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Delete Holiday?',
      'Are you sure you want to delete this holiday?',
      'Delete',
      'Cancel',
      '#ef4444',
    );

    if (confirmed) {
      showLoading('Deleting...');
      const result = await dispatch(deleteHoliday(id));
      closeLoading();
      if (deleteHoliday.fulfilled.match(result)) {
        showSuccess('Deleted', 'Holiday removed successfully');
        dispatch(fetchHolidays());
      }
    }
  };

  const getBranchData = (branchIds: string[]) => {
    if (!branchIds || branchIds.length === 0) return [];
    return branchIds
      .map((id) => branches.find((b) => String(b.id) === String(id)))
      .filter((b): b is NonNullable<typeof b> => !!b);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holiday Management"
        description="Manage salon-wide and branch-specific holidays"
        breadcrumbs={[{ label: 'Holidays' }]}
        actions={
          <Button asChild className="h-10 w-full gap-2 sm:w-auto">
            <Link to="new">
              <Icon icon="solar:calendar-add-bold-duotone" className="size-5" />
              Add Holiday
            </Link>
          </Button>
        }
      />

      <LoadingGate
        loading={loading && holidays.length === 0}
        error={error}
        data={holidays}
        resetError={() => dispatch(clearError())}
        emptyMessage="No holidays found. Add one to get started."
        emptyIcon="solar:calendar-minimalistic-broken"
      >
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            Existing Holidays <span className="text-muted-foreground">({holidays.length})</span>
          </h2>

          {/* Phones, tablets and small laptops */}
          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {holidays.map((holiday) => {
              const date = new Date(holiday.date);
              return (
                <li
                  key={holiday.id}
                  className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="text-lg font-bold leading-5">{format(date, 'd')}</span>
                      <span className="text-[11px] font-medium">{format(date, 'MMM')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-semibold">{holiday.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {format(date, 'EEEE, d MMMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {holiday.isAllBranches ? (
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 text-primary"
                      >
                        All Branches
                      </Badge>
                    ) : (
                      getBranchData(holiday.branchIds).map((branch) => (
                        <Badge
                          key={branch.id}
                          variant="outline"
                          className="max-w-full break-words bg-muted"
                        >
                          {branch.name}
                        </Badge>
                      ))
                    )}
                  </div>
                  <Button
                    variant="outline"
                    aria-label={`Delete ${holiday.name}`}
                    className="mt-auto h-10 w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(holiday.id)}
                  >
                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-4" />
                    Delete
                  </Button>
                </li>
              );
            })}
          </ul>

          {/* Laptops and desktops */}
          <div className="hidden overflow-hidden rounded-2xl border bg-white shadow-sm xl:block">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[32%] pl-4">Holiday Name</TableHead>
                  <TableHead className="w-[210px]">Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="w-[130px] pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => {
                  const holidayBranches = getBranchData(holiday.branchIds);
                  return (
                    <TableRow key={holiday.id}>
                      <TableCell className="truncate pl-4 font-medium" title={holiday.name}>
                        {holiday.name}
                      </TableCell>
                      <TableCell>{format(new Date(holiday.date), 'EEE, d MMM yyyy')}</TableCell>
                      <TableCell>
                        {holiday.isAllBranches ? (
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/5 text-primary"
                          >
                            All Branches
                          </Badge>
                        ) : (
                          <div
                            className="flex min-w-0 flex-wrap gap-1"
                            title={holidayBranches.map((branch) => branch.name).join(', ')}
                          >
                            {holidayBranches.slice(0, 2).map((branch) => (
                              <Badge
                                key={branch.id}
                                variant="outline"
                                className="max-w-full truncate bg-muted"
                              >
                                {branch.name}
                              </Badge>
                            ))}
                            {holidayBranches.length > 2 && (
                              <Badge variant="outline">+{holidayBranches.length - 2} more</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          variant="outline"
                          aria-label={`Delete ${holiday.name}`}
                          className="h-9 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </LoadingGate>
    </div>
  );
}
