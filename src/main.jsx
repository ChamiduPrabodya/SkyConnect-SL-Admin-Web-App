import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AdminSession from './AdminSession.jsx';
import AccountDeletionPage from './privacy/AccountDeletionPage.jsx';
import './styles.css';
import './review.css';
import './catalog.css';
import './theme.css';
import './directory.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>{window.location.pathname === '/delete-account' ? <AccountDeletionPage/> : <AdminSession><App /></AdminSession>}</React.StrictMode>
);
