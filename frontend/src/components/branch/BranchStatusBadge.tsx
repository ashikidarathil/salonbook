import { Badge } from '@/components/ui/badge';

/** Soft Active or Disabled badge for a branch's categories and services. */
export function BranchStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? 'shrink-0 border-green-200 bg-green-50 text-green-700'
          : 'shrink-0 border-red-200 bg-red-50 text-red-700'
      }
    >
      {active ? 'Active' : 'Disabled'}
    </Badge>
  );
}
