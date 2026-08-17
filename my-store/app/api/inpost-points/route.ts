import { NextRequest, NextResponse } from 'next/server';

type InpostPoint = {
  name: string;
  location?: { latitude: number; longitude: number };
  location_description?: string | null;
  address?: { line1?: string; line2?: string };
  address_details?: { city?: string; post_code?: string; street?: string; building_number?: string };
};

const POINTS_URL = 'https://api-shipx-pl.easypack24.net/v1/points';

const titleCasePl = (value: string) =>
  value
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part || part === '-' || /^\s+$/.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase('pl-PL') + part.slice(1).toLocaleLowerCase('pl-PL');
    })
    .join('');

const fetchPoints = async (params: URLSearchParams) => {
  const url = new URL(POINTS_URL);
  params.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set('type', 'parcel_locker');
  url.searchParams.set('status', 'Operating');
  if (!url.searchParams.has('per_page')) url.searchParams.set('per_page', '50');

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return { items: [] as InpostPoint[] };
  return res.json() as Promise<{ items: InpostPoint[] }>;
};

const geocodePoland = async (query: string, limit = 1) => {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'pl');
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'PetTagi locker-map',
    },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  }[];
};

const formatNominatimLabel = (item: { display_name: string; address?: Record<string, string> }) => {
  const address = item.address ?? {};
  const street = [address.road, address.house_number].filter(Boolean).join(' ');
  const city = address.city || address.town || address.village || address.municipality || '';
  const code = address.postcode || '';
  const label = [street, city, code].filter(Boolean).join(', ');
  return label || item.display_name.split(',').slice(0, 3).join(',').trim();
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q')?.trim() ?? '';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const suggest = searchParams.get('suggest') === '1';

  try {
    if (suggest && query.length >= 2) {
      const places = await geocodePoland(query, 6);
      const suggestions = places.map((item) => ({
        type: 'address' as const,
        label: formatNominatimLabel(item),
        lat: Number(item.lat),
        lng: Number(item.lon),
      }));
      return NextResponse.json({ items: suggestions });
    }

    if (lat && lng) {
      const data = await fetchPoints(
        new URLSearchParams({
          relative_point: `${lat},${lng}`,
          max_distance: searchParams.get('max_distance') ?? '15000',
        })
      );
      return NextResponse.json(data);
    }

    if (query) {
      const compact = query.replace(/\s/g, '');
      const isPostal = /^\d{2}-?\d{3}$/.test(compact);
      const isLockerName = /^[A-Za-z]{3}\d/.test(compact);

      if (isPostal) {
        const postCode = compact.includes('-') ? compact : `${compact.slice(0, 2)}-${compact.slice(2)}`;
        const data = await fetchPoints(new URLSearchParams({ post_code: postCode }));
        if (data.items?.length) return NextResponse.json(data);
      } else if (isLockerName) {
        const data = await fetchPoints(new URLSearchParams({ name: compact.toUpperCase() }));
        if (data.items?.length) return NextResponse.json(data);
      } else {
        const cityData = await fetchPoints(new URLSearchParams({ city: titleCasePl(query) }));
        if (cityData.items?.length) return NextResponse.json(cityData);
      }

      const geo = await geocodePoland(query, 1);
      if (geo[0]) {
        const data = await fetchPoints(
          new URLSearchParams({
            relative_point: `${geo[0].lat},${geo[0].lon}`,
            max_distance: '15000',
          })
        );
        return NextResponse.json(data);
      }

      return NextResponse.json({ items: [] });
    }

    const data = await fetchPoints(
      new URLSearchParams({
        relative_point: '52.2297,21.0122',
        max_distance: '15000',
      })
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
