const cabinTypes = [
  { key: 'economy', label: 'Economy' },
  { key: 'business', label: 'Business' },
  { key: 'first', label: 'First Class' },
];

export function submittedCabins(route) {
  const selected = String(route.cabin || '').toLowerCase();
  return cabinTypes.filter(({ key }) => selected
    ? selected.includes(key)
    : Number(route.price?.[`${key}Local`] ?? route.price?.[key]) > 0 || Number(route.seats?.[key]) > 0)
    .map(({ key, label }) => {
      const local = route.price?.[`${key}Local`];
      return {
        key, label, price: local ?? route.price?.[key], seats: route.seats?.[key],
        currency: local != null ? route.currency : route.priceCurrency || route.currency,
      };
    });
}

export function submittedPrice(value, currency) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) return 'Not provided';
  return `${currency || 'Currency not provided'} ${Number(value).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function routeStatus(route) {
  const status = String(route.status || '').toLowerCase();
  if (status === 'approved' || status === 'active') return { label: 'Approved', tone: 'approved', pending: false };
  if (status === 'pending') return { label: 'Pending review', tone: 'pending', pending: true };
  if (status === 'paused') return { label: 'Paused', tone: 'pending', pending: false };
  if (status === 'rejected') return { label: 'Rejected', tone: 'rejected', pending: false };
  return { label: route.status || 'Not provided', tone: 'pending', pending: false };
}
