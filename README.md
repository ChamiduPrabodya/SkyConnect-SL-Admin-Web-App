# SkyConnect SL Admin Web App

A responsive React + Vite admin dashboard starter for the SkyConnect SL MVP.

## Included
- Admin overview dashboard
- Partner verification table with demo approve/reject actions
- Offer and experience moderation
- Users/partners directory summary
- Trend insights charts (illustrative data)
- Settings page for Firebase and Backend 2 integration
- Firebase Web SDK initialization scaffold
- Responsive desktop/tablet/mobile layout

## Requirements
- Node.js 20+ recommended
- npm

## Run locally
```bash
npm install
cp .env.example .env
npm run dev
```
On Windows PowerShell, use:
```powershell
Copy-Item .env.example .env
npm install
npm run dev
```
Open the local URL Vite prints, usually `http://localhost:5173`.

## Firebase setup
1. Create/open the SkyConnect Firebase project.
2. Register a Web App in Firebase Project Settings.
3. Copy the web app config into `.env` variables starting with `VITE_FIREBASE_`.
4. Enable the authentication provider you intend to use.
5. Create Firestore collections according to the final shared data model.
6. Add restrictive Firestore Security Rules and enforce admin roles with custom claims or server-side authorization.

Firebase initialization is in `src/firebase.js`. The dashboard currently uses local demo arrays in `src/data.js`; it does not yet read or write Firestore.

## Backend 1 and Backend 2
- Main application data (users, partners, offers, likes/saves) should come from the agreed Backend 1 / Firestore schema.
- Backend 2 is expected to expose a FastAPI endpoint for recommendations. Set `VITE_AI_API_BASE_URL` to its base URL after confirming its actual routes.
- Do not expose Vertex AI/Gemini secrets, Firebase service-account keys, or other server credentials in frontend environment variables.
- Do not call Firebase Admin SDK or privileged APIs directly from the browser.

## Important status
This is a frontend starter, not a deployed production app. Demo actions only change local React state and reset on refresh. Authentication, persistent writes, role enforcement, real analytics, and AI API calls still need integration.

## Suggested next integration steps
1. Inspect the existing `SkyConnect-user-app`, `SkyConnect-partner-app`, and Backend 2 repositories.
2. Agree on shared collection names, document shapes, status values, and authentication/role strategy.
3. Replace demo data and action handlers with Firebase/API calls.
4. Add protected admin routes and server-enforced admin authorization.
5. Test with separate admin, partner, and traveler accounts.
