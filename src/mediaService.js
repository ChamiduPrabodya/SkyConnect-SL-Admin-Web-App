import { auth } from './firebase.js';

const base = (import.meta.env.VITE_MEDIA_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export async function uploadCatalogPhoto(file) {
  if (!auth?.currentUser) throw new Error('Sign in before uploading photos.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) {
    throw new Error('Choose a JPG, PNG or WebP photo no larger than 8 MB.');
  }
  const token = await auth.currentUser.getIdToken();
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 75000);
  try {
    const response = await fetch(`${base}/v1/media/images?purpose=catalog`, { method: 'POST', body: file, signal: controller.signal,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type } });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Photo upload failed. Try again.');
    if (!/^https:\/\/res\.cloudinary\.com\//.test(result.url || '')) throw new Error('Photo upload did not return a valid URL.');
    return result.url;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Cannot reach the photo service. Check your connection and try again.');
    throw error;
  } finally { clearTimeout(timer); }
}
