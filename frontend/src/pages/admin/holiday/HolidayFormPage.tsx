import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createHoliday } from '@/features/holiday/holiday.thunks';
import { fetchBranches } from '@/features/branch/branch.thunks';
import { showError, showSuccess } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const todayValue = () => format(new Date(), 'yyyy-MM-dd');

const holidaySchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    date: z
      .string()
      .min(1, 'Date is required')
      .refine((date) => date >= todayValue(), 'Date cannot be in the past'),
    isAllBranches: z.boolean(),
    branchIds: z.array(z.string()).optional(),
  })
  .refine((data) => data.isAllBranches || (data.branchIds && data.branchIds.length > 0), {
    message: 'Please select at least one branch or apply to all branches',
    path: ['branchIds'],
  });

type HolidayFormData = z.infer<typeof holidaySchema>;

const BACK_TO = '/admin/holidays';

export default function HolidayFormPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { branches } = useAppSelector((state) => state.branch);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { name: '', date: '', isAllBranches: true, branchIds: [] },
  });
  const isAllBranches = useWatch({ control, name: 'isAllBranches' });

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  const onSubmit = async (data: HolidayFormData) => {
    const result = await dispatch(
      createHoliday({
        name: data.name,
        date: data.date,
        isAllBranches: data.isAllBranches,
        branchIds: data.isAllBranches ? [] : data.branchIds,
      }),
    );
    if (createHoliday.fulfilled.match(result)) {
      showSuccess('Success', 'Holiday created successfully');
      navigate(BACK_TO);
    } else {
      showError('Failed', (result.payload as string) || 'Could not create the holiday');
    }
  };

  return (
    <FormPage
      title="Add New Holiday"
      description="Create a holiday for the whole salon or selected branches"
      breadcrumbs={[{ label: 'Holidays', href: BACK_TO }, { label: 'Add New Holiday' }]}
      backTo={BACK_TO}
      submitLabel={isSubmitting ? 'Saving...' : 'Create Holiday'}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="holiday-name">Holiday Name *</Label>
          <Input id="holiday-name" placeholder="e.g., Independence Day" {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="holiday-date">Date *</Label>
          <Input id="holiday-date" type="date" min={todayValue()} {...register('date')} />
          {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3">
        <input
          type="checkbox"
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
          {...register('isAllBranches')}
        />
        <span className="text-sm font-medium">Apply to all branches</span>
      </label>

      {!isAllBranches && (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Select Branches *</legend>
          <Controller
            name="branchIds"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {branches.map((branch) => (
                  <label
                    key={branch.id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={field.value?.includes(branch.id) ?? false}
                      onChange={(e) =>
                        field.onChange(
                          e.target.checked
                            ? [...(field.value ?? []), branch.id]
                            : (field.value ?? []).filter((id) => id !== branch.id),
                        )
                      }
                      className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="min-w-0 break-words text-sm font-medium">{branch.name}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.branchIds && <p className="text-sm text-red-600">{errors.branchIds.message}</p>}
        </fieldset>
      )}
    </FormPage>
  );
}
