/** Razorpay's message without the generic "Payment failed:" prefix; null when there is nothing useful. */
export const cleanReason = (reason?: string | null) =>
  reason && reason !== 'Payment failed' && reason !== 'DISMISSED'
    ? reason.replace(/^Payment failed:\s*/, '')
    : null;
