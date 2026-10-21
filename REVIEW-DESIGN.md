# Reliable booking reviews

The improvement targets a real failure boundary: a review can be older than the current session, selected dates or catalog rate. A confirmation retry must also mean the same thing as the original request.

## State and money rules

The shared browser/server rules validate canonical integer guest/room/quantity fields. Rates must be positive decimal-cent values within the existing MySQL `DECIMAL(10,2)` range. Quote totals use integer cents throughout: unit rate × nights × quantity. Booleans, exponent strings, ambiguous counts, non-finite values and more than two decimal places are rejected rather than coerced or silently rounded.

Reviews expire after fifteen minutes, using one shared lifetime constant. Changing dates invalidates the old quote, review and receipt but preserves sample guest details. A changed catalog total requires a fresh review. Recovery restores the current session/catalog and preview, displays the refreshed quote and waits for another explicit Confirm action. It never silently confirms a changed price.

Confirmed snapshots preserve identity and terms. Returning to the same reviewed token reuses its receipt in both modes. Express also caches one immutable receipt per unpredictable review token, rechecking after the asynchronous catalog lookup before the synchronous save. The cache has a fifteen-minute expiry and a maximum of 500 entries; the session can retain its already-confirmed receipt. Requests must still match the session preview and pass CSRF checks.

## Useful failure responses

| Code | Meaning | Browser behavior |
| --- | --- | --- |
| `session_expired` | Missing/expired CSRF session | Restore session and review, preserving sample details |
| `review_required` / `review_expired` | Missing/mismatched/expired reviewed token | Produce a fresh review for explicit approval |
| `price_changed` | Current price differs from reviewed price | Show the new current review; require confirmation again |
| `selection_invalid` | Dates, capacity or quantity no longer valid | Return to the stay selection with useful guidance |
| `catalog_unavailable` | Repository temporarily unavailable | Preserve current selection and allow retry; expose no database details |

## Tests and practical limits

API tests force two confirmations to reach the same asynchronous boundary before releasing them and assert identical receipts. An injected clock tests review expiry without waiting. Other checks distinguish stock changes from catalog outages and reject invalid monetary/numeric domains. Browser journeys use actual cleared Express cookies to exercise recovery, preserve guest details across date changes, and simulate an older stored static quote. The recovered-review screenshot comes from the real Express recovery journey, not a fabricated interface.

Twenty backend/rule checks, one isolated MySQL catalog check and seven complete browser workflows gate the source release. Existing styles, source routes, synthetic-data reset and mobile behavior remain covered. The same verified package/review/Pages system publishes matching portfolio evidence.

This remains a synthetic educational demonstration. It does not hold date-based inventory, create real hotel reservations, take payments or send messages. MySQL supplies the optional synthetic room catalog; it does not store bookings. Default Express sessions and the bounded receipt cache are temporary local state, not production booking persistence. The browser demo is session-local and cannot synchronize bookings across devices. These limits are explicit rather than hidden behind a realistic interface.
