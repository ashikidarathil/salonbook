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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-white px-4 py-3">
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
        <TabsList className="bg-slate-50/50 border p-1 rounded-xl w-full max-w-full md:w-auto overflow-x-auto !justify-start inline-flex">
          <TabsTrigger
            value="schedule"
            className="shrink-0 rounded-lg px-3 py-2 sm:px-8 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:clock-circle-linear" className="mr-2 size-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="shrink-0 rounded-lg px-3 py-2 sm:px-8 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:scissors-square-linear" className="mr-2 size-4" />
            Services
          </TabsTrigger>
          <TabsTrigger
            value="off-days"
            className="shrink-0 rounded-lg px-3 py-2 sm:px-8 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:calendar-linear" className="mr-2 size-4" />
            Off-Days
          </TabsTrigger>
          <TabsTrigger
            value="wallet"
            className="shrink-0 rounded-lg px-3 py-2 sm:px-8 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
          >
            <Icon icon="solar:wallet-bold" className="mr-2 size-4" />
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
