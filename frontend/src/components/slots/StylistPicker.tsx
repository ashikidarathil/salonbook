import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { StylistListItem } from '@/features/stylistInvite/stylistInvite.types';

interface StylistPickerProps {
  stylists: StylistListItem[];
  /** A stylist's user id, or 'ALL' */
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const stylistLabel = (stylist: StylistListItem) => stylist.name || stylist.email || 'Stylist';

/** A stylist dropdown with a search box. */
export function StylistPicker({ stylists, value, disabled, onChange }: StylistPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = stylists.find((stylist) => stylist.userId === value);
  const matches = stylists.filter((stylist) =>
    stylistLabel(stylist).toLowerCase().includes(query.trim().toLowerCase()),
  );
  const options = [{ id: 'ALL', label: 'All Stylists' }].concat(
    matches.map((stylist) => ({ id: stylist.userId, label: stylistLabel(stylist) })),
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label="Filter by stylist"
          className="h-10 w-full min-w-0 justify-between gap-2 px-3 font-normal"
        >
          <span className="truncate">{selected ? stylistLabel(selected) : 'All Stylists'}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-56 bg-white p-2"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            aria-label="Search stylists"
            placeholder="Search stylists..."
            className="h-10 pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <ul className="mt-2 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted',
                  value === option.id && 'font-semibold text-primary',
                )}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <span className="min-w-0 break-words">{option.label}</span>
                {value === option.id && <Check className="size-4 shrink-0" />}
              </button>
            </li>
          ))}
          {!matches.length && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No stylists found</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
