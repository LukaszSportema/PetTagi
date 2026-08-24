'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

export type SelectedPickupPoint = {
  code: string;
  name: string;
  address: string;
};

type ApiPoint = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  street: string;
  city: string;
  postcode: string;
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
        { once: true },
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

const formatPointAddress = (point: ApiPoint) => {
  const line = [point.street, [point.postcode, point.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return line || point.name;
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

export default function FurgonetkaMap({
  city,
  street,
  postcode,
  onSelect,
}: {
  city?: string;
  street?: string;
  postcode?: string;
  onSelect: (point: SelectedPickupPoint) => void;
}) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [query, setQuery] = useState([street, postcode, city].filter((value) => value?.trim()).join(', '));
  const [points, setPoints] = useState<ApiPoint[]>([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPoints = async (params: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/furgonetka-points?${params}`);
      const data = (await res.json()) as { items?: ApiPoint[] };
      const items = data.items ?? [];
      setPoints(items);
      if (!items.length) setError('Nie znaleziono punktów InPost. Spróbuj innego adresu.');
      return items;
    } catch {
      setError('Nie udało się pobrać punktów Furgonetki.');
      setPoints([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const selectPoint = (item: ApiPoint) => {
    setSelectedCode(item.code);
    onSelectRef.current({
      code: item.code,
      name: item.name,
      address: formatPointAddress(item),
    });
    mapRef.current?.setView([item.latitude, item.longitude], 16);
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

        const initialQuery = [street, postcode, city].filter((value) => value?.trim()).join(', ');
        if (initialQuery) {
          await fetchPoints(`q=${encodeURIComponent(initialQuery)}`);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!cancelled) loadAround(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              if (!cancelled) loadAround(WARSAW[0], WARSAW[1], 12);
            },
            { timeout: 2500, maximumAge: 60000 },
          );
        } else {
          await loadAround(WARSAW[0], WARSAW[1], 12);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError('Nie udało się wyświetlić mapy punktów InPost.');
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
      const marker = L.marker([item.latitude, item.longitude], {
        icon: L.divIcon({
          className: '',
          html: markerHtml(item.code === selectedCode),
          iconSize: item.code === selectedCode ? [22, 22] : [16, 16],
          iconAnchor: item.code === selectedCode ? [11, 11] : [8, 8],
        }),
      }).addTo(map);
      marker.on('click', () => selectPoint(item));
      markersRef.current.push(marker);
    });
  }, [points, selectedCode]);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || points.length === 0) return;
    const latlngs = points.map((item) => [item.latitude, item.longitude] as [number, number]);
    if (latlngs.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
    } else {
      map.setView(latlngs[0], 15);
    }
    setTimeout(() => map.invalidateSize(), 50);
  }, [points]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const timeout = setTimeout(() => {
      fetchPoints(`q=${encodeURIComponent(value)}`);
    }, 280);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = query.trim();
    if (!value) return;
    await fetchPoints(`q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="w-full h-[min(70vh,480px)] md:h-[580px] flex flex-col bg-white">
      <form onSubmit={handleSearch} className="p-3 border-b border-[#D6C7AE]">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Miasto, adres lub kod"
            className="flex-1 min-w-0 rounded-none border border-[#D6C7AE] px-4 py-2 text-base md:text-sm focus:outline-none focus:border-[#C4A574]"
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-4 md:px-5 py-2 rounded-none text-[11px] uppercase tracking-[0.16em] md:tracking-[0.22em] font-light shrink-0 transition-colors duration-300"
          >
            Szukaj
          </button>
        </div>
      </form>

      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        <div className="relative flex-[1.6] min-h-[200px] min-w-0">
          <div ref={mapElRef} className="absolute inset-0" />
          {loading && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/80 text-sm text-[#6E635B]">
              Ładowanie punktów InPost...
            </div>
          )}
        </div>
        <ul className="h-36 md:h-auto w-full md:w-56 lg:w-72 overflow-y-auto border-t md:border-t-0 md:border-l border-[#D6C7AE] bg-white shrink-0">
          {error && !points.length && <li className="p-3 text-xs text-red-500">{error}</li>}
          {points.map((item) => {
            const isSelected = item.code === selectedCode;
            return (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => selectPoint(item)}
                  className={`w-full text-left px-3 py-2.5 border-b border-[#F3EFEA] ${
                    isSelected ? 'bg-[#F4EFE6]' : 'hover:bg-[#FBF9F5]'
                  }`}
                >
                  <p className="text-sm font-bold text-[#2C2623]">{item.code}</p>
                  <p className="text-xs text-[#6E635B]">{formatPointAddress(item)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
