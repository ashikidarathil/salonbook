import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import type { SlotItem } from '@/features/slot/slot.types';
import { slotService } from '@/services/slot.service';

export interface PickerService {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
}

export interface PickerStylist {
  userId: string;
  name: string;
  specialization?: string;
  profilePicture?: string;
}

export interface SlotSelection {
  stylistId: string;
  stylistName: string;
  date: string;
  startTime: string;
  slotId: string;
}

interface SlotPickerProps {
  branchId: string;
  services: PickerService[];
  stylists: PickerStylist[];
  initialStylistId?: string;
  submitLabel: string;
  isSubmitting?: boolean;
  cancelTo: string;
  /** Extra fields shown above the confirm button */
  children?: ReactNode;
  onConfirm: (selection: SlotSelection) => void;
}

const UNAVAILABLE_DAY = ['OFF_DAY', 'NON_WORKING', 'NO_SCHEDULE', 'HOLIDAY'];
const BOOKABLE = ['AVAILABLE', 'SPECIAL'];

/** Choose a date, stylist and time directly on a page. */
export function SlotPicker({
  branchId,
  services,
  stylists,
  initialStylistId,
  submitLabel,
  isSubmitting,
  cancelTo,
  children,
  onConfirm,
}: SlotPickerProps) {
  const [date, setDate] = useState(() => new Date());
  const [chosenStylistId, setChosenStylistId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [result, setResult] = useState<{ key: string; slots: SlotItem[]; failed: boolean } | null>(
    null,
  );

  const stylistId =
    chosenStylistId || initialStylistId || (stylists.length === 1 ? stylists[0].userId : '');
  const dateValue = format(date, 'yyyy-MM-dd');
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const servicesTotal = services.reduce((sum, service) => sum + service.price, 0);
  const requestKey = `${branchId}|${stylistId}|${dateValue}|${totalDuration}`;

  useEffect(() => {
    if (!stylistId || !branchId) return;
    let active = true;
    slotService
      .listAvailableSlots({ branchId, stylistId, date: dateValue, duration: totalDuration })
      .then((response) => {
        if (active) {
          setResult({
            key: requestKey,
            slots: response.data.success ? response.data.data : [],
            failed: !response.data.success,
          });
        }
      })
      .catch(() => active && setResult({ key: requestKey, slots: [], failed: true }));
    return () => {
      active = false;
    };
  }, [branchId, stylistId, dateValue, totalDuration, requestKey]);

  const isLoading = !!stylistId && result?.key !== requestKey;
  const slots = result?.key === requestKey ? result.slots : [];
  const failed = result?.key === requestKey && result.failed;
  const closedDay = slots.find((slot) => UNAVAILABLE_DAY.includes(slot.status));
  const visibleSlots = slots.filter(
    (slot) =>
      (slot.startTime !== '00:00' || slot.status === 'AVAILABLE') && slot.status !== 'HOLIDAY',
  );
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
  const total = selectedSlot?.price && selectedSlot.price > 0 ? selectedSlot.price : servicesTotal;

  const confirm = () => {
    if (!selectedSlot || !stylistId) return;
    onConfirm({
      stylistId,
      stylistName: stylists.find((item) => item.userId === stylistId)?.name ?? '',
      date: dateValue,
      startTime: selectedSlot.startTime,
      slotId: selectedSlot.id,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="min-w-0">
        <CardContent className="space-y-3 p-4 !pt-4 sm:p-6 sm:!pt-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon icon="solar:calendar-bold" className="text-primary" />
            1. Choose Date
          </h2>
          <div className="flex justify-center overflow-x-auto">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(day) => {
                if (!day) return;
                setDate(day);
                setSelectedSlotId('');
              }}
              className="rounded-md border-none p-0"
              disabled={(day) => isBefore(day, startOfDay(new Date()))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardContent className="space-y-3 p-4 !pt-4 sm:p-6 sm:!pt-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon icon="solar:user-bold" className="text-primary" />
            2. Choose Stylist
          </h2>
          {stylists.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No stylists are available for this service at this branch.
            </p>
          ) : (
            <div className="grid max-h-96 gap-2 overflow-y-auto">
              {stylists.map((stylist) => {
                const isSelected = stylistId === stylist.userId;
                return (
                  <button
                    key={stylist.userId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setChosenStylistId(stylist.userId);
                      setSelectedSlotId('');
                    }}
                    className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border/60 bg-background hover:border-primary/40'
                    }`}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {stylist.profilePicture ? (
                        <img
                          src={stylist.profilePicture}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Icon icon="solar:user-bold" className="size-5 text-muted-foreground/40" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{stylist.name}</span>
                      {stylist.specialization && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {stylist.specialization}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Icon
                        icon="solar:check-circle-bold"
                        className="size-5 shrink-0 text-primary"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardContent className="flex h-full flex-col gap-4 p-4 !pt-4 sm:p-6 sm:!pt-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon icon="solar:clock-circle-bold" className="text-primary" />
            3. Choose Time
          </h2>

          <div className="min-h-40 flex-1">
            {!stylistId ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Choose a stylist to see available times.
              </p>
            ) : isLoading ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader size="sm" label="Finding slots" />
                Finding slots...
              </div>
            ) : failed ? (
              <p role="alert" className="py-10 text-center text-sm text-red-600">
                Could not load times. Try another date.
              </p>
            ) : closedDay ? (
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-6 text-center">
                <p className="font-semibold text-red-600">
                  {closedDay.status === 'HOLIDAY'
                    ? 'Salon Holiday'
                    : closedDay.status === 'OFF_DAY'
                      ? 'On Leave'
                      : 'Not Available'}
                </p>
                <p className="mt-1 text-sm text-red-500/80">
                  {closedDay.status === 'HOLIDAY'
                    ? closedDay.note || 'The salon is closed on this day.'
                    : 'The stylist is not available on this date.'}
                </p>
              </div>
            ) : visibleSlots.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No times available. Try another date or stylist.
              </p>
            ) : (
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto p-0.5 lg:grid-cols-2 xl:grid-cols-3">
                {visibleSlots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={!BOOKABLE.includes(slot.status)}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`min-h-11 rounded-lg border p-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                          : 'border-border/60 bg-background hover:border-primary/40'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            {children}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Services</span>
              <span>{services.length}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <Button
              type="button"
              className="h-12 w-full font-bold"
              disabled={!selectedSlot || !stylistId || isSubmitting}
              onClick={confirm}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link to={cancelTo}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
