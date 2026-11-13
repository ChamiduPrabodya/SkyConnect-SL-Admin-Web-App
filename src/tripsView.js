export const serviceTypes = {
  flight: "Flight",
  stay: "Stay / cabana",
  tour: "Activity",
  package: "Package",
};
export const statusKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace("canceled", "cancelled");
export const statusLabel = (value) =>
  ({
    pending: "Pending",
    confirmed: "Confirmed",
    rejected: "Rejected",
    "checked in": "Checked in",
    completed: "Completed",
    cancelled: "Cancelled",
    saved: "Saved plan",
  })[statusKey(value)] ||
  value ||
  "Not recorded";
export const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";
export function numberValue(value) {
  return hasValue(value) && Number.isFinite(Number(value))
    ? Number(value)
    : undefined;
}
export function dateValue(value) {
  if (!hasValue(value)) return null;
  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : typeof value?.seconds === "number"
        ? new Date(value.seconds * 1000)
        : new Date(
            /^\d{4}-\d{2}-\d{2}$/.test(String(value))
              ? `${value}T12:00:00+05:30`
              : value,
          );
  return Number.isNaN(date.getTime()) ? null : date;
}
export function formatDate(value, timestamp = false) {
  const date = dateValue(value);
  return date
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Colombo",
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(timestamp ? { hour: "2-digit", minute: "2-digit" } : {}),
      }).format(date)
    : "Date not set";
}
export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function money(value, currency = "LKR") {
  const amount = numberValue(value);
  return amount === undefined
    ? "Amount not recorded"
    : `${currency} ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(amount)}`;
}
export const fieldLabel = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export function recordView(record, catalog = {}) {
  const draft = record.draft || {},
    plan = record.plan || {},
    trip = record.tripDetails || {};
  const profile =
    catalog.users?.find((user) => user.id === record.userId) || {};
  const traveler = { ...profile, ...record.traveler };
  const name =
    record.traveler?.name ||
    record.guestName ||
    record.passengerName ||
    profile.name ||
    profile.fullName ||
    "Traveler";
  const providerName = (service, listing) =>
    service.providerName ||
    catalog.partners?.find(
      (partner) =>
        partner.id ===
        (service.providerId ||
          service.airlineId ||
          service.partnerId ||
          listing?.partnerId ||
          listing?.airlineId),
    )?.name ||
    listing?.airlineName ||
    listing?.operatorName ||
    "";
  const lookup = (id, items) =>
    items?.find(
      (item) => item.id === id || item.id === String(id).split(":")[0],
    );
  const enrich = (service) => {
    const current =
      service.kind === "flight"
        ? lookup(service.routeId || service.itemId, catalog.routes)
        : service.kind === "package"
          ? lookup(service.offerId || service.itemId, catalog.travelPackages)
          : lookup(
              service.offerId ||
                service.hotelId ||
                service.activityId ||
                service.itemId,
              catalog.offers,
            );
    return {
      ...service,
      listing: service.listing || current,
      providerName: providerName(service, current),
      currentListing: !service.listing && Boolean(current),
    };
  };
  let services;
  if (record.recordType === "booking")
    services = [
      enrich({
        ...record,
        kind:
          record.kind ||
          (record.airlineId ? "flight" : record.hotelId ? "stay" : "tour"),
      }),
    ];
  else if (trip.selectedServices) services = trip.selectedServices.map(enrich);
  else
    services = [
      { kind: "stay", itemId: plan.hotelId },
      ...(!draft.local ? [{ kind: "flight", itemId: plan.flightId }] : []),
      { kind: "package", itemId: plan.packageId },
      ...(plan.tourIds || []).map((itemId) => ({ kind: "tour", itemId })),
    ]
      .filter((service) => service.itemId)
      .map((service) => {
        const result = enrich(service);
        return {
          ...result,
          itemName:
            result.listing?.title ||
            result.listing?.name ||
            result.listing?.airlineName ||
            `${serviceTypes[service.kind]} details`,
        };
      });
  const route = (trip.route || plan.route || []).map((stop) =>
    typeof stop === "string"
      ? {
          id: stop,
          name:
            catalog.destinations?.find((destination) => destination.id === stop)
              ?.name || stop,
          nights: plan.nightsByStop?.[stop],
        }
      : stop,
  );
  const start = draft.startDate || record.departureDate || record.checkInDate,
    end = draft.endDate || record.checkOutDate;
  const guests =
    numberValue(record.guests ?? record.passengers) ??
    (hasValue(record.adults ?? draft.adults)
      ? Number(record.adults ?? draft.adults) +
        Number(record.children ?? draft.children ?? 0) +
        Number(record.infants ?? draft.infants ?? 0)
      : undefined);
  const providers = [
    ...new Set(services.map((service) => service.providerName).filter(Boolean)),
  ];
  return {
    record,
    draft,
    plan,
    trip,
    traveler,
    services,
    route,
    start,
    end,
    guests,
    key: `${record.userId}/${record.id}`,
    name,
    email: traveler.email || record.passengerEmail || "",
    phone: traveler.phone || "",
    country: traveler.country || record.guestCountry || "",
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
    title:
      record.recordType === "booking"
        ? record.itemName ||
          services[0]?.listing?.title ||
          services[0]?.listing?.name ||
          "Booking request"
        : trip.name || plan.name || "Saved trip plan",
    provider:
      providers.join(", ") ||
      (record.recordType === "saved"
        ? `${services.length} selected ${services.length === 1 ? "service" : "services"}`
        : "Provider not recorded"),
    status:
      record.recordType === "saved"
        ? "saved"
        : statusKey(record.status || "pending"),
    kind: record.kind || services[0]?.kind,
    amount: numberValue(
      record.recordType === "saved"
        ? trip.estimate?.total
        : (record.requestedPriceLKR ?? record.totalAmount ?? record.totalPrice),
    ),
    currency: record.currency || trip.estimate?.currency || "LKR",
    duration: trip.duration || record.duration || draft.duration,
    dateLabel: draft.flexible
      ? "Flexible dates"
      : start
        ? `${formatDate(start)}${end && end !== start ? ` – ${formatDate(end)}` : ""}`
        : "Dates not set",
    created: record.createdAt || record.savedAt,
  };
}
export function filterRecords(views, { query, status, kind, dates, sort }) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return views
    .filter((view) => {
      const haystack = [
        view.name,
        view.email,
        view.phone,
        view.title,
        view.provider,
        view.record.id,
        view.record.tripGroupId,
        ...view.route.map((stop) => stop.name),
        ...view.services.flatMap((service) => [
          service.itemName,
          service.providerName,
          service.flightNo,
        ]),
      ]
        .join(" ")
        .toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return false;
      if (status !== "all" && view.status !== status) return false;
      if (
        kind !== "all" &&
        !view.services.some((service) => service.kind === kind)
      )
        return false;
      if (dates === "flexible") return Boolean(view.draft.flexible);
      if (dates !== "all") {
        const start = dateValue(view.start),
          end = dateValue(view.end || view.start),
          today = dateValue(todayKey());
        if (view.draft.flexible || !start) return false;
        if (dates === "upcoming" && start < today) return false;
        if (dates === "past" && end >= today) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "traveler") return a.name.localeCompare(b.name);
      if (sort === "travel") {
        const start = (view) =>
          !view.draft.flexible && dateValue(view.start)
            ? dateValue(view.start).getTime()
            : Infinity;
        return start(a) - start(b) || a.title.localeCompare(b.title);
      }
      const time = (view) => dateValue(view.created)?.getTime() || 0;
      return sort === "oldest" ? time(a) - time(b) : time(b) - time(a);
    });
}
export function exportCsv(views, tab) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [
    [
      "Reference",
      "Trip group",
      "Traveler",
      "Email",
      "Phone",
      "Trip or service",
      "Provider",
      "Service type",
      "Status",
      "Start date",
      "End date",
      "Flexible dates",
      "Guests",
      "Currency",
      "Requested estimate",
      "Created or saved",
    ],
    ...views.map((view) => [
      view.record.id,
      view.record.tripGroupId,
      view.name,
      view.email,
      view.phone,
      view.title,
      view.provider,
      view.record.recordType === "saved"
        ? "Saved plan"
        : serviceTypes[view.kind] || view.kind,
      statusLabel(view.status),
      view.draft.flexible ? "" : view.start,
      view.draft.flexible ? "" : view.end,
      view.draft.flexible ? "Yes" : "No",
      view.guests,
      view.currency,
      view.amount,
      formatDate(view.created, true),
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    ),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `skyconnect-${tab === "saved" ? "saved-plans" : "bookings"}-${todayKey()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
