const { test } = require("node:test");
const assert = require("node:assert/strict");
const R = require("./booking");
test("room price is calculated in cents and invalid rates are rejected", () => {
  assert.equal(R.quote(99.99, 3, 2), 599.94);
  for (const rate of [-1, 0, NaN, Infinity])
    assert.throws(() => R.quote(rate, 1, 2));
});
test("stay rejects past dates and invalid guest counts", () => {
  assert.throws(() =>
    R.validateStay(
      { checkin: "2020-01-01", checkout: "2020-01-02", guests: 1 },
      "2026-10-19",
    ),
  );
  for (const guests of [0, 1.5, 7])
    assert.throws(() =>
      R.validateStay(
        { checkin: "2026-11-01", checkout: "2026-11-02", guests },
        "2026-10-19",
      ),
    );
});
test("guest accepts sample addresses only and normalizes values", () => {
  assert.deepEqual(
    R.validateGuest({
      name: " Sample Guest ",
      email: "GUEST@example.com",
      request: "No preference",
    }),
    {
      name: "Sample Guest",
      email: "guest@example.com",
      request: "No preference",
    },
  );
  assert.throws(() =>
    R.validateGuest({
      name: "Sample",
      email: "real@gmail.com",
      request: "No preference",
    }),
  );
});
test("capacity, availability and fractional quantities are enforced", () => {
  const s = {
    checkin: "2026-11-01",
    checkout: "2026-11-03",
    guests: 2,
    roomId: 1,
    quantity: 1,
  };
  assert.throws(() => R.makeQuote(R.catalog, s, "2026-10-19"));
  assert.equal(
    R.makeQuote(R.catalog, { ...s, quantity: 2 }, "2026-10-19").totalCents,
    32000,
  );
  for (const quantity of [9, 1.5])
    assert.throws(() =>
      R.makeQuote(R.catalog, { ...s, quantity }, "2026-10-19"),
    );
});

test("money uses exact cents and rejects coercions or unsupported precision", () => {
  for (const price of [
    true,
    false,
    null,
    [],
    {},
    "1e2",
    " 120",
    "1.005",
    1.005,
    0,
    -1,
    Infinity,
    1e20,
  ])
    assert.throws(() => R.quote(price, 2, 3));
  assert.equal(R.priceCents("0.29"), 29);
  assert.equal(R.quote("0.29", 2, 3), 1.74);
  const rooms = R.catalog.map((r) =>
    r.id === 2 ? { ...r, price: "99999999.99", stock: 10 } : r,
  );
  const q = R.makeQuote(
    rooms,
    {
      checkin: "2030-01-01",
      checkout: "2031-01-01",
      guests: 6,
      quantity: 10,
      roomId: 2,
    },
    "2030-01-01",
  );
  assert.equal(q.totalCents, 36499999996350);
  assert.ok(Number.isSafeInteger(q.totalCents));
});
test("counts reject booleans, exponent strings and ambiguous integer syntax", () => {
  const p = {
    checkin: "2030-01-01",
    checkout: "2030-01-04",
    guests: 2,
    quantity: 2,
    roomId: 2,
  };
  for (const key of ["guests", "quantity", "roomId"])
    for (const value of [
      true,
      false,
      [],
      {},
      null,
      "1e0",
      " 1",
      "01",
      "1.0",
      1.5,
    ])
      assert.throws(() =>
        R.makeQuote(R.catalog, { ...p, [key]: value }, "2030-01-01"),
      );
  assert.equal(
    R.makeQuote(
      R.catalog,
      { ...p, guests: "2", quantity: "2", roomId: "2" },
      "2030-01-01",
    ).totalCents,
    72000,
  );
});
const s = {
  checkin: "2030-01-01",
  checkout: "2030-01-04",
  guests: 6,
  quantity: 1,
  roomId: 2,
};
test("comparison gives exact current-quantity amounts without accepting an invalid booking", () => {
  const before = JSON.stringify(R.catalog);
  const o = R.roomOption(R.catalog, s, "2030-01-01");
  assert.equal(o.quote.totalCents, 36000);
  assert.equal(o.quote.unitPriceCents, 12000);
  assert.equal(o.eligible, false);
  assert.equal(o.minimumQuantity, 3);
  assert.equal(o.suggestedQuantity, 3);
  assert.throws(() => R.makeQuote(R.catalog, s, "2030-01-01"), /enough rooms/);
  const q = R.makeQuote(R.catalog, { ...s, quantity: 3 }, "2030-01-01");
  assert.equal(q.totalCents, 108000);
  assert.equal(q.guests, 6);
  assert.equal(q.nights, 3);
  assert.deepEqual(
    Object.keys(q).sort(),
    [
      "checkin",
      "checkout",
      "guests",
      "nights",
      "quantity",
      "roomId",
      "roomName",
      "totalCents",
      "unitPriceCents",
    ].sort(),
  );
  assert.equal(JSON.stringify(R.catalog), before);
});
test("repair respects zero stock, insufficient stock, excessive quantity and exact decimal rates", () => {
  for (const stock of [0, "0", 2]) {
    const rooms = R.catalog.map((r) => ({ ...r, stock }));
    const o = R.roomOption(rooms, s, "2030-01-01");
    assert.equal(o.eligible, false);
    assert.equal(o.suggestedQuantity, null);
    assert.throws(() => R.makeQuote(rooms, s, "2030-01-01"));
  }
  const o = R.roomOption(R.catalog, { ...s, quantity: 7 }, "2030-01-01");
  assert.match(o.reason, /availability/);
  assert.equal(o.suggestedQuantity, 3);
  const rooms = R.catalog.map((r) => ({ ...r, price: "99.99" }));
  assert.equal(
    R.makeQuote(rooms, { ...s, quantity: 3 }, "2030-01-01").totalCents,
    89991,
  );
});
test("comparison and quotation reject malformed catalog counts instead of coercing them", () => {
  for (const key of ["capacity", "stock"])
    for (const value of [
      true,
      false,
      null,
      [],
      {},
      "01",
      "1e0",
      " 1",
      1.5,
      -1,
      2147483648,
    ]) {
      const rooms = R.catalog.map((r) => ({ ...r, [key]: value }));
      assert.throws(() => R.roomOption(rooms, s, "2030-01-01"));
      assert.throws(() => R.makeQuote(rooms, s, "2030-01-01"));
    }
  assert.throws(() =>
    R.roomOption(
      R.catalog.map((r) => ({ ...r, capacity: 0 })),
      s,
      "2030-01-01",
    ),
  );
});
