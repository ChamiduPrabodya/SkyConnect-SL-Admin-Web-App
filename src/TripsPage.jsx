import React, { useEffect, useRef, useState } from "react";
import { collection, collectionGroup, onSnapshot } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  FileText,
  Hotel,
  Info,
  LoaderCircle,
  Mail,
  Phone,
  Plane,
  Printer,
  Route,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { db } from "./firebase";
import {
  dateValue,
  exportCsv,
  fieldLabel,
  filterRecords,
  formatDate,
  hasValue,
  money,
  recordView,
  serviceTypes,
  statusKey,
  statusLabel,
} from "./tripsView";
import "./trips.css";

const serviceIcons = {
  flight: Plane,
  stay: Hotel,
  tour: Sparkles,
  package: Ticket,
};
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
function handleTabKeys(event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(document.activeElement);
  if (index < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
          tabs.length;
  tabs[next].focus();
  tabs[next].click();
}
function Status({ value }) {
  const key = statusKey(value);
  return (
    <span className={`trips-status trips-status--${key.replaceAll(" ", "-")}`}>
      <i aria-hidden="true" />
      {statusLabel(key)}
    </span>
  );
}
function ServiceIcon({ kind, large = false }) {
  const Icon = serviceIcons[kind] || Bookmark;
  return (
    <span
      className={`trips-service-icon trips-service-icon--${kind || "saved"}${large ? " trips-service-icon--large" : ""}`}
    >
      <Icon size={large ? 22 : 17} aria-hidden="true" />
    </span>
  );
}
function FieldGrid({ rows }) {
  return (
    <dl className="trips-fields">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>
            {hasValue(value) ? (
              value
            ) : (
              <span className="trips-missing">Not provided</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function DetailTree({ value }) {
  if (!hasValue(value))
    return <span className="trips-missing">Not provided</span>;
  if (typeof value?.toDate === "function")
    return <span>{formatDate(value, true)}</span>;
  if (typeof value !== "object")
    return (
      <span>
        {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
      </span>
    );
  if (
    Array.isArray(value) &&
    value.every((item) => item === null || typeof item !== "object")
  )
    return value.length ? (
      <div className="trips-tags">
        {value.map((item, index) => (
          <span key={index}>{String(item)}</span>
        ))}
      </div>
    ) : (
      <span className="trips-missing">None recorded</span>
    );
  return (
    <dl className="trips-record-tree">
      {Object.entries(value).map(([key, item]) => (
        <div key={key}>
          <dt>
            {Array.isArray(value) ? `Item ${Number(key) + 1}` : fieldLabel(key)}
          </dt>
          <dd>
            <DetailTree value={item} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
function InfoCard({ title, icon: Icon, children, className = "", extra }) {
  return (
    <section className={`trips-info-card ${className}`}>
      <header>
        <h3>
          {Icon && <Icon size={17} aria-hidden="true" />}
          {title}
        </h3>
        {extra}
      </header>
      {children}
    </section>
  );
}
function ServiceCard({ service }) {
  const listing = service.listing || {};
  const location =
    listing.city ||
    listing.propertyLocation?.city ||
    listing.location?.city ||
    (typeof listing.destination === "string" ? listing.destination : "");
  const amount =
    service.requestedPriceLKR ?? service.totalAmount ?? service.totalPrice;
  const inclusions =
    listing.amenities || listing.inclusions || listing.includes || [];
  const airport = (value) =>
    typeof value === "object"
      ? value?.code || value?.city || value?.name
      : value;
  return (
    <article className="trips-service-card">
      <div className="trips-service-heading">
        <ServiceIcon kind={service.kind} />
        <div>
          <span className="trips-kicker">
            {serviceTypes[service.kind] || "Service"}
          </span>
          <h4>
            {service.itemName ||
              listing.title ||
              listing.name ||
              "Selected service"}
          </h4>
          <p>
            {service.providerName || "Provider not recorded"}
            {location && (
              <>
                {" "}
                <span aria-hidden="true">·</span> {location}
              </>
            )}
          </p>
        </div>
        <div className="trips-service-price">
          <strong>{money(amount, service.currency)}</strong>
          <span>Requested estimate</span>
        </div>
      </div>
      {service.kind === "flight" && (listing.origin || listing.destination) && (
        <div className="trips-flight-route">
          <div>
            <strong>{airport(listing.origin) || "Departure"}</strong>
            <span>{listing.origin?.city || "Origin"}</span>
          </div>
          <div className="trips-flight-line">
            <span />
            <Plane size={17} />
            <span />
          </div>
          <div>
            <strong>{airport(listing.destination) || "Arrival"}</strong>
            <span>{listing.destination?.city || "Destination"}</span>
          </div>
          <span className="trips-flight-code">
            {service.flightNo || listing.flightNo || listing.code}
          </span>
        </div>
      )}
      <div className="trips-service-facts">
        {[
          ...(service.kind === "flight"
            ? [
                service.cabin || listing.cabin,
                listing.baggage,
                listing.departureTime
                  ? `Departs ${listing.departureTime}`
                  : null,
              ]
            : []),
          ...(service.kind === "stay"
            ? [
                hasValue(service.rooms) ? plural(service.rooms, "room") : null,
                hasValue(service.nights)
                  ? plural(service.nights, "night")
                  : null,
                service.roomType || listing.roomType,
              ]
            : []),
          listing.duration,
        ]
          .filter(Boolean)
          .map((value, index) => (
            <span key={index}>
              <Check size={12} />
              {typeof value === "object"
                ? String(value.label || value.name || "")
                : value}
            </span>
          ))}
      </div>
      {Array.isArray(inclusions) && inclusions.length > 0 && (
        <div className="trips-tags trips-inclusions">
          {inclusions.slice(0, 6).map((value, index) => (
            <span key={index}>
              {typeof value === "string"
                ? value
                : value?.name || value?.label || "Included"}
            </span>
          ))}
          {inclusions.length > 6 && <span>+{inclusions.length - 6} more</span>}
        </div>
      )}
      {hasValue(service.unitPriceLKR) && (
        <p className="trips-price-basis">
          {hasValue(service.quantity) ? `${service.quantity} × ` : ""}
          {money(service.unitPriceLKR)}
          {service.priceBasis ? ` · ${service.priceBasis}` : ""}
        </p>
      )}
      {service.currentListing && (
        <p className="trips-context-note">
          <Info size={14} />
          Original listing details weren’t saved. Current listing information is
          shown.
        </p>
      )}
      <details className="trips-disclosure">
        <summary>
          View all service details <ChevronDown size={15} />
        </summary>
        <DetailTree
          value={{
            ...(service.listing || {}),
            ...(hasValue(service.quantity)
              ? { quantity: service.quantity }
              : {}),
            ...(service.priceBasis ? { priceBasis: service.priceBasis } : {}),
          }}
        />
      </details>
    </article>
  );
}
function RouteOverview({ route }) {
  if (!route.length)
    return (
      <p className="trips-context-note">
        No destinations were recorded for this plan.
      </p>
    );
  return (
    <ol className="trips-route-stops">
      {route.map((stop, index) => (
        <li key={`${stop.id || stop.name}-${index}`}>
          <span className="trips-stop-dot">{index + 1}</span>
          <div>
            <strong>{stop.name}</strong>
            <span>
              {stop.stayExcluded
                ? "Stay arranged separately"
                : hasValue(stop.nights)
                  ? plural(stop.nights, "night")
                  : "Route stop"}
            </span>
          </div>
          {index < route.length - 1 && (
            <ChevronRight size={15} className="trips-stop-arrow" />
          )}
        </li>
      ))}
    </ol>
  );
}

export function TripRecordDetails({ record, onNotice = () => {}, ...catalog }) {
  const view = recordView(record, catalog),
    { draft, trip } = view;
  const [detailTab, setDetailTab] = useState("overview");
  const copy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value));
      onNotice(`${label} copied.`);
    } catch {
      onNotice("Copy isn’t available here. Select and copy the text instead.");
    }
  };
  return (
    <div className="trips-detail-content">
      <div
        className="trips-detail-tabs"
        role="tablist"
        aria-label="Trip detail sections"
        onKeyDown={handleTabKeys}
      >
        {[
          ["overview", "Overview", FileText],
          ["itinerary", "Itinerary", Route],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            id={`trip-tab-${key}`}
            role="tab"
            aria-selected={detailTab === key}
            tabIndex={detailTab === key ? 0 : -1}
            aria-controls={`trip-panel-${key}`}
            onClick={() => setDetailTab(key)}
          >
            <Icon size={16} />
            {label}
            {key === "itinerary" && trip.itinerary?.length > 0 && (
              <span>{trip.itinerary.length} days</span>
            )}
          </button>
        ))}
      </div>
      <div
        id="trip-panel-overview"
        role="tabpanel"
        aria-labelledby="trip-tab-overview"
        hidden={detailTab !== "overview"}
        className="trips-print-section"
      >
        <div className="trips-detail-grid">
          <div className="trips-detail-main">
            <InfoCard title="Trip overview" icon={Route}>
              <RouteOverview route={view.route} />
              <FieldGrid
                rows={[
                  ["Travel dates", view.dateLabel],
                  [
                    "Duration",
                    view.duration ? plural(view.duration, "day") : undefined,
                  ],
                  [
                    "Travelers",
                    hasValue(view.guests)
                      ? plural(view.guests, "guest")
                      : undefined,
                  ],
                  [
                    "Adults / children / infants",
                    hasValue(record.adults ?? draft.adults)
                      ? `${record.adults ?? draft.adults} / ${record.children ?? draft.children ?? 0} / ${record.infants ?? draft.infants ?? 0}`
                      : undefined,
                  ],
                  ["Travel group", draft.group],
                  ["Food preference", draft.food],
                ]}
              />
              {draft.interests?.length > 0 && (
                <div className="trips-interest-row">
                  <span>Interests</span>
                  <div className="trips-tags">
                    {draft.interests.map((interest) => (
                      <span key={interest}>{interest}</span>
                    ))}
                  </div>
                </div>
              )}
            </InfoCard>
            <InfoCard
              title={
                record.recordType === "saved"
                  ? "Selected services"
                  : "Requested service"
              }
              icon={Ticket}
              extra={
                <span className="trips-count">{view.services.length}</span>
              }
            >
              {view.services.length ? (
                view.services.map((service, index) => (
                  <ServiceCard
                    service={service}
                    key={`${service.kind}-${service.itemId || service.id || index}`}
                  />
                ))
              ) : (
                <p className="trips-context-note">
                  No services were selected for this plan.
                </p>
              )}
            </InfoCard>
            {trip.estimate && (
              <InfoCard title="Trip estimate" icon={FileText}>
                <div className="trips-estimate-lines">
                  {(trip.estimate.items || []).map((item, index) => (
                    <div key={index}>
                      <span>{item.label}</span>
                      <strong>
                        {money(item.value, trip.estimate.currency)}
                      </strong>
                    </div>
                  ))}
                  <div className="trips-estimate-total">
                    <span>Total estimated cost</span>
                    <strong>
                      {money(trip.estimate.total, trip.estimate.currency)}
                    </strong>
                  </div>
                </div>
                <p className="trips-context-note">
                  <Info size={14} />
                  Estimates show requested costs. Payment is not recorded here.
                </p>
              </InfoCard>
            )}
          </div>
          <aside className="trips-detail-aside">
            <InfoCard title="Traveler" icon={Users}>
              <div className="trips-contact-person">
                <span className="trips-avatar trips-avatar--large">
                  {view.initials}
                </span>
                <div>
                  <strong>{view.name}</strong>
                  <span>{view.country || "Country not provided"}</span>
                </div>
              </div>
              <div className="trips-contact-links">
                {[
                  [
                    Mail,
                    "Email",
                    view.email,
                    `mailto:${encodeURIComponent(view.email)}`,
                  ],
                  [
                    Phone,
                    "Phone",
                    view.phone,
                    `tel:${encodeURIComponent(view.phone)}`,
                  ],
                ].map(([Icon, label, value, href]) => (
                  <div key={label}>
                    <Icon size={16} />
                    <div>
                      <span>{label}</span>
                      {value ? (
                        <a href={href}>{value}</a>
                      ) : (
                        <span className="trips-missing">Not provided</span>
                      )}
                    </div>
                    {value && (
                      <button
                        className="trips-icon-button"
                        aria-label={`Copy traveler ${label.toLowerCase()}`}
                        onClick={() => copy(value, label)}
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="trips-contact-note">
                <ShieldCheck size={14} />
                {record.recordType === "saved"
                  ? "Saved plans are visible to the traveler and admins."
                  : "Traveler details are visible to admins and the assigned provider."}
              </p>
            </InfoCard>
            <InfoCard
              title={
                record.recordType === "saved"
                  ? "Plan information"
                  : "Request information"
              }
              icon={Clock3}
            >
              <div className="trips-request-state">
                <Status value={view.status} />
                <p>
                  {view.status === "pending"
                    ? "Waiting for the selected provider to respond."
                    : view.status === "saved"
                      ? "Saved by the traveler. Providers receive details only after a booking request."
                      : view.status === "confirmed"
                        ? "The provider has accepted this request."
                        : `This request is ${statusLabel(view.status).toLowerCase()}.`}
                </p>
              </div>
              <dl className="trips-meta-list">
                <div>
                  <dt>
                    {record.recordType === "saved"
                      ? "Saved on"
                      : "Requested on"}
                  </dt>
                  <dd>{formatDate(view.created, true)}</dd>
                </div>
                {record.updatedAt && (
                  <div>
                    <dt>Last updated</dt>
                    <dd>{formatDate(record.updatedAt, true)}</dd>
                  </div>
                )}
                <div>
                  <dt>Provider</dt>
                  <dd>{view.provider}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd className="trips-copy-reference">
                    <span>{record.id}</span>
                    <button
                      className="trips-icon-button"
                      aria-label="Copy reference"
                      onClick={() => copy(record.id, "Reference")}
                    >
                      <Copy size={14} />
                    </button>
                  </dd>
                </div>
                {record.tripGroupId && (
                  <div>
                    <dt>Trip group</dt>
                    <dd>{record.tripGroupId}</dd>
                  </div>
                )}
              </dl>
            </InfoCard>
          </aside>
        </div>
      </div>
      <div
        id="trip-panel-itinerary"
        role="tabpanel"
        aria-labelledby="trip-tab-itinerary"
        hidden={detailTab !== "itinerary"}
        className="trips-print-section"
      >
        <InfoCard
          title="Day-by-day itinerary"
          icon={CalendarDays}
          extra={
            trip.itinerary?.length ? (
              <span className="trips-count">
                {plural(trip.itinerary.length, "day")}
              </span>
            ) : null
          }
        >
          {trip.itinerary?.length ? (
            <ol className="trips-itinerary">
              {trip.itinerary.map((day, index) => (
                <li key={`${day.day}-${index}`}>
                  <span className="trips-day-number">
                    <small>DAY</small>
                    {day.day}
                  </span>
                  <article>
                    <div className="trips-day-heading">
                      <h4>{day.destination || "Explore & discover"}</h4>
                      {!draft.flexible && dateValue(view.start) && (
                        <span>
                          {formatDate(
                            new Date(
                              dateValue(view.start).getTime() +
                                (Number(day.day) - 1) * 86400000,
                            ),
                          )}
                        </span>
                      )}
                    </div>
                    {day.text && <p>{day.text}</p>}
                    {day.travel && (
                      <div className="trips-travel-note">
                        <Route size={15} />
                        <DetailTree value={day.travel} />
                      </div>
                    )}
                    {day.activities?.length > 0 && (
                      <ul>
                        {day.activities.map((activity, activityIndex) => (
                          <li key={activityIndex}>
                            <span className="trips-activity-dot" />
                            <div>
                              <strong>
                                {activity.name || "Planned activity"}
                              </strong>
                              {(activity.time || activity.duration) && (
                                <span>
                                  <Clock3 size={12} />
                                  {[activity.time, activity.duration]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <div className="trips-small-empty">
              <Route size={28} />
              <h4>No day-by-day schedule recorded</h4>
              <p>
                The traveler’s route and service details are available in
                Overview.
              </p>
              <button
                className="trips-button trips-button--secondary"
                onClick={() => setDetailTab("overview")}
              >
                Back to overview <ArrowRight size={15} />
              </button>
            </div>
          )}
        </InfoCard>
      </div>
      <details className="trips-additional">
        <summary>
          <div>
            <FileText size={17} />
            <span>
              <strong>Additional recorded details</strong>
              <small>
                All information saved with this{" "}
                {record.recordType === "saved" ? "plan" : "request"}.
              </small>
            </span>
          </div>
          <ChevronDown size={17} />
        </summary>
        <DetailTree value={record} />
      </details>
    </div>
  );
}

function RecordRow({ view, onOpen }) {
  return (
    <tr>
      <td>
        <div className="trips-traveler-cell">
          <span className="trips-avatar">{view.initials}</span>
          <div>
            <strong>{view.name}</strong>
            <span>
              {view.email || view.country || "Contact details not provided"}
            </span>
          </div>
        </div>
      </td>
      <td>
        <div className="trips-title-cell">
          <ServiceIcon
            kind={view.record.recordType === "saved" ? "saved" : view.kind}
          />
          <div>
            <button onClick={onOpen} className="trips-record-title">
              {view.title}
            </button>
            <span>{view.provider}</span>
          </div>
        </div>
      </td>
      <td data-label="Travel dates">
        <div className="trips-date-cell">
          <strong>{view.dateLabel}</strong>
          <span>
            {[
              view.duration ? plural(view.duration, "day") : null,
              hasValue(view.guests) ? plural(view.guests, "guest") : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Details not provided"}
          </span>
        </div>
      </td>
      <td data-label="Estimate">
        <div className="trips-amount-cell">
          <strong>
            {hasValue(view.amount)
              ? new Intl.NumberFormat("en-GB", {
                  maximumFractionDigits: 2,
                }).format(view.amount)
              : "—"}
          </strong>
          <span>{hasValue(view.amount) ? view.currency : "Not recorded"}</span>
        </div>
      </td>
      <td>
        <Status value={view.status} />
      </td>
      <td>
        <button
          onClick={onOpen}
          className="trips-open-button"
          aria-label={`View details for ${view.title}, ${view.name}`}
        >
          View details <ArrowUpRight size={15} />
        </button>
      </td>
    </tr>
  );
}

export default function TripsPage({ search = "", onSearchChange, ...catalog }) {
  const [bookings, setBookings] = useState([]),
    [saved, setSaved] = useState([]);
  const [loaded, setLoaded] = useState({}),
    [errors, setErrors] = useState({}),
    [retry, setRetry] = useState(0);
  const [tab, setTab] = useState("booking"),
    [selected, setSelected] = useState(null);
  const [query, setQuery] = useState(search),
    [status, setStatus] = useState("all"),
    [kind, setKind] = useState("all"),
    [dates, setDates] = useState("all"),
    [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [notice, setNotice] = useState("");
  const headingRef = useRef(null),
    listRef = useRef(null),
    previousScroll = useRef(0);
  useEffect(() => setQuery(search), [search]);
  useEffect(() => {
    let active = true;
    setLoaded({});
    setErrors({});
    const listen = (source, name, setter) =>
      onSnapshot(
        source,
        (snapshot) => {
          if (!active) return;
          setter(
            snapshot.docs.map((document) => ({
              ...document.data(),
              id: document.id,
              userId:
                name === "saved"
                  ? document.ref.parent.parent.id
                  : document.data().userId,
              recordType: name,
            })),
          );
          setLoaded((value) => ({ ...value, [name]: true }));
          setErrors((value) => ({ ...value, [name]: "" }));
        },
        (error) => {
          if (active) {
            setErrors((value) => ({ ...value, [name]: error.message }));
            setLoaded((value) => ({ ...value, [name]: true }));
          }
        },
      );
    const stops = [
      listen(collection(db, "bookings"), "booking", setBookings),
      listen(collectionGroup(db, "savedPlans"), "saved", setSaved),
    ];
    return () => {
      active = false;
      stops.forEach((stop) => stop());
    };
  }, [retry]);
  useEffect(() => {
    setPage(1);
  }, [tab, query, status, kind, dates, sort, pageSize]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);
  const bookingViews = bookings.map((record) => recordView(record, catalog)),
    savedViews = saved.map((record) => recordView(record, catalog));
  const views = tab === "booking" ? bookingViews : savedViews;
  const filtered = filterRecords(views, { query, status, kind, dates, sort });
  const active = views.find((view) => view.key === selected);
  const pending = bookingViews.filter(
      (view) => view.status === "pending",
    ).length,
    confirmed = bookingViews.filter(
      (view) => view.status === "confirmed",
    ).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize,
    visible = filtered.slice(start, start + pageSize);
  const filterCount = [
    status !== "all",
    kind !== "all",
    dates !== "all",
  ].filter(Boolean).length;
  const changeQuery = (value) => {
    setQuery(value);
    onSearchChange?.(value);
  };
  const clearFilters = () => {
    changeQuery("");
    setStatus("all");
    setKind("all");
    setDates("all");
    setSort("newest");
  };
  const changeTab = (value) => {
    setTab(value);
    setSelected(null);
    setStatus("all");
    setKind("all");
    setDates("all");
  };
  const open = (view) => {
    previousScroll.current = window.scrollY;
    setSelected(view.key);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  };
  const back = () => {
    setSelected(null);
    requestAnimationFrame(() => {
      listRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: previousScroll.current, behavior: "instant" });
    });
  };
  const showPending = () => {
    changeTab("booking");
    setStatus("pending");
    changeQuery("");
    requestAnimationFrame(() =>
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };
  const related = active?.record.tripGroupId
    ? bookingViews.filter(
        (view) =>
          view.record.tripGroupId === active.record.tripGroupId &&
          view.record.userId === active.record.userId &&
          view.key !== active.key,
      )
    : [];
  const statuses = [
    ...new Set([
      "pending",
      "confirmed",
      "rejected",
      "checked in",
      "completed",
      "cancelled",
      ...bookingViews.map((view) => view.status),
    ]),
  ];
  const exportRows = () => {
    exportCsv(filtered, tab);
    setNotice(`${plural(filtered.length, "record")} exported to CSV.`);
  };
  const pendingShare = bookingViews.length
    ? Math.round((pending / bookingViews.length) * 100)
    : 0;
  const bookingsAvailable = loaded.booking && !errors.booking;
  const savedAvailable = loaded.saved && !errors.saved;
  return (
    <div className="trips-page">
      <div className="trips-notice" role="status" aria-live="polite">
        {notice && (
          <>
            <CheckCircle2 size={17} />
            <span>{notice}</span>
            <button
              className="trips-icon-button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </>
        )}
      </div>
      {active ? (
        <>
          <div className="trips-detail-toolbar">
            <button className="trips-back" onClick={back}>
              <ArrowLeft size={16} />
              Back to {tab === "saved" ? "saved plans" : "booking requests"}
            </button>
            <button
              className="trips-button trips-button--secondary"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              Print summary
            </button>
          </div>
          <header className="trips-detail-hero">
            <div className="trips-detail-hero-top">
              <span className="trips-eyebrow">
                {tab === "saved" ? "SAVED TRIP PLAN" : "BOOKING REQUEST"}
              </span>
              <Status value={active.status} />
            </div>
            <div className="trips-detail-hero-heading">
              <ServiceIcon
                kind={tab === "saved" ? "saved" : active.kind}
                large
              />
              <div>
                <h1 ref={headingRef} tabIndex={-1}>
                  {active.title}
                </h1>
                <p>
                  <Users size={14} />
                  {active.name}
                  <span>·</span>
                  <CalendarDays size={14} />
                  {active.dateLabel}
                </p>
              </div>
              <div className="trips-hero-amount">
                <span>
                  {tab === "saved" ? "Trip estimate" : "Requested estimate"}
                </span>
                <strong>{money(active.amount, active.currency)}</strong>
              </div>
            </div>
          </header>
          {related.length > 0 && (
            <div className="trips-related">
              <span>
                <Route size={15} />
                Also in this trip
              </span>
              {related.map((view) => (
                <button
                  key={view.key}
                  onClick={() => {
                    setSelected(view.key);
                    setNotice("");
                    requestAnimationFrame(() =>
                      headingRef.current?.focus({ preventScroll: true }),
                    );
                  }}
                >
                  <ServiceIcon kind={view.kind} />
                  {view.title}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}
          <TripRecordDetails
            key={active.key}
            record={active.record}
            {...catalog}
            onNotice={setNotice}
          />
        </>
      ) : (
        <>
          <header className="trips-page-title">
            <div>
              <span className="trips-eyebrow">TRAVELER OPERATIONS</span>
              <h1>
                Trips & bookings<span className="trips-title-dot">.</span>
              </h1>
              <p>
                Every journey, from the first saved plan to the final booking.
              </p>
            </div>
            <div className="trips-title-actions">
              <span
                className={`trips-live${Object.values(errors).some(Boolean) ? " trips-live--error" : ""}`}
              >
                <i />
                {Object.values(errors).some(Boolean)
                  ? "Connection issue"
                  : loaded.booking && loaded.saved
                    ? "Auto updates"
                    : "Connecting…"}
              </span>
              <button
                className="trips-button trips-button--secondary"
                disabled={
                  !loaded[tab] || Boolean(errors[tab]) || !filtered.length
                }
                onClick={exportRows}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </header>
          <div className="trips-metrics">
            <article className="trips-metric trips-metric--pending">
              <div className="trips-metric-top">
                <span>Pending requests</span>
                <span className="trips-metric-icon">
                  <Clock3 size={18} />
                </span>
              </div>
              <strong>{bookingsAvailable ? pending : "—"}</strong>
              <div className="trips-metric-bottom">
                <span>
                  {!bookingsAvailable
                    ? "Waiting for updates"
                    : pending
                      ? "Awaiting provider response"
                      : "No requests waiting"}
                </span>
                <button
                  aria-label="View pending requests"
                  disabled={!bookingsAvailable}
                  onClick={showPending}
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </article>
            {[
              [
                Ticket,
                "Booking requests",
                bookingsAvailable ? bookings.length : "—",
                bookingsAvailable
                  ? `${confirmed} confirmed`
                  : "Waiting for updates",
                "blue",
              ],
              [
                Bookmark,
                "Saved plans",
                savedAvailable ? saved.length : "—",
                "Ideas ready for the next step",
                "teal",
              ],
              [
                Users,
                "Travelers",
                bookingsAvailable && savedAvailable
                  ? new Set(
                      [...bookings, ...saved]
                        .map((record) => record.userId)
                        .filter(Boolean),
                    ).size
                  : "—",
                "Across saved plans & requests",
                "purple",
              ],
            ].map(([Icon, label, value, sub, tint]) => (
              <article
                className={`trips-metric trips-metric--${tint}`}
                key={label}
              >
                <div className="trips-metric-top">
                  <span>{label}</span>
                  <span className="trips-metric-icon">
                    <Icon size={18} />
                  </span>
                </div>
                <strong>{value}</strong>
                <div className="trips-metric-bottom">
                  <span>{sub}</span>
                </div>
              </article>
            ))}
          </div>
          {loaded.booking && !errors.booking && pending > 0 && (
            <div className="trips-attention">
              <span className="trips-attention-icon">
                <Clock3 size={19} />
              </span>
              <div>
                <strong>
                  {plural(pending, "request")} waiting for a provider response
                </strong>
                <p>
                  {pendingShare}% of booking requests are pending. Open a
                  request to review its traveler and service details.
                </p>
              </div>
              <button onClick={showPending}>
                View pending <ArrowRight size={16} />
              </button>
            </div>
          )}
          <section
            className="trips-list-panel"
            ref={listRef}
            tabIndex={-1}
            aria-label="Trip records"
          >
            <div className="trips-list-top">
              <div
                className="trips-view-tabs"
                role="tablist"
                aria-label="Trip records view"
                onKeyDown={handleTabKeys}
              >
                {[
                  ["booking", "Booking requests", Ticket, bookings.length],
                  ["saved", "Saved plans", Bookmark, saved.length],
                ].map(([key, title, Icon, count]) => (
                  <button
                    key={key}
                    id={`trip-list-tab-${key}`}
                    role="tab"
                    aria-selected={tab === key}
                    tabIndex={tab === key ? 0 : -1}
                    aria-controls="trip-list-results"
                    onClick={() => changeTab(key)}
                  >
                    <Icon size={16} />
                    {title}
                    <span>{loaded[key] && !errors[key] ? count : "—"}</span>
                  </button>
                ))}
              </div>
              <span className="trips-list-hint">
                <ShieldCheck size={14} />
                Admin view · all providers
              </span>
            </div>
            <div className="trips-search-bar">
              <label className="trips-search">
                <Search size={18} />
                <input
                  type="search"
                  aria-label="Search trips and bookings"
                  placeholder="Search traveler, service, provider or reference…"
                  value={query}
                  onChange={(event) => changeQuery(event.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear search"
                    onClick={() => changeQuery("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </label>
              <div className="trips-sort">
                <label htmlFor="trip-sort">Sort by</label>
                <select
                  id="trip-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="travel">Travel date</option>
                  <option value="traveler">Traveler A–Z</option>
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
            <div className="trips-filter-bar">
              <span className="trips-filter-label">
                <SlidersHorizontal size={15} />
                Filters{filterCount > 0 && <b>{filterCount}</b>}
              </span>
              <label className="trips-select">
                <span className="trips-sr-only">Service type</span>
                <select
                  aria-label="Service type"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                >
                  <option value="all">All services</option>
                  {Object.entries(serviceTypes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} />
              </label>
              {tab === "booking" && (
                <label className="trips-select">
                  <span className="trips-sr-only">Booking status</span>
                  <select
                    aria-label="Booking status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {statuses.map((key) => (
                      <option key={key} value={key}>
                        {statusLabel(key)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>
              )}
              <label className="trips-select">
                <span className="trips-sr-only">Travel dates</span>
                <select
                  aria-label="Travel dates"
                  value={dates}
                  onChange={(event) => setDates(event.target.value)}
                >
                  <option value="all">Any travel date</option>
                  <option value="upcoming">Upcoming trips</option>
                  <option value="past">Past trips</option>
                  <option value="flexible">Flexible dates</option>
                </select>
                <ChevronDown size={13} />
              </label>
              {(query || filterCount > 0) && (
                <button className="trips-reset" onClick={clearFilters}>
                  <X size={13} />
                  Reset
                </button>
              )}
              <span className="trips-results-count" aria-live="polite">
                {loaded[tab]
                  ? `${filtered.length} ${tab === "saved" ? "plans" : "requests"}`
                  : "Loading…"}
              </span>
            </div>
            <div
              id="trip-list-results"
              role="tabpanel"
              aria-labelledby={`trip-list-tab-${tab}`}
              aria-busy={!loaded[tab]}
            >
              {errors[tab] ? (
                <div className="trips-empty" role="alert">
                  <span className="trips-empty-icon">
                    <Info size={30} />
                  </span>
                  <h2>
                    We couldn’t load these{" "}
                    {tab === "saved" ? "plans" : "requests"}
                  </h2>
                  <p>Check your connection and try again.</p>
                  <details>
                    <summary>Show error details</summary>
                    <p>{errors[tab]}</p>
                  </details>
                  <button
                    className="trips-button trips-button--primary"
                    onClick={() => setRetry((value) => value + 1)}
                  >
                    Try again <ArrowRight size={15} />
                  </button>
                </div>
              ) : !loaded[tab] ? (
                <div className="trips-loading" role="status">
                  <LoaderCircle size={23} />
                  <strong>
                    Loading your{" "}
                    {tab === "saved" ? "saved plans" : "booking requests"}…
                  </strong>
                  <span>Bringing the latest trip details together.</span>
                  <div className="trips-skeleton" />
                  <div className="trips-skeleton" />
                  <div className="trips-skeleton" />
                </div>
              ) : !filtered.length ? (
                <div className="trips-empty">
                  <span className="trips-empty-icon">
                    {views.length ? (
                      <Search size={30} />
                    ) : tab === "saved" ? (
                      <Bookmark size={30} />
                    ) : (
                      <Ticket size={30} />
                    )}
                  </span>
                  <h2>
                    {views.length
                      ? "No matching trips"
                      : tab === "saved"
                        ? "The next journey starts here"
                        : "No booking requests yet"}
                  </h2>
                  <p>
                    {views.length
                      ? "Try a traveler name, another provider, or fewer filters."
                      : tab === "saved"
                        ? "Plans will appear here when travelers save their trips."
                        : "When a traveler requests a flight, stay or activity, you’ll find it here."}
                  </p>
                  {views.length > 0 && (
                    <button
                      className="trips-button trips-button--primary"
                      onClick={clearFilters}
                    >
                      Clear search & filters <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="trips-table-wrap">
                  <table className="trips-table">
                    <thead>
                      <tr>
                        <th>Traveler</th>
                        <th>
                          {tab === "saved" ? "Trip plan" : "Service & provider"}
                        </th>
                        <th>Travel dates</th>
                        <th>Estimate</th>
                        <th>Status</th>
                        <th>
                          <span className="trips-sr-only">Open details</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((view) => (
                        <RecordRow
                          key={view.key}
                          view={view}
                          onOpen={() => open(view)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {loaded[tab] && !errors[tab] && filtered.length > 0 && (
              <footer className="trips-pagination">
                <span>
                  Showing{" "}
                  <strong>
                    {start + 1}–{Math.min(start + pageSize, filtered.length)}
                  </strong>{" "}
                  of <strong>{filtered.length}</strong>
                </span>
                <div>
                  <label>
                    Rows per page
                    <select
                      aria-label="Rows per page"
                      value={pageSize}
                      onChange={(event) =>
                        setPageSize(Number(event.target.value))
                      }
                    >
                      {[10, 20, 50].map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="trips-icon-button"
                    aria-label="Previous page"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    className="trips-icon-button"
                    aria-label="Next page"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </footer>
            )}
          </section>
          <p className="trips-page-footnote">
            <Info size={14} />
            Saved plans stay with the traveler. Providers receive details after
            a booking request is sent.
          </p>
        </>
      )}
    </div>
  );
}
