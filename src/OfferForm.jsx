import React, { useState } from 'react';
import { Check, Image as ImageIcon, X } from 'lucide-react';

const categories = ['Beach', 'Nature', 'Adventure', 'Culture'];

export default function OfferForm({ partners, destinations, onClose, onSubmit }) {
  const firstPartner = partners[0]?.name || '';
  const [form, setForm] = useState({ title: '', partner: firstPartner, category: 'Beach', destination: destinations[0]?.name || '', price: '', image: '', description: '' });
  const [error, setError] = useState('');
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));

  const submit = event => {
    event.preventDefault();
    if (!form.title.trim() || !form.partner || !form.destination || !form.description.trim()) {
      setError('Add an offer title, approved partner, destination, and description.');
      return;
    }
    if (form.price && Number(form.price) < 0) {
      setError('Price must be zero or higher.');
      return;
    }
    onSubmit({ ...form, title: form.title.trim(), description: form.description.trim(), price: form.price ? Number(form.price) : null });
  };

  return <div className="catalog-editor-overlay" onMouseDown={onClose}>
    <section className="catalog-editor" role="dialog" aria-modal="true" aria-labelledby="offer-form-title" onMouseDown={event => event.stopPropagation()}>
      <header><div><span className="eyebrow">CONTENT CURATION</span><h2 id="offer-form-title">Add offer or experience</h2></div><button type="button" aria-label="Close" onClick={onClose}><X size={18}/></button></header>
      <form onSubmit={submit}><div className="catalog-editor-body">
        <label>Offer title<input autoFocus value={form.title} onChange={event => update('title', event.target.value)} placeholder="e.g. Sunset coastal escape"/></label>
        <div className="catalog-form-row"><label>Partner<select value={form.partner} onChange={event => update('partner', event.target.value)}><option value="">Select an approved partner</option>{partners.map(partner => <option key={partner.id} value={partner.name}>{partner.name}</option>)}</select></label><label>Category<select value={form.category} onChange={event => update('category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label></div>
        <div className="catalog-form-row"><label>Destination<select value={form.destination} onChange={event => update('destination', event.target.value)}><option value="">Select a destination</option>{destinations.map(destination => <option key={destination.id} value={destination.name}>{destination.name}</option>)}</select></label><label>Price (LKR)<input type="number" min="0" value={form.price} onChange={event => update('price', event.target.value)} placeholder="Optional"/></label></div>
        <label>Image path or URL<input value={form.image} onChange={event => update('image', event.target.value)} placeholder="/destinations/image.jpg"/></label>
        {form.image && <div className="catalog-form-image-preview"><img src={form.image} alt="Offer image preview" onError={event => { event.currentTarget.style.display = 'none'; }}/><span><ImageIcon size={12}/> Preview</span></div>}
        <label>Description<textarea rows="4" value={form.description} onChange={event => update('description', event.target.value)} placeholder="Describe the experience travelers will discover..."/></label>
        {error && <div className="catalog-form-error">{error}</div>}
        <div className="offer-review-note">New offers are added as <strong>Pending</strong> for admin review before publishing.</div>
      </div><footer><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Check size={15}/>Add pending offer</button></footer></form>
    </section>
  </div>;
}
