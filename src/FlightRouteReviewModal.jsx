import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, Clock3, Plane, Ticket, X } from 'lucide-react';
import { RouteField } from './AirlineRouteReview.jsx';
import { formatPartnerSubmission } from './partnerApplication.js';
import { routeStatus, submittedCabins, submittedPrice } from './flightRouteDetails.js';

export default function FlightRouteReviewModal({ route, onClose, onStatus }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const status = routeStatus(route);
  const submitted = formatPartnerSubmission(route);
  const cabins = submittedCabins(route);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape' && !busy.current) { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.current.querySelectorAll('button:not(:disabled), [href], [tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [route.id]);

  const updateStatus = async value => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const result = await onStatus(route.id, value);
      if (result === false) setError('Unable to update this route. Please try again.');
      else onClose();
    } catch (cause) { setError(cause.message || 'Unable to update this route.'); }
    finally { busy.current = false; setSaving(false); }
  };

  return <div className="review-overlay flight-route-overlay" onMouseDown={event => {
    if (event.target === event.currentTarget && !busy.current) onClose();
  }}>
    <section ref={dialog} className="review-modal flight-route-modal" role="dialog" aria-modal="true" aria-labelledby="flight-route-title">
      <header className="review-modal-header">
        <div className="review-eyebrow"><span className="eyebrow">FLIGHT ROUTE APPLICATION</span><button className="review-close" aria-label="Close route details" disabled={saving} onClick={onClose}><X size={18}/></button></div>
        <div className="flight-review-heading"><span className="flight-review-icon"><Plane size={24}/></span><div><h2 id="flight-route-title">{route.flightNo || 'Flight route'}</h2>{route.airlineName && <p>{route.airlineName}</p>}</div><span className={`badge badge-${status.tone}`}>{status.label}</span></div>
        <div className="flight-request-date"><CalendarDays size={14}/><span>Request submitted</span>{submitted
          ? <time dateTime={submitted.dateTime}>{submitted.date} · {submitted.time} (Sri Lanka)</time>
          : <span>Date not recorded</span>}</div>
      </header>
      <div className="review-modal-body">
        <div className="flight-airports">
          {[['Departure', route.origin], ['Arrival', route.destination]].map(([label, airport]) => <div className="flight-airport" key={label}>
            <span>{label}</span><strong>{airport?.code || 'Not provided'}</strong>
            {airport?.name && <p>{airport.name}</p>}
            {(airport?.city || airport?.country) && <small>{[airport.city, airport.country].filter(Boolean).join(', ')}</small>}
          </div>)}
          <Plane className="flight-airports-arrow" size={20}/>
        </div>
        <section className="review-section"><h3><Clock3 size={16}/> Flight schedule</h3><div className="review-fields">
          <RouteField label="Effective date" value={route.startDate}/>
          <RouteField label="Flight duration" value={route.duration}/>
          <RouteField label="Departure time" value={route.departureTime}/>
          <RouteField label="Arrival time" value={route.arrivalTime}/>
          <RouteField label="Aircraft type" value={route.aircraft}/>
          <RouteField label="Frequency" value={route.frequency}/>
          <RouteField label="Cabin class" value={route.cabin}/>
          <RouteField label="Pricing currency" value={route.currency}/>
        </div></section>
        <section className="review-section"><h3><Ticket size={16}/> Ticket prices & available seats</h3>
          {cabins.length ? <div className="flight-fare-table"><table><thead><tr><th scope="col">CABIN</th><th scope="col">TICKET PRICE</th><th scope="col">AVAILABLE SEATS</th></tr></thead><tbody>{cabins.map(cabin => <tr key={cabin.key}>
            <th scope="row">{cabin.label}</th><td>{submittedPrice(cabin.price, cabin.currency)}</td><td>{cabin.seats ?? 'Not provided'}</td>
          </tr>)}</tbody></table></div> : <p className="review-helper">No cabin prices or seat counts were provided.</p>}
        </section>
        {error && <p className="flight-review-error" role="alert">{error}</p>}
      </div>
      <footer className="review-modal-footer"><button className="button button-secondary" disabled={saving} onClick={onClose}>Close</button>{status.pending && <div>
        <button className="button review-reject" disabled={saving} onClick={() => updateStatus('rejected')}><X size={15}/> Reject route</button>
        <button className="button button-primary" disabled={saving} onClick={() => updateStatus('approved')}><Check size={15}/>{saving ? 'Saving…' : 'Approve route'}</button>
      </div>}</footer>
    </section>
  </div>;
}
