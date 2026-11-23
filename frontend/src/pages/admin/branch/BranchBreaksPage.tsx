import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { updateBranch } from '@/features/branch/branch.thunks';
import { branchService } from '@/services/branch.service';
import { showError, showSuccess } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LIST_PATH = '/admin/branches';
const MAX_MINUTES = 90;

interface BranchBreak {
  startTime: string;
  endTime: string;
  description: string;
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export default function BranchBreaksPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [branchName, setBranchName] = useState('');
  const [breaks, setBreaks] = useState<BranchBreak[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');

  const listSearch = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = `${LIST_PATH}${listSearch}`;
  const breadcrumbs = [
    { label: 'Branches', href: backTo },
    ...(branchName ? [{ label: branchName }] : []),
    { label: 'Breaks' },
  ];

  useEffect(() => {
    let active = true;
    branchService
      .list(true)
      .then((response) => {
        if (!active) return;
        const found = response.data.data.find((item) => item.id === branchId);
        if (!found) {
          setLoadState('missing');
          return;
        }
        setBranchName(found.name);
        setBreaks(found.defaultBreaks ?? []);
        setLoadState('ready');
      })
      .catch(() => active && setLoadState('missing'));
    return () => {
      active = false;
    };
  }, [branchId]);

  const totalMinutes = breaks.reduce(
    (total, item) => total + (toMinutes(item.endTime) - toMinutes(item.startTime)),
    0,
  );

  const change = (index: number, key: keyof BranchBreak, value: string) =>
    setBreaks((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!branchId) return;
    const invalid = breaks.find((item) => toMinutes(item.endTime) <= toMinutes(item.startTime));
    if (invalid) {
      showError('Invalid Time', `End time must be after start time for "${invalid.description}"`);
      return;
    }
    if (totalMinutes > MAX_MINUTES) {
      showError(
        'Limit Exceeded',
        `Total break time cannot exceed ${MAX_MINUTES} minutes. Currently ${totalMinutes} mins.`,
      );
      return;
    }

    setIsSaving(true);
    const result = await dispatch(updateBranch({ id: branchId, data: { defaultBreaks: breaks } }));
    setIsSaving(false);

    if (updateBranch.fulfilled.match(result)) {
      showSuccess('Success', 'Default branch breaks updated');
      navigate(backTo);
    } else {
      showError('Failed', (result.payload as string) || 'Could not save default breaks');
    }
  };

  if (loadState !== 'ready') {
    return (
      <div className="w-full space-y-6">
        <PageHeader title="Branch Breaks" breadcrumbs={breadcrumbs} backTo={backTo} />
        {loadState === 'loading' ? (
          <div className="flex justify-center py-16">
            <Loader label="Loading breaks" />
          </div>
        ) : (
          <div className="space-y-4 py-12 text-center">
            <p className="text-muted-foreground">This branch could not be found.</p>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to branches</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <FormPage
      title={`${branchName} Breaks`}
      description={`These apply to all stylists in this branch. Maximum ${MAX_MINUTES} minutes in total.`}
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSaving ? 'Saving...' : 'Save Changes'}
      isSubmitting={isSaving}
      onSubmit={save}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Clock className="size-4 text-primary" />
          <span className="font-medium">Total Duration:</span>
          <span
            className={`font-bold ${totalMinutes > MAX_MINUTES ? 'text-red-600' : 'text-primary'}`}
          >
            {totalMinutes} / {MAX_MINUTES} mins
          </span>
        </p>
        <Button
          type="button"
          className="h-10 gap-2"
          onClick={() =>
            setBreaks((current) => [
              ...current,
              { startTime: '13:00', endTime: '14:00', description: 'New Break' },
            ])
          }
        >
          <Plus className="size-4" />
          Add Break
        </Button>
      </div>

      {breaks.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No global breaks defined.</p>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {breaks.map((item, index) => (
            <li key={index} className="min-w-0 space-y-3 rounded-2xl border p-4">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor={`break-name-${index}`}>Description</Label>
                  <Input
                    id={`break-name-${index}`}
                    value={item.description}
                    placeholder="Lunch Break"
                    onChange={(event) => change(index, 'description', event.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.description || 'break'}`}
                  className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setBreaks((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={`break-start-${index}`}>Start</Label>
                  <Input
                    id={`break-start-${index}`}
                    type="time"
                    value={item.startTime}
                    onChange={(event) => change(index, 'startTime', event.target.value)}
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={`break-end-${index}`}>End</Label>
                  <Input
                    id={`break-end-${index}`}
                    type="time"
                    value={item.endTime}
                    onChange={(event) => change(index, 'endTime', event.target.value)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FormPage>
  );
}
