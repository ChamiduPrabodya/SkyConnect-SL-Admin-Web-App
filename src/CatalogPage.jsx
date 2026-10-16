import React, { useMemo, useState } from 'react';
import { Compass, MapPin, Package, Plus, Pencil, Trash2, Search, X, Check, Image as ImageIcon } from 'lucide-react';

const categories = ['Beach', 'Nature', 'Adventure', 'Culture'];
const money = value => `LKR ${Number(value || 0).toLocaleString('en-LK')}`;
const slug = value => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const destinationActivities = item => item.activities || (item.attractions || []).map(name => ({ name, duration: '' }));

export default function CatalogPage({ destinations, setDestinations, packages, setPackages, search, notify }) {
  const [section, setSection] = useState('Destinations');
  const [category, setCategory] = useState('All');
  const [editor, setEditor] = useState(null);

  const visibleDestinations = useMemo(() => destinations.filter(item =>
    (category === 'All' || item.category === category) &&
    `${item.name} ${item.region} ${item.category} ${item.description} ${item.travelFrom || ''} ${item.travelTime || ''} ${destinationActivities(item).map(activity => `${activity.name} ${activity.duration}`).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  ), [destinations, category, search]);
  const visiblePackages = useMemo(() => packages.filter(item =>
    `${item.name} ${item.duration} ${item.description} ${(item.includes || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  ), [packages, search]);

  const saveItem = value => {
    if (editor.kind === 'destination') {
      setDestinations(previous => editor.item
        ? previous.map(item => item.id === editor.item.id ? { ...value, id: item.id } : item)
        : [{ ...value, id: `${slug(value.name)}-${Date.now().toString(36)}` }, ...previous]);
    } else {
      setPackages(previous => editor.item
        ? previous.map(item => item.id === editor.item.id ? { ...value, id: item.id } : item)
        : [{ ...value, id: `${slug(value.name)}-${Date.now().toString(36)}` }, ...previous]);
    }
    notify(`${editor.kind === 'destination' ? 'Destination' : 'Package'} ${editor.item ? 'updated' : 'added'} in this demo.`);
    setEditor(null);
  };

  const removeDestination = item => {
    if (packages.some(pack => (pack.destinationIds || []).includes(item.id))) {
      notify('This destination is included in a package. Remove it from that package before deleting it.');
      return;
    }
    if (!window.confirm(`Remove ${item.name} from the destination catalog?`)) return;
    setDestinations(previous => previous.filter(destination => destination.id !== item.id));
    notify(`${item.name} removed from this demo catalog.`);
  };
  const removePackage = item => {
    if (!window.confirm(`Remove the ${item.name} package?`)) return;
    setPackages(previous => previous.filter(pack => pack.id !== item.id));
    notify(`${item.name} removed from this demo catalog.`);
  };

  return <>
    <div className="catalog-title-row">
      <div><div className="eyebrow">TRAVEL CATALOG</div><h1>Destinations & packages</h1><p>Manage the places and curated trips travelers can discover.</p></div>
      <button className="button button-primary" onClick={() => setEditor({ kind: section === 'Destinations' ? 'destination' : 'package', item: null })}><Plus size={16}/>{section === 'Destinations' ? 'Add destination' : 'Create package'}</button>
    </div>

    <div className="catalog-toolbar">
      <div className="catalog-tabs"><button className={section === 'Destinations' ? 'selected' : ''} onClick={() => { setSection('Destinations'); setCategory('All'); }}><MapPin size={15}/>Destinations <span>{destinations.length}</span></button><button className={section === 'Packages' ? 'selected' : ''} onClick={() => setSection('Packages')}><Package size={15}/>Packages <span>{packages.length}</span></button></div>
      {section === 'Destinations' && <div className="catalog-categories">{['All', ...categories].map(item => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>}
    </div>

    {section === 'Destinations' ? <div className="catalog-grid">{visibleDestinations.map(item => <article className="catalog-card" key={item.id}>
      <div className="catalog-image">{item.image && <img src={item.image} alt={`${item.name} destination`} onError={event => { event.currentTarget.style.display = 'none'; }}/>}<span className="catalog-category">{item.category}</span><div className="catalog-card-actions"><button aria-label={`Edit ${item.name}`} onClick={() => setEditor({ kind: 'destination', item })}><Pencil size={14}/></button><button aria-label={`Remove ${item.name}`} onClick={() => removeDestination(item)}><Trash2 size={14}/></button></div></div>
      <div className="catalog-card-body"><div className="catalog-card-kicker"><MapPin size={13}/>{item.region}</div><div className="catalog-card-heading"><h2>{item.name}</h2><span>{item.price ? <>{money(item.price)}<small> from</small></> : 'Price not set'}</span></div><p>{item.description}</p><div className="attraction-list"><strong>Activities</strong>{destinationActivities(item).map((activity, index) => <span key={`${activity.name}-${index}`}><span>{activity.name}</span>{activity.duration && <small>{activity.duration}</small>}</span>)}</div><div className="travel-route"><strong>Sample travel time</strong><span>{item.travelFrom ? `${item.travelFrom}${item.travelTime ? ` · ${item.travelTime}` : ''}` : 'No direct sample route listed'}</span></div><div className="catalog-card-foot"><span><ImageIcon size={13}/>{item.image ? 'Image added' : 'No image'}</span><span>Traveler catalog</span></div></div>
    </article>)}{visibleDestinations.length === 0 && <div className="catalog-empty"><Compass size={24}/><strong>No destinations found</strong><span>Try a different category or search.</span></div>}</div> : <div className="package-grid">{visiblePackages.map(item => {
      const included = item.destinationIds.map(id => destinations.find(destination => destination.id === id)).filter(Boolean);
      return <article className="package-card" key={item.id}><div className="package-image"><img src={item.image || included[0]?.image} alt={`${item.name} package`} onError={event => { event.currentTarget.style.display = 'none'; }}/><div className="catalog-card-actions"><button aria-label={`Edit ${item.name}`} onClick={() => setEditor({ kind: 'package', item })}><Pencil size={14}/></button><button aria-label={`Remove ${item.name}`} onClick={() => removePackage(item)}><Trash2 size={14}/></button></div><span className="package-duration">{item.duration}</span></div><div className="catalog-card-body"><div className="catalog-card-heading"><h2>{item.name}</h2><span>{money(item.price)}</span></div><p>{item.description}</p><div className="package-destinations"><strong>Destinations</strong><div>{included.map(destination => <span key={destination.id}>{destination.name}</span>)}{included.length === 0 && <em>No destinations selected</em>}</div></div><div className="package-includes"><strong>Includes</strong><div>{item.includes.map(value => <span key={value}>{value}</span>)}</div></div></div></article>;
    })}{visiblePackages.length === 0 && <div className="catalog-empty"><Package size={24}/><strong>No packages found</strong><span>Create a package or adjust your search.</span></div>}</div>}

    <div className="catalog-note"><Compass size={16}/> These catalog changes are saved in local demo state and reset when the page reloads.</div>
    {editor && <CatalogEditor key={`${editor.kind}-${editor.item?.id || 'new'}`} kind={editor.kind} item={editor.item} destinations={destinations} onCancel={() => setEditor(null)} onSave={saveItem}/>}
  </>;
}

function CatalogEditor({ kind, item, destinations, onCancel, onSave }) {
  const isDestination = kind === 'destination';
  const [form, setForm] = useState(() => isDestination ? {
    name: item?.name || '', region: item?.region || '', category: item?.category || 'Beach', image: item?.image || '', price: item?.price ?? '', travelFrom: item?.travelFrom || '', travelTime: item?.travelTime || '', description: item?.description || '', activitiesText: destinationActivities(item || {}).map(activity => `${activity.name}${activity.duration ? ` | ${activity.duration}` : ''}`).join('\n'),
  } : {
    name: item?.name || '', duration: item?.duration || '', price: item?.price || '', image: item?.image || '', destinationIds: item?.destinationIds || [], includesText: (item?.includes || []).join(', '), description: item?.description || '',
  });
  const [error, setError] = useState('');
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const submit = event => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim()) { setError('Add a name and description.'); return; }
    if (isDestination && !form.region.trim()) { setError('Add the destination region.'); return; }
    if (!isDestination && (!form.duration.trim() || Number(form.price) <= 0 || form.destinationIds.length === 0 || !form.image.trim())) { setError('Add a duration, a positive price, an image, and at least one destination.'); return; }
    onSave(isDestination ? {
      name: form.name.trim(), region: form.region.trim(), category: form.category, image: form.image.trim(), price: form.price === '' ? null : Number(form.price),
      travelFrom: form.travelFrom.trim(), travelTime: form.travelTime.trim(), description: form.description.trim(),
      activities: form.activitiesText.split('\n').map(value => value.trim()).filter(Boolean).map(value => {
        const [name, ...duration] = value.split('|');
        return { name: name.trim(), duration: duration.join('|').trim() };
      }), rating: item?.rating || 'New',
    } : {
      name: form.name.trim(), duration: form.duration.trim(), price: Number(form.price), image: form.image.trim(), destinationIds: form.destinationIds,
      includes: form.includesText.split(',').map(value => value.trim()).filter(Boolean), description: form.description.trim(),
    });
  };

  return <div className="catalog-editor-overlay" onMouseDown={onCancel}><section className="catalog-editor" role="dialog" aria-modal="true" aria-labelledby="catalog-editor-title" onMouseDown={event => event.stopPropagation()}>
    <header><div><span className="eyebrow">{isDestination ? 'DESTINATION CATALOG' : 'TRAVEL PACKAGE'}</span><h2 id="catalog-editor-title">{item ? 'Edit' : 'Add'} {isDestination ? 'destination' : 'package'}</h2></div><button type="button" aria-label="Close" onClick={onCancel}><X size={18}/></button></header>
    <form onSubmit={submit}><div className="catalog-editor-body">
      <label>Name<input autoFocus value={form.name} onChange={event => update('name', event.target.value)} placeholder={isDestination ? 'e.g. Trincomalee' : 'e.g. East Coast discovery'}/></label>
      {isDestination ? <><div className="catalog-form-row"><label>Region<input value={form.region} onChange={event => update('region', event.target.value)} placeholder="e.g. Eastern Province"/></label><label>Category<select value={form.category} onChange={event => update('category', event.target.value)}>{categories.map(value => <option key={value}>{value}</option>)}</select></label></div><div className="catalog-form-row"><label>Sample activity price (LKR)<input type="number" min="0" value={form.price} onChange={event => update('price', event.target.value)} placeholder="Not set"/></label><label>Image path or URL <small>Optional</small><input value={form.image} onChange={event => update('image', event.target.value)} placeholder="/destinations/image.jpg"/></label></div><div className="catalog-form-row"><label>Travel from<input value={form.travelFrom} onChange={event => update('travelFrom', event.target.value)} placeholder="e.g. Colombo"/></label><label>Sample travel time<input value={form.travelTime} onChange={event => update('travelTime', event.target.value)} placeholder="e.g. 2–3 hr"/></label></div><label>Activities <small>One per line: activity | time spent</small><textarea rows="6" value={form.activitiesText} onChange={event => update('activitiesText', event.target.value)} placeholder={'Beach walk | 2 hr\nLocal museum | 1 hr'}/></label></> : <><div className="catalog-form-row"><label>Duration<input value={form.duration} onChange={event => update('duration', event.target.value)} placeholder="e.g. 4 days · 3 nights"/></label><label>Package price (LKR)<input type="number" min="1" value={form.price} onChange={event => update('price', event.target.value)} placeholder="0"/></label></div><label>Package image path or URL<input value={form.image} onChange={event => update('image', event.target.value)} placeholder="/destinations/image.jpg"/></label><fieldset className="destination-picker"><legend>Included destinations</legend>{destinations.map(destination => <label key={destination.id}><input type="checkbox" checked={form.destinationIds.includes(destination.id)} onChange={event => update('destinationIds', event.target.checked ? [...form.destinationIds, destination.id] : form.destinationIds.filter(id => id !== destination.id))}/><span>{destination.name}</span><small>{destination.category}</small></label>)}</fieldset><label>What's included <small>Separate items with commas</small><input value={form.includesText} onChange={event => update('includesText', event.target.value)} placeholder="Hotels, transport, activities"/></label></>}
      {form.image && <div className="catalog-form-image-preview"><img src={form.image} alt="Selected catalog image preview" onError={event => { event.currentTarget.style.display = 'none'; }}/><span>Image preview</span></div>}
      <label>Description<textarea rows="4" value={form.description} onChange={event => update('description', event.target.value)} placeholder="Describe what travelers can discover..."/></label>
      {error && <div className="catalog-form-error">{error}</div>}
    </div><footer><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary"><Check size={15}/>{item ? 'Save changes' : isDestination ? 'Add destination' : 'Create package'}</button></footer></form>
  </section></div>;
}
