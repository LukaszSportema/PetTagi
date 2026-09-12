'use client';

import { useEffect, useRef, useState } from 'react';
import { getConfiguratorAnalyticsReport } from './actions/configurator-analytics';
import { getAnalyticsReport } from './actions/analytics';
import { getOrder, listOrders, updateOrderClientPhone, updateOrderStatus } from './actions/orders';
import { getPopularityReport } from './actions/popularity';
import { getRevenueReport } from './actions/revenue';
import { getPaymentRecipient, setPaymentRecipient } from './actions/settings';
import { generateShippingLabel } from './actions/shipping';
import {
  canSetOrderStatusToPending,
  deliveryLabel,
  formatAddress,
  formatOrderDate,
  formatPrice,
  fulfillmentRangeLabel,
  orderItemOptions,
  orderItemTitle,
  statusLabel,
  statusOptionsForOrder,
} from '@/lib/order-display';
import {
  DEFAULT_PAYMENT_RECIPIENT,
  paymentRecipientLabel,
  persistPaymentRecipient,
  PAYMENT_RECIPIENTS,
  readStoredPaymentRecipient,
  type PaymentRecipientId,
} from '@/lib/payment';
import type { OrderDetail, OrderRecord, OrderStatus } from '@/lib/types/order';
import type { AnalyticsRow } from '@/lib/analytics-report';
import type { ConfiguratorAnalyticsReport } from '@/lib/configurator-analytics';
import { formatDuration, formatPercent } from '@/lib/configurator-analytics';
import { formatPolishMobile, isPolishMobilePhone, normalizePolishPhone } from '@/lib/phone';
import { DEFAULT_POPULARITY_GROUP, POPULARITY_GROUPS, type PopularityRow } from '@/lib/popularity';
import type { ReportPeriod } from '@/lib/report-periods';
import { warsawYmd } from '@/lib/report-periods';
import type { RevenueRow } from '@/lib/revenue';

const adminTabs = [
  { id: 'orders', label: 'Zamówienia' },
  { id: 'revenue', label: 'Przychody' },
  { id: 'analytics', label: 'Analityka' },
  { id: 'popularity', label: 'Popularność' },
  { id: 'configurator-analytics', label: 'Analityka Konfiguratora' },
] as const;

const statusClass: Record<OrderStatus, string> = {
  pending: 'bg-[#EBE4D6] text-[#7A736C]',
  paid: 'bg-[#EFE8DC] text-[#161616]',
  processing: 'bg-[#EBE4D6] text-[#C4A574]',
  shipped: 'bg-[#161616] text-[#F4EFE6]',
  completed: 'bg-[#161616] text-[#F4EFE6]',
  cancelled: 'bg-[#EFE8DC] text-[#7A736C]',
};

const dash = '—';

type StatusChangeRequest = {
  id: string;
  status: OrderStatus;
  orderNumber: string;
  currentStatus: OrderStatus;
};

type PendingPaidConfirmation = {
  id: string;
  orderNumber: string;
};

const orderRowClass = (status: OrderStatus) => {
  const base = 'border-t border-[#D6C7AE] cursor-pointer transition-colors';
  if (status === 'paid') {
    return `${base} bg-[#E4EDE5] hover:bg-[#D6E4D7]`;
  }
  return `${base} hover:bg-[#F4EFE6]`;
};

export default function AdminPanel() {
  const [activeAdminTab, setActiveAdminTab] = useState<(typeof adminTabs)[number]['id']>('orders');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [listError, setListError] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailError, setDetailError] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [paymentRecipient, setPaymentRecipientState] = useState<PaymentRecipientId>(
    () => readStoredPaymentRecipient() ?? DEFAULT_PAYMENT_RECIPIENT,
  );
  const [paymentRecipientError, setPaymentRecipientError] = useState('');
  const [isSavingRecipient, setIsSavingRecipient] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [pendingPaidConfirmation, setPendingPaidConfirmation] = useState<PendingPaidConfirmation | null>(null);
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([]);
  const [revenueQuantityRows, setRevenueQuantityRows] = useState<RevenueRow[]>([]);
  const [revenueError, setRevenueError] = useState('');
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsWarning, setAnalyticsWarning] = useState('');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [popularityRows, setPopularityRows] = useState<PopularityRow[]>([]);
  const [popularityPeriods, setPopularityPeriods] = useState<ReportPeriod[]>([]);
  const [popularityError, setPopularityError] = useState('');
  const [isLoadingPopularity, setIsLoadingPopularity] = useState(false);
  const [configuratorReport, setConfiguratorReport] = useState<ConfiguratorAnalyticsReport | null>(null);
  const [configuratorError, setConfiguratorError] = useState('');
  const [isLoadingConfigurator, setIsLoadingConfigurator] = useState(false);
  const [configuratorStartedDay, setConfiguratorStartedDay] = useState(() =>
    warsawYmd(new Date().toISOString()),
  );
  const paymentRecipientVersion = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingList(true);
      const result = await listOrders();
      if (cancelled) return;
      if (!result.ok) {
        setListError(result.message);
        setOrders([]);
      } else {
        setListError('');
        setOrders(result.orders);
      }
      setIsLoadingList(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError('');
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingDetail(true);
      setDetailError('');
      const result = await getOrder(selectedId);
      if (cancelled) return;
      if (!result.ok) {
        setDetail(null);
        setDetailError(result.message);
      } else {
        setDetail(result.order);
      }
      setIsLoadingDetail(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    let cancelled = false;
    const version = paymentRecipientVersion.current;
    const stored = readStoredPaymentRecipient();
    const load = async () => {
      const result = await getPaymentRecipient();
      if (cancelled || version !== paymentRecipientVersion.current) return;
      if (!result.ok) {
        setPaymentRecipientError(result.message);
        return;
      }
      if (stored) return;
      setPaymentRecipientError('');
      setPaymentRecipientState(result.recipient);
      persistPaymentRecipient(result.recipient);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeAdminTab !== 'revenue') return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingRevenue(true);
      const result = await getRevenueReport();
      if (cancelled) return;
      if (!result.ok) {
        setRevenueError(result.message);
        setRevenueRows([]);
        setRevenueQuantityRows([]);
      } else {
        setRevenueError('');
        setRevenueRows(result.rows);
        setRevenueQuantityRows(result.quantityRows);
      }
      setIsLoadingRevenue(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeAdminTab]);

  useEffect(() => {
    if (activeAdminTab !== 'analytics') return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingAnalytics(true);
      const result = await getAnalyticsReport();
      if (cancelled) return;
      if (!result.ok) {
        setAnalyticsError(result.message);
        setAnalyticsWarning('');
        setAnalyticsRows([]);
      } else {
        setAnalyticsError('');
        setAnalyticsWarning(result.warning ?? '');
        setAnalyticsRows(result.rows);
      }
      setIsLoadingAnalytics(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeAdminTab]);

  useEffect(() => {
    if (activeAdminTab !== 'popularity') return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingPopularity(true);
      const result = await getPopularityReport();
      if (cancelled) return;
      if (!result.ok) {
        setPopularityError(result.message);
        setPopularityRows([]);
        setPopularityPeriods([]);
      } else {
        setPopularityError('');
        setPopularityRows(result.rows);
        setPopularityPeriods(result.periods);
      }
      setIsLoadingPopularity(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeAdminTab]);

  useEffect(() => {
    if (activeAdminTab !== 'configurator-analytics') return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingConfigurator(true);
      const result = await getConfiguratorAnalyticsReport(configuratorStartedDay);
      if (cancelled) return;
      if (!result.ok) {
        setConfiguratorError(result.message);
        setConfiguratorReport(null);
      } else {
        setConfiguratorError('');
        setConfiguratorReport(result.report);
      }
      setIsLoadingConfigurator(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeAdminTab, configuratorStartedDay]);

  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    const previous = orders.find((order) => order.id === id)?.status;
    setStatusError('');
    setUpdatingStatusId(id);
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    setDetail((current) => (current?.id === id ? { ...current, status } : current));

    const result = await updateOrderStatus(id, status);
    setUpdatingStatusId(null);
    if (result.ok) return;

    if (previous) {
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, status: previous } : order)),
      );
      setDetail((current) => (current?.id === id ? { ...current, status: previous } : current));
    }
    setStatusError(result.message);
  };

  const requestOrderStatusChange = ({
    id,
    status,
    orderNumber,
    currentStatus,
  }: StatusChangeRequest) => {
    if (status === 'pending' && !canSetOrderStatusToPending(currentStatus)) {
      setStatusError('Opłaconego zamówienia nie można oznaczyć ponownie jako oczekujące na płatność.');
      return;
    }
    if (status === 'paid' && currentStatus !== 'paid') {
      setPendingPaidConfirmation({ id, orderNumber });
      return;
    }
    void changeOrderStatus(id, status);
  };

  const confirmPaidStatusChange = () => {
    if (!pendingPaidConfirmation) return;
    void changeOrderStatus(pendingPaidConfirmation.id, 'paid');
    setPendingPaidConfirmation(null);
  };

  const changeOrderPhone = async (id: string, phone: string) => {
    const result = await updateOrderClientPhone(id, phone);
    if (!result.ok) return result;

    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, clientPhone: result.phone } : order)),
    );
    setDetail((current) => (current?.id === id ? { ...current, clientPhone: result.phone } : current));
    return result;
  };

  const changePaymentRecipient = async (value: PaymentRecipientId) => {
    paymentRecipientVersion.current += 1;
    setPaymentRecipientState(value);
    persistPaymentRecipient(value);
    setIsSavingRecipient(true);
    setPaymentRecipientError('');
    const result = await setPaymentRecipient(value);
    setIsSavingRecipient(false);
    if (!result.ok) {
      setPaymentRecipientError(result.message);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-6 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <h1 className="text-4xl md:text-6xl font-serif font-light text-[#161616]">Panel administratora</h1>
        <label className="flex flex-col gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase">
            Odbiorca płatności
          </span>
          <select
            value={paymentRecipient}
            onChange={(e) => changePaymentRecipient(e.target.value as PaymentRecipientId)}
            disabled={isSavingRecipient}
            className="appearance-none bg-white rounded-none border border-[#D6C7AE] pl-4 pr-10 py-2.5 text-sm text-[#161616] focus:outline-none focus:border-[#C4A574] bg-[length:10px] bg-[right_12px_center] bg-no-repeat disabled:opacity-60 w-full md:min-w-[220px]"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 20 20' fill='none' stroke='%236E635B' stroke-width='2'%3E%3Cpath d='M5 7l5 6 5-6'/%3E%3C/svg%3E")` }}
          >
            {Object.values(PAYMENT_RECIPIENTS).map((recipient) => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {paymentRecipientError && (
        <p className="text-sm text-red-500 mb-6">{paymentRecipientError}</p>
      )}
      {statusError && (
        <p className="text-sm text-red-500 mb-6">{statusError}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-8 border-b border-[#D6C7AE]">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveAdminTab(tab.id);
              setSelectedId(null);
            }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
              activeAdminTab === tab.id
                ? 'text-[#161616] font-bold border-b-2 border-[#161616]'
                : 'text-[#7A736C] hover:text-[#161616]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeAdminTab === 'orders' && (
        selectedId ? (
          <OrderDetailView
            detail={detail}
            error={detailError}
            isLoading={isLoadingDetail}
            isUpdatingStatus={updatingStatusId === selectedId}
            onStatusChange={requestOrderStatusChange}
            onPhoneChange={changeOrderPhone}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <OrdersTable
            orders={orders}
            error={listError}
            isLoading={isLoadingList}
            updatingStatusId={updatingStatusId}
            onStatusChange={requestOrderStatusChange}
            onOpen={setSelectedId}
          />
        )
      )}

      {activeAdminTab === 'revenue' && (
        <RevenueTable
          rows={revenueRows}
          quantityRows={revenueQuantityRows}
          error={revenueError}
          isLoading={isLoadingRevenue}
        />
      )}

      {activeAdminTab === 'analytics' && (
        <AnalyticsTable
          rows={analyticsRows}
          error={analyticsError}
          warning={analyticsWarning}
          isLoading={isLoadingAnalytics}
        />
      )}

      {activeAdminTab === 'popularity' && (
        <PopularityTable
          rows={popularityRows}
          periods={popularityPeriods}
          error={popularityError}
          isLoading={isLoadingPopularity}
        />
      )}

      {activeAdminTab === 'configurator-analytics' && (
        <ConfiguratorAnalyticsPanel
          report={configuratorReport}
          error={configuratorError}
          isLoading={isLoadingConfigurator}
          startedDay={configuratorStartedDay}
          onStartedDayChange={setConfiguratorStartedDay}
        />
      )}

      {pendingPaidConfirmation && (
        <PaidStatusConfirmationDialog
          orderNumber={pendingPaidConfirmation.orderNumber}
          onConfirm={confirmPaidStatusChange}
          onCancel={() => setPendingPaidConfirmation(null)}
        />
      )}
    </div>
  );
}

function ConfiguratorAnalyticsPanel({
  report,
  error,
  isLoading,
  startedDay,
  onStartedDayChange,
}: {
  report: ConfiguratorAnalyticsReport | null;
  error: string;
  isLoading: boolean;
  startedDay: string;
  onStartedDayChange: (day: string) => void;
}) {
  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie analityki konfiguratora...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!report) {
    return <p className="text-sm text-[#7A736C]">Brak danych analityki konfiguratora.</p>;
  }

  const formatCount = (value: number) => value.toLocaleString('pl-PL');
  const maxFunnelUsers = Math.max(...report.funnel.map((step) => step.users), 1);

  const choicesByStep = report.choices.reduce<
    Record<string, { stepLabel: string; items: typeof report.choices }>
  >((acc, choice) => {
    if (!acc[choice.stepKey]) {
      acc[choice.stepKey] = { stepLabel: choice.stepLabel, items: [] };
    }
    acc[choice.stepKey].items.push(choice);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl md:text-4xl font-serif font-light text-[#161616]">Analityka Konfiguratora</h2>
        <p className="text-sm text-[#7A736C] mt-2">
          Analiza czasu spędzonego na krokach oraz wskaźniki porzuceń (drop-off)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#D6C7AE] rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
            Rozpoczęte konfiguracje
          </p>
          <label className="mt-3 block">
            <span className="text-xs text-[#7A736C]">Dzień</span>
            <input
              type="date"
              value={startedDay}
              onChange={(event) => onStartedDayChange(event.target.value)}
              className="mt-1 w-full border border-[#D6C7AE] bg-white px-3 py-2 text-sm text-[#161616] focus:outline-none focus:border-[#C4A574]"
            />
          </label>
          <p className="text-3xl font-serif text-[#161616] mt-3">{formatCount(report.startedSessions)}</p>
        </div>
        <div className="bg-white border border-[#D6C7AE] rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
            Średni czas do zamówienia
          </p>
          <p className="text-3xl font-serif text-[#161616] mt-2">{formatDuration(report.avgCompletionMs)}</p>
        </div>
        <div className="bg-white border border-[#D6C7AE] rounded-2xl p-5">
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
            Współczynnik konwersji
          </p>
          <p className="text-3xl font-serif text-[#161616] mt-2">{formatPercent(report.conversionRate)}</p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-serif font-light text-[#161616]">Lejek krokowy</h3>
        {report.funnel.length === 0 ? (
          <p className="text-sm text-[#7A736C]">Brak danych o krokach. Przejdź konfigurator, aby zebrać statystyki.</p>
        ) : (
          <div className="space-y-4">
            {report.funnel.map((step) => (
              <div key={step.stepKey} className="bg-white border border-[#D6C7AE] rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-[#9A9288]">Krok {step.stepIndex}</p>
                    <p className="text-lg font-medium text-[#161616]">{step.stepLabel}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[#7A736C]">
                    <span><span className="font-medium text-[#161616]">{formatCount(step.users)}</span> użytkowników</span>
                    <span>Średni czas: <span className="font-medium text-[#161616]">{formatDuration(step.avgDurationMs)}</span></span>
                    <span>
                      Drop-off:{' '}
                      <span className="font-medium text-[#161616]">
                        {step.dropOffRate === null ? '—' : formatPercent(step.dropOffRate)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-[#EFE8DC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3A5A40] transition-all"
                    style={{ width: `${Math.max((step.users / maxFunnelUsers) * 100, step.users > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-serif font-light text-[#161616]">Popularne wybory w krokach</h3>
        {Object.keys(choicesByStep).length === 0 ? (
          <p className="text-sm text-[#7A736C]">Brak zapisanych wyborów użytkowników.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(choicesByStep)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([stepKey, group]) => {
                const maxCount = Math.max(...group.items.map((item) => item.count), 1);
                return (
                  <div key={stepKey} className="bg-white border border-[#D6C7AE] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#D6C7AE] bg-[#F9F5ED]">
                      <p className="text-[11px] uppercase tracking-wider text-[#9A9288]">Krok {stepKey}</p>
                      <p className="font-medium text-[#161616]">{group.stepLabel}</p>
                    </div>
                    <div className="divide-y divide-[#D6C7AE]">
                      {group.items.slice(0, 8).map((choice) => (
                        <div key={`${choice.choiceKey}-${choice.choiceValue}`} className="px-5 py-3 space-y-2">
                          <div className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-[#161616]">
                              <span className="text-[#9A9288]">{choice.choiceKey}: </span>
                              {choice.choiceValue}
                            </span>
                            <span className="tabular-nums font-medium text-[#161616]">{formatCount(choice.count)}</span>
                          </div>
                          <div className="h-2 bg-[#EFE8DC] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#C4A574]"
                              style={{ width: `${Math.max((choice.count / maxCount) * 100, choice.count > 0 ? 4 : 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}

function PopularityTable({
  rows,
  periods,
  error,
  isLoading,
}: {
  rows: PopularityRow[];
  periods: ReportPeriod[];
  error: string;
  isLoading: boolean;
}) {
  const [selectedGroup, setSelectedGroup] = useState(DEFAULT_POPULARITY_GROUP);

  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie popularności...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const formatCount = (value: number) => value.toLocaleString('pl-PL');
  const visibleRows = rows.filter((row) => row.groupKey === selectedGroup);

  return (
    <div className="space-y-4">
      <label className="flex flex-col gap-1.5 w-full md:w-auto">
        <span className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase">
          Grupa elementów
        </span>
        <select
          value={selectedGroup}
          onChange={(event) => setSelectedGroup(event.target.value)}
          className="appearance-none bg-white rounded-none border border-[#D6C7AE] pl-4 pr-10 py-2.5 text-sm text-[#161616] focus:outline-none focus:border-[#C4A574] bg-[length:10px] bg-[right_12px_center] bg-no-repeat w-full md:min-w-[260px]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 20 20' fill='none' stroke='%236E635B' stroke-width='2'%3E%3Cpath d='M5 7l5 6 5-6'/%3E%3C/svg%3E")` }}
        >
          {POPULARITY_GROUPS.map((group) => (
            <option key={group.key} value={group.key}>
              {group.label}
            </option>
          ))}
        </select>
      </label>

      <div className="bg-white rounded-3xl border border-[#D6C7AE] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#EFE8DC] text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap sticky left-0 bg-[#EFE8DC] z-10">Element</th>
                {periods.map((period) => (
                  <th key={period.key} className="px-4 py-3 whitespace-nowrap text-right">
                    {period.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={row.key}
                  className={`border-t border-[#D6C7AE] ${row.isGroup ? 'bg-[#F9F5ED]' : ''}`}
                >
                  <td
                    className={`px-4 py-3 whitespace-nowrap sticky left-0 z-10 ${
                      row.isGroup
                        ? 'font-medium text-[#161616] bg-[#F9F5ED]'
                        : 'pl-8 text-[#7A736C] bg-white'
                    }`}
                  >
                    {row.label}
                  </td>
                  {periods.map((period) => (
                    <td
                      key={period.key}
                      className={`px-4 py-3 whitespace-nowrap text-right tabular-nums ${
                        row.isGroup ? 'font-medium text-[#161616]' : 'text-[#161616]'
                      }`}
                    >
                      {formatCount(row.counts[period.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTable({
  rows,
  error,
  warning,
  isLoading,
}: {
  rows: AnalyticsRow[];
  error: string;
  warning: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie analityki...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const formatCount = (value: number) => value.toLocaleString('pl-PL');
  const columns: { key: keyof Omit<AnalyticsRow, 'key' | 'label'>; label: string }[] = [
    { key: 'visits', label: 'Wejścia na stronę' },
    { key: 'orders', label: 'Zamówienia' },
    { key: 'paidOrders', label: 'Opłacone zamówienia' },
  ];

  return (
    <div className="space-y-4">
      {warning && <p className="text-sm text-[#C4A574]">{warning}</p>}
      <div className="bg-white rounded-3xl border border-[#D6C7AE] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#EFE8DC] text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Okres</th>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 whitespace-nowrap text-right">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.key}
                  className={`border-t border-[#D6C7AE] ${index < 3 ? 'bg-[#F9F5ED]' : ''}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-[#161616]">
                    {row.label}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-[#161616]"
                    >
                      {formatCount(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RevenueTable({
  rows,
  quantityRows,
  error,
  isLoading,
}: {
  rows: RevenueRow[];
  quantityRows: RevenueRow[];
  error: string;
  isLoading: boolean;
}) {
  const [viewMode, setViewMode] = useState<'money' | 'quantity'>('money');
  const formatCount = (value: number) => value.toLocaleString('pl-PL');

  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie przychodów...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  const displayRows = viewMode === 'money' ? rows : quantityRows;
  const formatValue = viewMode === 'money' ? formatPrice : formatCount;

  const allColumns: { key: keyof Omit<RevenueRow, 'key' | 'label'>; label: string }[] = [
    { key: 'total', label: 'Przychody razem' },
    { key: 'base', label: 'Bazowe' },
    { key: 'charms', label: 'Charms' },
    { key: 'karabiners', label: 'Karabińczyki' },
    { key: 'strings', label: 'Sznurki' },
    { key: 'stoppers', label: 'Stopery' },
    { key: 'stickers', label: 'Naklejki' },
    { key: 'dialCode', label: 'Kierunkowy' },
    { key: 'express', label: 'Ekspresowa realizacja' },
    { key: 'shipping', label: 'Wysyłka' },
  ];
  const columns =
    viewMode === 'money' ? allColumns : allColumns.filter((column) => column.key !== 'total');

  return (
    <div className="bg-white rounded-3xl border border-[#D6C7AE] overflow-hidden">
      <div className="flex gap-2 px-4 pt-4 border-b border-[#D6C7AE]">
        <button
          type="button"
          onClick={() => setViewMode('money')}
          className={`px-3 py-2 text-sm font-medium transition-colors -mb-px ${
            viewMode === 'money'
              ? 'text-[#161616] font-bold border-b-2 border-[#161616]'
              : 'text-[#7A736C] hover:text-[#161616]'
          }`}
        >
          Kwotowo
        </button>
        <button
          type="button"
          onClick={() => setViewMode('quantity')}
          className={`px-3 py-2 text-sm font-medium transition-colors -mb-px ${
            viewMode === 'quantity'
              ? 'text-[#161616] font-bold border-b-2 border-[#161616]'
              : 'text-[#7A736C] hover:text-[#161616]'
          }`}
        >
          Ilościowo
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-[#EFE8DC] text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Okres</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 whitespace-nowrap text-right">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => (
              <tr
                key={row.key}
                className={`border-t border-[#D6C7AE] ${index < 3 ? 'bg-[#F9F5ED]' : ''}`}
              >
                <td className="px-4 py-3 whitespace-nowrap font-medium text-[#161616]">
                  {row.label}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 whitespace-nowrap text-right tabular-nums text-[#161616]"
                  >
                    {formatValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTable({
  orders,
  error,
  isLoading,
  updatingStatusId,
  onStatusChange,
  onOpen,
}: {
  orders: OrderRecord[];
  error: string;
  isLoading: boolean;
  updatingStatusId: string | null;
  onStatusChange: (request: StatusChangeRequest) => void;
  onOpen: (id: string) => void;
}) {
  if (isLoading) {
    return <p className="text-sm text-[#7A736C]">Ładowanie zamówień...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-[#D6C7AE]">
        <p className="text-[#7A736C]">Brak zamówień.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#D6C7AE] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-[#EFE8DC] text-[11px] font-bold tracking-wider uppercase text-[#9A9288]">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Data zamówienia</th>
              <th className="px-4 py-3 whitespace-nowrap">ID zamówienia</th>
              <th className="px-4 py-3 whitespace-nowrap">Kwota zamówienia</th>
              <th className="px-4 py-3 whitespace-nowrap">Płatność</th>
              <th className="px-4 py-3 whitespace-nowrap">Imię i nazwisko</th>
              <th className="px-4 py-3 whitespace-nowrap">E-mail</th>
              <th className="px-4 py-3 whitespace-nowrap">Numer telefonu</th>
              <th className="px-4 py-3">Adres</th>
              <th className="px-4 py-3 whitespace-nowrap">Rodzaj wysyłki</th>
              <th className="px-4 py-3 min-w-[180px]">Oprawa i baza</th>
              <th className="px-4 py-3 whitespace-nowrap min-w-[200px]">Termin realizacji</th>
              <th className="px-4 py-3 whitespace-nowrap">Numer paczkomatu</th>
              <th className="px-4 py-3 whitespace-nowrap">Rabat</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                tabIndex={0}
                onClick={() => onOpen(order.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(order.id);
                  }
                }}
                className={orderRowClass(order.status)}
              >
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">{formatOrderDate(order.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-[#161616]">{order.orderId}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-[#161616]">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                  {paymentRecipientLabel(order.paymentRecipient) || dash}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                  {`${order.clientName} ${order.clientSurname}`.trim()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">{order.clientEmail}</td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">{order.clientPhone}</td>
                <td className="px-4 py-3 text-[#161616] min-w-[180px]">
                  {formatAddress(order.clientAddress, order.clientPostcode, order.clientCity)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">{deliveryLabel(order.deliveryType)}</td>
                <td className="px-4 py-3 text-[#161616] min-w-[180px]">
                  {order.frameBaseLines.length > 0 ? (
                    <div className="space-y-1">
                      {order.frameBaseLines.map((line, index) => (
                        <div key={`${order.id}-${index}`}>{line}</div>
                      ))}
                    </div>
                  ) : (
                    dash
                  )}
                </td>
                <td className="px-4 py-3 text-[#161616] min-w-[200px]">
                  {fulfillmentRangeLabel(order.fastDelivery, order.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                  {order.deliveryType === 'paczkomat' ? order.inpostId || dash : dash}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">{order.discountCode || dash}</td>
                <td className="px-4 py-3 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                  <StatusSelect
                    status={order.status}
                    disabled={updatingStatusId === order.id}
                    onChange={(status) =>
                      onStatusChange({
                        id: order.id,
                        status,
                        orderNumber: order.orderId,
                        currentStatus: order.status,
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetailView({
  detail,
  error,
  isLoading,
  isUpdatingStatus,
  onStatusChange,
  onPhoneChange,
  onBack,
}: {
  detail: OrderDetail | null;
  error: string;
  isLoading: boolean;
  isUpdatingStatus: boolean;
  onStatusChange: (request: StatusChangeRequest) => void;
  onPhoneChange: (id: string, phone: string) => Promise<{ ok: true; phone: string } | { ok: false; message: string }>;
  onBack: () => void;
}) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [inpostCode, setInpostCode] = useState(detail?.inpostCode ?? '');
  const [copied, setCopied] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  useEffect(() => {
    setInpostCode(detail?.inpostCode ?? '');
    setCodeError('');
    setCopied(false);
    setIsEditingPhone(false);
    setPhoneDraft(detail ? normalizePolishPhone(detail.clientPhone) : '');
    setPhoneError('');
  }, [detail?.id, detail?.inpostCode, detail?.clientPhone]);

  const generateCode = async (orderId: string) => {
    setIsGeneratingCode(true);
    setCodeError('');
    const result = await generateShippingLabel(orderId);
    setIsGeneratingCode(false);
    if (!result.ok) {
      setCodeError(result.message);
      return;
    }
    setInpostCode(result.code);
  };

  const copyCode = async () => {
    if (!inpostCode) return;
    await navigator.clipboard.writeText(inpostCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const savePhone = async () => {
    if (!detail) return;
    setPhoneError('');
    if (!isPolishMobilePhone(phoneDraft)) {
      setPhoneError('Podaj poprawny numer komórkowy (9 cyfr, np. 500 600 700).');
      return;
    }
    setIsSavingPhone(true);
    const result = await onPhoneChange(detail.id, phoneDraft);
    setIsSavingPhone(false);
    if (!result.ok) {
      setPhoneError(result.message);
      return;
    }
    setIsEditingPhone(false);
    setCodeError('');
  };

  const phoneIsMobile = detail ? isPolishMobilePhone(detail.clientPhone) : true;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-[#161616] text-sm font-medium mb-6 hover:underline"
      >
        ← Wróć do listy
      </button>

      {isLoading && <p className="text-sm text-[#7A736C]">Ładowanie zamówienia...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {detail && (
        <>
          <div className="flex flex-wrap items-baseline gap-3 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#161616]">{detail.orderId}</h2>
            <span className="text-sm text-[#7A736C]">{formatOrderDate(detail.createdAt)}</span>
            <StatusSelect
              status={detail.status}
              disabled={isUpdatingStatus}
              onChange={(status) =>
                onStatusChange({
                  id: detail.id,
                  status,
                  orderNumber: detail.orderId,
                  currentStatus: detail.status,
                })
              }
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <section className="flex-1 w-full bg-[#EBE4D6] p-5 md:p-10 space-y-6">
              <h3 className="text-2xl font-serif font-light text-[#161616]">Podsumowanie zamówienia</h3>

              <div className="space-y-4">
                {detail.items.map((item) => {
                  const options = orderItemOptions(item);
                  return (
                    <div key={item.id} className="bg-white/70 rounded-2xl p-4">
                      <div className="flex gap-3 items-start">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0 border border-[#D6C7AE]">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <p className="flex-1 min-w-0 font-bold text-[#161616]">
                          {orderItemTitle(item)}
                          {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                        </p>
                        <span className="font-bold text-[#161616] whitespace-nowrap">
                          {formatPrice(item.lineTotal || item.unitPrice * item.quantity)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                        {options.map((option) => (
                          <div key={`${item.id}-${option.label}`} className="text-sm min-w-0">
                            <p className="text-[#9A9288]">{option.label}:</p>
                            <ul className="mt-0.5 space-y-0.5 pl-3">
                              {option.values.map((value) => (
                                <li key={`${item.id}-${option.label}-${value}`} className="text-[#161616] font-medium">
                                  {value}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {detail.discountCode && (
                <p className="text-sm text-[#7A736C]">
                  Kod rabatowy: <span className="font-medium text-[#161616]">{detail.discountCode}</span>
                </p>
              )}

              <div className="space-y-2 text-sm text-[#7A736C] pt-2">
                <div className="flex justify-between">
                  <span>Wartość produktów</span>
                  <span className="font-medium text-[#161616]">{formatPrice(detail.productsValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dostawa</span>
                  <span className="font-medium text-[#161616]">{formatPrice(detail.shippingCost)}</span>
                </div>
                {detail.fastDelivery && (
                  <div className="flex justify-between">
                    <span>Ekspresowy czas realizacji</span>
                    <span className="font-medium text-[#161616]">{formatPrice(detail.fastDeliveryCost)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <span className="font-bold text-[#161616]">Razem</span>
                <span className="text-2xl font-bold text-[#161616]">{formatPrice(detail.total)}</span>
              </div>
            </section>

            <section className="w-full lg:w-[380px] shrink-0 bg-[#F9F5ED] p-5 md:p-8 space-y-6 border border-[#D6C7AE]">
              <h3 className="text-xl font-bold text-[#161616]">Dane do wysyłki</h3>
              <dl className="space-y-4 text-sm">
                <DetailField label="Imię i nazwisko" value={`${detail.clientName} ${detail.clientSurname}`.trim()} />
                <DetailField label="E-mail" value={detail.clientEmail} />
                <div>
                  <dt className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase mb-1">Numer telefonu</dt>
                  <dd className="space-y-2">
                    {isEditingPhone ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <span className="shrink-0 px-3 py-2 border border-[#D6C7AE] bg-white text-sm text-[#161616]">+48</span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={formatPolishMobile(phoneDraft)}
                            onChange={(event) => {
                              const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
                              setPhoneDraft(digits);
                              setPhoneError('');
                            }}
                            placeholder="500 600 700"
                            className="flex-1 min-w-0 px-3 py-2 border border-[#D6C7AE] bg-white text-sm text-[#161616] focus:outline-none focus:border-[#C4A574]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={savePhone}
                            disabled={isSavingPhone}
                            className="px-3 py-1.5 bg-[#3A5A40] text-[#F4EFE6] text-xs uppercase tracking-wider disabled:opacity-60"
                          >
                            {isSavingPhone ? 'Zapisywanie...' : 'Zapisz'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPhone(false);
                              setPhoneDraft(normalizePolishPhone(detail.clientPhone));
                              setPhoneError('');
                            }}
                            className="px-3 py-1.5 border border-[#D6C7AE] text-xs uppercase tracking-wider text-[#161616]"
                          >
                            Anuluj
                          </button>
                        </div>
                        {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[#161616] font-medium">{detail.clientPhone}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneDraft(normalizePolishPhone(detail.clientPhone));
                            setIsEditingPhone(true);
                            setPhoneError('');
                          }}
                          className="shrink-0 text-xs text-[#3A5A40] hover:underline uppercase tracking-wider"
                        >
                          Edytuj
                        </button>
                      </div>
                    )}
                    {!phoneIsMobile && !isEditingPhone && (
                      <p className="text-xs text-red-500">
                        To nie jest numer komórkowy — InPost nie wygeneruje kodu nadania. Kliknij Edytuj i wpisz numer komórkowy klienta.
                      </p>
                    )}
                  </dd>
                </div>
                <DetailField
                  label="Adres"
                  value={formatAddress(detail.clientAddress, detail.clientPostcode, detail.clientCity)}
                />
                <DetailField label="Rodzaj wysyłki" value={deliveryLabel(detail.deliveryType)} />
                <DetailField label="Czas realizacji" value={fulfillmentRangeLabel(detail.fastDelivery, detail.createdAt)} />
                <DetailField
                  label="Płatność"
                  value={paymentRecipientLabel(detail.paymentRecipient) || dash}
                />
                {detail.deliveryType === 'paczkomat' && (
                  <DetailField label="Numer paczkomatu" value={detail.inpostId || dash} />
                )}
              </dl>
              {inpostCode ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase">Kod nadania InPost</p>
                  <p className="text-2xl md:text-3xl font-bold tracking-[0.12em] md:tracking-[0.2em] text-[#161616] break-all">{inpostCode}</p>
                  <p className="text-xs text-[#7A736C]">
                    Napisz ten kod na przesyłce i wpisz go w Paczkomacie albo podaj w punkcie POP.
                  </p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="w-full bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] py-3 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300"
                  >
                    {copied ? 'Skopiowano' : 'Kopiuj kod'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => generateCode(detail.id)}
                  disabled={isGeneratingCode}
                  className="w-full bg-[#3A5A40] hover:bg-[#2E4833] text-[#F4EFE6] py-3 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingCode ? 'Generowanie kodu...' : 'Generuj kod InPost'}
                </button>
              )}
              {codeError && <p className="text-xs text-red-500">{codeError}</p>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function PaidStatusConfirmationDialog({
  orderNumber,
  onConfirm,
  onCancel,
}: {
  orderNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md bg-white border border-[#D6C7AE] p-6 md:p-8 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paid-status-confirmation-title"
      >
        <p id="paid-status-confirmation-title" className="text-base text-[#161616] leading-relaxed">
          Czy na pewno zamówienie <strong>&quot;{orderNumber}&quot;</strong> zostało opłacone? Do klienta zostanie wysłany mail potwierdzający.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-none border border-[#D6C7AE] text-sm text-[#161616] hover:border-[#C4A574] transition-colors"
          >
            Nie
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-none bg-[#3A5A40] text-[#F4EFE6] text-sm hover:bg-[#2E4833] transition-colors"
          >
            Tak
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase mb-1">{label}</dt>
      <dd className="text-[#161616] font-medium">{value}</dd>
    </div>
  );
}

function StatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: OrderStatus;
  disabled?: boolean;
  onChange: (status: OrderStatus) => void;
}) {
  const options = statusOptionsForOrder(status);

  return (
    <select
      value={status}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value as OrderStatus)}
      aria-label="Status zamówienia"
      className={`appearance-none rounded-none border border-[#D6C7AE] pl-2.5 pr-8 py-1.5 text-xs font-medium focus:outline-none focus:border-[#C4A574] bg-[length:10px] bg-[right_8px_center] bg-no-repeat disabled:opacity-60 ${statusClass[status]}`}
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 20 20' fill='none' stroke='%236E635B' stroke-width='2'%3E%3Cpath d='M5 7l5 6 5-6'/%3E%3C/svg%3E")` }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
