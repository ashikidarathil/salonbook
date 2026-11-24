import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeeklyRoutine from '@/components/schedule/WeeklyRoutine';
import DailyAdjustments from '@/components/schedule/DailyAdjustments';
import BreakManagement from '@/components/schedule/BreakManagement';

const TABS = [
  { value: 'weekly', label: 'Weekly Routine', short: 'Weekly' },
  { value: 'daily', label: 'Daily Adjustments', short: 'Daily' },
  { value: 'breaks', label: 'Break Times', short: 'Breaks' },
];

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
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/20 bg-muted/50 p-1 shadow-sm sm:inline-grid sm:w-auto">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-9 min-w-0 rounded-xl px-2 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:px-6"
            >
              <span className="sm:hidden">{tab.short}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

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
