# Full-stay room comparison

The problem: nightly rates do not answer the cost of a party staying several nights across several rooms. A generic disabled button also leaves the guest to calculate capacity manually.

The solution: `BookingRules.roomOption` returns the exact current-quantity quotation plus capacity, example stock, eligibility, a minimum quantity and an optional suggestion. `makeQuote` uses this assessment, rejects ineligible quantities and returns its unchanged quotation shape. Express recalculates independently from its catalog; client prices are never trusted.

An invalid quantity can have a calculable amount, clearly labelled as the current quantity, while its booking action stays disabled. A suggested repair is offered only if the minimum fits stock and the existing ten-room limit. Zero stock has no repair. Stock is illustrative per room type, without date allocation or holds.

Both manual and suggested quantity changes clear quote, preview and receipt, preserve dates/guest details, redraw every comparison, and return focus to the labelled quantity control. This prevents reaching an earlier review through manual hash navigation. A repair changes the quantity only after an explicit action; choosing the room is a separate action.

## Evidence

Three focused Node checks cover exact cents and unchanged quote shape, eligibility/repair boundaries including zero stock, malformed catalog counts, and non-mutation of source rooms. Two new browser journeys exercise Express and static mode: three room totals, six-guest repair, exact later summary, invalidation of stale review, preservation of dates/guest details, keyboard focus and 390px layout. The seven existing journeys still exercise confirmations and recovery. CI additionally checks an isolated MySQL catalog.

`HOTEL_BASE=https://benjanning.github.io/cork-city-hotel/ npx playwright test browser/comparison.spec.cjs` runs only the new journey against the real public static site; default test runs still start both isolated local servers. Genuine captures are exported only through the existing successful release workflow.

No real room is reserved. There is no payment, held stock or date-dependent inventory model. The improvement demonstrates consistent pricing and state transitions, not production hotel operations.
