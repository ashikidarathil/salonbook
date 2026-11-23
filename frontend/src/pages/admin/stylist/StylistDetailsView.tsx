'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import StylistBranchService from '@/services/stylistBranch.service';

import { branchService } from '@/services/branch.service';
import StylistServiceManagement from './StylistServiceManagement';
import StylistScheduleManagement from './StylistScheduleManagement';
import OffDayManagement from './OffDayManagementPage';
import type { StylistListItem } from '@/features/stylistInvite/stylistInvite.types';
import type { Branch } from '@/features/branch/branch.types';
import StylistWalletManagement from './StylistWalletManagement';
import { StylistSlugEditor } from '@/components/admin/StylistSlugEditor';

interface StylistDetailsViewProps {
  stylist: StylistListItem;
}

export default function StylistDetailsView({ stylist }: StylistDetailsViewProps) {
  const [params, setParams] = useSearchParams();
  const section = params.get('section') || 'schedule';
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await StylistBranchService.getStylistBranches(stylist.id);
        if (response.data.data && response.data.data.length > 0) {
          const branchId = response.data.data[0].branchId;
          const branchRes = await branchService.list();
          const found = branchRes.data.data.find((b: Branch) => b.id === branchId);
          if (found) {
            // Found branch
          }
        }
      } catch (error) {
        console.error('Failed to fetch branch info', error);
      } finally {
        // done
      }
    };

    fetchBranch();
  }, [stylist.id]);

  return (
    <div className="space-y-6">
      {/* Public profile address (readable URL name) */}
      <div className="flex min-w-0 flex-col gap-1 rounded-xl border bg-white px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Public profile
        </span>
        <StylistSlugEditor stylistId={stylist.id} slug={stylist.slug} />
      </div>

      {/* Unified Management Tabs */}
      <Tabs
        value={section}
        onValueChange={(value) => setParams({ section: value }, { replace: true })}
        className="space-y-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-xl border bg-slate-50/50 p-1 xl:inline-flex xl:w-auto">
          <TabsTrigger
            value="schedule"
            className="min-w-0 rounded-lg px-1 py-2 text-xs font-medium sm:text-sm xl:px-8 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:clock-circle-linear" className="mr-2 hidden size-4 sm:block" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="min-w-0 rounded-lg px-1 py-2 text-xs font-medium sm:text-sm xl:px-8 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:scissors-square-linear" className="mr-2 hidden size-4 sm:block" />
            Services
          </TabsTrigger>
          <TabsTrigger
            value="off-days"
            className="min-w-0 rounded-lg px-1 py-2 text-xs font-medium sm:text-sm xl:px-8 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:calendar-linear" className="mr-2 hidden size-4 sm:block" />
            Off-Days
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="min-w-0 rounded-lg px-1 py-2 text-xs font-medium sm:text-sm xl:px-8 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:wallet-bold" className="mr-2 hidden size-4 sm:block" />
            Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-0 outline-none">
          <StylistScheduleManagement stylistId={stylist.id} stylistName={stylist.name} />
        </TabsContent>

        <TabsContent value="services" className="mt-0 outline-none">
          <StylistServiceManagement stylistId={stylist.id} stylistName={stylist.name} />
        </TabsContent>

        <TabsContent value="off-days" className="mt-0 outline-none">
          <OffDayManagement stylistId={stylist.id} />
        </TabsContent>

        <TabsContent value="wallet" className="mt-0 outline-none">
          <StylistWalletManagement stylistId={stylist.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
