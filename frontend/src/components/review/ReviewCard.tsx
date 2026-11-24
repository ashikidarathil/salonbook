import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { Star, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Review } from '@/features/review/review.types';
import { cn } from '@/lib/utils';

/** One customer review: who, stars, when, and what they said. */
export function ReviewCard({ review, actions }: { review: Review; actions?: ReactNode }) {
  return (
    <li
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5',
        review.isDeleted && 'bg-muted/30',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0 border">
          <AvatarImage src={review.userId?.profilePicture} />
          <AvatarFallback>
            <User className="size-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 break-words font-semibold">
              {review.userId?.name || 'Anonymous User'}
            </p>
            {review.isDeleted && (
              <Badge variant="destructive" className="shrink-0">
                Deleted
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex" aria-label={`${review.rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'size-4',
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30',
                  )}
                />
              ))}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(review.createdAt), 'd MMM yyyy')}
            </span>
          </div>
        </div>
      </div>
      {review.comment ? (
        <p className="break-words border-l-2 border-muted pl-3 text-sm text-muted-foreground">
          “{review.comment}”
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No comment</p>
      )}
      {actions}
    </li>
  );
}
