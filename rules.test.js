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
