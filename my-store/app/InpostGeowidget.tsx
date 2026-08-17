'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

export type InpostPoint = {
  name: string;
  address?: {
    line1?: string;
    city?: string;
    post_code?: string;
  };
  location_description?: string;
};

type ApiPoint = {
  name: string;
  location?: { latitude: number; longitude: number };
  location_description?: string | null;
  address?: { line1?: string };
  address_details?: { city?: string; post_code?: string };
};

type AddressSuggestion = {
  type: 'address';
  label: string;
  lat: number;
  lng: number;
};

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  remove: () => void;
  invalidateSize: () => void;
  fitBounds: (bounds: unknown, options?: { padding?: [number, number] }) => void;
  removeLayer: (layer: unknown) => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
  on: (event: string, handler: () => void) => LeafletMarker;
};

type LeafletApi = {
  map: (el: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  marker: (latlng: [number, number], options?: Record<string, unknown>) => LeafletMarker;
  divIcon: (options: Record<string, unknown>) => unknown;
  latLngBounds: (points: [number, number][]) => unknown;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

let leafletPromise: Promise<LeafletApi> | null = null;
const WARSAW: [number, number] = [52.2297, 21.0122];

const loadLeaflet = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet', 'true');
      document.head.appendChild(link);
    }

    const existing = document.querySelector('script[data-leaflet]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        'load',
        () => (window.L ? resolve(window.L) : reject(new Error('Leaflet niedostępny'))),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.setAttribute('data-leaflet', 'true');
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error('Leaflet niedostępny')));
    script.onerror = () => reject(new Error('Nie udało się załadować mapy'));
    document.body.appendChild(script);
  });

  return leafletPromise;
};

const toWidgetPoint = (item: ApiPoint): InpostPoint => ({
  name: item.name,
  address: {
    line1: item.address?.line1,
    city: item.address_details?.city,
    post_code: item.address_details?.post_code,
  },
  location_description: item.location_description ?? undefined,
});

export const formatInpostPointAddress = (point: InpostPoint) => {
  const line = point.address?.line1 ?? '';
  const code = point.address?.post_code ?? '';
  const city = point.address?.city ?? '';
  return [line, [code, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
};

const markerHtml = (selected: boolean) =>
  `<div style="width:${selected ? 22 : 16}px;height:${selected ? 22 : 16}px;background:#FFCC00;border:2px solid #111;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`;

const waitForSize = (el: HTMLElement) =>
  new Promise<void>((resolve) => {
    if (el.offsetWidth > 40 && el.offsetHeight > 40) {
      resolve();
      return;
    }
    const started = Date.now();
    const tick = () => {
      if (el.offsetWidth > 40 && el.offsetHeight > 40 || Date.now() - started > 2500) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

export default function InpostGeowidget({
  onSelect,
}: {
  onSelect: (point: InpostPoint) => void;
}) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [points, setPoints] = useState<ApiPoint[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState('');

  const fetchPoints = async (params: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/inpost-points?${params}`);
      const data = (await res.json()) as { items?: ApiPoint[] };
      const items = (data.items ?? []).filter((item) => item.location?.latitude && item.location?.longitude);
      setPoints(items);
      if (!items.length) setError('Nie znaleziono paczkomatów. Spróbuj innego adresu.');
      return items;
    } catch {
      setError('Nie udało się pobrać listy paczkomatów.');
      setPoints([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const selectPoint = (item: ApiPoint) => {
    setSelectedName(item.name);
    setShowSuggestions(false);
    onSelectRef.current(toWidgetPoint(item));
    const map = mapRef.current;
    if (map && item.location) {
      map.setView([item.location.latitude, item.location.longitude], 16);
    }
  };

  const loadAround = async (lat: number, lng: number, zoom = 14) => {
    mapRef.current?.setView([lat, lng], zoom);
    await fetchPoints(`lat=${lat}&lng=${lng}`);
  };

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const start = async () => {
      try {
        const L = await loadLeaflet();
        const el = mapElRef.current;
        if (cancelled || !el) return;
        await waitForSize(el);
        if (cancelled) return;

        delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
        const map = L.map(el, { scrollWheelZoom: true });
        map.setView(WARSAW, 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
        map.invalidateSize();
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(el);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!cancelled) loadAround(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              if (!cancelled) loadAround(WARSAW[0], WARSAW[1], 12);
            },
            { timeout: 2500, maximumAge: 60000 }
          );
        } else {
          await loadAround(WARSAW[0], WARSAW[1], 12);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError('Nie udało się wyświetlić mapy paczkomatów.');
        }
      }
    };

    start();
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      const el = mapElRef.current;
      if (el) delete (el as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;

    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    points.forEach((item) => {
      if (!item.location) return;
      const latlng: [number, number] = [item.location.latitude, item.location.longitude];
      const marker = L.marker(latlng, {
        icon: L.divIcon({
          className: '',
          html: markerHtml(item.name === selectedName),
          iconSize: item.name === selectedName ? [22, 22] : [16, 16],
          iconAnchor: item.name === selectedName ? [11, 11] : [8, 8],
        }),
      }).addTo(map);
      marker.on('click', () => selectPoint(item));
      markersRef.current.push(marker);
    });
  }, [points, selectedName]);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || points.length === 0) return;
    const latlngs = points
      .filter((item) => item.location)
      .map((item) => [item.location!.latitude, item.location!.longitude] as [number, number]);
    if (latlngs.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 15);
    }
    setTimeout(() => map.invalidateSize(), 50);
  }, [points]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await fetch(`/api/inpost-points?suggest=1&q=${encodeURIComponent(value)}`);
        const data = (await res.json()) as { items?: AddressSuggestion[] };
        setSuggestions(data.items ?? []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggesting(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = query.trim();
    if (!value) return;
    setShowSuggestions(false);
    if (suggestions[0]) {
      await loadAround(suggestions[0].lat, suggestions[0].lng);
      return;
    }
    await fetchPoints(`q=${encodeURIComponent(value)}`);
  };

  const pickSuggestion = async (item: AddressSuggestion) => {
    setQuery(item.label);
    setShowSuggestions(false);
    setSuggestions([]);
    await loadAround(item.lat, item.lng);
  };

  return (
    <div className="w-full h-[580px] flex flex-col bg-white">
      <form onSubmit={handleSearch} className="p-3 border-b border-[#E8E2D8] space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length) setShowSuggestions(true);
            }}
            placeholder="Wpisz adres, miasto lub kod pocztowy"
            className="flex-1 rounded-full border border-[#E8E2D8] px-4 py-2 text-sm focus:outline-none focus:border-[#4A90E2]"
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-[#FFCC00] hover:bg-[#f0c000] text-black px-4 py-2 rounded-full text-sm font-bold shrink-0"
          >
            Szukaj
          </button>
        </div>
        {showSuggestions && (suggesting || suggestions.length > 0) && (
          <ul className="border border-[#E8E2D8] rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white">
            {suggesting && !suggestions.length && (
              <li className="px-4 py-2 text-sm text-[#9A918A]">Szukam adresów...</li>
            )}
            {suggestions.map((item) => (
              <li key={`${item.label}-${item.lat}-${item.lng}`}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(item)}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#2C2623] hover:bg-[#FBF9F5] border-b border-[#F3EFEA] last:border-b-0"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="flex-1 flex min-h-0">
        <div className="relative flex-[1.6] min-w-0">
          <div ref={mapElRef} className="absolute inset-0" />
          {loading && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 text-sm text-[#6E635B]">
              Ładowanie mapy paczkomatów...
            </div>
          )}
        </div>
        <ul className="w-56 md:w-72 overflow-y-auto border-l border-[#E8E2D8] bg-white">
          {error && !points.length && <li className="p-3 text-xs text-red-500">{error}</li>}
          {points.map((item) => {
            const isSelected = item.name === selectedName;
            return (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => selectPoint(item)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#F3EFEA] ${
                    isSelected ? 'bg-[#FFF6CC]' : 'hover:bg-[#FBF9F5]'
                  }`}
                >
                  <p className="text-sm font-bold text-[#2C2623]">{item.name}</p>
                  <p className="text-xs text-[#6E635B]">
                    {item.address?.line1}
                    {item.address_details?.city ? `, ${item.address_details.city}` : ''}
                  </p>
                  {item.location_description && (
                    <p className="text-xs text-[#9A918A]">{item.location_description}</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
