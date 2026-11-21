import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { MapLocation } from '@/features/branch/branch.types';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER: [number, number] = [19.076, 72.8777];
const GEOCODER = 'https://nominatim.openstreetmap.org';

interface BranchMapFieldProps {
  value?: MapLocation;
  error?: string;
  onChange: (location: MapLocation) => void;
  /** A place name was found for the chosen point */
  onAddressFound: (address: string) => void;
  onUseAddress: (address: string) => void;
}

function MapEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

/** Choose a branch location directly on the form page. */
export function BranchMapField({
  value,
  error,
  onChange,
  onAddressFound,
  onUseAddress,
}: BranchMapFieldProps) {
  const [query, setQuery] = useState('');
  const [foundAddress, setFoundAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const lookupId = useRef(0);
  const position: [number, number] = value ? [value.latitude, value.longitude] : DEFAULT_CENTER;

  const showAddress = useCallback(
    (address: string) => {
      setFoundAddress(address);
      onAddressFound(address);
    },
    [onAddressFound],
  );

  const pick = useCallback(
    async (latitude: number, longitude: number) => {
      onChange({ latitude, longitude });
      setNotice(null);
      const id = ++lookupId.current;
      try {
        const response = await fetch(
          `${GEOCODER}/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        );
        const data = await response.json();
        if (id === lookupId.current && data.display_name) showAddress(data.display_name);
      } catch {
        if (id === lookupId.current) setFoundAddress('');
      }
    },
    [onChange, showAddress],
  );

  const search = async () => {
    const text = query.trim();
    if (!text || isSearching) return;
    setIsSearching(true);
    setNotice(null);
    const id = ++lookupId.current;
    try {
      const response = await fetch(
        `${GEOCODER}/search?format=json&q=${encodeURIComponent(text)}&limit=1`,
      );
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'Too many searches. Please wait a moment.'
            : 'Map search is unavailable right now.',
        );
      }
      const [result] = await response.json();
      if (id !== lookupId.current) return;
      if (!result) {
        setNotice('No results found for this place.');
        return;
      }
      onChange({ latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) });
      showAddress(result.display_name);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not search for this place.');
    } finally {
      setIsSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setNotice('Your browser cannot share its location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => pick(coords.latitude, coords.longitude),
      () => setNotice('Could not get your location. Check the browser permission.'),
    );
  };

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      search();
    }
  };

  const coordinate = (key: 'latitude' | 'longitude', limit: number) => (
    <div className="space-y-2">
      <Label htmlFor={`branch-${key}`} className="capitalize">
        {key}
      </Label>
      <Input
        id={`branch-${key}`}
        type="number"
        step="0.0001"
        min={-limit}
        max={limit}
        value={value?.[key] ?? ''}
        onChange={(event) => {
          const number = parseFloat(event.target.value);
          if (Number.isNaN(number) || Math.abs(number) > limit) return;
          onChange({
            latitude: key === 'latitude' ? number : position[0],
            longitude: key === 'longitude' ? number : position[1],
          });
        }}
        onBlur={() => value && pick(value.latitude, value.longitude)}
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Location *</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a place, tap the map, or drag the pin
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          aria-label="Search for a place"
          placeholder="Search for a place..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onSearchKey}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={isSearching}
          onClick={search}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      {notice && (
        <p role="alert" className="text-sm text-red-600">
          {notice}
        </p>
      )}

      <div className="relative z-0 h-64 overflow-hidden rounded-lg border sm:h-96 xl:h-[28rem]">
        <MapContainer
          center={position}
          zoom={13}
          className="size-full"
          scrollWheelZoom={false}
          dragging={!L.Browser.mobile}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents onPick={pick} />
          <MapCenter center={position} />
          {value && (
            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const point = (event.target as L.Marker).getLatLng();
                  pick(point.lat, point.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {foundAddress && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-words text-sm">{foundAddress}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => onUseAddress(foundAddress)}
          >
            Use this address
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {coordinate('latitude', 90)}
        {coordinate('longitude', 180)}
      </div>
      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={useMyLocation}>
        Use My Location
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
