import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchHolidays, deleteHoliday } from '@/features/holiday/holiday.thunks';
import { clearError } from '@/features/holiday/holiday.slice';
import { fetchBranches } from '@/features/branch/branch.thunks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
          <Button asChild className="w-full gap-2 sm:w-auto">
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
        <Card>
          <CardHeader>
            <CardTitle>Existing Holidays</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y lg:hidden">
              {holidays.map((holiday) => (
                <li key={holiday.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-2">
                    <p className="break-words font-medium">{holiday.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(holiday.date), 'MMMM do, yyyy')}
                    </p>
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
                          <Badge key={branch.id} variant="secondary">
                            {branch.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${holiday.name}`}
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(holiday.id)}
                  >
                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-5" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>{format(new Date(holiday.date), 'MMMM do, yyyy')}</TableCell>
                      <TableCell>
                        {holiday.isAllBranches ? (
                          <Badge
                            variant="outline"
                            className="bg-primary/5 text-primary border-primary/20"
                          >
                            All Branches
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {getBranchData(holiday.branchIds)
                              .slice(0, 2)
                              .map((branch) => (
                                <Badge
                                  key={branch.id}
                                  variant="secondary"
                                  className="whitespace-nowrap"
                                >
                                  {branch.name}
                                </Badge>
                              ))}
                            {holiday.branchIds.length > 2 && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0 bg-orange-500 hover:bg-orange-600 border-none text-white"
                              >
                                +{holiday.branchIds.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(holiday.id)}
                        >
                          <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </LoadingGate>
    </div>
  );
}
