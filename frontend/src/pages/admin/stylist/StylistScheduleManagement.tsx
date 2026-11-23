import { Loader } from '@/components/common/Loader';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icon } from '@iconify/react';
import WeeklyRoutine from '@/components/schedule/WeeklyRoutine';
import DailyAdjustments from '@/components/schedule/DailyAdjustments';
import BreakManagement from '@/components/schedule/BreakManagement';
import StylistBranchService from '@/services/stylistBranch.service';

interface StylistScheduleManagementProps {
  stylistId: string;
  stylistName: string;
}

export default function StylistScheduleManagement({
  stylistId,
  stylistName,
}: StylistScheduleManagementProps) {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'weekly';
  const setActiveTab = (tab: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('tab', tab);
        return next;
      },
      { replace: true },
    );
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isBranchLoading, setIsBranchLoading] = useState(true);

  // Auto-fetch stylist's branch for the admin
  useEffect(() => {
    const fetchStylistBranch = async () => {
      setIsBranchLoading(true);
      try {
        const response = await StylistBranchService.getStylistBranches(stylistId);

        const branches = response.data.data;
        if (branches.length > 0) {
          const activeBranch = branches.find((b) => b.isActive);
          setBranchId(activeBranch?.branchId || branches[0].branchId);
        }
      } catch (error) {
        console.error('Failed to fetch stylist branch:', error);
      } finally {
        setIsBranchLoading(false);
      }
    };
    fetchStylistBranch();
  }, [stylistId]);

  return (
    <div className="space-y-4">
      <div className="space-y-4 sm:space-y-6 sm:rounded-2xl sm:border sm:bg-white sm:p-6 sm:shadow-sm lg:p-8">
        {/* Component Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4 sm:pb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">
                <Icon icon="solar:calendar-bold" className="size-6 text-primary/80" />
                Schedule Management
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage weekly routine, daily adjustments, and breaks for{' '}
                <span className="font-semibold text-slate-700">{stylistName}</span>.
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="hidden rounded-full px-4 py-1.5 text-xs font-semibold md:inline-flex"
          >
            Admin Access
          </Badge>
        </div>

        {isBranchLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader size="md" />
          </div>
        ) : !branchId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-amber-50 rounded-[2.5rem] border border-amber-100 border-dashed">
            <div className="p-5 bg-amber-100 rounded-full shadow-inner">
              <Icon icon="solar:info-circle-bold" className="size-12 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 text-xl uppercase tracking-tight">
                No Branch Assigned
              </h3>
              <p className="text-sm text-amber-600/70 font-medium max-w-[340px] mx-auto mt-1">
                This stylist needs to be assigned to a branch before you can manage their schedule.
              </p>
            </div>
          </div>
        ) : (
          /* Schedule Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
            <div>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-lg border bg-slate-50/50 p-1 xl:inline-flex xl:w-auto">
                <TabsTrigger
                  value="weekly"
                  className="rounded-md min-w-0 px-1 py-2 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm xl:px-4"
                >
                  <Icon icon="solar:calendar-linear" className="mr-2 hidden size-4 lg:block" />
                  <span className="lg:hidden">Weekly</span>
                  <span className="hidden lg:inline">Weekly Routine</span>
                </TabsTrigger>
                <TabsTrigger
                  value="daily"
                  className="rounded-md min-w-0 px-1 py-2 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm xl:px-4"
                >
                  <Icon icon="solar:calendar-date-linear" className="mr-2 hidden size-4 lg:block" />
                  <span className="lg:hidden">Daily</span>
                  <span className="hidden lg:inline">Daily Overrides</span>
                </TabsTrigger>
                <TabsTrigger
                  value="breaks"
                  className="rounded-md min-w-0 px-1 py-2 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm sm:text-sm xl:px-4"
                >
                  <Icon icon="solar:coffee-cup-linear" className="mr-2 hidden size-4 lg:block" />
                  <span className="lg:hidden">Breaks</span>
                  <span className="hidden lg:inline">Break Times</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="weekly" className="mt-6 border-none p-0 focus-visible:ring-0">
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <WeeklyRoutine stylistId={stylistId} branchId={branchId} />
              </div>
            </TabsContent>

            <TabsContent value="daily" className="mt-6 border-none p-0 focus-visible:ring-0">
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <DailyAdjustments
                  stylistId={stylistId}
                  branchId={branchId}
                  stylistName={stylistName}
                />
              </div>
            </TabsContent>

            <TabsContent value="breaks" className="mt-6 border-none p-0 focus-visible:ring-0">
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <BreakManagement
                  stylistId={stylistId}
                  branchId={branchId}
                  stylistName={stylistName}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
