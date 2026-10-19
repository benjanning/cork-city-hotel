(() => {
  "use strict";
  const R = window.BookingRules,
    app = document.querySelector("#app"),
    server = document.body.dataset.mode === "server";
  const key = "cork-city-hotel-v2";
  let state = {},
    rooms = [],
    csrf = "";
  try {
    state = JSON.parse(sessionStorage.getItem(key) || "{}");
  } catch {
    state = {};
  }
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const money = (cents) =>
    new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  const date = (v) =>
    new Date(v + "T12:00:00Z").toLocaleDateString("en-IE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const save = () => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* The flow still works when browser storage is unavailable. */
    }
  };
  const error = (message) => {
    const box = document.querySelector("#error");
    box.textContent = message;
    box.hidden = false;
    box.focus();
  };
  const go = (step) => {
    save();
    if (location.hash === "#" + step) render();
    else location.hash = step;
  };
  async function api(path, body) {
    const response = await fetch("./api/" + path, {
      method: body ? "POST" : "GET",
      headers: body
        ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
        : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error("The demo server is unavailable. Reload and try again.");
    }
    if (!response.ok) throw Error(data.error || "Please try again.");
    return data;
  }
  const errors = () =>
    '<div id="error" class="error" role="alert" tabindex="-1" hidden></div>';
  function steps(active) {
    return (
      '<ol class="progress" aria-label="Booking progress">' +
      ["Your stay", "Your room", "Guest details", "Review"]
        .map(
          (label, i) =>
            `<li ${i === active ? 'aria-current="step" class="current"' : ""}><span>${i + 1}</span>${label}</li>`,
        )
        .join("") +
      "</ol>"
    );
  }
  function datesForm() {
    const s = state.stay || {};
    return `<form id="stay-form" class="stay-form"><div><label for="checkin">Check-in</label><input type="date" id="checkin" name="checkin" min="${R.today()}" value="${esc(s.checkin)}" required></div><div><label for="checkout">Check-out</label><input type="date" id="checkout" name="checkout" min="${R.today()}" value="${esc(s.checkout)}" required></div><div><label for="guests">Guests</label><select id="guests" name="guests">${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${Number(s.guests || 2) === n ? "selected" : ""}>${n} ${n === 1 ? "guest" : "guests"}</option>`).join("")}</select></div><button class="button" type="submit">Find your room <span aria-hidden="true">→</span></button></form>`;
  }
  function summary(q = state.quote) {
    if (!q) return "";
    return `<aside class="summary"><span class="eyebrow">YOUR EXAMPLE STAY</span><h2>A little time away.</h2><div class="summary-dates"><div><small>CHECK-IN</small><strong>${esc(date(q.checkin))}</strong></div><span>→</span><div><small>CHECK-OUT</small><strong>${esc(date(q.checkout))}</strong></div></div><dl><div><dt>Room</dt><dd>${esc(q.roomName)}</dd></div><div><dt>Rooms · guests</dt><dd>${q.quantity} · ${q.guests}</dd></div><div><dt>${money(q.unitPriceCents)} × ${q.nights} nights × ${q.quantity} rooms</dt><dd>${money(q.totalCents)}</dd></div></dl><div class="summary-total"><span>Example total</span><strong>${money(q.totalCents)}</strong></div><p class="fine">Synthetic rate. No payment is collected.<br>No reservation or real availability is implied.</p></aside>`;
  }
  function hero() {
    app.innerHTML = `${errors()}<section class="hotel-hero"><div class="hero-copy"><span class="eyebrow">A FICTIONAL RETREAT IN THE HEART OF CORK</span><h1>Come for the city.<br><em>Stay for a moment.</em></h1><p>A considered space to slow down. Explore three example rooms and a thoughtful, fully interactive booking journey.</p><a class="underlink" href="#stay">Make yourself at home <span>↗</span></a><div class="hero-details"><span>Three room types</span><span>One simple journey</span><span>Entirely a demonstration</span></div></div><figure class="hero-photo"><img src="./images/hotel-room.jpg" alt="Illustrative hotel bedroom with a warm wooden interior" width="1600" height="1068"><figcaption>Illustrative room photography · Not a real property</figcaption></figure></section><section class="booking-bar" aria-label="Plan your example stay"><span class="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>${datesForm()}</section><section class="home-bottom"><div><span class="eyebrow">CONSIDERED, FROM START TO FINISH</span><h2>A room for your<br>kind of stay.</h2></div><p>Choose your dates, explore the example rooms and see the full price before confirming a demonstration. No account. No payment. Just a useful way to explore the application.</p><a href="#stay" class="underlink">Explore the rooms →</a></section>`;
  }
  function stay() {
    app.innerHTML = `<div class="flow">${steps(0)}${errors()}<header class="page-heading"><span class="eyebrow">01 / MAKE A LITTLE SPACE</span><h1>When shall we<br><em>expect you?</em></h1><p>Choose a future stay and your guest count. All availability is synthetic.</p></header><section class="date-panel">${datesForm()}<p class="fine">Choose 1–365 nights. Use the next steps to explore room types, prices and sample guest details.</p></section></div>`;
  }
  function roomCards() {
    return rooms
      .map((room) => {
        const qty = Number(state.quantity || 1),
          fits = room.capacity * qty >= state.stay.guests && qty <= room.stock;
        return `<article class="room-card"><div class="room-art art-${room.kind.toLowerCase()}" aria-hidden="true"><div class="floorplan"><i></i>${room.kind === "Single" ? "" : "<i></i>"}</div><span>${room.size} m² / ILLUSTRATIVE LAYOUT</span></div><div class="room-card-body"><div class="room-meta">${esc(room.kind)} room <span>${room.capacity} ${room.capacity === 1 ? "guest" : "guests"} per room</span></div><h2>${esc(room.name)}</h2><p>${esc(room.description)}</p><ul>${room.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul><div class="room-price"><strong>${money(Math.round(room.price * 100))}<small>/ room / night</small></strong><span>${room.stock} example rooms</span></div><button class="button" data-room="${room.id}" ${fits ? "" : "disabled"}>${fits ? "Choose this room" : "Adjust room quantity"} <span aria-hidden="true">→</span></button>${!fits ? '<p class="fine">Select enough rooms for your guest count and stay within example stock.</p>' : ""}</div></article>`;
      })
      .join("");
  }
  function selectRoom() {
    R.validateStay(state.stay);
    app.innerHTML = `<div class="flow wide">${steps(1)}${errors()}<div class="heading-row"><header class="page-heading"><span class="eyebrow">02 / FIND YOUR FAVOURITE</span><h1>A room to<br><em>call your own.</em></h1><p>${date(state.stay.checkin)} — ${date(state.stay.checkout)} · ${state.stay.nights} nights · ${state.stay.guests} guests <a href="#stay">Edit dates</a></p></header><div class="quantity-control"><label for="quantity">Number of rooms</label><select id="quantity">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option ${Number(state.quantity || 1) === n ? "selected" : ""}>${n}</option>`).join("")}</select><small>Example availability only</small></div></div><div class="room-grid">${roomCards()}</div></div>`;
  }
  function guest() {
    if (!state.quote) throw Error("Choose your room first.");
    R.makeQuote(rooms, state.quote);
    const g = state.guest || {};
    app.innerHTML = `<div class="flow">${steps(2)}${errors()}<div class="booking-layout"><section><header class="page-heading"><span class="eyebrow">03 / THE LITTLE DETAILS</span><h1>Make it<br><em>your stay.</em></h1><p>Use sample details only. This demonstration does not create an account or send email.</p></header><form id="guest-form" class="guest-form"><label for="guest-name">Sample guest name</label><input id="guest-name" name="name" autocomplete="off" maxlength="60" minlength="2" value="${esc(g.name || "")}" placeholder="Sample Guest" required><label for="guest-email">Example email</label><input id="guest-email" name="email" type="email" autocomplete="off" maxlength="100" value="${esc(g.email || "")}" placeholder="guest@example.com" aria-describedby="email-help" required><small id="email-help">Please use an @example.com address.</small><label for="request">Example preference</label><select id="request" name="request">${["No preference", "Quiet room", "Late arrival"].map((v) => `<option ${g.request === v ? "selected" : ""}>${v}</option>`).join("")}</select><button class="button" type="submit">Review your stay →</button><a class="back-link" href="#rooms">← Change your room</a></form></section>${summary()}</div></div>`;
  }
  function review() {
    if (!state.preview)
      throw Error("Enter your sample guest details before reviewing.");
    R.validateGuest(state.preview.guest);
    app.innerHTML = `<div class="flow">${steps(3)}${errors()}<div class="booking-layout"><section><header class="page-heading"><span class="eyebrow">04 / EVERYTHING IN ONE PLACE</span><h1>Your stay,<br><em>at a glance.</em></h1><p>A final look before completing the demonstration.</p></header><div class="guest-review"><span class="eyebrow">SAMPLE GUEST</span><h2>${esc(state.preview.guest.name)}</h2><p>${esc(state.preview.guest.email)}<br>${esc(state.preview.guest.request)}</p><a href="#guest">Edit guest details</a></div><div class="notice">This creates a demonstration confirmation only. No real hotel room is reserved and no payment is processed.</div><button class="button" id="confirm">Confirm demonstration →</button><a class="back-link" href="#rooms">← Change your room</a></section>${summary(state.preview.quote)}</div></div>`;
  }
  function confirmation() {
    if (!state.receipt)
      throw Error(
        "Complete the review step to see a demonstration confirmation.",
      );
    const rec = state.receipt;
    app.innerHTML = `<div class="flow confirmation">${errors()}<div class="confirmation-heading"><span class="success-mark" aria-hidden="true">✓</span><span class="eyebrow">DEMONSTRATION COMPLETE</span><h1>A lovely example.<br><em>All wrapped up.</em></h1><p>Thank you, ${esc(rec.guest.name)}. You’ve completed the booking demonstration.<br><strong>No real reservation has been made.</strong></p><div class="reference"><small>DEMO REFERENCE</small><strong>${esc(rec.reference)}</strong></div></div><div class="confirmation-grid">${summary(rec.quote)}<section class="confirmation-note"><span class="eyebrow">THE DETAILS</span><h2>Ready to explore<br>what’s behind it?</h2><p>Guest: ${esc(rec.guest.name)}<br>Email: ${esc(rec.guest.email)}<br>Preference: ${esc(rec.guest.request)}</p><p>In the public version, the journey runs in your browser. The source also includes an Express API and an optional MySQL catalog.</p><button class="button" id="restart">Start again →</button><a class="underlink" href="https://github.com/benjanning/cork-city-hotel">Explore the source ↗</a></section></div></div>`;
  }
  function render() {
    let guarded = false;
    try {
      const step = location.hash.slice(1) || "home";
      (
        ({ home: hero, stay, rooms: selectRoom, guest, review, confirmation })[
          step
        ] || hero
      )();
    } catch (e) {
      stay();
      error(e.message);
      guarded = true;
    }
    document.title =
      "Cork City Hotel — " + (location.hash.slice(1) || "A considered stay");
    if (!guarded) document.querySelector("#main").focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  app.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.target;
    try {
      if (form.id === "stay-form") {
        state.stay = R.validateStay(Object.fromEntries(new FormData(form)));
        delete state.quote;
        delete state.preview;
        delete state.receipt;
        go("rooms");
      }
      if (form.id === "guest-form") {
        const guest = R.validateGuest(Object.fromEntries(new FormData(form)));
        state.guest = guest;
        const payload = { ...state.quote, guest };
        const submit = form.querySelector("button");
        submit.disabled = true;
        try {
          state.preview = server
            ? await api("preview", payload)
            : {
                quote: R.makeQuote(rooms, payload),
                guest,
                token: crypto.randomUUID(),
              };
          go("review");
        } finally {
          submit.disabled = false;
        }
      }
    } catch (e) {
      error(e.message);
    }
  });
  app.addEventListener("change", (e) => {
    if (e.target.id === "quantity") {
      state.quantity = Number(e.target.value);
      save();
      selectRoom();
      document.querySelector("#quantity").focus();
    }
  });
  app.addEventListener("click", async (e) => {
    const choose = e.target.closest("[data-room]");
    try {
      if (choose) {
        state.quote = R.makeQuote(rooms, {
          ...state.stay,
          roomId: Number(choose.dataset.room),
          quantity: Number(state.quantity || 1),
        });
        delete state.preview;
        delete state.receipt;
        go("guest");
      }
      if (e.target.closest("#confirm")) {
        const button = document.querySelector("#confirm");
        button.disabled = true;
        try {
          state.receipt = server
            ? await api("confirm", { token: state.preview.token })
            : {
                ...state.preview,
                reference:
                  "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
                demo: true,
              };
          go("confirmation");
        } finally {
          button.disabled = false;
        }
      }
      if (e.target.closest("#restart")) {
        state = {};
        save();
        go("home");
      }
    } catch (errorValue) {
      error(errorValue.message);
    }
  });
  document.querySelector(".skip").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#main").focus();
  });
  window.addEventListener("hashchange", () => {
    if (location.hash !== "#main") render();
  });
  (async () => {
    try {
      if (server) {
        const session = await api("session");
        csrf = session.csrf;
        rooms = (await api("rooms")).rooms;
        document.querySelector("#mode-label").textContent =
          "Express demo · Synthetic data · No real reservations";
      } else {
        rooms = structuredClone(R.catalog);
        document.querySelector("#mode-label").textContent =
          "Interactive static demo · No real reservations or payments";
      }
      render();
    } catch (e) {
      app.innerHTML =
        errors() +
        '<section class="credits"><h1>A moment, please.</h1><p>The room catalog could not be loaded.</p><a href="./">Reload the demonstration →</a></section>';
      error(e.message);
    }
  })();
})();
