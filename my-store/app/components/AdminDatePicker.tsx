'use client';

import { useEffect, useMemo, useState } from 'react';
import { monthLabel, warsawYmd } from '@/lib/report-periods';

const pad2 = (value: number) => String(value).padStart(2, '0');

const ymdFromParts = (year: number, month: number, day: number) =>
  `${year}-${pad2(month)}-${pad2(day)}`;

const parseYmd = (ymd: string) => {
  const [year, month, day] = ymd.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
};

const formatYmdPl = (ymd: string) => {
  const parsed = parseYmd(ymd);
  if (!parsed) return ymd;
  return `${pad2(parsed.day)}.${pad2(parsed.month)}.${parsed.year}`;
};

type CalendarCell = {
  ymd: string;
  day: number;
  inMonth: boolean;
};

const buildMonthGrid = (year: number, month: number): CalendarCell[] => {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const day = daysInPrevMonth - firstWeekday + index + 1;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    cells.push({
      ymd: ymdFromParts(prevYear, prevMonth, day),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      ymd: ymdFromParts(year, month, day),
      day,
      inMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    cells.push({
      ymd: ymdFromParts(nextYear, nextMonth, nextDay),
      day: nextDay,
      inMonth: false,
    });
    nextDay += 1;
  }

  return cells;
};

const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

type AdminDatePickerProps = {
  value: string;
  onChange: (ymd: string) => void;
  disabled?: boolean;
};

export function AdminDatePicker({ value, onChange, disabled }: AdminDatePickerProps) {
  const todayYmd = warsawYmd(new Date().toISOString());
  const parsedValue = value ? parseYmd(value) : null;
  const [viewYear, setViewYear] = useState(parsedValue?.year ?? Number(todayYmd.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(parsedValue?.month ?? Number(todayYmd.slice(5, 7)));

  useEffect(() => {
    const parsed = parseYmd(value) ?? parseYmd(warsawYmd(new Date().toISOString()));
    if (!parsed) return;
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
  }, [value]);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const shiftMonth = (delta: number) => {
    let month = viewMonth + delta;
    let year = viewYear;
    while (month < 1) {
      month += 12;
      year -= 1;
    }
    while (month > 12) {
      month -= 12;
      year += 1;
    }
    setViewMonth(month);
    setViewYear(year);
  };

  const monthTitle = monthLabel(viewYear, viewMonth);

  return (
    <div className="rounded-xl border border-[#D6C7AE] bg-[#F9F5ED] p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => shiftMonth(-1)}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#D6C7AE] bg-white text-[#161616] hover:border-[#C4A574] disabled:opacity-50 transition-colors"
          aria-label="Poprzedni miesiąc"
        >
          ‹
        </button>
        <p className="text-sm font-medium text-[#161616] capitalize text-center min-w-0 flex-1">
          {monthTitle}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => shiftMonth(1)}
          className="h-9 w-9 flex items-center justify-center rounded-lg border border-[#D6C7AE] bg-white text-[#161616] hover:border-[#C4A574] disabled:opacity-50 transition-colors"
          aria-label="Następny miesiąc"
        >
          ›
        </button>
      </div>

      <p className="text-center text-lg font-serif text-[#161616] tabular-nums">
        {value ? formatYmdPl(value) : 'Wybierz dzień'}
      </p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-[10px] font-bold tracking-wider uppercase text-[#9A9288] py-1"
          >
            {label}
          </span>
        ))}
        {cells.map((cell) => {
          const isSelected = value === cell.ymd;
          const isToday = todayYmd === cell.ymd;
          return (
            <button
              key={cell.ymd}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.ymd)}
              className={[
                'h-9 w-full rounded-lg text-sm tabular-nums transition-colors',
                cell.inMonth ? 'text-[#161616]' : 'text-[#9A9288]/70',
                isSelected
                  ? 'bg-[#3A5A40] text-[#F4EFE6] font-medium shadow-sm'
                  : 'hover:bg-[#EBE4D6]',
                isToday && !isSelected ? 'ring-1 ring-[#C4A574] ring-inset' : '',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(todayYmd)}
          className="text-xs text-[#3A5A40] hover:text-[#2E4833] underline underline-offset-2 disabled:opacity-50"
        >
          Dzisiaj
        </button>
      </div>
    </div>
  );
}
