// Booking URLs use the readable booking number ("BK-7F3A21"); old links with the id still work.

/** The part of a URL that identifies a booking. */
export const bookingRef = (booking: { id: string; bookingNumber?: string }): string =>
  booking.bookingNumber || booking.id;

/** Whether a loaded booking is the one the URL refers to (by id or booking number). */
export const matchesBookingRef = (
  booking: { id: string; bookingNumber?: string } | null | undefined,
  ref: string | undefined,
): boolean =>
  Boolean(
    booking &&
    ref &&
    (booking.id === ref || booking.bookingNumber?.toUpperCase() === ref.toUpperCase()),
  );
