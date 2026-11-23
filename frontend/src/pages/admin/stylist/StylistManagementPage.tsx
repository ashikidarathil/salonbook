'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  approveStylist,
  rejectStylist,
  sendInviteToApplied,
  fetchPaginatedStylists,
  blockUnblockStylist,
  updateStylistPosition,
} from '@/features/stylistInvite/stylistInviteThunks';
import { clearError } from '@/features/stylistInvite/stylistInviteSlice';
import { LoadingGate } from '@/components/common/LoadingGate';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { PageHeader } from '@/components/common/PageHeader';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/react';
import Pagination from '@/components/pagination/Pagination';
import { Copy, Check } from 'lucide-react';
import {
  showSuccess,
  showError,
  showConfirm,
  showLoading,
  closeLoading,
} from '@/common/utils/swal.utils';

import type {
  StylistListItem,
  StylistPosition,
} from '@/features/stylistInvite/stylistInvite.types';

const ITEMS_PER_PAGE = 5;

const ADMIN_COLOR = '#10B981';

const initials = (name?: string) =>
  (name || 'Stylist')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

function StylistAvatar({ stylist }: { stylist: StylistListItem }) {
  return stylist.profilePicture ? (
    <img
      src={stylist.profilePicture}
      alt=""
      className="size-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials(stylist.name)}
    </span>
  );
}

export default function StylistManagementPage() {
  const dispatch = useAppDispatch();
  const { stylists, loading, error, pagination } = useAppSelector((state) => state.stylistInvite);
  const location = useLocation();
  const list = useListParams();

  const searchTerm = list.search;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const currentPage = list.page;
  const [viewInviteDialog, setViewInviteDialog] = useState<StylistListItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const loadStylists = useCallback(() => {
    dispatch(
      fetchPaginatedStylists({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchTerm || undefined,
      }),
    );
  }, [dispatch, currentPage, debouncedSearchTerm]);

  useEffect(() => {
    loadStylists();
  }, [loadStylists]);

  const handleToggleBlock = async (stylistId: string, name: string, isBlocked: boolean) => {
    const action = isBlocked ? 'Unblock' : 'Block';
    const confirmed = await showConfirm(
      `${action} Stylist?`,
      `Are you sure you want to ${action.toLowerCase()} ${name || 'this stylist'}?`,
      `Yes, ${action}`,
      'Cancel',
    );

    if (!confirmed) return;

    showLoading(`${action}ing stylist...`);
    const result = await dispatch(blockUnblockStylist({ stylistId, isBlocked: !isBlocked }));
    closeLoading();

    if (blockUnblockStylist.fulfilled.match(result)) {
      await showSuccess(`${action}ed!`, `${name || 'Stylist'} has been ${action.toLowerCase()}ed`);
      loadStylists();
    } else {
      await showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPDATE_FAILED);
    }
  };

  const handleSendInviteToApplied = async (userId: string, name: string) => {
    const confirmed = await showConfirm(
      'Send Invitation?',
      `Are you sure you want to send invitation to ${name || 'this stylist'}?`,
      'Yes, Send',
      'Cancel',
    );

    if (!confirmed) return;

    showLoading('Sending invitation...');
    const result = await dispatch(sendInviteToApplied({ userId }));
    closeLoading();

    if (sendInviteToApplied.fulfilled.match(result)) {
      await showSuccess('Invitation Sent!', `${name || 'Stylist'} has been invited`);
      loadStylists();
      if (viewInviteDialog?.userId === userId) {
        setViewInviteDialog(null);
      }
    } else {
      await showError('Failed', (result.payload as string) || ERROR_MESSAGES.CREATE_FAILED);
    }
  };

  const handleApprove = async (userId: string, name: string) => {
    const confirmed = await showConfirm(
      'Approve Stylist?',
      `Approve ${name || 'this stylist'} to join the platform?`,
      'Yes, Approve',
      'Cancel',
    );

    if (!confirmed) return;

    showLoading('Approving stylist...');
    const result = await dispatch(approveStylist({ userId }));
    closeLoading();

    if (approveStylist.fulfilled.match(result)) {
      await showSuccess('Approved!', `${name || 'Stylist'} is now active`);
      loadStylists();
    } else {
      await showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPDATE_FAILED);
    }
  };

  const handleReject = async (userId: string, name: string) => {
    const confirmed = await showConfirm(
      'Reject Stylist?',
      `Reject ${name || 'this stylist'}? This cannot be undone.`,
      'Yes, Reject',
      'Cancel',
    );

    if (!confirmed) return;

    showLoading('Rejecting stylist...');
    const result = await dispatch(rejectStylist({ userId }));
    closeLoading();

    if (rejectStylist.fulfilled.match(result)) {
      await showSuccess('Rejected', `${name || 'Stylist'} has been rejected`);
      loadStylists();
    } else {
      await showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  const handleUpdatePosition = async (stylistId: string, position: StylistPosition) => {
    showLoading('Updating position...');
    const result = await dispatch(updateStylistPosition({ stylistId, position }));
    closeLoading();

    if (updateStylistPosition.fulfilled.match(result)) {
      showSuccess('Updated', 'Stylist position updated successfully');
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPDATE_FAILED);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getFlowStatus = (stylist: StylistListItem): string => {
    if (stylist.status === 'ACTIVE') return 'ACTIVE';
    if (stylist.inviteStatus === 'ACCEPTED') return 'ACCEPTED';
    if (stylist.inviteStatus === 'PENDING') return 'PENDING';
    if (stylist.inviteStatus === 'EXPIRED' || stylist.inviteStatus === 'CANCELLED')
      return 'EXPIRED';
    return 'APPLIED';
  };

  const getStatusBadge = (stylist: StylistListItem) => {
    const styles: Record<string, [string, string]> = {
      ACTIVE: ['Active', 'border-emerald-200 bg-emerald-50 text-emerald-700'],
      APPLIED: ['Applied', 'border-amber-200 bg-amber-50 text-amber-700'],
      PENDING: ['Invite Sent', 'border-blue-200 bg-blue-50 text-blue-700'],
      EXPIRED: ['Expired', 'border-red-200 bg-red-50 text-red-700'],
      ACCEPTED: ['Registered', 'border-purple-200 bg-purple-50 text-purple-700'],
    };
    const flowStatus = getFlowStatus(stylist);
    const [label, style] = styles[flowStatus] ?? [flowStatus, ''];
    return (
      <Badge variant="outline" className={`shrink-0 whitespace-nowrap ${style}`}>
        {label}
      </Badge>
    );
  };

  const positionSelect = (stylist: StylistListItem, className: string) => (
    <Select
      value={stylist.position || 'TRAINEE'}
      onValueChange={(val) => handleUpdatePosition(stylist.id, val as StylistPosition)}
      disabled={stylist.status !== 'ACTIVE'}
    >
      <SelectTrigger aria-label={`Position of ${stylist.name || 'stylist'}`} className={className}>
        <SelectValue placeholder="Position" />
      </SelectTrigger>
      <SelectContent className="theme-admin">
        <SelectItem value="TRAINEE">Trainee</SelectItem>
        <SelectItem value="JUNIOR">Junior</SelectItem>
        <SelectItem value="SENIOR">Senior</SelectItem>
      </SelectContent>
    </Select>
  );

  const getActionButtons = (stylist: StylistListItem) => {
    const { userId, isBlocked, name = 'Stylist' } = stylist;
    const flowStatus = getFlowStatus(stylist);
    const size = 'h-10 min-w-0 flex-1 px-3 xl:flex-none';

    if (flowStatus === 'APPLIED') {
      return (
        <Button
          size="sm"
          onClick={() => handleSendInviteToApplied(userId, name)}
          style={{ backgroundColor: ADMIN_COLOR }}
          className={`${size} text-white hover:opacity-90`}
        >
          Send Invite
        </Button>
      );
    }

    if (flowStatus === 'PENDING') {
      return (
        <Button
          size="sm"
          variant="outline"
          className={size}
          onClick={() => setViewInviteDialog(stylist)}
        >
          View Link
        </Button>
      );
    }

    if (flowStatus === 'ACCEPTED') {
      return (
        <>
          <Button
            size="sm"
            onClick={() => handleApprove(userId, name)}
            style={{ backgroundColor: ADMIN_COLOR }}
            className={`${size} text-white hover:opacity-90`}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`${size} border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700`}
            onClick={() => handleReject(userId, name)}
          >
            Reject
          </Button>
        </>
      );
    }

    if (flowStatus === 'ACTIVE') {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className={`${size} border-primary/30 font-semibold text-primary hover:bg-primary/5 hover:text-primary`}
            asChild
          >
            <Link to={stylist.id} state={{ from: location.search }}>
              <Icon icon="solar:settings-bold" className="mr-1.5 size-4" />
              Manage
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`${size} ${
              isBlocked
                ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                : 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
            onClick={() => handleToggleBlock(stylist.id, stylist.name, stylist.isBlocked)}
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </>
      );
    }

    return <span className="text-sm text-muted-foreground">No action</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stylist Management"
        description="Manage all stylist applications, invites, registrations, and team members"
        breadcrumbs={[{ label: 'Stylists' }]}
        actions={
          <Button
            asChild
            style={{ backgroundColor: ADMIN_COLOR }}
            className="w-full text-white hover:opacity-90 sm:w-auto"
          >
            <Link to="invite">Invite Stylist</Link>
          </Button>
        }
      />

      <div className="relative sm:max-w-md">
        <Icon
          icon="solar:magnifer-linear"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search stylists"
          placeholder="Search by name, email, specialization..."
          value={searchTerm}
          onChange={(e) => list.update({ q: e.target.value })}
          className="h-10 w-full bg-background pl-9"
        />
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={stylists}
        resetError={() => {
          dispatch(clearError());
          loadStylists();
        }}
        emptyMessage={searchTerm ? 'No matches' : 'No applications or team members yet'}
        emptyIcon="hugeicons:user-group"
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold">
            All Stylists{' '}
            <span className="text-muted-foreground">({pagination?.totalItems || 0})</span>
          </p>

          {/* Phones and tablets */}
          <ul className="grid gap-3 lg:grid-cols-2 xl:hidden">
            {stylists.map((stylist) => (
              <li key={stylist.userId}>
                <Card className="flex h-full flex-col gap-3 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <StylistAvatar stylist={stylist} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-words font-semibold leading-snug">
                          {stylist.name || 'Pending Registration'}
                        </p>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {getStatusBadge(stylist)}
                          {stylist.isBlocked && (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-700"
                            >
                              Blocked
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 break-all text-sm text-muted-foreground">
                        {stylist.email || '—'}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Specialization</dt>
                      <dd className="mt-0.5 break-words font-medium">{stylist.specialization}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Experience</dt>
                      <dd className="mt-0.5 font-medium">{stylist.experience} years</dd>
                    </div>
                  </dl>
                  <div className="mt-auto space-y-2">
                    {positionSelect(stylist, 'h-10 w-full')}
                    <div className="flex gap-2">{getActionButtons(stylist)}</div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Large screens */}
          <Card className="hidden overflow-hidden shadow-sm xl:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Stylist</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stylists.map((stylist) => (
                  <TableRow key={stylist.userId}>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-3">
                        <StylistAvatar stylist={stylist} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {stylist.name || 'Pending Registration'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {stylist.email || '—'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="truncate">{stylist.specialization}</p>
                      <p className="text-xs text-muted-foreground">{stylist.experience} years</p>
                    </TableCell>
                    <TableCell>{positionSelect(stylist, 'h-10 w-32')}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadge(stylist)}
                        {stylist.isBlocked && (
                          <Badge
                            variant="outline"
                            className="border-red-200 bg-red-50 text-red-700"
                          >
                            Blocked
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">{getActionButtons(stylist)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Pagination
            className="mt-2"
            currentPage={pagination?.currentPage || 1}
            totalPages={pagination?.totalPages || 1}
            onPageChange={(page) => list.update({}, page)}
          />
        </div>
      </LoadingGate>
      {/* View Invite Link Dialog */}
      <Dialog open={!!viewInviteDialog} onOpenChange={() => setViewInviteDialog(null)}>
        <DialogContent className="theme-admin sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stylist Invitation Link</DialogTitle>
            <DialogDescription>
              Share this link with {viewInviteDialog?.name} to complete registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewInviteDialog?.inviteLink ? (
              <>
                <div className="p-4 font-mono text-sm break-all bg-gray-100 rounded-lg">
                  {viewInviteDialog.inviteLink}
                </div>

                {viewInviteDialog.inviteExpiresAt && (
                  <div className="p-3 text-sm border border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-blue-800">
                      Expires: {new Date(viewInviteDialog.inviteExpiresAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => {
                    if (viewInviteDialog.inviteLink) {
                      handleCopyLink(viewInviteDialog.inviteLink);
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {copiedLink === viewInviteDialog.inviteLink ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p>No active invite found</p>
                {viewInviteDialog && (
                  <Button
                    onClick={() => {
                      handleSendInviteToApplied(
                        viewInviteDialog.userId,
                        viewInviteDialog.name || '',
                      );
                      setViewInviteDialog(null);
                    }}
                    className="mt-4 text-white hover:opacity-90"
                    style={{ backgroundColor: ADMIN_COLOR }}
                  >
                    Send Invite Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
