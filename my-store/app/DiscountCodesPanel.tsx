'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  deleteDiscountCode,
  generateDiscountCode,
  listDiscountCodes,
  updateDiscountCodeComment,
} from './actions/discount-codes';
import { formatOrderDate } from '@/lib/order-display';
import {
  DISCOUNT_COMMENT_MAX,
  DISCOUNT_LABEL_MAX,
  DISCOUNT_PERCENTS,
  DISCOUNT_VALIDITY_MONTHS,
  discountCodeStatus,
  discountCodeStatusLabel,
  type DiscountCodeRecord,
  type DiscountPercent,
  type DiscountValidityMonths,
} from '@/lib/discount-codes';

function DiscountCommentField({
  id,
  value,
  onSaved,
}: {
  id: string;
  value: string | null;
  onSaved: (id: string, comment: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(value ?? '');
    setError('');
  }, [value, id]);

  const commit = async () => {
    const normalized = draft.trim().slice(0, DISCOUNT_COMMENT_MAX);
    const previous = (value ?? '').trim();
    if (normalized === previous) return;

    const result = await updateDiscountCodeComment(id, normalized);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSaved(id, normalized || null);
    setError('');
  };

  return (
    <div className="min-w-[120px] max-w-[160px]" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        maxLength={DISCOUNT_COMMENT_MAX}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value.slice(0, DISCOUNT_COMMENT_MAX));
          setError('');
        }}
        onBlur={() => void commit()}
        onKeyDown={(e) => e.stopPropagation()}
        className="w-full rounded-none border border-[#D6C7AE] bg-white px-2 py-1.5 text-xs text-[#161616] focus:outline-none focus:border-[#C4A574]"
        placeholder="Komentarz…"
      />
      <p className="text-[10px] text-[#9A9288] mt-0.5 tabular-nums">{draft.length}/{DISCOUNT_COMMENT_MAX}</p>
      {error ? <p className="text-[10px] text-red-500">{error}</p> : null}
    </div>
  );
}

export function DiscountCodesPanel() {
  const [codes, setCodes] = useState<DiscountCodeRecord[]>([]);
  const [listError, setListError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [label, setLabel] = useState('');
  const [validMonths, setValidMonths] = useState<DiscountValidityMonths>(1);
  const [percent, setPercent] = useState<DiscountPercent>(5);
  const [generateError, setGenerateError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCodeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    setListError('');
    const result = await listDiscountCodes();
    setIsLoading(false);
    if (!result.ok) {
      setListError(result.message);
      setCodes([]);
      return;
    }
    setCodes(result.codes);
  }, []);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  const handleGenerate = async () => {
    setGenerateError('');
    setIsGenerating(true);
    const result = await generateDiscountCode({ label, validMonths, percent });
    setIsGenerating(false);
    if (!result.ok) {
      setGenerateError(result.message);
      return;
    }
    setCodes((prev) => [result.code, ...prev]);
    setLabel('');
    setShowGenerator(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleteError('');
    setIsDeleting(true);
    const result = await deleteDiscountCode(deleteTarget.id);
    setIsDeleting(false);
    if (!result.ok) {
      setDeleteError(result.message);
      return;
    }
    setCodes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie kodów rabatowych...</p>;
  }

  return (
    <div className="space-y-6">
      {deleteTarget && (
        <DeleteDiscountCodeDialog
          code={deleteTarget.code}
          label={deleteTarget.label}
          isDeleting={isDeleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (isDeleting) return;
            setDeleteTarget(null);
            setDeleteError('');
          }}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-serif font-light text-[#161616]">Kody rabatowe</h2>
        <button
          type="button"
          onClick={() => {
            setShowGenerator((open) => !open);
            setGenerateError('');
          }}
          className="bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] px-6 py-3 rounded-none text-[11px] uppercase tracking-[0.16em] font-light transition-colors"
        >
          Generator kodów rabatowych
        </button>
      </div>

      {listError && <p className="text-sm text-red-500">{listError}</p>}
      {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

      {showGenerator && (
        <div className="bg-white rounded-3xl border border-[#D6C7AE] p-5 md:p-8 space-y-5">
          <p className="font-bold text-[#161616]">Nowy kod rabatowy</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase">Nazwa rabatu</span>
              <input
                type="text"
                maxLength={DISCOUNT_LABEL_MAX}
                value={label}
                onChange={(e) => setLabel(e.target.value.slice(0, DISCOUNT_LABEL_MAX))}
                className="w-full rounded-none border border-[#D6C7AE] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A574]"
              />
              <span className="text-[10px] text-[#9A9288]">{label.length}/{DISCOUNT_LABEL_MAX}</span>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase">Data ważności kodu</span>
              <select
                value={validMonths}
                onChange={(e) => setValidMonths(Number(e.target.value) as DiscountValidityMonths)}
                className="w-full rounded-none border border-[#D6C7AE] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A574]"
              >
                {DISCOUNT_VALIDITY_MONTHS.map((months) => (
                  <option key={months} value={months}>
                    {months} {months === 1 ? 'miesiąc' : months < 5 ? 'miesiące' : 'miesięcy'}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase">% rabatu</span>
              <select
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value) as DiscountPercent)}
                className="w-full rounded-none border border-[#D6C7AE] bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A574]"
              >
                {DISCOUNT_PERCENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}%
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={isGenerating || !label.trim()}
                onClick={() => void handleGenerate()}
                className="w-full bg-[#161616] hover:bg-[#3A3A3A] disabled:opacity-50 text-[#F4EFE6] px-4 py-2.5 rounded-none text-[11px] uppercase tracking-[0.16em] font-light"
              >
                {isGenerating ? 'Generowanie…' : 'Generuj'}
              </button>
            </div>
          </div>
          {generateError && <p className="text-sm text-red-500">{generateError}</p>}
        </div>
      )}

      {codes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#D6C7AE]">
          <p className="text-[#7A736C]">Brak wygenerowanych kodów.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#D6C7AE] overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#EFE8DC] text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Data wygenerowania kodu</th>
                <th className="px-4 py-3 whitespace-nowrap">Termin ważności kodu</th>
                <th className="px-4 py-3 whitespace-nowrap">% rabatu</th>
                <th className="px-4 py-3 whitespace-nowrap">Nazwa rabatu</th>
                <th className="px-4 py-3 whitespace-nowrap">Kod</th>
                <th className="px-4 py-3 whitespace-nowrap">Komentarz</th>
                <th className="px-4 py-3 whitespace-nowrap">Status kodu</th>
                <th className="px-4 py-3 whitespace-nowrap w-0"> </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((row) => {
                const status = discountCodeStatus(row);
                return (
                  <tr key={row.id} className="border-t border-[#D6C7AE]">
                    <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                      {formatOrderDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                      {formatOrderDate(row.expiresAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-[#161616]">{row.percent}%</td>
                    <td className="px-4 py-3 text-[#161616]">{row.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-bold tracking-widest text-[#161616]">
                      {row.code}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <DiscountCommentField
                        id={row.id}
                        value={row.adminComment}
                        onSaved={(id, comment) =>
                          setCodes((prev) =>
                            prev.map((c) => (c.id === id ? { ...c, adminComment: comment } : c)),
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                      {discountCodeStatusLabel(status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap align-top">
                      {status === 'active' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteError('');
                            setDeleteTarget(row);
                          }}
                          className="border border-red-700/70 hover:border-red-800 hover:bg-red-50 text-red-800 px-3 py-1.5 rounded-none text-[10px] uppercase tracking-[0.16em] font-light transition-colors"
                        >
                          Usuń
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeleteDiscountCodeDialog({
  code,
  label,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  code: string;
  label: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md bg-white border border-[#D6C7AE] p-6 md:p-8 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-discount-code-title"
      >
        <div className="space-y-2">
          <p id="delete-discount-code-title" className="text-base text-[#161616] leading-relaxed">
            Czy na pewno chcesz usunąć aktywny kod rabatowy{' '}
            <strong className="font-mono tracking-widest">{code}</strong>
            {label ? (
              <>
                {' '}
                (<span>{label}</span>)
              </>
            ) : null}
            ? Tej operacji nie można cofnąć.
          </p>
          <p className="text-sm text-[#7A736C]">Kod przestanie działać w checkoutcie.</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="px-5 py-2.5 rounded-none border border-[#D6C7AE] text-sm text-[#161616] hover:border-[#C4A574] transition-colors disabled:opacity-50"
          >
            Anuluj
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-none bg-[#161616] text-[#F4EFE6] text-sm hover:bg-[#3A3A3A] transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Usuwanie…' : 'Usuń kod'}
          </button>
        </div>
      </div>
    </div>
  );
}
