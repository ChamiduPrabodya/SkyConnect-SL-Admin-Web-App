import React, { useState } from 'react';
import { Download, Eye, Plane } from 'lucide-react';
import FlightRouteReviewModal from './FlightRouteReviewModal.jsx';
import { formatPartnerSubmission, sortPartnerApplications } from './partnerApplication.js';
import { routeStatus } from './flightRouteDetails.js';

export default function FlightRoutesPage({ routes, filter, setFilter, onStatus }) {
  const [activeId, setActiveId] = useState(null);
  const activeRoute = routes.find(route => route.id === activeId);
  return <>
    <div className="section-title"><div><div className="eyebrow">AVIATION & AIRLINE OPERATIONS</div><h1>Flight routes & slots</h1><p>Review airline-submitted airports, schedules, cabin prices and available seats.</p></div><button className="button button-secondary" onClick={() => window.print()}><Download size={16}/> Export schedules</button></div>
    <div className="filter-row"><div className="filter-tabs">{['All', 'Pending', 'Approved', 'Rejected'].map(value => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{value}</button>)}</div><span className="result-count">{routes.length} flight schedules · Oldest requests first</span></div>
    <section className="panel table-panel"><div className="table-scroll"><table>
      <thead><tr><th>FLIGHT NO</th><th>ROUTE (SECTOR)</th><th>AIRLINE</th><th>SCHEDULE / AIRCRAFT</th><th aria-sort="ascending">REQUEST DATE</th><th>STATUS</th><th>APPLICATION</th></tr></thead>
      <tbody>{sortPartnerApplications(routes).map(route => {
        const status = routeStatus(route);
        const submitted = formatPartnerSubmission(route);
        const open = () => setActiveId(route.id);
        return <tr key={route.id} className="flight-route-row" tabIndex={0} aria-label={`View route ${route.flightNo || route.id}`} onClick={open} onKeyDown={event => {
          if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); open(); }
        }}>
          <td><div className="flight-route-cell"><span className="offer-thumb adventure"><Plane size={16}/></span><div><strong>{route.flightNo || 'Not provided'}</strong><small>{route.id}</small></div></div></td>
          <td><strong>{route.origin?.code || 'Not provided'}{route.origin?.city ? ` (${route.origin.city})` : ''} → {route.destination?.code || 'Not provided'}{route.destination?.city ? ` (${route.destination.city})` : ''}</strong></td>
          <td>{route.airlineName || 'Not provided'}</td>
          <td><span>{[route.aircraft, route.frequency].filter(Boolean).join(' · ') || 'Not provided'}</span><small>{[route.departureTime, route.arrivalTime].filter(Boolean).join(' – ')}</small></td>
          <td>{submitted ? <time className="application-date" dateTime={submitted.dateTime} title="Sri Lanka time (UTC+05:30)">{submitted.date}<small>{submitted.time} SL</small></time> : 'Date not recorded'}</td>
          <td><span className={`badge badge-${status.tone}`}>{status.label}</span></td>
          <td><button className="more-btn" onClick={event => { event.stopPropagation(); open(); }}><Eye size={14}/> {status.pending ? 'Review details' : 'View details'}</button></td>
        </tr>;
      })}</tbody>
    </table>{routes.length === 0 && <div className="empty-state">No flight routes match this filter.</div>}</div></section>
    {activeRoute && <FlightRouteReviewModal route={activeRoute} onClose={() => setActiveId(null)} onStatus={onStatus}/>}
  </>;
}
