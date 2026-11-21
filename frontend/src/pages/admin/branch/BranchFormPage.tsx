import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch } from '@/app/hooks';
import { createBranch, updateBranch } from '@/features/branch/branch.thunks';
import type { Branch, MapLocation } from '@/features/branch/branch.types';
import { branchService } from '@/services/branch.service';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { showError, showSuccess } from '@/common/utils/swal.utils';
import { slugForSubmit, slugFormField } from '@/common/utils/slug';
import { SlugField } from '@/components/admin/SlugField';
import { BranchMapField } from '@/components/branch/BranchMapField';
import { FormPage } from '@/components/common/FormPage';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LIST_PATH = '/admin/branches';

const branchSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  address: z.string().trim().min(5, 'Address must be at least 5 characters'),
  phone: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  slug: slugFormField,
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function BranchFormPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [mapValue, setMapValue] = useState<MapLocation | undefined>();
  const [locationError, setLocationError] = useState<string>();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>(
    id ? 'loading' : 'ready',
  );

  const listSearch = (routerLocation.state as { from?: string } | null)?.from ?? '';
  const backTo = `${LIST_PATH}${listSearch}`;
  const heading = id ? 'Edit Branch' : 'Add New Branch';
  const breadcrumbs = [{ label: 'Branches', href: backTo }, { label: heading }];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '', phone: '', latitude: 0, longitude: 0, slug: '' },
  });
  const slugValue = useWatch({ control, name: 'slug' });
  const nameValue = useWatch({ control, name: 'name' });

  useEffect(() => {
    if (!id) return;
    let active = true;
    branchService
      .list(true)
      .then((response) => {
        if (!active) return;
        const found = response.data.data.find((item) => item.id === id);
        if (!found) {
          setLoadState('missing');
          return;
        }
        setBranch(found);
        setMapValue({ latitude: found.latitude, longitude: found.longitude });
        reset({
          name: found.name,
          address: found.address,
          phone: found.phone || '',
          latitude: found.latitude,
          longitude: found.longitude,
          slug: found.slug || '',
        });
        setLoadState('ready');
      })
      .catch(() => active && setLoadState('missing'));
    return () => {
      active = false;
    };
  }, [id, reset]);

  const onMapChange = useCallback(
    (location: MapLocation) => {
      setMapValue(location);
      setLocationError(undefined);
      setValue('latitude', location.latitude, { shouldDirty: true });
      setValue('longitude', location.longitude, { shouldDirty: true });
    },
    [setValue],
  );

  const applyAddress = useCallback(
    (address: string) => setValue('address', address, { shouldDirty: true, shouldValidate: true }),
    [setValue],
  );

  // Never overwrite an address the admin already typed
  const onAddressFound = useCallback(
    (address: string) => {
      if (!getValues('address')?.trim()) applyAddress(address);
    },
    [getValues, applyAddress],
  );

  const onSubmit = async (data: BranchFormData) => {
    const payload = { ...data, slug: slugForSubmit(data.slug) };
    const result = id
      ? await dispatch(updateBranch({ id, data: payload }))
      : await dispatch(createBranch(payload));

    if (createBranch.fulfilled.match(result) || updateBranch.fulfilled.match(result)) {
      showSuccess(
        id ? 'Branch Updated' : 'Branch Created',
        id ? 'Changes saved successfully' : 'New branch added',
      );
      navigate(id ? backTo : LIST_PATH);
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (!mapValue) {
      event.preventDefault();
      setLocationError('Please choose a location on the map');
      handleSubmit(() => undefined)();
      return;
    }
    return handleSubmit(onSubmit)(event);
  };

  if (loadState !== 'ready') {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={heading} breadcrumbs={breadcrumbs} backTo={backTo} />
        {loadState === 'loading' ? (
          <div className="flex justify-center py-16">
            <Loader label="Loading branch" />
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
      title={heading}
      description={id ? 'Update branch details' : 'Fill in the details and choose the location'}
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSubmitting ? 'Saving...' : id ? 'Save Changes' : 'Create Branch'}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="branch-name">Branch Name *</Label>
          <Input id="branch-name" placeholder="Main Salon Branch" {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <SlugField
          pathPrefix="/branches/"
          value={slugValue}
          sourceName={nameValue}
          savedSlug={branch?.slug}
          error={errors.slug?.message}
          inputProps={register('slug')}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="branch-address">Address *</Label>
          <Input id="branch-address" placeholder="123 Main Street, City" {...register('address')} />
          {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch-phone">Phone (optional)</Label>
          <Input id="branch-phone" placeholder="+91 98765 43210" {...register('phone')} />
        </div>
      </div>

      <div className="border-t pt-6">
        <BranchMapField
          value={mapValue}
          error={locationError}
          onChange={onMapChange}
          onAddressFound={onAddressFound}
          onUseAddress={applyAddress}
        />
      </div>
    </FormPage>
  );
}
