# Cork City Hotel

A complete demonstration booking journey: choose dates, compare example rooms, enter sample guest details and review an accurate total.

![Verified shared demonstration homepage](https://raw.githubusercontent.com/benjanning/cork-city-hotel/portfolio-published/portfolio/export/assets/homepage.jpg)

**Node.js · Express · EJS · JavaScript · Optional MySQL**

**[Try the interactive demo →](https://benjanning.github.io/cork-city-hotel/)** · [Visual case study](https://benjanning.github.io/projects/projects/hotel-booking/) · [Portfolio](https://benjanning.github.io/projects/)

The public demo is static and runs in your browser. It shares the interface and booking rules with the Express application; it does not run Express or MySQL. Everything uses synthetic data. No actual reservation or payment is made.

## What it does

- Dates → room and quantity → sample guest details → review → confirmation.
- Validates dates, guest capacity, quantity and example availability.
- Computes totals in cents; the server independently recalculates submitted selections.
- Preserves guest details and supports editing, retries and idempotent confirmation.
- Handles missing steps, expired sessions and catalog failures with clear messages.

## Run the Express application

Requires Node.js 18+.

```bash
npm ci
npm test
npm start
```

Open http://127.0.0.1:3000. Use sample names and an @example.com address. The default needs no database. The server binds to loopback and uses temporary sessions.

## Screens from the working application

| Room selection | Guest details |
| --- | --- |
| ![Example room cards](assets/rooms.jpg) | ![Sample guest form and accurate total](assets/guest-form.jpg) |
| Review | Confirmation |
| ![Review](assets/review.jpg) | ![Demonstration confirmation](assets/confirmation.jpg) |

## Architecture

The EJS shell, CSS, browser journey and pure booking rules are shared by both modes. Express provides room, preview and confirmation endpoints; the public static adapter runs those rules locally. The backend validates from its catalog, uses CSRF-protected session requests and never trusts a client-supplied price. No real inventory is allocated.

`npm run build:demo` renders docs/ from the same EJS shell and copies its assets. GitHub Pages serves docs/. Do not edit generated docs/ directly.

## Optional isolated MySQL catalog

The source release checks this catalog against a fresh MySQL 8.4 service in CI. For an optional local disposable setup:

1. Copy .env.example to .env and choose disposable local passwords.
2. Run `docker compose up -d --wait`. It creates an isolated MySQL 8.4 container with three synthetic rooms, loopback port 3307 and temporary database storage.
3. Set MYSQL_MODE=1, DB_HOST=127.0.0.1, DB_PORT=3307, DB_NAME=hotel_demo, DB_USER=hotel_demo and DB_PASSWORD to the local demo password, then run npm start.
4. Set RUN_MYSQL_TESTS=1 with the same DB_* variables and run npm test.
5. `docker compose down` stops the disposable demo. Its temporary database is not intended to preserve records.

There is no dependency on Docker to run the default application. No production database or public database port is configured.

## Verification and limits

Source CI requires 15 backend/rule checks, a separate disposable MySQL 8.4 integration check and two complete browser workflows before publishing a release. The default local run skips the opt-in database check. Tests exercise full HTTP preview/confirmation, CSRF, tampered prices, invalid dates/quantities/capacity/guests, idempotency, changed rates and catalog failures. Browser checks cover the complete Express and static journeys on desktop/mobile.

Academic source evolved into a portfolio demo: original booking templates are preserved in views/legacy/ and Git history. This is not a real hotel, payment system, inventory engine or production authentication service. Use synthetic details only.

[Image/demo credits](public/credits.html) · [Screenshot provenance](assets/PROVENANCE.md) · [Historical V1 documentation](COURSEWORK.md)

## Verified visual publishing

`npm run test:browser` starts isolated Express and static servers, checks the complete journey, invalid dates and sample email, confirmation reload, reset and mobile fit. Capture dates are calculated thirty days ahead to keep the scheduled checks usable. The MySQL check uses the explicitly named disposable CI database only. `scripts/seed-ci.cjs` refuses other names. The source release workflow exports fresh screenshot hashes and source identity only after all checks pass. The central site imports that package through a review PR and deploys after merge.
