# SkyConnect SL Admin Web App

A responsive React + Vite admin dashboard starter for the SkyConnect SL MVP.

## Included
- Admin overview dashboard
- Partner verification table with demo approve/reject actions
- Airline review details: airline profile, actual departure and arrival airports, flight schedule, aircraft, frequency, cabin class, currency, per-cabin ticket prices, and available seats
- Hotel review details: property type, category, SLTDA registration, room inventory, nightly rate, location, facilities, and photos
- Offer and experience moderation
- Users/partners directory with separate Airlines, Hotels, Activities, and Users tabs, category counts, search, and partner status filters. Tourism partners appear under Activities; user profiles await account-service integration.
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

Firebase initialization is in `src/firebase.js`. The dashboard reads Firestore and persists catalog/status changes. See `FIRESTORE.md` and `../skyconnect-backend/README.md` for the required migration, rules and administrator setup.

The supplied partner mock store is preserved in `src/partnerMockData.js`, including airlines, routes, hotels, registrations, bookings, and analytics. `src/partnerData.js` adapts its profiles and routes to the admin UI. The dashboard uses all 4 supplied airlines, 6 routes, and 4 hotels, plus the supplied pending tourism registrations. The existing tourism demo partners and offers are retained. Helitours' pending registration is merged with its airline profile rather than listed twice. Hotels appear as individual Hotel records; no tourism portfolio owner is assigned because the source does not supply that relationship.

Routes retain their actual source airports, including Colombo departures and domestic destinations. Duration strings are converted to minutes, lowercase statuses are adapted to the admin filters, and selected cabin classes determine which ticket prices and seat allocations appear. Missing values are shown explicitly and zero values are preserved. Hotel nightly-rate currency is shown as unspecified because the source has no hotel currency field. Registration document filenames are shown without download links because document contents were not supplied. Bookings and analytics remain available in the mock module for future integration; the current review screens display profiles, registrations, routes, and hotel details. All supplied values remain illustrative mock data.

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
