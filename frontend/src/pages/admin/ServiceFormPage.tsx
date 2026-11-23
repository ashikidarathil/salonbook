import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  createService,
  deleteServiceImage,
  updateService,
  uploadServiceImage,
} from '@/features/service/serviceThunks';
import { fetchCategories } from '@/features/category/categoryThunks';
import type { Service } from '@/features/service/service.types';
import { serviceService } from '@/services/service.service';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { showConfirm, showError, showSuccess } from '@/common/utils/swal.utils';
import { slugForSubmit, slugFormField } from '@/common/utils/slug';
import { SlugField } from '@/components/admin/SlugField';
import { FormPage } from '@/components/common/FormPage';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { ImageCropper } from '@/components/cropper/ImageCropper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const LIST_PATH = '/admin/services';
const MAX_INCLUDED = 10;

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  whatIncluded: z.array(z.string()).optional(),
  slug: slugFormField,
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const capitalizeFirst = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export default function ServiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { categories } = useAppSelector((state) => state.category);
  const imageLoading = useAppSelector((state) => state.service.imageLoading);

  const [service, setService] = useState<Service | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>(
    id ? 'loading' : 'ready',
  );
  const [includedInput, setIncludedInput] = useState('');
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const listSearch = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = `${LIST_PATH}${listSearch}`;
  const heading = id ? 'Edit Service' : 'Add New Service';
  const breadcrumbs = [{ label: 'Services', href: backTo }, { label: heading }];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', description: '', categoryId: '', whatIncluded: [], slug: '' },
  });
  const slugValue = useWatch({ control, name: 'slug' });
  const nameValue = useWatch({ control, name: 'name' });
  const categoryId = useWatch({ control, name: 'categoryId' });
  const whatIncluded = useWatch({ control, name: 'whatIncluded' }) ?? [];

  const loadService = useCallback(async () => {
    if (!id) return null;
    const response = await serviceService.adminList(true);
    return response.data.data.find((item) => item.id === id) ?? null;
  }, [id]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    loadService()
      .then((found) => {
        if (!active) return;
        if (!found || found.isDeleted) {
          setLoadState('missing');
          return;
        }
        setService(found);
        reset({
          name: found.name,
          description: found.description || '',
          categoryId: found.categoryId,
          whatIncluded: found.whatIncluded || [],
          slug: found.slug || '',
        });
        setLoadState('ready');
      })
      .catch(() => active && setLoadState('missing'));
    return () => {
      active = false;
    };
  }, [id, loadService, reset]);

  useEffect(() => {
    if (loadState === 'ready' && location.hash === '#photo') {
      photoRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [loadState, location.hash]);

  useEffect(
    () => () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    },
    [pendingPreview],
  );

  const addIncluded = () => {
    const item = includedInput.trim();
    if (!item || whatIncluded.length >= MAX_INCLUDED) return;
    setValue('whatIncluded', [...whatIncluded, item], { shouldDirty: true });
    setIncludedInput('');
  };

  const onSubmit = async (data: ServiceFormData) => {
    const payload = { ...data, slug: slugForSubmit(data.slug) };
    const result = id
      ? await dispatch(updateService({ id, data: payload }))
      : await dispatch(createService(payload));

    if (createService.fulfilled.match(result)) {
      showSuccess('Service Created', 'Now you can add a photo');
      navigate(`${LIST_PATH}/${result.payload.id}/edit#photo`, { replace: true });
    } else if (updateService.fulfilled.match(result)) {
      showSuccess('Service Updated', 'Changes saved successfully');
      navigate(backTo);
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  const onPickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setCropSource(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  const refreshPhoto = async () => {
    const fresh = await loadService();
    if (fresh) setService(fresh);
  };

  const uploadPhoto = async () => {
    if (!id || !pendingFile) return;
    const result = await dispatch(uploadServiceImage({ serviceId: id, file: pendingFile }));
    if (uploadServiceImage.fulfilled.match(result)) {
      showSuccess('Success', 'Image uploaded successfully');
      clearPending();
      await refreshPhoto();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.UPLOAD_PICTURE_FAILED);
    }
  };

  const removePhoto = async () => {
    if (!id) return;
    const confirmed = await showConfirm(
      'Delete Image?',
      'Are you sure you want to delete this service image?',
      'Delete',
      'Cancel',
      '#ef4444',
    );
    if (!confirmed) return;
    const result = await dispatch(deleteServiceImage(id));
    if (deleteServiceImage.fulfilled.match(result)) {
      showSuccess('Deleted', 'Image deleted successfully');
      await refreshPhoto();
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.DELETE_FAILED);
    }
  };

  if (loadState !== 'ready') {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={heading} breadcrumbs={breadcrumbs} backTo={backTo} />
        {loadState === 'loading' ? (
          <div className="flex justify-center py-16">
            <Loader label="Loading service" />
          </div>
        ) : (
          <div className="space-y-4 py-12 text-center">
            <p className="text-muted-foreground">This service could not be found.</p>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to services</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const photo = pendingPreview ?? service?.imageUrl;

  return (
    <>
      <FormPage
        title={heading}
        description={id ? 'Update this service' : 'Create a new salon service'}
        breadcrumbs={breadcrumbs}
        backTo={backTo}
        submitLabel={isSubmitting ? 'Saving...' : id ? 'Save Changes' : 'Create Service'}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
          <div className="min-w-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name *</Label>
              <Input id="service-name" placeholder="Hair Cut & Style" {...register('name')} />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <SlugField
              pathPrefix="/branches/<branch>/services/"
              value={slugValue}
              sourceName={nameValue}
              savedSlug={service?.slug}
              error={errors.slug?.message}
              inputProps={register('slug')}
            />

            <div className="space-y-2">
              <Label htmlFor="service-category">Category *</Label>
              <select
                id="service-category"
                value={categoryId || ''}
                onChange={(e) =>
                  setValue('categoryId', e.target.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-primary md:text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {capitalizeFirst(category.name)}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">Description (optional)</Label>
              <Textarea
                id="service-description"
                rows={4}
                placeholder="Detailed description of the service..."
                {...register('description')}
              />
            </div>
          </div>
          <div className="min-w-0 space-y-6">
            <div className="space-y-3 border-t pt-6 xl:border-t-0 xl:pt-0">
              <div>
                <Label htmlFor="service-included" className="text-base font-semibold">
                  What's Included (optional)
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">Add up to {MAX_INCLUDED} items</p>
              </div>
              <div className="flex gap-2">
                <Input
                  id="service-included"
                  value={includedInput}
                  placeholder="e.g., Free hair consultation"
                  disabled={whatIncluded.length >= MAX_INCLUDED}
                  onChange={(e) => setIncludedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIncluded();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 gap-2"
                  disabled={whatIncluded.length >= MAX_INCLUDED}
                  onClick={addIncluded}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
              {whatIncluded.length > 0 && (
                <ul className="space-y-2">
                  {whatIncluded.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3"
                    >
                      <span className="flex min-w-0 items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                        <span className="break-words">{item}</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${item}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                        onClick={() =>
                          setValue(
                            'whatIncluded',
                            whatIncluded.filter((_, i) => i !== index),
                            { shouldDirty: true },
                          )
                        }
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {id ? (
              <div ref={photoRef} id="photo" className="scroll-mt-4 space-y-3 border-t pt-6">
                <div>
                  <p className="text-base font-semibold">Service Photo</p>
                  <p className="mt-1 text-sm text-muted-foreground">Photos save straight away</p>
                </div>
                <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/30 sm:h-72">
                  {photo ? (
                    <img src={photo} alt="Service" className="size-full object-cover" />
                  ) : (
                    <ImagePlus className="size-8 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  aria-label="Choose service photo"
                  className="hidden"
                  onChange={onPickImage}
                />
                <div className="grid gap-2 sm:grid-cols-2 [&>button]:h-10">
                  {pendingFile ? (
                    <>
                      <Button type="button" disabled={imageLoading} onClick={uploadPhoto}>
                        {imageLoading ? 'Uploading...' : 'Save Photo'}
                      </Button>
                      <Button type="button" variant="outline" onClick={clearPending}>
                        Discard
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                      >
                        <ImagePlus className="mr-2 size-4" />
                        {service?.imageUrl ? 'Change Photo' : 'Choose Photo'}
                      </Button>
                      {service?.imageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          className="text-red-600"
                          onClick={removePhoto}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete Photo
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="border-t pt-6 text-sm text-muted-foreground">
                You can add a photo right after creating the service.
              </p>
            )}
          </div>
        </div>
      </FormPage>

      {cropSource && (
        <ImageCropper
          open
          imageSrc={cropSource}
          onClose={() => setCropSource(null)}
          onCropComplete={(file) => {
            setPendingFile(file);
            setPendingPreview(URL.createObjectURL(file));
          }}
        />
      )}
    </>
  );
}
