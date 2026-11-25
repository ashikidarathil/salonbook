import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

interface ResultHeroProps {
  outcome: 'success' | 'failure';
  title: string;
  message: string;
  /** Why a payment failed, as the payment provider reported it. */
  reason?: string | null;
}

/** The big tick or cross with a title, shared by every payment result page. */
export function ResultHero({ outcome, title, message, reason }: ResultHeroProps) {
  const success = outcome === 'success';
  return (
    <div className="text-center">
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
        className={cn(
          'mx-auto flex size-20 items-center justify-center rounded-full ring-8',
          success ? 'bg-emerald-50 ring-emerald-50/50' : 'bg-rose-50 ring-rose-50/50',
        )}
      >
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-full shadow-lg',
            success ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200',
          )}
        >
          <Icon
            icon={success ? 'solar:check-read-linear' : 'solar:close-circle-linear'}
            className="size-8 text-white"
          />
        </span>
      </motion.span>
      <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      {reason && (
        <p className="mx-auto mt-3 max-w-md rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
          Reason: {reason}
        </p>
      )}
    </div>
  );
}

/** Same fade-up entrance for every result page body. */
export function ResultBody({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="mx-auto w-full max-w-xl space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
