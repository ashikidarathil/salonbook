import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { useAppDispatch } from '@/app/hooks';
import { createCoupon, updateCoupon } from '@/features/coupon/coupon.thunks';
import { DiscountType, type Coupon } from '@/features/coupon/coupon.types';
import couponService from '@/services/coupon.service';
import { showError, showSuccess } from '@/common/utils/swal.utils';
import { FormPage } from '@/components/common/FormPage';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const LIST_PATH = '/admin/coupons';

const emptyForm = () => ({
  code: '',
  discountType: DiscountType.PERCENTAGE,
  discountValue: 0,
  minBookingAmount: 0,
  expiryDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  maxUsage: 100,
  maxDiscountAmount: 0,
});

type CouponForm = ReturnType<typeof emptyForm>;
type NumberKey = 'discountValue' | 'minBookingAmount' | 'maxUsage' | 'maxDiscountAmount';

/** There is no single-coupon endpoint, so an opened or refreshed edit link searches the list. */
async function findCoupon(id: string): Promise<Coupon | null> {
  for (let page = 1; ; page++) {
    const response = await couponService.listAllCoupons({ page, limit: 50 });
    const { data, pagination } = response.data.data;
    const match = data.find((coupon) => coupon.id === id);
    if (match) return match;
    if (page >= pagination.totalPages) return null;
  }
}

const validate = (form: CouponForm) => {
  const errors: Record<string, string> = {};
  if (!form.code) errors.code = 'Coupon code is required';
  else if (!/^[A-Z0-9]+$/i.test(form.code)) {
    errors.code = 'Must be alphanumeric (no spaces or special chars)';
  }
  if (!form.discountValue || form.discountValue <= 0) {
    errors.discountValue = 'Discount value must be greater than 0';
  } else if (form.discountType === DiscountType.PERCENTAGE && form.discountValue > 100) {
    errors.discountValue = 'Percentage discount cannot exceed 100%';
  }
  if (form.minBookingAmount <= 0) {
    errors.minBookingAmount = 'Minimum booking amount must be greater than 0';
  }
  if (!form.expiryDate) errors.expiryDate = 'Expiry date is required';
  else if (form.expiryDate <= format(new Date(), 'yyyy-MM-dd')) {
    errors.expiryDate = 'Expiry date must be in the future';
  }
  if (!form.maxUsage || form.maxUsage <= 0) errors.maxUsage = 'Max usage must be at least 1';
  if (form.maxDiscountAmount < 0) {
    errors.maxDiscountAmount = 'Max discount amount cannot be negative';
  }
  return errors;
};

export default function CouponFormPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>(
    id ? 'loading' : 'ready',
  );

  const listSearch = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = `${LIST_PATH}${listSearch}`;
  const heading = id ? 'Edit Coupon' : 'Create New Coupon';
  const breadcrumbs = [{ label: 'Coupons', href: backTo }, { label: heading }];

  useEffect(() => {
    if (!id) return;
    let active = true;
    findCoupon(id)
      .then((coupon) => {
        if (!active) return;
        if (!coupon || coupon.isDeleted) {
          setLoadState('missing');
          return;
        }
        setForm({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minBookingAmount: coupon.minBookingAmount,
          expiryDate: format(new Date(coupon.expiryDate), 'yyyy-MM-dd'),
          maxUsage: coupon.maxUsage,
          maxDiscountAmount: coupon.maxDiscountAmount || 0,
        });
        setLoadState('ready');
      })
      .catch(() => active && setLoadState('missing'));
    return () => {
      active = false;
    };
  }, [id]);

  const change = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSubmitting(true);
    const result = id
      ? await dispatch(updateCoupon({ id, data: form }))
      : await dispatch(createCoupon(form));
    setIsSubmitting(false);

    if (createCoupon.fulfilled.match(result) || updateCoupon.fulfilled.match(result)) {
      showSuccess('Success', id ? 'Coupon updated successfully' : 'Coupon created successfully');
      navigate(id ? backTo : LIST_PATH);
    } else {
      showError('Error', (result.payload as string) || 'Failed to save coupon');
    }
  };

  if (loadState !== 'ready') {
    return (
      <div className="w-full space-y-6">
        <PageHeader title={heading} breadcrumbs={breadcrumbs} backTo={backTo} />
        {loadState === 'loading' ? (
          <div className="flex justify-center py-16">
            <Loader label="Loading coupon" />
          </div>
        ) : (
          <div className="space-y-4 py-12 text-center">
            <p className="text-muted-foreground">This coupon could not be found.</p>
            <Button asChild variant="outline">
              <Link to={backTo}>Back to coupons</Link>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const numberField = (key: NumberKey, label: string, placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={`coupon-${key}`}>{label}</Label>
      <Input
        id={`coupon-${key}`}
        type="number"
        min={0}
        value={form[key] || ''}
        placeholder={placeholder}
        className={cn(errors[key] && 'border-destructive')}
        onChange={(e) => change(key, Number(e.target.value))}
      />
      {errors[key] && <p className="text-sm text-red-600">{errors[key]}</p>}
    </div>
  );

  const isPercent = form.discountType === DiscountType.PERCENTAGE;

  return (
    <FormPage
      title={heading}
      description="Enter the details for the discount coupon"
      breadcrumbs={breadcrumbs}
      backTo={backTo}
      submitLabel={isSubmitting ? 'Saving...' : id ? 'Save Changes' : 'Create Coupon'}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    >
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Code *</Label>
          <Input
            id="coupon-code"
            value={form.code}
            disabled={!!id}
            placeholder="E.g. SUMMER24"
            className={cn(errors.code && 'border-destructive')}
            onChange={(e) => change('code', e.target.value.toUpperCase())}
          />
          {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="coupon-type">Discount Type *</Label>
          <Select
            value={form.discountType}
            disabled={!!id}
            onValueChange={(value) => change('discountType', value as DiscountType)}
          >
            <SelectTrigger id="coupon-type" className="h-10">
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value={DiscountType.PERCENTAGE}>Percentage (%)</SelectItem>
              <SelectItem value={DiscountType.FIXED}>Fixed Amount (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {numberField(
          'discountValue',
          'Discount Value *',
          isPercent ? 'e.g. 10 for 10%' : 'e.g. 150 for ₹150',
        )}
        {numberField('minBookingAmount', 'Minimum Booking (₹) *', 'e.g. 500')}
        <div className="space-y-2">
          <Label htmlFor="coupon-expiry">Expiry Date *</Label>
          <Input
            id="coupon-expiry"
            type="date"
            value={form.expiryDate}
            className={cn(errors.expiryDate && 'border-destructive')}
            onChange={(e) => change('expiryDate', e.target.value)}
          />
          {errors.expiryDate && <p className="text-sm text-red-600">{errors.expiryDate}</p>}
        </div>
        {numberField('maxUsage', 'Max Usage *')}
        {numberField(
          'maxDiscountAmount',
          'Max Discount (₹)',
          isPercent ? 'Limit for percentage discount' : 'Set equal to discount value',
        )}
      </div>
    </FormPage>
  );
}
