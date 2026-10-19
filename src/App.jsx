import { useNotifications } from './notifications/useNotifications';
import { signOutWithNotifications } from './notifications/notificationService';
import NotificationPanel from './notifications/NotificationPanel';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Building2, ClipboardCheck, Compass, ChartNoAxesCombined,
  Settings, Search, Bell, ChevronDown, Menu, X, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Plane, MapPin, Heart, Bookmark, Clock3, Check, XCircle,
  ExternalLink, Sparkles, SlidersHorizontal, Plus, Download, Filter, ShieldCheck,
  CircleHelp, LogOut, Eye, CheckCircle2, AlertCircle, Mail, Globe, CalendarDays, Moon, Sun
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { createRecord, persistStatus } from './firestoreService.js';
import CatalogPage from './CatalogPage.jsx';
import TripsPage from './TripsPage.jsx';
import OfferForm from './OfferForm.jsx';
import AirlineRouteReview, { RouteField } from './AirlineRouteReview.jsx';
import { AirlineProfile, HotelProfile, RegistrationDetails } from './PartnerProfiles.jsx';
import { firebaseConfigured, db, auth } from './firebase.js';
import { collection, onSnapshot, doc, setDoc, collectionGroup, query, where } from 'firebase/firestore';

const chartData = [];
const destinationData = [];
const experienceData = [];
let likesThisWeek = 0;


export function getPartnerSection(partner) {
  const type = String(partner.type || '').trim().toLowerCase();
  if (type === 'airline') return 'airline';
  if (['tourism', 'hotel', 'activity'].includes(type)) return 'tourism';
  if (type === 'user') return 'user';
  return 'other';
}

const partnerSections = [
  { id: 'airline', label: 'Airline Partners', icon: Plane, tint: 'tint-blue', description: 'Airline profiles, submitted routes, flight schedules, and cabin pricing.' },
  { id: 'tourism', label: 'Tourism Partners', icon: Compass, tint: 'tint-green', description: 'Hotels, stays, tour operators, and activity providers.' },
];

function Badge({ children, status }) {
  const cls = status || String(children).toLowerCase().replaceAll(' ', '-');
  return <span className={`badge badge-${cls}`}>{children}</span>;
}
function Avatar({ initials, color = 'blue', small = false }) {
  return <span className={`avatar avatar-${color} ${small ? 'avatar-small' : ''}`}>{initials}</span>;
}
function Metric({ label, value, change, direction = 'up', icon: Icon, tint }) {
  return <article className="metric-card">
    <div className="metric-top"><span>{label}</span><span className={`metric-icon ${tint}`}><Icon size={18}/></span></div>
    <div className="metric-value">{value}</div>
    <div className="metric-bottom"><span className={`change ${direction}`} >{direction === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {change}</span><span>vs. last 7 days</span></div>
  </article>;
}
function SectionTitle({ eyebrow, title, description, action }) {
  return <div className="section-title"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function EmptyNote({ children }) { return <div className="empty-note"><AlertCircle size={16}/>{children}</div>; }

export default function App() {
  const [users, setUsers] = useState([]);
  const [insightsVersion, setInsightsVersion] = useState(0);
  const [page, setPage] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('Pending');
  const [offerFilter, setOfferFilter] = useState('All');
  const [routeFilter, setRouteFilter] = useState('All');
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [offers, setOffers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [travelPackages, setTravelPackages] = useState([]);
  const [toast, setToast] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [theme, setTheme] = useState(() => window.localStorage.getItem('skyconnect-admin-theme') || 'light');
  const pendingPartnerCount = partners.filter(partner => partner.status === 'Pending').length;

  useEffect(() => onSnapshot(doc(db, 'users', auth.currentUser.uid, 'settings', 'preferences'), snap => {
    if (snap.exists() && snap.data().theme) setTheme(snap.data().theme);
  }), []);
  const changeTheme = async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { await setDoc(doc(db, 'users', auth.currentUser.uid, 'settings', 'preferences'), { theme: next }, {merge:true}); }
    catch (error) { notify(error.message); }
  };

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const notificationState = useNotifications(auth.currentUser?.uid, notify);
  useEffect(() => { if(notificationState.notificationOpen) setShowNotifications(true); }, [notificationState.notificationOpen]);

  // Real-time Firestore sync with partners, offers, and routes collections
  useEffect(() => {
    if (!firebaseConfigured || !db) return;

    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => {
      const livePartners = snap.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id,
      }));
      setPartners(livePartners);
    }, (err) => console.log('Admin Firestore partners error:', err));

    const unsubOffers = onSnapshot(collection(db, 'offers'), (snap) => {
      {
        const liveOffers = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setOffers(liveOffers);
      }
    }, (err) => console.log('Admin Firestore offers error:', err));

    const unsubRoutes = onSnapshot(collection(db, 'routes'), (snap) => {
      {
        const liveRoutes = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setRoutes(liveRoutes);
      }
    }, (err) => console.log('Admin Firestore routes error:', err));

    const unsubDestinations = onSnapshot(collection(db, 'destinations'), snap => setDestinations(snap.docs.map(d => ({ ...d.data(), id: d.id }))), err => notify(err.message));
    const unsubPackages = onSnapshot(collection(db, 'packages'), snap => setTravelPackages(snap.docs.map(d => ({ ...d.data(), id: d.id }))), err => notify(err.message));
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => ({ ...d.data(), id:d.id, type:'user', status:'Active', initials:(d.data().name || 'U').slice(0,2), location:d.data().country || '' }))), err => notify(err.message));
    const unsubSaved = onSnapshot(query(collectionGroup(db, 'savedPlans'), where('savedAt', '>=', '')), snap => {
      const days = Array.from({length:7},(_,index) => { const date = new Date(); date.setDate(date.getDate() - 6 + index); return {name:date.toISOString().slice(0,10),saves:0}; });
      snap.docs.forEach(d => { const day = days.find(item => item.name === String(d.data().savedAt || '').slice(0,10)); if (day) day.saves += 1; });
      chartData.splice(0, chartData.length, ...days); setInsightsVersion(v => v + 1);
    }, err => notify(err.message));
    const unsubLikes = onSnapshot(query(collectionGroup(db, 'likes'), where('createdAt', '>=', '')), snap => {
      likesThisWeek = snap.docs.filter(d => new Date(d.data().createdAt).getTime() >= Date.now() - 7 * 86400000).length;
      const destCounts = new Map();
      const expCounts = new Map();
      snap.docs.forEach(d => {
        const value = d.data();
        if (value.type === 'destination') {
          destCounts.set(value.name, (destCounts.get(value.name) || 0) + 1);
        } else if (value.name) {
          expCounts.set(value.name, (expCounts.get(value.name) || 0) + 1);
        }
      });
      destinationData.splice(0, destinationData.length, ...[...destCounts].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value, color: '#28b7a4' })));
      experienceData.splice(0, experienceData.length, ...[...expCounts].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value, color: '#638cf6' })));
      setInsightsVersion(v => v + 1);
    }, err => notify(err.message));
    return () => {
      unsubDestinations(); unsubPackages(); unsubLikes(); unsubUsers(); unsubSaved();
      unsubPartners();
      unsubOffers();
      unsubRoutes();
    };
  }, []);

  const changeStatus = async (name, id, status) => {
    try { await persistStatus(name, id, status); setActivePartner(null); notify(`Saved ${status.toLowerCase()} status.`); }
    catch (error) { notify(`Update failed: ${error.message}`); }
  };
  const changePartnerStatus = (id, status) => changeStatus('partners', id, status);
  const changeOfferStatus = (id, status) => changeStatus('offers', id, status);
  const changeRouteStatus = (id, status) => changeStatus('routes', id, status);

  const pendingPartnersCount = partners.filter(p => p.status === 'Pending').length;
  const pendingOffersCount = offers.filter(o => o.status === 'Pending').length;
  const pendingRoutesCount = routes.filter(r => r.status === 'pending' || r.status === 'Pending').length;

  const dynamicNavGroups = useMemo(() => [
    { label: 'WORKSPACE', items: [
      { id: 'Overview', icon: LayoutDashboard },
      { id: 'Trips & bookings', icon: Bookmark },
      { id: 'Partner verification', icon: ClipboardCheck, badge: pendingPartnersCount > 0 ? String(pendingPartnersCount) : null },
      { id: 'Offers & experiences', icon: Compass, badge: pendingOffersCount > 0 ? String(pendingOffersCount) : null },
      { id: 'Flight routes', icon: Plane, badge: pendingRoutesCount > 0 ? String(pendingRoutesCount) : null },
      { id: 'Destinations & packages', icon: MapPin },
      { id: 'Users & partners', icon: Users },
    ]},
    { label: 'INSIGHTS', items: [
      { id: 'Trend insights', icon: ChartNoAxesCombined },
    ]},
    { label: 'SYSTEM', items: [
      { id: 'Settings', icon: Settings },
    ]},
  ], [pendingPartnersCount, pendingOffersCount, pendingRoutesCount]);

  const createOffer = async offer => {
    try {
      const partner = partners.find(p => p.name === offer.partner);
      if (!partner || partner.status !== 'Approved') throw new Error('Select an approved partner.');
      await createRecord('offers', { ...offer, name: offer.title, type: 'tour', partnerId: partner.id, city: offer.destination, priceLKR: Number(offer.price || 0), priceUSD: Number(offer.price || 0) / 300, images: offer.image ? [offer.image] : [], status: 'Pending' });
      setShowOfferForm(false); notify('Offer saved for review.');
    } catch (error) { notify(error.message); }
  };
  const filteredPartners = useMemo(() => partners.filter(p =>
    (partnerFilter === 'All' || p.status === partnerFilter) &&
    `${p.name || ''} ${p.type || ''} ${p.location || ''} ${p.id || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [partners, partnerFilter, search]);

  const filteredOffers = useMemo(() => offers.filter(o =>
    (offerFilter === 'All' || o.status === offerFilter) &&
    `${o.title || o.name || ''} ${o.partner || ''} ${o.category || ''} ${o.id || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [offers, offerFilter, search]);

  const filteredRoutes = useMemo(() => {
    const list = routes.filter(r => {
      const isApproved = r.status === 'approved' || r.status === 'active';
      const isPending = r.status === 'pending' || r.status === 'Pending';
      const matchFilter = routeFilter === 'All'
        ? true
        : routeFilter === 'Pending'
        ? isPending
        : routeFilter === 'Approved'
        ? isApproved
        : r.status?.toLowerCase() === routeFilter.toLowerCase();
      const str = `${r.flightNo || ''} ${r.airlineName || ''} ${r.origin?.code || ''} ${r.origin?.city || ''} ${r.destination?.code || ''} ${r.destination?.city || ''}`.toLowerCase();
      return matchFilter && str.includes(search.toLowerCase());
    });
    return list.sort((a, b) => {
      const timeA = a.createdAt || a.submittedAt ? new Date(a.createdAt || a.submittedAt).getTime() : 0;
      const timeB = b.createdAt || b.submittedAt ? new Date(b.createdAt || b.submittedAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      const numA = typeof a.id === 'string' ? parseInt(a.id.replace(/\D/g, ''), 10) || 0 : 0;
      const numB = typeof b.id === 'string' ? parseInt(b.id.replace(/\D/g, ''), 10) || 0 : 0;
      return numB - numA;
    });
  }, [routes, routeFilter, search]);

  const go = (id) => { setPage(id); setMobileOpen(false); setSearch(''); };
  const nav = <><div className="brand"><img className="brand-mark" src="/logo.png" alt="SkyConnect logo" width="39" height="39"/><div><strong>SkyConnect<span>SL</span></strong><small>TRAVEL DISCOVERY</small></div><button className="close-nav" onClick={() => setMobileOpen(false)}><X size={19}/></button></div>
    <div className="workspace-chip"><span className="online-dot"/><span>Admin workspace</span><ChevronDown size={14}/></div>
    {dynamicNavGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item => {const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={`nav-item ${page === item.id ? 'active' : ''}`}><Icon size={18}/><span>{item.id}</span>{item.badge && <b className="nav-badge">{item.badge}</b>}</button>;})}</div>)}
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore the admin guide and tips.</p><button onClick={() => notify('Admin guide will be added in a future iteration.')}>Open help centre <ArrowUpRight size={13}/></button></div><button className="profile-row" onClick={() => signOutWithNotifications().catch(e=>notify(e.message))}><Avatar initials="AD" color="navy"/><span><strong>SkyConnect Admin</strong><small>Administrator</small></span><MoreHorizontal size={18}/></button></div></>;

  return <div className="app-shell" data-theme={theme}>
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>{nav}</aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={21}/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>{page}</strong></div></div><div className="topbar-actions"><div className="searchbox"><Search size={16}/><input aria-label="Search" placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18}/>{notificationState.notifications.some(n=>n.unread)&&<i/>}</button>{showNotifications && <NotificationPanel state={notificationState} notify={notify}><p>{pendingPartnerCount} partner applications need review.</p><button onClick={() => {go('Partner verification');setShowNotifications(false)}}>Review applications <ArrowUpRight size={13}/></button></NotificationPanel>}<button className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={changeTheme}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="topbar-user"><Avatar initials="AD" color="navy" small/><span>Admin</span><ChevronDown size={14}/></div></div></header>
      <div className="page-content">
        {page === 'Overview' && <Overview users={users} partners={partners} offers={offers} routes={routes} go={go} notify={notify} onView={setActivePartner} />}
        {page === 'Trips & bookings' && <TripsPage users={users} partners={partners} offers={offers} routes={routes} travelPackages={travelPackages} destinations={destinations} search={search} onSearchChange={setSearch}/>}
        {page === 'Partner verification' && <PartnerPage partners={filteredPartners} filter={partnerFilter} setFilter={setPartnerFilter} onView={setActivePartner} />}
        {page === 'Offers & experiences' && <OffersPage offers={filteredOffers} filter={offerFilter} setFilter={setOfferFilter} onStatus={changeOfferStatus} notify={notify} onAdd={() => setShowOfferForm(true)}/>}
        {page === 'Flight routes' && <RoutesPage routes={filteredRoutes} filter={routeFilter} setFilter={setRouteFilter} onStatus={changeRouteStatus} notify={notify}/>}
        {page === 'Destinations & packages' && <CatalogPage partners={partners} destinations={destinations}  packages={travelPackages}  search={search} notify={notify}/>}
        {page === 'Users & partners' && <DirectoryPage partners={[...partners, ...users.filter(user => !partners.some(partner => partner.id === user.id))]} search={search} onView={setActivePartner} />}
        {page === 'Trend insights' && <InsightsPage />}
        {page === 'Settings' && <SettingsPage notify={notify}/>}
      </div>
      <footer className="footer"><span>© 2026 SkyConnect SL</span><span><span className="footer-dot"/> All systems operational <span className="footer-sep">·</span> Admin console v0.1</span></footer>
    </main>
    {activePartner && <PartnerReviewModal partner={partners.find(p => p.id === activePartner.id) || activePartner} onClose={() => setActivePartner(null)} onStatus={changePartnerStatus}/>}
    {showOfferForm && <OfferForm partners={partners.filter(partner => partner.status === 'Approved')} destinations={destinations} onClose={() => setShowOfferForm(false)} onSubmit={createOffer}/>}
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

function Overview({ users, partners, offers, routes, go, notify, onView }) {
  const pendingPartners = partners.filter(p => p.status === 'Pending').length;
  const pendingOffers = offers.filter(o => o.status === 'Pending').length;
  const pendingRoutes = (routes || []).filter(r => r.status === 'pending' || r.status === 'Pending').length;
  const totalPending = pendingPartners + pendingOffers + pendingRoutes;
  const activity = [...partners.map(p => ({ title:'Partner profile',detail:p.name,time:p.updatedAt || p.createdAt || '',icon:'partner',tone:'blue' })), ...offers.map(o => ({title:'Listing '+o.status,detail:o.title || o.name,time:o.updatedAt || o.createdAt || '',icon:'offer',tone:'green'}))].sort((a,b)=>String(b.time).localeCompare(String(a.time))).slice(0,6);
  const published = offers.filter(o => o.status === 'Published').length;
  return <>
    <SectionTitle eyebrow={new Date().toLocaleDateString('en-LK',{timeZone:'Asia/Colombo',dateStyle:'full'})} title="Good afternoon, Admin ✨" description="Here's what's happening across your travel discovery platform today." action={<button className="button button-primary" onClick={() => go('Flight routes')}><Plus size={16}/> Manage schedules</button>}/>
    <div className="welcome-strip"><div className="welcome-copy"><div className="welcome-label"><Sparkles size={14}/> YOUR WEEKLY SNAPSHOT</div><h2>Make every journey <em>personal.</em></h2><p>Keep great local experiences visible, trusted and easy to discover.</p><button onClick={() => go('Trend insights')}>Explore travel insights <ArrowUpRight size={15}/></button></div><div className="welcome-art"><div className="sun"/><div className="mountain mountain-back"/><div className="mountain mountain-front"/><div className="art-plane"><Plane size={30}/></div><div className="art-cloud cloud-one"/><div className="art-cloud cloud-two"/></div></div>
    <div className="metric-grid"><Metric label="Total users" value={String(users.length)} change="N/A" icon={Users} tint="tint-blue"/><Metric label="Verified partners" value={String(partners.filter(p=>p.status==='Approved').length)} change="N/A" icon={ShieldCheck} tint="tint-green"/><Metric label="Published offers" value={String(published)} change="N/A" icon={Compass} tint="tint-purple"/><Metric label="Pending reviews" value={String(totalPending)} change={`${pendingRoutes} routes · ${pendingOffers} offers`} direction="down" icon={Clock3} tint="tint-orange"/></div>
    <div className="dashboard-grid"><section className="panel engagement-panel"><div className="panel-heading"><div><h3>Discovery activity</h3><p>Explore views and saves across the platform</p></div><button className="select-like" onClick={() => notify('Showing the last 7 days.')}>Last 7 days <ChevronDown size={14}/></button></div><div className="chart-legend"><span><i className="legend-blue"/> Views <strong>Not tracked</strong></span><span><i className="legend-teal"/> Saves <strong>{chartData.reduce((sum,day)=>sum+day.saves,0)}</strong></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:4,left:-22,bottom:0}}><defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#638cf6" stopOpacity={0.18}/><stop offset="95%" stopColor="#638cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:12}} dy={9}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:11}}/><Tooltip contentStyle={{borderRadius:12,border:'1px solid #e8edf4',boxShadow:'0 8px 24px #14233a12'}}/><Area type="monotone" dataKey="visitors" name="Views" stroke="#638cf6" strokeWidth={2.5} fill="url(#viewsFill)"/><Area type="monotone" dataKey="saves" name="Saves" stroke="#2ab6a4" strokeWidth={2.5} fill="transparent"/></AreaChart></ResponsiveContainer></div></section>
    <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Latest updates from your workspace</p></div><button className="text-button" onClick={() => go('Offers & experiences')}>View all <ArrowUpRight size={14}/></button></div><div className="activity-list">{activity.map((a,i)=><div className="activity-item" key={i}><div className={`activity-icon ${a.tone}`}>{a.icon==='partner'?<Building2 size={16}/>:a.icon==='offer'?<Compass size={16}/>:a.icon==='check'?<Check size={16}/>:<ChartNoAxesCombined size={16}/>}</div><div className="activity-text"><strong>{a.title}</strong><p>{a.detail}</p><small>{a.time}</small></div></div>)}</div></section></div>
    <section className="panel table-panel"><div className="panel-heading"><div><h3>Partner applications</h3><p>Open each application to check its profile before deciding</p></div><button className="text-button" onClick={() => go('Partner verification')}>View applications <ArrowUpRight size={14}/></button></div><PartnerReviewTable partners={partners.filter(p=>p.status==='Pending').slice(0,3)} onView={onView} compact/></section>
    <div className="insight-note"><div className="insight-spark"><Sparkles size={18}/></div><div><strong>Travel discovery insight</strong><p>Nature and coastal experiences are strong categories to feature. Keep partner listings current so travelers see relevant local options.</p></div><button onClick={() => go('Trend insights')}>View insights <ArrowUpRight size={14}/></button></div>
  </>;
}

export function PartnerPage({ partners, filter, setFilter, onView }) {
  const sections = [...partnerSections];
  if (partners.some(partner => getPartnerSection(partner) === 'other')) {
    sections.push({ id: 'other', label: 'Other Partners', icon: Building2, description: 'Applications awaiting partner type classification.' });
  }
  return <>
    <SectionTitle eyebrow="PARTNER MANAGEMENT" title="Partner verification" description="Review airline and tourism applications in separate sections." action={<button className="button button-secondary" onClick={()=>window.print()}><Download size={16}/> Export list</button>}/>
    <div className="filter-row"><div className="filter-tabs" aria-label="Partner application status">{['Pending','Approved','Rejected','All'].map(s=><button type="button" className={filter===s?'selected':''} aria-pressed={filter===s} key={s} onClick={()=>setFilter(s)}>{s}</button>)}</div><span className="result-count">{partners.filter(partner => getPartnerSection(partner) !== 'user').length} partners</span></div>
    <div className="partner-review-sections">
      {sections.map(section => {
        const Icon = section.icon;
        const sectionPartners = partners.filter(partner => getPartnerSection(partner) === section.id);
        return <section className="panel table-panel" key={section.id} aria-labelledby={`review-${section.id}-title`}>
          <div className="panel-heading"><div><h3 className="directory-section-title" id={`review-${section.id}-title`}><Icon size={16}/>{section.label}</h3><p>{section.description}</p></div><span className="result-count">{sectionPartners.length} {sectionPartners.length === 1 ? 'application' : 'applications'}</span></div>
          <PartnerReviewTable partners={sectionPartners} onView={onView}/>
        </section>;
      })}
    </div>
    <p className="page-footnote"><ShieldCheck size={14}/> Open an application to review its submitted information before approving or rejecting it.</p>
  </>;
}
function PartnerTable({ partners, onStatus, compact=false }) {
  return <div className="table-scroll"><table><thead><tr><th>PARTNER</th><th>TYPE</th><th>LOCATION</th><th>STATUS</th><th>{compact?'ACTIONS':'SUBMITTED'}</th></tr></thead><tbody>{partners.map(p=><tr key={p.id}><td><div className="partner-cell"><Avatar initials={p.initials} color={p.color}/><div><strong>{p.name}</strong><small>{p.id}</small></div></div></td><td>{p.type}</td><td><span className="location-cell"><MapPin size={13}/>{p.location}</span></td><td><Badge status={p.status.toLowerCase()}>{p.status}</Badge></td><td>{p.status==='Pending'?<div className="row-actions"><button className="approve-btn" title="Approve" onClick={()=>onStatus(p.id,'Approved')}><Check size={15}/></button><button className="reject-btn" title="Reject" onClick={()=>onStatus(p.id,'Rejected')}><X size={15}/></button><button className="more-btn" title="View details" onClick={()=>onStatus(p.id,'Pending')}><Eye size={15}/></button></div>:compact?<span className="muted">—</span>:<button className="more-btn" onClick={()=>onStatus(p.id,'Pending')}><Eye size={15}/> Review again</button>}</td></tr>)}</tbody></table>{partners.length===0&&<div className="empty-state"><ClipboardCheck size={24}/><strong>No partners found</strong><span>Try another filter or search term.</span></div>}</div>;
}
function RoutesPage({ routes, filter, setFilter, onStatus, notify }) {
  return <>
    <SectionTitle
      eyebrow="AVIATION & AIRLINE OPERATIONS"
      title="Flight routes & slots"
      description="Review and clear airline flight schedules & slot approvals in compliance with CAASL."
      action={<button className="button button-secondary" onClick={()=>window.print()}><Download size={16}/> Export schedules</button>}
    />
    <div className="filter-row">
      <div className="filter-tabs">
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button className={filter === s ? 'selected' : ''} key={s} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      <span className="result-count">{routes.length} flight schedules</span>
    </div>
    <section className="panel table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>FLIGHT NO</th>
              <th>ROUTE (SECTOR)</th>
              <th>AIRLINE</th>
              <th>SCHEDULE / AIRCRAFT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(r => {
              const orig = r.origin?.code || 'CMB';
              const origCity = r.origin?.city || '';
              const dest = r.destination?.code || 'DXB';
              const destCity = r.destination?.city || '';
              const isPending = r.status === 'pending' || r.status === 'Pending';
              const isApproved = r.status === 'approved' || r.status === 'active';
              return (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="offer-thumb adventure" style={{ width: 34, height: 34, borderRadius: 8 }}>
                        <Plane size={16} />
                      </div>
                      <div>
                        <strong>{r.flightNo || 'UL-000'}</strong>
                        <small>{r.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>
                      {orig} ({origCity}) ➔ {dest} ({destCity})
                    </span>
                  </td>
                  <td>{r.airlineName || 'Sri Lankan Airline'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>{r.aircraft || 'Airbus A320'} · {r.frequency || 'Daily'}</span>
                      <small style={{ color: '#64748b' }}>{r.departureTime || '08:30'} – {r.arrivalTime || '13:00'}</small>
                    </div>
                  </td>
                  <td>
                    <Badge status={isApproved ? 'approved' : isPending ? 'pending' : 'rejected'}>
                      {isApproved ? 'Approved (CAASL Cleared)' : isPending ? 'Pending Review' : 'Rejected'}
                    </Badge>
                  </td>
                  <td>
                    {isPending ? (
                      <div className="row-actions">
                        <button className="approve-btn" title="Approve & Clear Slot" onClick={() => onStatus(r.id, 'approved')}>
                          <Check size={15} />
                        </button>
                        <button className="reject-btn" title="Reject Slot" onClick={() => onStatus(r.id, 'rejected')}>
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button className="more-btn" onClick={() => onStatus(r.id, 'pending')}>
                        <Eye size={15} /> Re-review
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {routes.length === 0 && <div className="empty-state">No flight routes match this filter.</div>}
      </div>
    </section>
    <div className="insight-note">
      <div className="insight-spark"><ShieldCheck size={18}/></div>
      <div>
        <strong>CAASL Slot & Regulatory Compliance</strong>
        <p>Flight schedules approved here automatically update the partner airline console and publish route discovery to global travelers.</p>
      </div>
    </div>
  </>;
}

function PartnerReviewTable({ partners, onView, compact=false }) {
  return <div className="table-scroll"><table><thead><tr><th>PARTNER</th><th>TYPE</th><th>LOCATION</th><th>STATUS</th><th>{compact?'REVIEW':'APPLICATION'}</th></tr></thead><tbody>{partners.map(p=><tr key={p.id}><td><div className="partner-cell"><Avatar initials={p.initials} color={p.color}/><div><strong>{p.name}</strong><small>{p.id}</small></div></div></td><td>{p.type}</td><td><span className="location-cell"><MapPin size={13}/>{p.location}</span></td><td><Badge status={p.status.toLowerCase()}>{p.status}</Badge></td><td><button className="more-btn" onClick={()=>onView(p)}><Eye size={14}/>{p.status==='Pending'?'Review details':'View details'}</button></td></tr>)}</tbody></table>{partners.length===0&&<div className="empty-state"><ClipboardCheck size={24}/><strong>No partners found</strong><span>Try another filter or search term.</span></div>}</div>;
}

function ReviewField({ label, value }) {
  return <RouteField label={label} value={value}/>;
}

export function PartnerReviewModal({ partner, onClose, onStatus }) {
  return <div className="review-overlay" onMouseDown={onClose}>
    <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title" onMouseDown={event=>event.stopPropagation()}>
      <div className="review-modal-header">
        <div className="review-eyebrow"><span className="eyebrow">PARTNER APPLICATION · {partner.id}</span><button className="review-close" aria-label="Close review" onClick={onClose}><X size={18}/></button></div>
        <div className="review-partner-heading"><Avatar initials={partner.initials} color={partner.color}/><div><h2 id="review-title">{partner.name}</h2><p>{partner.type} partner · {partner.location}</p></div><Badge status={partner.status.toLowerCase()}>{partner.status}</Badge></div>
      </div>
      <div className="review-modal-body">
        <div className="review-section"><h3><Building2 size={16}/> Business profile</h3><div className="review-fields"><ReviewField label="Registered business name" value={partner.name}/><ReviewField label="Business registration" value={partner.businessRegistration}/><ReviewField label="Country" value={partner.country}/><ReviewField label="Business address" value={partner.location}/><div className="review-field review-field-wide"><span>About the business</span><strong>{partner.description || 'Not provided'}</strong></div></div></div>
        <div className="review-section"><h3><Mail size={16}/> Contact details</h3><div className="review-fields"><ReviewField label="Contact person" value={partner.contactName}/><ReviewField label="Email" value={partner.email}/><ReviewField label="Phone" value={partner.phone}/><div className="review-field"><span>Website</span><strong className="review-website"><Globe size={13}/>{partner.website || 'Not provided'}</strong></div></div></div>
        {partner.type==='Airline' && <><AirlineProfile partner={partner}/><AirlineRouteReview routes={partner.routes}/></>}
        {partner.type==='Hotel' && <HotelProfile hotel={partner.hotelDetails}/>}
        <RegistrationDetails partner={partner}/>
        <div className="review-submitted"><CalendarDays size={15}/> Application submitted <strong>{partner.submittedAt || 'Date not provided'}</strong></div>
        <div className="review-demo-note"><AlertCircle size={15}/> Review submitted information before approval. Independent verification requires checking the original documents.</div>
      </div>
      <div className="review-modal-footer"><button className="button button-secondary" onClick={onClose}>Close</button>{partner.status==='Pending' && <div><button className="button review-reject" onClick={()=>onStatus(partner.id,'Rejected')}><X size={15}/> Reject application</button><button className="button button-primary" onClick={()=>onStatus(partner.id,'Approved')}><Check size={15}/> Approve partner</button></div>}</div>
    </section>
  </div>;
}
function OffersPage({ offers, filter, setFilter, onStatus, notify, onAdd }) {
  return <><SectionTitle eyebrow="CONTENT CURATION" title="Offers & experiences" description="Manage the travel inspiration that travelers discover in their feed." action={<button className="button button-primary" onClick={onAdd}><Plus size={16}/> Add offer</button>}/><div className="filter-row"><div className="filter-tabs">{['All','Pending','Published','Rejected'].map(s=><button className={filter===s?'selected':''} key={s} onClick={()=>setFilter(s)}>{s}</button>)}</div><span className="result-count">{offers.length} listings</span></div><section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>OFFER / EXPERIENCE</th><th>CATEGORY</th><th>PARTNER</th><th>STATUS</th><th>REACH</th><th>ACTIONS</th></tr></thead><tbody>{offers.map(o=>{
    const category = o.category || o.type || 'Experience';
    const catLower = category.toLowerCase();
    const title = o.title || o.name || 'Untitled Listing';
    const partner = o.partner || o.partnerName || 'Tourism Partner';
    const status = o.status || 'Pending';
    return <tr key={o.id}><td><div className="offer-cell"><div className={`offer-thumb ${catLower}`}>{catLower==='beach'?<Compass size={18}/>:catLower==='nature'?<MapPin size={18}/>:catLower==='adventure'?<Plane size={18}/>:<Sparkles size={18}/>}</div><div><strong>{title}</strong><small>{o.id}</small></div></div></td><td><span className="category-chip">{category}</span></td><td>{partner}</td><td><Badge status={status.toLowerCase()}>{status}</Badge></td><td>{o.reach ?? '—'}</td><td>{status==='Pending'?<div className="row-actions"><button className="approve-btn" title="Publish" onClick={()=>onStatus(o.id,'Published')}><Check size={15}/></button><button className="reject-btn" title="Reject" onClick={()=>onStatus(o.id,'Rejected')}><X size={15}/></button></div>:<button className="more-btn" onClick={()=>notify(`Viewing ${title} is a demo action.`)}><Eye size={15}/></button>}</td></tr>;
  })}</tbody></table>{offers.length===0&&<div className="empty-state">No offers match this filter.</div>}</div></section><div className="insight-note"><div className="insight-spark"><ShieldCheck size={18}/></div><div><strong>Keep content trustworthy</strong><p>Check descriptions, partner ownership, images and contact information before publishing an experience.</p></div></div></>;
}
export function DirectoryPage({ partners, search = '', onView }) {
  const [category, setCategory] = useState('airline');
  const [status, setStatus] = useState('All');
  const groups = [
    ...partnerSections,
    { id: 'user', label: 'Users', icon: Users, tint: 'tint-orange', description: 'Traveler accounts and user profiles.' },
  ];
  const belongsToGroup = (partner, group) => getPartnerSection(partner) === group.id;
  const activeGroup = groups.find(group => group.id === category);
  const groupPartners = partners.filter(partner => belongsToGroup(partner, activeGroup));
  const query = search.trim().toLowerCase();
  const visiblePartners = groupPartners.filter(partner =>
    (status === 'All' || partner.status === status) &&
    [partner.name, partner.id, partner.location, partner.email, partner.iata || partner.iataCode, partner.hotelDetails?.type, partner.type, activeGroup.label]
      .filter(Boolean).join(' ').toLowerCase().includes(query)
  );
  const ActiveIcon = activeGroup.icon;
  const selectCategory = id => { setCategory(id); setStatus('All'); };
  const handleCategoryKey = event => {
    const currentIndex = groups.findIndex(group => group.id === category);
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % groups.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + groups.length) % groups.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = groups.length - 1;
    else return;
    event.preventDefault();
    selectCategory(groups[nextIndex].id);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus();
  };

  return <>
    <SectionTitle eyebrow="COMMUNITY" title="Users & partners" description="Browse Airline Partners and Tourism Partners, including hotels, stays, tours, and activities."/>
    <div className="directory-categories" role="tablist" aria-label="Directory categories">
      {groups.map(group => {
        const Icon = group.icon;
        const count = partners.filter(partner => belongsToGroup(partner, group)).length;
        return <button type="button" role="tab" id={`directory-tab-${group.id}`} aria-selected={category === group.id} aria-controls="directory-panel" tabIndex={category === group.id ? 0 : -1} onKeyDown={handleCategoryKey} className={`directory-category ${category === group.id ? 'selected' : ''}`} key={group.id} onClick={() => selectCategory(group.id)}>
          <div className="directory-category-top"><span className={`metric-icon ${group.tint}`}><Icon size={18}/></span><span>{group.label}</span></div>
          <strong>{group.id === 'user' ? '—' : count}</strong>
          <small>{`${count} profiles in the directory`}</small>
        </button>;
      })}
    </div>
    <div id="directory-panel" role="tabpanel" tabIndex={0} aria-labelledby={`directory-tab-${category}`}>
      {category === 'user' ? <section className="panel"><PartnerReviewTable partners={visiblePartners} onView={onView}/></section> : <>
        <div className="filter-row directory-filters"><div className="filter-tabs" aria-label={`${activeGroup.label} status filters`}>{['All', 'Approved', 'Pending', 'Rejected'].map(value => <button type="button" key={value} className={status === value ? 'selected' : ''} aria-pressed={status === value} onClick={() => setStatus(value)}>{value}</button>)}</div><span className="result-count">{visiblePartners.length} of {groupPartners.length} {activeGroup.label.toLowerCase()}</span></div>
        <section className="panel table-panel"><div className="panel-heading"><div><h3 className="directory-section-title"><ActiveIcon size={16}/>{activeGroup.label}</h3><p>{activeGroup.description}</p></div></div><PartnerReviewTable partners={visiblePartners} onView={onView}/></section>
      </>}
    </div>
  </>;
}
function InsightsPage() {
  return <><SectionTitle eyebrow="BASIC TREND INSIGHTS" title="Travel insights" description="Understand what travelers are exploring, liking and saving." action={<button className="button button-secondary" onClick={()=>window.print()}><Download size={16}/> Export report</button>}/><div className="metric-grid"><Metric label="Experience views" value="Not tracked" change="N/A" icon={Eye} tint="tint-blue"/><Metric label="Saved plans this week" value={chartData.reduce((sum,day)=>sum+day.saves,0)} change="N/A" icon={Bookmark} tint="tint-green"/><Metric label="Likes this week" value={likesThisWeek} change="N/A" icon={Heart} tint="tint-purple"/><Metric label="Partner engagement" value="Not tracked" change="N/A" icon={ChartNoAxesCombined} tint="tint-orange"/></div><div className="dashboard-grid insights-grid"><section className="panel engagement-panel"><div className="panel-heading"><div><h3>Views & saves</h3><p>Saved plans from Firestore</p></div></div><div className="chart-wrap chart-large"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barGap={5}><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:11}}/><Tooltip/><Bar dataKey="visitors" name="Views" fill="#638cf6" radius={[5,5,0,0]}/><Bar dataKey="saves" name="Saves" fill="#2ab6a4" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel destinations-panel"><div className="panel-heading"><div><h3>Popular destinations</h3><p>Destination likes</p></div></div><div className="destination-list">{destinationData.length ? destinationData.map((d,i)=><div className="destination-row" key={d.name}><span className="destination-rank">0{i+1}</span><span className="destination-name">{d.name}</span><div className="destination-track"><span style={{width:`${Math.min(100, d.value * 20)}%`,background:d.color}}/></div><strong>{d.value}</strong></div>) : <p className="empty-state" style={{padding:16,color:'#8994a5',fontSize:13}}>No destination likes recorded yet.</p>}</div><div className="chart-footnote">Destination likes saved by traveler accounts.</div></section><section className="panel destinations-panel"><div className="panel-heading"><div><h3>Popular experiences</h3><p>Stays and tours likes</p></div></div><div className="destination-list">{experienceData.length ? experienceData.map((d,i)=><div className="destination-row" key={d.name}><span className="destination-rank">0{i+1}</span><span className="destination-name">{d.name}</span><div className="destination-track"><span style={{width:`${Math.min(100, d.value * 20)}%`,background:d.color}}/></div><strong>{d.value}</strong></div>) : <p className="empty-state" style={{padding:16,color:'#8994a5',fontSize:13}}>No experience likes recorded yet.</p>}</div><div className="chart-footnote">Stays, tours and activity likes from travelers.</div></section></div><EmptyNote>Likes and saves come directly from live Firestore. Experience views require client event tracking, which is outside this implementation.</EmptyNote></>;
}
function SettingsPage({ notify }) {
  return <><SectionTitle eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Manage the connections and access rules for the SkyConnect admin console."/><div className="settings-grid"><section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon blue"><ShieldCheck size={19}/></div><div><h3>Authentication & access</h3><p>Admin access and role permissions</p></div></div><div className="setting-line"><div><strong>Firebase configuration</strong><p>Connect this console to your Firebase project.</p></div><Badge status={firebaseConfigured?'approved':'pending'}>{firebaseConfigured?'Configured':'Not configured'}</Badge></div><div className="setting-line"><div><strong>Admin role enforcement</strong><p>Firebase custom claims and Firestore rules protect this console.</p></div><Badge status="approved">Enabled</Badge></div><button className="button button-secondary" onClick={()=>notify('Set Firebase variables in .env, then restart the dev server.')}><Settings size={15}/> Setup guide</button></section><section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon purple"><Sparkles size={19}/></div><div><h3>AI service connection</h3><p>Backend 2 recommendation service</p></div></div><div className="setting-line"><div><strong>FastAPI base URL</strong><p>Set VITE_AI_API_BASE_URL in your local .env file.</p></div><Badge status="pending">Not tested</Badge></div><div className="setting-line"><div><strong>Recommendation endpoint</strong><p>Will be mapped to the endpoint in your Backend 2 repository.</p></div><Badge status="pending">To configure</Badge></div><button className="button button-secondary" onClick={()=>notify('Please confirm the actual FastAPI route from Backend 2.')}>Review API connection <ExternalLink size={14}/></button></section></div><div className="security-callout"><ShieldCheck size={20}/><div><strong>Security before launch</strong><p>Use role-based authorization, Firestore security rules, server-side validation and environment variables. Never expose service-account keys or AI provider secrets in browser code.</p></div></div></>;
}
