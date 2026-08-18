'use client';

import { useEffect, useRef, useState } from 'react';
import { getOrder, listOrders } from './actions/orders';
import { getPaymentRecipient, setPaymentRecipient } from './actions/settings';
import { generateShippingLabel } from './actions/shipping';
import {
  deliveryLabel,
  formatAddress,
  formatOrderDate,
  formatPrice,
  fulfillmentLabel,
  orderItemOptions,
  statusLabel,
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

const adminTabs = [{ id: 'orders', label: 'Zamówienia' }] as const;

const statusClass: Record<OrderStatus, string> = {
  pending: 'bg-[#EBE4D6] text-[#7A736C]',
  paid: 'bg-[#EFE8DC] text-[#161616]',
  processing: 'bg-[#EBE4D6] text-[#C4A574]',
  shipped: 'bg-[#161616] text-[#F4EFE6]',
  completed: 'bg-[#161616] text-[#F4EFE6]',
  cancelled: 'bg-[#EFE8DC] text-[#7A736C]',
};

const dash = '—';

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

      <div className="flex gap-2 mb-8 border-b border-[#D6C7AE]">
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
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <OrdersTable
            orders={orders}
            error={listError}
            isLoading={isLoadingList}
            onOpen={setSelectedId}
          />
        )
      )}
    </div>
  );
}

function OrdersTable({
  orders,
  error,
  isLoading,
  onOpen,
}: {
  orders: OrderRecord[];
  error: string;
  isLoading: boolean;
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
        <table className="w-full min-w-[1100px] text-left text-sm">
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
                className="border-t border-[#D6C7AE] cursor-pointer hover:bg-[#F4EFE6] transition-colors"
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
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">
                  {order.deliveryType === 'paczkomat' ? order.inpostId || dash : dash}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[#161616]">{order.discountCode || dash}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusPill status={order.status} />
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
  onBack,
}: {
  detail: OrderDetail | null;
  error: string;
  isLoading: boolean;
  onBack: () => void;
}) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [inpostCode, setInpostCode] = useState(detail?.inpostCode ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInpostCode(detail?.inpostCode ?? '');
    setCodeError('');
    setCopied(false);
  }, [detail?.id, detail?.inpostCode]);

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
            <StatusPill status={detail.status} />
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
                            <img src={item.imageUrl} alt="Adresówka" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <p className="flex-1 min-w-0 font-bold text-[#161616]">
                          Adresówka{item.dogName ? ` dla ${item.dogName}` : ''}
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
                <DetailField label="Numer telefonu" value={detail.clientPhone} />
                <DetailField
                  label="Adres"
                  value={formatAddress(detail.clientAddress, detail.clientPostcode, detail.clientCity)}
                />
                <DetailField label="Rodzaj wysyłki" value={deliveryLabel(detail.deliveryType)} />
                <DetailField label="Czas realizacji" value={fulfillmentLabel(detail.fastDelivery)} />
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
                    className="w-full bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] py-3 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300"
                  >
                    {copied ? 'Skopiowano' : 'Kopiuj kod'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => generateCode(detail.id)}
                  disabled={isGeneratingCode}
                  className="w-full bg-[#161616] hover:bg-[#3A3A3A] text-[#F4EFE6] py-3 rounded-none text-[11px] uppercase tracking-[0.22em] font-light transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-wider text-[#9A9288] uppercase mb-1">{label}</dt>
      <dd className="text-[#161616] font-medium">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusClass[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
