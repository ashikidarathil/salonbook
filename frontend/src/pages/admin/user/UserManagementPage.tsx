'use client';

import { useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchUsers, toggleBlockUser } from '@/features/user/userThunks';
import { Card } from '@/components/ui/card';
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
import {
  showSuccess,
  showError,
  showConfirm,
  showLoading,
  closeLoading,
} from '@/common/utils/swal.utils';

import { clearError } from '@/features/user/userSlice';
import { LoadingGate } from '@/components/common/LoadingGate';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import type { UserListItem } from '@/features/user/user.types';

const ADMIN_COLOR = '#10B981';

const joinedDate = (value?: string) => (value ? format(new Date(value), 'd MMM yyyy') : '—');

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        blocked
          ? 'shrink-0 border-red-200 bg-red-50 text-red-700'
          : 'shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700'
      }
    >
      {blocked ? 'Blocked' : 'Active'}
    </Badge>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials(name)}
    </span>
  );
}

export default function UserManagementPage() {
  const dispatch = useAppDispatch();
  const { users, pagination, loading, error } = useAppSelector((state) => state.user);

  const list = useListParams();
  const searchTerm = list.search;
  const debouncedSearch = useDebounce(searchTerm, 500);
  const currentPage = list.page;
  const limit = 5;

  const loadUsers = useCallback(() => {
    dispatch(
      fetchUsers({
        page: currentPage,
        limit,
        search: debouncedSearch,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    );
  }, [dispatch, currentPage, limit, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleBlock = async (userId: string, name: string, isBlocked: boolean) => {
    const action = isBlocked ? 'Unblock' : 'Block';
    const confirmed = await showConfirm(
      `${action} User?`,
      `Are you sure you want to ${action.toLowerCase()} ${name}?`,
      `Yes, ${action}`,
      'Cancel',
      isBlocked ? ADMIN_COLOR : '#ef4444',
    );

    if (!confirmed) return;

    showLoading(`${action}ing user...`);
    const result = await dispatch(toggleBlockUser({ userId, block: !isBlocked }));
    closeLoading();

    if (toggleBlockUser.fulfilled.match(result)) {
      await showSuccess(`${action}ed!`, `${name} has been ${action.toLowerCase()}ed`);
    } else {
      await showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPDATE_FAILED);
    }
  };

  const blockButton = (user: UserListItem, className = '') => (
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleToggleBlock(user.id, user.name, user.isBlocked)}
      className={`h-10 ${
        user.isBlocked
          ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
          : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
      } ${className}`}
    >
      <Icon
        icon={user.isBlocked ? 'solar:lock-unlocked-bold' : 'solar:forbidden-circle-bold'}
        className="mr-1.5 size-4"
      />
      {user.isBlocked ? 'Unblock' : 'Block'}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="break-words text-2xl font-bold sm:text-3xl">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all registered customers</p>
      </div>

      <div className="relative sm:max-w-md">
        <Icon
          icon="solar:magnifer-linear"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search customers"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => list.update({ q: e.target.value })}
          className="h-10 w-full bg-background pl-9"
        />
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={users}
        resetError={() => {
          dispatch(clearError());
          loadUsers();
        }}
        emptyMessage={searchTerm ? 'No matches' : 'No registered users yet'}
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold">
            All Users <span className="text-muted-foreground">({pagination?.totalItems || 0})</span>
          </p>

          {/* Phones and tablets */}
          <ul className="grid gap-3 md:grid-cols-1 lg:grid-cols-2 xl:hidden">
            {users.map((user) => (
              <li key={user.id}>
                <Card className="flex h-full flex-col gap-3 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CustomerAvatar name={user.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words font-semibold leading-snug">
                          {user.name}
                        </p>
                        <StatusBadge blocked={user.isBlocked} />
                      </div>
                      <p className="mt-0.5 break-all text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="mt-0.5 break-words font-medium">{user.phone || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Joined</dt>
                      <dd className="mt-0.5 font-medium">{joinedDate(user.createdAt)}</dd>
                    </div>
                  </dl>
                  {blockButton(user, 'mt-auto w-full')}
                </Card>
              </li>
            ))}
          </ul>

          {/* Large screens */}
          <Card className="hidden overflow-hidden shadow-sm xl:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="max-w-md">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={user.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{user.phone || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {joinedDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge blocked={user.isBlocked} />
                    </TableCell>
                    <TableCell className="text-right">{blockButton(user, 'w-28')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {pagination && (
            <Pagination
              className="mt-2"
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={(page) => list.update({}, page)}
            />
          )}
        </div>
      </LoadingGate>
    </div>
  );
}
