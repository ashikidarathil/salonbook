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
    const flowStatus = getFlowStatus(stylist);

    if (flowStatus === 'ACTIVE') return <Badge className="bg-green-500">ACTIVE</Badge>;
    if (flowStatus === 'APPLIED')
      return (
        <Badge variant="secondary" className="bg-yellow-300">
          APPLIED
        </Badge>
      );
    if (flowStatus === 'PENDING') return <Badge className="bg-blue-500">INVITE SENT</Badge>;
    if (flowStatus === 'EXPIRED')
      return (
        <Badge variant="destructive" className="bg-red-500">
          EXPIRED
        </Badge>
      );
    if (flowStatus === 'ACCEPTED') return <Badge className="bg-purple-500">REGISTERED</Badge>;
    return <Badge variant="outline">{flowStatus}</Badge>;
  };

  const getActionButtons = (stylist: StylistListItem) => {
    const { userId, isBlocked, name = 'Stylist' } = stylist;
    const flowStatus = getFlowStatus(stylist);

    if (flowStatus === 'APPLIED') {
      return (
        <Button
          size="sm"
          onClick={() => handleSendInviteToApplied(userId, name)}
          style={{ backgroundColor: ADMIN_COLOR }}
          className="text-white hover:opacity-90"
        >
          Send Invite
        </Button>
      );
    }

    if (flowStatus === 'PENDING') {
      return (
        <Button size="sm" variant="outline" onClick={() => setViewInviteDialog(stylist)}>
          View Link
        </Button>
      );
    }

    if (flowStatus === 'ACCEPTED') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleApprove(userId, name)}
            style={{ backgroundColor: ADMIN_COLOR }}
            className="text-white hover:opacity-90"
          >
            Approve
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleReject(userId, name)}>
            Reject
          </Button>
        </div>
      );
    }

    if (flowStatus === 'ACTIVE') {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="font-bold border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
            asChild
          >
            <Link to={stylist.id} state={{ from: location.search }}>
              <Icon icon="solar:settings-bold" className="mr-2 size-4" />
              Manage
            </Link>
          </Button>

          <Button
            size="sm"
            variant={isBlocked ? 'default' : 'destructive'}
            onClick={() => handleToggleBlock(stylist.id, stylist.name, stylist.isBlocked)}
            style={isBlocked ? { backgroundColor: ADMIN_COLOR } : {}}
            className={isBlocked ? 'text-white hover:opacity-90' : ''}
          >
            {isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </div>
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

      <div className="sm:max-w-md">
        <Input
          placeholder="Search by name, email, specialization..."
          value={searchTerm}
          onChange={(e) => list.update({ q: e.target.value })}
          className="w-full"
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
        {/* Stylists Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Stylists ({pagination?.totalItems || 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y lg:hidden">
              {stylists.map((stylist) => (
                <li key={stylist.userId} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        {stylist.name || 'Pending Registration'}
                      </p>
                      <p className="mt-0.5 break-all text-sm text-muted-foreground">
                        {stylist.email || '—'}
                      </p>
                      <p className="mt-1 break-words text-sm">
                        {stylist.specialization} · {stylist.experience} years
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {getStatusBadge(stylist)}
                      {stylist.isBlocked && <Badge variant="destructive">BLOCKED</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Select
                      value={stylist.position || 'TRAINEE'}
                      onValueChange={(val) =>
                        handleUpdatePosition(stylist.id, val as StylistPosition)
                      }
                      disabled={stylist.status !== 'ACTIVE'}
                    >
                      <SelectTrigger
                        aria-label={`Position of ${stylist.name || 'stylist'}`}
                        className="w-full sm:w-36"
                      >
                        <SelectValue placeholder="Position" />
                      </SelectTrigger>
                      <SelectContent className="theme-admin">
                        <SelectItem value="TRAINEE">Trainee</SelectItem>
                        <SelectItem value="JUNIOR">Junior</SelectItem>
                        <SelectItem value="SENIOR">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                    {getActionButtons(stylist)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blocked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stylists.map((stylist) => (
                    <TableRow key={stylist.userId}>
                      <TableCell className="font-medium">
                        {stylist.name || 'Pending Registration'}
                      </TableCell>
                      <TableCell>{stylist.email || '—'}</TableCell>
                      <TableCell>{stylist.specialization}</TableCell>
                      <TableCell>{stylist.experience} years</TableCell>
                      <TableCell>
                        <Select
                          value={stylist.position || 'TRAINEE'}
                          onValueChange={(val) =>
                            handleUpdatePosition(stylist.id, val as StylistPosition)
                          }
                          disabled={stylist.status !== 'ACTIVE'}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Position" />
                          </SelectTrigger>
                          <SelectContent className="theme-admin">
                            <SelectItem value="TRAINEE">Trainee</SelectItem>
                            <SelectItem value="JUNIOR">Junior</SelectItem>
                            <SelectItem value="SENIOR">Senior</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getStatusBadge(stylist)}</TableCell>
                      <TableCell>
                        <Badge variant={stylist.isBlocked ? 'destructive' : 'secondary'}>
                          {stylist.isBlocked ? 'YES' : 'NO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{getActionButtons(stylist)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 border-t">
              <Pagination
                currentPage={pagination?.currentPage || 1}
                totalPages={pagination?.totalPages || 1}
                onPageChange={(page) => list.update({}, page)}
              />
            </div>
          </CardContent>
        </Card>
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
                      ⏰ Expires: {new Date(viewInviteDialog.inviteExpiresAt).toLocaleString()}
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
