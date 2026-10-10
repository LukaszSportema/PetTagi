'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { listWarehouseStockAdmin, setWarehouseStock } from './actions/warehouse';
import {
  isWarehouseLowStock,
  WAREHOUSE_MAX_QUANTITY,
  type WarehouseKind,
} from '@/lib/warehouse-stock';
import type { WarehouseAdminRow } from './actions/warehouse';

function StockRowEditor({
  row,
  onUpdated,
}: {
  row: WarehouseAdminRow;
  onUpdated: (id: string, quantity: number) => void;
}) {
  const [draft, setDraft] = useState(row.quantity === null ? '' : String(row.quantity));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(row.quantity === null ? '' : String(row.quantity));
    setError('');
  }, [row.id, row.quantity]);

  const lowStock =
    row.quantity !== null && isWarehouseLowStock(row.kind, row.quantity);

  const commit = async () => {
    const normalized = draft.trim();
    if (normalized === '') {
      setError('Podaj liczbę.');
      return;
    }
    if (!/^\d{1,3}$/.test(normalized)) {
      setError('Max 3 cyfry (0–999).');
      return;
    }
    const qty = Number(normalized);
    if (qty > WAREHOUSE_MAX_QUANTITY) {
      setError('Max 999 szt.');
      return;
    }

    setError('');
    setIsSaving(true);
    const result = await setWarehouseStock(row.id, row.kind, qty);
    setIsSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onUpdated(row.id, qty);
  };

  return (
    <tr className={`border-t border-[#D6C7AE] ${lowStock ? 'bg-red-50' : ''}`}>
      <td className="px-4 py-3 text-sm text-[#161616] min-w-[140px]">{row.group}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {row.image ? (
            <div className="w-10 h-10 shrink-0 border border-[#D6C7AE] bg-[#EFE8DC] overflow-hidden">
              <img src={row.image} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}
          <span className="text-sm font-medium text-[#161616]">{row.label}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs uppercase tracking-wider text-[#9A9288]">
        {row.kind === 'charm' ? 'Charms' : 'Karabińczyk'}
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={draft}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, 3);
            setDraft(next);
            setError('');
          }}
          className={`w-20 rounded-none border bg-white px-2 py-1.5 text-sm text-[#161616] focus:outline-none ${
            lowStock ? 'border-red-500 bg-red-50/80' : 'border-[#D6C7AE] focus:border-[#C4A574]'
          }`}
        />
        {error ? <p className="text-[10px] text-red-500 mt-1 max-w-[8rem]">{error}</p> : null}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void commit()}
          className="border border-[#D6C7AE] hover:border-[#161616] text-[#161616] px-3 py-1.5 rounded-none text-[10px] uppercase tracking-[0.16em] font-light transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Zapis…' : 'Aktualizuj'}
        </button>
      </td>
    </tr>
  );
}

export function WarehousePanel() {
  const [rows, setRows] = useState<WarehouseAdminRow[]>([]);
  const [listError, setListError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setListError('');
    const result = await listWarehouseStockAdmin();
    setIsLoading(false);
    if (!result.ok) {
      setListError(result.message);
      setRows([]);
      return;
    }
    setRows(result.rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const charms = useMemo(() => rows.filter((r) => r.kind === 'charm'), [rows]);
  const karabiners = useMemo(() => rows.filter((r) => r.kind === 'karabiner'), [rows]);

  const handleUpdated = (id: string, quantity: number) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, quantity, updatedAt: new Date().toISOString() } : row,
      ),
    );
  };

  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie magazynu…</p>;
  }

  const renderTable = (title: string, items: WarehouseAdminRow[], kind: WarehouseKind) => (
    <div className="bg-white rounded-3xl border border-[#D6C7AE] overflow-x-auto">
      <div className="px-4 md:px-6 py-4 border-b border-[#D6C7AE] bg-[#F9F5ED]">
        <h3 className="text-lg font-serif font-light text-[#161616]">{title}</h3>
        <p className="text-xs text-[#7A736C] mt-1">
          {kind === 'charm'
            ? 'Poniżej 6 szt. — podświetlenie na czerwono.'
            : 'Poniżej 11 szt. — podświetlenie na czerwono.'}
        </p>
      </div>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#EFE8DC] text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
          <tr>
            <th className="px-4 py-3">Grupa</th>
            <th className="px-4 py-3">Produkt</th>
            <th className="px-4 py-3">Typ</th>
            <th className="px-4 py-3">Ilość</th>
            <th className="px-4 py-3 w-0"> </th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <StockRowEditor key={row.id} row={row} onUpdated={handleUpdated} />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-light text-[#161616]">Magazyn</h2>
        <p className="text-sm text-[#7A736C] mt-2 max-w-2xl">
          Stan magazynowy charmsów i karabińczyków. Przy ilości 0 produkt w konfiguratorze jest
          oznaczony jako chwilowo niedostępny. Po oznaczeniu zamówienia jako Opłacone stany
          zmniejszają się automatycznie (jednorazowo na zamówienie).
        </p>
      </div>

      {listError && <p className="text-sm text-red-500">{listError}</p>}

      {renderTable('Charmsy', charms, 'charm')}
      {renderTable('Karabińczyki', karabiners, 'karabiner')}
    </div>
  );
}
