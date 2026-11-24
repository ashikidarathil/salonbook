/** Rupees the Indian way: ₹1,000 and ₹1,25,000. */
export const formatRupees = (amount?: number | null) => `₹${(amount ?? 0).toLocaleString('en-IN')}`;
