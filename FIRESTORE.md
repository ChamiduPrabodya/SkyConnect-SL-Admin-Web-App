# Firestore integration

Runtime business data comes from Firestore. There is no bundled mock-inventory fallback. A failed or empty catalog shows a loading/error/empty state. Shared seed data, media, rules and deployment instructions live in the separate `skyconnect-backend` folder at the workspace root; read its README before running these apps against the migrated catalog.

Frontend directories contain UI, services and calculations. `src/data/catalog` (traveler) and `src/data/referenceStore.js` (partner) are live in-memory stores, populated by Firebase snapshots, rather than static datasets. Local storage holds guest drafts/boot presentation preferences and the local push-device binding metadata; notification history and push preferences are in Firestore. Signed-in preferences, saved plans and likes are account-scoped Firestore documents.

Deploy the backend rules, seed the catalog, and provision a real admin Auth claim before connected-account verification. Do not restore permissive rules or mock-data fallbacks to bypass setup errors.

FCM permission, token and inbox clients are implemented. Notification sending runs in the separate Spark-compatible `skyconnect-backend` worker; see its `NOTIFICATIONS.md` for setup. Backend rules/indexes are deployed. The public browser VAPID key is configured in the local frontend environment. Browser permission, token registration and delivery still need testing. Native push requires an installed build with its platform credentials and device testing.

Privacy consent is recorded with registration and an immutable server-timed receipt. Account deletion uses recent reauthentication and a protected backend queue. See `skyconnect-backend/PRIVACY.md`. Mobile entry: Profile/Settings -> Privacy & account deletion. Web entry: `/delete-account`, accessible without admin claims. Restart the Spark backend worker to load the deletion processor; the web route still needs a published HTTPS URL for Play Console.
