import React from 'react';
import { CalendarDays, Clock3, MapPin, Plane, Ticket, Users } from 'lucide-react';

export function RouteField({ label, value }) {
  return <div className="review-field"><span>{label}</span><strong>{value === null || value === undefined || value === '' ? 'Not provided' : value}</strong></div>;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function formatPrice(price, currency) {
  if (price === null || price === undefined || price === '') return 'Not provided';
  if (!Number.isFinite(Number(price))) return 'Not provided';
  const amount = Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${currency} ${amount}` : `${amount} (currency not provided)`;
}

export default function AirlineRouteReview({ routes = [] }) {
  return <div className="review-section airline-route-section">
    <h3><Plane size={16}/> Submitted airline routes <span className="route-count">{routes.length}</span></h3>
    <p className="review-helper">Airports, schedules, prices, and seat inventory from the supplied partner mock data.</p>
    {routes.length === 0 ? <div className="route-empty"><Plane size={20}/><strong>No routes submitted</strong><span>Route, pricing, and seat details have not been provided.</span></div> : routes.map((route, index) => <article className="airline-route-card" key={route.id || index} aria-label={`Submitted route ${index + 1}`}>
      <header className="airline-route-header"><strong>Route {index + 1}</strong><span>{route.flightNumber || 'Flight number not provided'}</span></header>
      <div className="route-overview">
        <div><span>Departure</span><strong>{route.originIataCode || 'Not provided'}</strong><p>{[route.originCity, route.originCountry].filter(Boolean).join(', ') || 'Location not provided'}</p></div>
        <div className="route-direction"><Plane size={22}/><span>{route.stops === 0 ? 'Direct flight' : route.stops != null ? `${route.stops} stop${route.stops === 1 ? '' : 's'}` : 'Flight route'}</span></div>
        <div><span>Arrival</span><strong>{route.destinationIataCode || 'Not provided'}</strong><p>{[route.destinationCity, route.destinationCountry].filter(Boolean).join(', ') || 'Location not provided'}</p></div>
      </div>
      <section className="route-detail-section"><h4><MapPin size={14}/> Departure & arrival</h4><div className="review-fields">
        <RouteField label="Origin IATA code" value={route.originIataCode}/>
        <RouteField label="Origin city" value={route.originCity}/>
        <RouteField label="Origin country" value={route.originCountry}/>
        <RouteField label="Departure airport" value={route.origin?.name}/>
        <RouteField label="Destination IATA code" value={route.destinationIataCode}/>
        <RouteField label="Destination city" value={route.destinationCity}/>
        <RouteField label="Destination country" value={route.destinationCountry}/>
        <RouteField label="Arrival airport" value={route.destination?.name}/>
      </div></section>
      <section className="route-detail-section"><h4><CalendarDays size={14}/> Flight details</h4><div className="review-fields">
        <RouteField label="Effective date" value={route.effectiveDate}/>
        <RouteField label="Flight number" value={route.flightNumber}/>
        <RouteField label="Flight duration" value={formatDuration(route.durationMinutes)}/>
        <RouteField label="Aircraft type" value={route.aircraftType}/>
        <RouteField label="Departure time" value={route.departureTime}/>
        <RouteField label="Arrival time" value={route.arrivalTime}/>
      </div><p className="review-helper"><Clock3 size={12}/> Times are local to each airport. +1 indicates arrival on the following day.</p></section>
      <section className="route-detail-section"><h4><Ticket size={14}/> Frequency & cabin class</h4><div className="review-fields">
        <RouteField label="Frequency" value={route.frequency}/>
        <RouteField label="Cabin class" value={route.cabinClass}/>
        <RouteField label="Pricing currency" value={route.currency}/>
        <RouteField label="Route status" value={route.status}/>
      </div></section>
      <section className="route-detail-section"><h4><Users size={14}/> Ticket pricing & available seats</h4>
        {route.cabins?.length ? <div className="route-cabin-table"><table><thead><tr><th scope="col">CABIN CLASS</th><th scope="col">TICKET PRICE{route.currency ? ` (${route.currency})` : ''}</th><th scope="col">AVAILABLE SEATS</th></tr></thead><tbody>{route.cabins.map((cabin, cabinIndex) => <tr key={`${cabin.className}-${cabinIndex}`}><th scope="row">{cabin.className || 'Not provided'}</th><td>{formatPrice(cabin.price, route.currency)}</td><td>{cabin.seats ?? 'Not provided'}</td></tr>)}</tbody></table></div> : <p className="review-helper">Cabin prices and seat inventory have not been provided.</p>}
      </section>
    </article>)}
  </div>;
}
