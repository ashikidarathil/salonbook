import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch } from '@/app/hooks';
import { createCategory, updateCategory } from '@/features/category/categoryThunks';
import { categoryService } from '@/services/category.service';
import { ERROR_MESSAGES } from '@/common/constants/error.messages';
import { showError, showSuccess } from '@/common/utils/swal.utils';
import { APP_ROUTES } from '@/common/constants/app.routes';
import { FormPage } from '@/components/common/FormPage';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryFormPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>(
    id ? 'loading' : 'ready',
  );

  // Return to the same page, search and filter of the list
  const listSearch = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = `${APP_ROUTES.ADMIN.CATEGORIES}${listSearch}`;
  const heading = id ? 'Edit Category' : 'Add New Category';
  const breadcrumbs = [{ label: 'Categories', href: backTo }, { label: heading }];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (!id) return;
    let active = true;
    categoryService
      .listCategories(true)
      .then((response) => {
        if (!active) return;
        const category = response.data.data.find((item) => item.id === id);
        if (!category) {
          setLoadState('missing');
          return;
        }
        reset({ name: category.name, description: category.description || '' });
        setLoadState('ready');
      })
      .catch(() => active && setLoadState('missing'));
    return () => {
      active = false;
    };
  }, [id, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    const result = id
      ? await dispatch(updateCategory({ id, data }))
      : await dispatch(createCategory(data));

    if (createCategory.fulfilled.match(result) || updateCategory.fulfilled.match(result)) {
      showSuccess(
        id ? 'Category Updated' : 'Category Created',
        id ? 'Changes saved successfully' : 'New category added',
      );
      navigate(id ? backTo : APP_ROUTES.ADMIN.CATEGORIES);
    } else {
      showError('Failed', (result.payload as string) || ERROR_MESSAGES.OPERATION_FAILED);
    }
  };

  if (loadState !== 'ready') {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageHeader title={heading} breadcrumbs={breadcrumbs} backTo={backTo} />
        {loadState === 'loading' ? (
          <div className="flex justify-center py-16">
            <Loader label="Loading category" />
          </div>
        ) : (
          <div className="space-y-4 py-12 text-center">
            <p className="text-muted-foreground">This category could not be found.</p>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to categories</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <FormPage
      title={heading}
      description={id ? 'Update this service category' : 'Create a new service category'}
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSubmitting ? 'Saving...' : id ? 'Save Changes' : 'Create Category'}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-2">
        <Label htmlFor="category-name">Category Name *</Label>
        <Input
          id="category-name"
          aria-invalid={!!errors.name}
          placeholder="Hair Coloring"
          {...register('name')}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-description">Description (optional)</Label>
        <Input
          id="category-description"
          placeholder="For all coloring services..."
          {...register('description')}
        />
      </div>
    </FormPage>
  );
}
