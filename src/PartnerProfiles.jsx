import React, { useState } from 'react';
import { Building2, FileText, Image as ImageIcon, Plane, Wifi } from 'lucide-react';
import { RouteField } from './AirlineRouteReview.jsx';

export function AirlineProfile({ partner }) {
  return <section className="review-section"><h3><Plane size={16}/> Airline profile</h3><div className="review-fields">
    <RouteField label="Airline IATA code" value={partner.iataCode}/>
    <RouteField label="ICAO code" value={partner.icaoCode}/>
    <RouteField label="Headquarters" value={partner.headquarters}/>
    <RouteField label="Founded" value={partner.founded}/>
    <RouteField label="Fleet size" value={partner.fleetSize != null ? `${partner.fleetSize} aircraft` : null}/>
    <RouteField label="Total flights" value={partner.totalFlights}/>
    <RouteField label="On-time rate" value={partner.onTimeRate != null ? `${partner.onTimeRate}%` : null}/>
    <RouteField label="Rating" value={partner.rating != null ? `${partner.rating} / 5` : null}/>
  </div></section>;
}

function HotelPhoto({ src, name, index }) {
  const [failed, setFailed] = useState(false);
  return <div className="hotel-review-photo">{failed ? <span><ImageIcon size={20}/> Photo unavailable</span> : <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${name} photo ${index + 1}`}><img src={src} alt={`${name} · property photo ${index + 1}`} loading="lazy" onError={() => setFailed(true)}/></a>}</div>;
}

export function HotelProfile({ hotel }) {
  const price = hotel.pricePerNight == null ? null : `${hotel.currency ? `${hotel.currency} ` : ''}${Number(hotel.pricePerNight).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return <>
    <section className="review-section"><h3><Building2 size={16}/> Hotel profile</h3><div className="review-fields">
      <RouteField label="Property type" value={hotel.type}/>
      <RouteField label="Category" value={hotel.category}/>
      <RouteField label="SLTDA registration" value={hotel.sltdaReg}/>
      <RouteField label="Rating" value={hotel.rating != null ? `${hotel.rating} / 5` : null}/>
      <RouteField label="Review count" value={hotel.reviewsCount}/>
      <RouteField label="Price per night" value={price}/>
      <RouteField label="Total rooms" value={hotel.totalRooms}/>
      <RouteField label="Available rooms" value={hotel.availableRooms}/>
      <RouteField label="City" value={hotel.location?.city}/>
      <RouteField label="District" value={hotel.location?.district}/>
      <RouteField label="Latitude" value={hotel.location?.latitude}/>
      <RouteField label="Longitude" value={hotel.location?.longitude}/>
    </div>{!hotel.currency && <p className="review-helper">The supplied hotel mock data does not specify the nightly-rate currency.</p>}</section>
    <section className="review-section"><h3><Wifi size={16}/> Facilities</h3>{hotel.features?.length ? <div className="hotel-review-facilities">{hotel.features.map(feature => <span key={feature}>{feature}</span>)}</div> : <p className="review-helper">No facilities provided.</p>}</section>
    <section className="review-section"><h3><ImageIcon size={16}/> Property photos</h3>{hotel.images?.length ? <div className="hotel-review-gallery">{hotel.images.map((src, index) => <HotelPhoto key={`${src}-${index}`} src={src} name={hotel.name} index={index}/>)}</div> : <p className="review-helper">No property photos provided.</p>}<p className="review-helper">Photos use the image URLs included in the mock data.</p></section>
  </>;
}

export function RegistrationDetails({ partner }) {
  if (!partner.documents?.length && !partner.applicationNotes && !partner.registrationId) return null;
  return <section className="review-section"><h3><FileText size={16}/> Registration submission</h3>
    {partner.registrationId && <div className="review-fields"><RouteField label="Registration ID" value={partner.registrationId}/></div>}
    {partner.applicationNotes && <p className="review-helper">{partner.applicationNotes}</p>}
    {partner.documents?.length > 0 && <><ul className="review-document-list">{partner.documents.map((name, index) => <li key={`${name}-${index}`}><FileText size={14}/>{name}</li>)}</ul><p className="review-helper">Document filenames are provided in the mock data. File contents are not available for review.</p></>}
  </section>;
}
