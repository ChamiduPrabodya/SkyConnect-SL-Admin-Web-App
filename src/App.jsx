import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard, Users, Building2, ClipboardCheck, Compass, ChartNoAxesCombined,
  Settings, Search, Bell, ChevronDown, Menu, X, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Plane, MapPin, Heart, Bookmark, Clock3, Check, XCircle,
  ExternalLink, Sparkles, SlidersHorizontal, Plus, Download, Filter, ShieldCheck,
  CircleHelp, LogOut, Eye, CheckCircle2, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { demoPartners, demoOffers, activity } from './data.js';
import { firebaseConfigured } from './firebase.js';

const navGroups = [
  { label: 'WORKSPACE', items: [
    { id: 'Overview', icon: LayoutDashboard },
    { id: 'Partner verification', icon: ClipboardCheck, badge: '2' },
    { id: 'Offers & experiences', icon: Compass },
    { id: 'Users & partners', icon: Users },
  ]},
  { label: 'INSIGHTS', items: [
    { id: 'Trend insights', icon: ChartNoAxesCombined },
  ]},
  { label: 'SYSTEM', items: [
    { id: 'Settings', icon: Settings },
  ]},
];
const chartData = [
  { name: 'Mon', visitors: 310, saves: 92 }, { name: 'Tue', visitors: 420, saves: 128 },
  { name: 'Wed', visitors: 365, saves: 105 }, { name: 'Thu', visitors: 510, saves: 164 },
  { name: 'Fri', visitors: 470, saves: 151 }, { name: 'Sat', visitors: 680, saves: 230 },
  { name: 'Sun', visitors: 590, saves: 196 },
];
const destinationData = [
  { name: 'Ella', value: 82, color: '#28b7a4' },
  { name: 'Galle', value: 68, color: '#5d8df6' },
  { name: 'Sigiriya', value: 55, color: '#f1a85b' },
  { name: 'Mirissa', value: 44, color: '#9b7cf5' },
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
  const [page, setPage] = useState('Overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('All');
  const [offerFilter, setOfferFilter] = useState('All');
  const [partners, setPartners] = useState(demoPartners);
  const [offers, setOffers] = useState(demoOffers);
  const [toast, setToast] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const changePartnerStatus = (id, status) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    notify(`Partner ${id} marked ${status.toLowerCase()} in this demo.`);
  };
  const changeOfferStatus = (id, status) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    notify(`Offer ${id} marked ${status.toLowerCase()} in this demo.`);
  };
  const filteredPartners = useMemo(() => partners.filter(p =>
    (partnerFilter === 'All' || p.status === partnerFilter) &&
    `${p.name} ${p.type} ${p.location} ${p.id}`.toLowerCase().includes(search.toLowerCase())
  ), [partners, partnerFilter, search]);
  const filteredOffers = useMemo(() => offers.filter(o =>
    (offerFilter === 'All' || o.status === offerFilter) &&
    `${o.title} ${o.partner} ${o.category} ${o.id}`.toLowerCase().includes(search.toLowerCase())
  ), [offers, offerFilter, search]);

  const go = (id) => { setPage(id); setMobileOpen(false); setSearch(''); };
  const nav = <><div className="brand"><div className="brand-mark"><Plane size={21}/></div><div><strong>SkyConnect<span>SL</span></strong><small>TRAVEL DISCOVERY</small></div><button className="close-nav" onClick={() => setMobileOpen(false)}><X size={19}/></button></div>
    <div className="workspace-chip"><span className="online-dot"/><span>Admin workspace</span><ChevronDown size={14}/></div>
    {navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(item => {const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={`nav-item ${page === item.id ? 'active' : ''}`}><Icon size={18}/><span>{item.id}</span>{item.badge && <b className="nav-badge">{item.badge}</b>}</button>;})}</div>)}
    <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore the admin guide and tips.</p><button onClick={() => notify('Admin guide will be added in a future iteration.')}>Open help centre <ArrowUpRight size={13}/></button></div><button className="profile-row" onClick={() => go('Settings')}><Avatar initials="AD" color="navy"/><span><strong>SkyConnect Admin</strong><small>Administrator</small></span><MoreHorizontal size={18}/></button></div></>;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>{nav}</aside>
    {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={21}/></button><div className="breadcrumbs">Workspace <span>/</span> <strong>{page}</strong></div></div><div className="topbar-actions"><div className="searchbox"><Search size={16}/><input aria-label="Search" placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}><Bell size={18}/><i/></button>{showNotifications && <div className="notification-pop"><strong>Notifications</strong><p>2 partner applications need review.</p><button onClick={() => {go('Partner verification');setShowNotifications(false)}}>Review applications <ArrowUpRight size={13}/></button></div>}<div className="topbar-user"><Avatar initials="AD" color="navy" small/><span>Admin</span><ChevronDown size={14}/></div></div></header>
      <div className="page-content">
        {!firebaseConfigured && <div className="setup-banner"><div className="setup-banner-icon"><AlertCircle size={18}/></div><div><strong>Preview mode is active</strong><p>You're viewing sample data. Add your Firebase web config to <code>.env</code> when you're ready to connect real data.</p></div><span className="preview-pill">DEMO DATA</span></div>}
        {page === 'Overview' && <Overview partners={partners} offers={offers} go={go} notify={notify} />}
        {page === 'Partner verification' && <PartnerPage partners={filteredPartners} filter={partnerFilter} setFilter={setPartnerFilter} onStatus={changePartnerStatus} />}
        {page === 'Offers & experiences' && <OffersPage offers={filteredOffers} filter={offerFilter} setFilter={setOfferFilter} onStatus={changeOfferStatus} notify={notify}/>}
        {page === 'Users & partners' && <DirectoryPage partners={partners} />}
        {page === 'Trend insights' && <InsightsPage />}
        {page === 'Settings' && <SettingsPage notify={notify}/>}
      </div>
      <footer className="footer"><span>© 2026 SkyConnect SL</span><span><span className="footer-dot"/> All systems operational <span className="footer-sep">·</span> Admin console v0.1</span></footer>
    </main>
    {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}

function Overview({ partners, offers, go, notify }) {
  const pending = partners.filter(p => p.status === 'Pending').length;
  const published = offers.filter(o => o.status === 'Published').length;
  return <>
    <SectionTitle eyebrow="SUNDAY, OCTOBER 11, 2026" title="Good afternoon, Admin ✨" description="Here's what's happening across your travel discovery platform today." action={<button className="button button-primary" onClick={() => go('Offers & experiences')}><Plus size={16}/> Manage content</button>}/>
    <div className="welcome-strip"><div className="welcome-copy"><div className="welcome-label"><Sparkles size={14}/> YOUR WEEKLY SNAPSHOT</div><h2>Make every journey <em>personal.</em></h2><p>Keep great local experiences visible, trusted and easy to discover.</p><button onClick={() => go('Trend insights')}>Explore travel insights <ArrowUpRight size={15}/></button></div><div className="welcome-art"><div className="sun"/><div className="mountain mountain-back"/><div className="mountain mountain-front"/><div className="art-plane"><Plane size={30}/></div><div className="art-cloud cloud-one"/><div className="art-cloud cloud-two"/></div></div>
    <div className="metric-grid"><Metric label="Total users" value="2,840" change="12.8%" icon={Users} tint="tint-blue"/><Metric label="Verified partners" value={String(partners.filter(p=>p.status==='Approved').length + 36)} change="8.2%" icon={ShieldCheck} tint="tint-green"/><Metric label="Published offers" value={String(published + 124)} change="6.4%" icon={Compass} tint="tint-purple"/><Metric label="Pending reviews" value={String(pending)} change="Needs attention" direction="down" icon={Clock3} tint="tint-orange"/></div>
    <div className="dashboard-grid"><section className="panel engagement-panel"><div className="panel-heading"><div><h3>Discovery activity</h3><p>Explore views and saves across the platform</p></div><button className="select-like" onClick={() => notify('Showing the last 7 days.')}>Last 7 days <ChevronDown size={14}/></button></div><div className="chart-legend"><span><i className="legend-blue"/> Views <strong>3,345</strong></span><span><i className="legend-teal"/> Saves <strong>1,066</strong></span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:4,left:-22,bottom:0}}><defs><linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#638cf6" stopOpacity={0.18}/><stop offset="95%" stopColor="#638cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:12}} dy={9}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:11}}/><Tooltip contentStyle={{borderRadius:12,border:'1px solid #e8edf4',boxShadow:'0 8px 24px #14233a12'}}/><Area type="monotone" dataKey="visitors" name="Views" stroke="#638cf6" strokeWidth={2.5} fill="url(#viewsFill)"/><Area type="monotone" dataKey="saves" name="Saves" stroke="#2ab6a4" strokeWidth={2.5} fill="transparent"/></AreaChart></ResponsiveContainer></div></section>
    <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Latest updates from your workspace</p></div><button className="text-button" onClick={() => go('Partner verification')}>View all <ArrowUpRight size={14}/></button></div><div className="activity-list">{activity.map((a,i)=><div className="activity-item" key={i}><div className={`activity-icon ${a.tone}`}>{a.icon==='partner'?<Building2 size={16}/>:a.icon==='offer'?<Compass size={16}/>:a.icon==='check'?<Check size={16}/>:<ChartNoAxesCombined size={16}/>}</div><div className="activity-text"><strong>{a.title}</strong><p>{a.detail}</p><small>{a.time}</small></div></div>)}</div></section></div>
    <section className="panel table-panel"><div className="panel-heading"><div><h3>Partner applications</h3><p>Review partners before their content goes live</p></div><button className="text-button" onClick={() => go('Partner verification')}>View applications <ArrowUpRight size={14}/></button></div><PartnerTable partners={partners.filter(p=>p.status==='Pending').slice(0,3)} onStatus={(id,s)=>notify(`Demo: ${id} marked ${s.toLowerCase()}. Open Partner verification to manage statuses.`)} compact/></section>
    <div className="insight-note"><div className="insight-spark"><Sparkles size={18}/></div><div><strong>Travel discovery insight</strong><p>Nature and coastal experiences are strong categories to feature. Keep partner listings current so travelers see relevant local options.</p></div><button onClick={() => go('Trend insights')}>View insights <ArrowUpRight size={14}/></button></div>
  </>;
}

function PartnerPage({ partners, filter, setFilter, onStatus }) {
  return <><SectionTitle eyebrow="PARTNER MANAGEMENT" title="Partner verification" description="Review applications and keep the SkyConnect community trusted." action={<button className="button button-secondary" onClick={()=>window.print()}><Download size={16}/> Export list</button>}/><div className="filter-row"><div className="filter-tabs">{['All','Pending','Approved','Rejected'].map(s=><button className={filter===s?'selected':''} key={s} onClick={()=>setFilter(s)}>{s}</button>)}</div><span className="result-count">{partners.length} partners</span><button className="button button-secondary button-small"><Filter size={14}/> Filters</button></div><section className="panel table-panel"><PartnerTable partners={partners} onStatus={onStatus}/></section><p className="page-footnote"><ShieldCheck size={14}/> Verify partner identity and submitted details before approving listings. Status changes in this starter are local demo state until connected to your backend.</p></>;
}
function PartnerTable({ partners, onStatus, compact=false }) {
  return <div className="table-scroll"><table><thead><tr><th>PARTNER</th><th>TYPE</th><th>LOCATION</th><th>STATUS</th><th>{compact?'ACTIONS':'SUBMITTED'}</th></tr></thead><tbody>{partners.map(p=><tr key={p.id}><td><div className="partner-cell"><Avatar initials={p.initials} color={p.color}/><div><strong>{p.name}</strong><small>{p.id}</small></div></div></td><td>{p.type}</td><td><span className="location-cell"><MapPin size={13}/>{p.location}</span></td><td><Badge status={p.status.toLowerCase()}>{p.status}</Badge></td><td>{p.status==='Pending'?<div className="row-actions"><button className="approve-btn" title="Approve" onClick={()=>onStatus(p.id,'Approved')}><Check size={15}/></button><button className="reject-btn" title="Reject" onClick={()=>onStatus(p.id,'Rejected')}><X size={15}/></button><button className="more-btn" title="View details" onClick={()=>onStatus(p.id,'Pending')}><Eye size={15}/></button></div>:compact?<span className="muted">—</span>:<button className="more-btn" onClick={()=>onStatus(p.id,'Pending')}><Eye size={15}/> Review again</button>}</td></tr>)}</tbody></table>{partners.length===0&&<div className="empty-state"><ClipboardCheck size={24}/><strong>No partners found</strong><span>Try another filter or search term.</span></div>}</div>;
}
function OffersPage({ offers, filter, setFilter, onStatus, notify }) {
  return <><SectionTitle eyebrow="CONTENT CURATION" title="Offers & experiences" description="Manage the travel inspiration that travelers discover in their feed." action={<button className="button button-primary" onClick={()=>notify('Offer creation form will be connected to Backend 1 next.')}><Plus size={16}/> Add offer</button>}/><div className="filter-row"><div className="filter-tabs">{['All','Pending','Published','Rejected'].map(s=><button className={filter===s?'selected':''} key={s} onClick={()=>setFilter(s)}>{s}</button>)}</div><span className="result-count">{offers.length} listings</span></div><section className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>OFFER / EXPERIENCE</th><th>CATEGORY</th><th>PARTNER</th><th>STATUS</th><th>REACH</th><th>ACTIONS</th></tr></thead><tbody>{offers.map(o=><tr key={o.id}><td><div className="offer-cell"><div className={`offer-thumb ${o.category.toLowerCase()}`}>{o.category==='Beach'?<Compass size={18}/>:o.category==='Nature'?<MapPin size={18}/>:o.category==='Adventure'?<Plane size={18}/>:<Sparkles size={18}/>}</div><div><strong>{o.title}</strong><small>{o.id}</small></div></div></td><td><span className="category-chip">{o.category}</span></td><td>{o.partner}</td><td><Badge status={o.status.toLowerCase()}>{o.status}</Badge></td><td>{o.reach}</td><td>{o.status==='Pending'?<div className="row-actions"><button className="approve-btn" title="Publish" onClick={()=>onStatus(o.id,'Published')}><Check size={15}/></button><button className="reject-btn" title="Reject" onClick={()=>onStatus(o.id,'Rejected')}><X size={15}/></button></div>:<button className="more-btn" onClick={()=>notify(`Viewing ${o.title} is a demo action.`)}><Eye size={15}/></button>}</td></tr>)}</tbody></table>{offers.length===0&&<div className="empty-state">No offers match this filter.</div>}</div></section><div className="insight-note"><div className="insight-spark"><ShieldCheck size={18}/></div><div><strong>Keep content trustworthy</strong><p>Check descriptions, partner ownership, images and contact information before publishing an experience.</p></div></div></>;
}
function DirectoryPage({ partners }) {
  const approved=partners.filter(p=>p.status==='Approved').length;
  return <><SectionTitle eyebrow="COMMUNITY" title="Users & partners" description="A quick view of the SkyConnect community and partner network."/><div className="metric-grid"><Metric label="Registered users" value="2,840" change="12.8%" icon={Users} tint="tint-blue"/><Metric label="Total partners" value={String(partners.length)} change="Live demo list" icon={Building2} tint="tint-purple"/><Metric label="Approved partners" value={String(approved)} change="Verified" icon={ShieldCheck} tint="tint-green"/><Metric label="Pending partners" value={String(partners.filter(p=>p.status==='Pending').length)} change="Review needed" direction="down" icon={Clock3} tint="tint-orange"/></div><section className="panel table-panel"><div className="panel-heading"><div><h3>Partner directory</h3><p>Registered partners and their current status</p></div></div><PartnerTable partners={partners} onStatus={()=>{}}/></section><EmptyNote>User accounts and profile details will load here after Firebase/Backend 1 integration.</EmptyNote></>;
}
function InsightsPage() {
  return <><SectionTitle eyebrow="BASIC TREND INSIGHTS" title="Travel insights" description="Understand what travelers are exploring, liking and saving." action={<button className="button button-secondary" onClick={()=>window.print()}><Download size={16}/> Export report</button>}/><div className="metric-grid"><Metric label="Experience views" value="3,345" change="14.2%" icon={Eye} tint="tint-blue"/><Metric label="Saved experiences" value="1,066" change="9.6%" icon={Bookmark} tint="tint-green"/><Metric label="Likes this week" value="824" change="11.3%" icon={Heart} tint="tint-purple"/><Metric label="Partner engagement" value="68.4%" change="4.8%" icon={ChartNoAxesCombined} tint="tint-orange"/></div><div className="dashboard-grid insights-grid"><section className="panel engagement-panel"><div className="panel-heading"><div><h3>Views & saves</h3><p>Weekly discovery activity · sample data</p></div></div><div className="chart-wrap chart-large"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barGap={5}><CartesianGrid stroke="#edf1f6" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8994a5',fontSize:11}}/><Tooltip/><Bar dataKey="visitors" name="Views" fill="#638cf6" radius={[5,5,0,0]}/><Bar dataKey="saves" name="Saves" fill="#2ab6a4" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="panel destinations-panel"><div className="panel-heading"><div><h3>Popular destinations</h3><p>Interest index · illustrative</p></div></div><div className="destination-list">{destinationData.map((d,i)=><div className="destination-row" key={d.name}><span className="destination-rank">0{i+1}</span><span className="destination-name">{d.name}</span><div className="destination-track"><span style={{width:`${d.value}%`,background:d.color}}/></div><strong>{d.value}</strong></div>)}</div><div className="chart-footnote">Sample values only. Connect event tracking to calculate real popularity.</div></section></div><EmptyNote>These charts use illustrative sample data. We will replace them with real Firestore or Backend 1 analytics after confirming your schema.</EmptyNote></>;
}
function SettingsPage({ notify }) {
  return <><SectionTitle eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Manage the connections and access rules for the SkyConnect admin console."/><div className="settings-grid"><section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon blue"><ShieldCheck size={19}/></div><div><h3>Authentication & access</h3><p>Admin access and role permissions</p></div></div><div className="setting-line"><div><strong>Firebase configuration</strong><p>Connect this console to your Firebase project.</p></div><Badge status={firebaseConfigured?'approved':'pending'}>{firebaseConfigured?'Configured':'Not configured'}</Badge></div><div className="setting-line"><div><strong>Admin role enforcement</strong><p>Must be enforced with Firebase custom claims or backend authorization.</p></div><Badge status="pending">To configure</Badge></div><button className="button button-secondary" onClick={()=>notify('Set Firebase variables in .env, then restart the dev server.')}><Settings size={15}/> Setup guide</button></section><section className="panel settings-panel"><div className="settings-heading"><div className="settings-icon purple"><Sparkles size={19}/></div><div><h3>AI service connection</h3><p>Backend 2 recommendation service</p></div></div><div className="setting-line"><div><strong>FastAPI base URL</strong><p>Set VITE_AI_API_BASE_URL in your local .env file.</p></div><Badge status="pending">Not tested</Badge></div><div className="setting-line"><div><strong>Recommendation endpoint</strong><p>Will be mapped to the endpoint in your Backend 2 repository.</p></div><Badge status="pending">To configure</Badge></div><button className="button button-secondary" onClick={()=>notify('Please confirm the actual FastAPI route from Backend 2.')}>Review API connection <ExternalLink size={14}/></button></section></div><div className="security-callout"><ShieldCheck size={20}/><div><strong>Security before launch</strong><p>Use role-based authorization, Firestore security rules, server-side validation and environment variables. Never expose service-account keys or AI provider secrets in browser code.</p></div></div></>;
}