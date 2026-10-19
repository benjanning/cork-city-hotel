> Historical V1 documentation. Use README.md for the current setup and scope.

# Cork City Hotel booking prototype

An educational Express/EJS booking flow: choose dates, select a room and review a calculated total. Adapted from my original college project, with a local demonstration that needs no database, external API, account or payment details.

## Run locally

Install Node.js, run `npm ci`, then `npm start`. Open http://127.0.0.1:3000. Use synthetic names and an example.com address. All session data expires; nothing is booked or charged. Run `npm test` for date and pricing tests.

## Changes from the coursework

Preserved the EJS booking, room selection and confirmation screens. Added chronological date validation, quantity limits, server-calculated totals and guards for missing session state. The local demonstration uses three synthetic room records. Optional MySQL mode reads the original `products` schema using DB_HOST, DB_USER, DB_PASSWORD and DB_NAME; it has not been integration-tested here.

Removed embedded weather credentials, personal SQL exports and hotel photography with unverified redistribution rights. Removed broken CDN references; added local layout rules. The old demonstration password check was replaced with an explicit demo continuation; this is not an authentication system. Payment options are labelled demonstration only.

## Scope

Academic prototype. No real hotel affiliation, availability management, payment integration or production authentication is claimed. Do not expose this development server to the internet.

[Case study](https://benjanning.github.io/projects/projects/hotel-booking/) · [Portfolio](https://benjanning.github.io/projects/)
