import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyRoutine from '@/components/schedule/WeeklyRoutine';
import DailyAdjustments from '@/components/schedule/DailyAdjustments';
import BreakManagement from '@/components/schedule/BreakManagement';

export default function StylistSchedulePage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'weekly';

  return (
    <div className="w-full space-y-6 theme-stylist">
      <PageHeader
        title="My Schedule"
        description="Manage your weekly routine, specific daily adjustments, and scheduled breaks."
        breadcrumbs={[{ label: 'My Schedule' }]}
      />

      <Tabs
        value={activeTab}
        onValueChange={(tab) => setParams({ tab }, { replace: true })}
        className="space-y-6"
      >
        <div className="bg-muted/50 p-1 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar border border-border/20 shadow-sm">
          <TabsList className="flex h-10 w-max min-w-full !justify-start gap-1 bg-transparent md:inline-flex md:w-fit md:min-w-0">
            <TabsTrigger
              value="weekly"
              className="flex-1 md:flex-none rounded-xl px-4 sm:px-6 h-8 text-[11px] sm:text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap"
            >
              Weekly Routine
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="flex-1 md:flex-none rounded-xl px-4 sm:px-6 h-8 text-[11px] sm:text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap"
            >
              Daily Adjustments
            </TabsTrigger>
            <TabsTrigger
              value="breaks"
              className="flex-1 md:flex-none rounded-xl px-4 sm:px-6 h-8 text-[11px] sm:text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all whitespace-nowrap"
            >
              Break Times
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="weekly" className="space-y-4 animate-in fade-in duration-300">
          <WeeklyRoutine />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 animate-in fade-in duration-300">
          <DailyAdjustments />
        </TabsContent>

        <TabsContent value="breaks" className="space-y-4 animate-in fade-in duration-300">
          <BreakManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
