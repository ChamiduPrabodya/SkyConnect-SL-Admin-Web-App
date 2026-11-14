import React, { useState } from 'react';
import { uploadCatalogPhoto } from './mediaService.js';

export default function ImageUpload({ onUpload, onBusyChange }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const choose = async event => {
    const file = event.target.files?.[0];
    if (!file || busy) return;
    setBusy(true); setError(''); onBusyChange?.(true);
    try { onUpload(await uploadCatalogPhoto(file)); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); onBusyChange?.(false); event.target.value = ''; }
  };
  return <div className="photo-upload-control">
    <label>Upload photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={choose}/></label>
    <small aria-live="polite">{busy ? 'Uploading photo...' : 'JPG, PNG or WebP. Maximum 8 MB. Save the form to keep your changes.'}</small>
    {error && <div className="catalog-form-error" role="alert">{error}</div>}
  </div>;
}
