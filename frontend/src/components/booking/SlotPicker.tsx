import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { StepHeader, type StepInfo } from '@/components/common/StepHeader';
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
  /** Skip the stylist step: the booking keeps its stylist (used when rescheduling). */
  fixedStylist?: boolean;
  onConfirm: (selection: SlotSelection) => void;
}

type StepKey = 'date' | 'stylist' | 'time';

const UNAVAILABLE_DAY = ['OFF_DAY', 'NON_WORKING', 'NO_SCHEDULE', 'HOLIDAY'];
const BOOKABLE = ['AVAILABLE', 'SPECIAL'];

/** Choose a date, then a stylist, then a time, one step at a time, with Back to change an earlier one. */
export function SlotPicker({
  branchId,
  services,
  stylists,
  initialStylistId,
  submitLabel,
  isSubmitting,
  cancelTo,
  children,
  fixedStylist = false,
  onConfirm,
}: SlotPickerProps) {
  const order: StepKey[] = fixedStylist ? ['date', 'time'] : ['date', 'stylist', 'time'];
  const [stepIndex, setStepIndex] = useState(0);
  const step = order[stepIndex];
  const topRef = useRef<HTMLDivElement>(null);
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

  const stylistName = stylists.find((item) => item.userId === stylistId)?.name;
  const canLeave: Record<StepKey, boolean> = {
    date: true,
    stylist: !!stylistId,
    time: !!selectedSlot,
  };

  const goTo = (index: number) => {
    setStepIndex(index);
    // On phones the next step starts below the fold; bring the picker back into view
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const STEP_INFO: Record<StepKey, StepInfo> = {
    date: { label: 'Date', value: format(date, 'd MMM') },
    // First name keeps the step short enough for phones
    stylist: { label: 'Stylist', value: stylistName?.split(' ')[0] },
    time: { label: 'Time', value: selectedSlot?.startTime },
  };
  const isLast = stepIndex === order.length - 1;
  const nextKey = order[stepIndex + 1];

  return (
    <div ref={topRef} className="mx-auto w-full max-w-3xl scroll-mt-24">
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="!p-0">
          {/* Steps: done ones can be tapped to go back */}
          <StepHeader
            steps={order.map((key) => STEP_INFO[key])}
            current={stepIndex + 1}
            onSelect={(n) => goTo(n - 1)}
          />

          <div className="p-4 sm:p-6">
            {step === 'date' && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Icon icon="solar:calendar-bold" className="text-primary" />
                  Choose a date
                </h2>
                <div className="flex justify-center">
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
              </section>
            )}

            {step === 'stylist' && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 font-semibold">
                  <Icon icon="solar:user-bold" className="text-primary" />
                  Choose a stylist
                </h2>
                {stylists.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No stylists are available for this service at this branch.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
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
                          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {stylist.profilePicture ? (
                              <img
                                src={stylist.profilePicture}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <Icon
                                icon="solar:user-bold"
                                className="size-5 text-muted-foreground/40"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {stylist.name}
                            </span>
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
              </section>
            )}

            {step === 'time' && (
              <section className="space-y-4">
                <div>
                  <h2 className="flex items-center gap-2 font-semibold">
                    <Icon icon="solar:clock-circle-bold" className="text-primary" />
                    Choose a time
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(date, 'EEEE, d MMMM')} with {stylistName}
                  </p>
                </div>
                <div className="min-h-40">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                      <Loader size="sm" label="Finding slots" />
                    </div>
                  ) : failed ? (
                    <p role="alert" className="py-10 text-center text-sm text-red-600">
                      Could not load times. Go back and try another date.
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
                      No times available. Go back and try another date or stylist.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
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
                </div>
              </section>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-muted/20 p-4 sm:px-6">
            {stepIndex === 0 ? (
              <Button type="button" variant="ghost" className="h-11" asChild>
                <Link to={cancelTo}>Cancel</Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-1"
                onClick={() => goTo(stepIndex - 1)}
              >
                <Icon icon="solar:alt-arrow-left-linear" className="size-4" />
                Back
              </Button>
            )}
            {!isLast ? (
              <Button
                type="button"
                className="h-11 gap-1 font-semibold"
                disabled={!canLeave[step]}
                onClick={() => goTo(stepIndex + 1)}
              >
                {`Next: ${STEP_INFO[nextKey].label.toLowerCase()}`}
                <Icon icon="solar:alt-arrow-right-linear" className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="h-11 font-bold"
                disabled={!selectedSlot || !stylistId || isSubmitting}
                onClick={confirm}
              >
                {isSubmitting ? 'Saving...' : submitLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
