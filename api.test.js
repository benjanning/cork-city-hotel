const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("./server");
const R = require("./booking");
async function client(repository) {
  const server = createApp({ repository, clock: () => "2026-10-19" }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((r) => server.once("listening", r));
  const base = "http://127.0.0.1:" + server.address().port;
  let cookie = "",
    csrf = "";
  async function request(route, body, headers = {}) {
    const res = await fetch(base + "/api/" + route, {
      method: body ? "POST" : "GET",
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body
          ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
          : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.headers.get("set-cookie"))
      cookie = res.headers.get("set-cookie").split(";")[0];
    return { status: res.status, data: await res.json(), headers: res.headers };
  }
  const session = await request("session");
  csrf = session.data.csrf;
  return { request, close: () => new Promise((r) => server.close(r)) };
}
const selection = {
  checkin: "2026-11-10",
  checkout: "2026-11-13",
  guests: 2,
  roomId: 2,
  quantity: 2,
  guest: {
    name: "Sample Guest",
    email: "guest@example.com",
    request: "Quiet room",
  },
};
test("complete server journey computes prices and confirms idempotently", async () => {
  const c = await client();
  try {
    const preview = await c.request("preview", { ...selection, totalCents: 1 });
    assert.equal(preview.status, 200);
    assert.equal(preview.data.quote.totalCents, 72000);
    const receipt = await c.request("confirm", { token: preview.data.token });
    assert.equal(receipt.status, 200);
    assert.match(receipt.data.reference, /^DEMO-/);
    assert.equal(receipt.data.demo, true);
    assert.equal(receipt.data.guest.name, "Sample Guest");
    assert.deepEqual(
      (await c.request("confirm", { token: preview.data.token })).data,
      receipt.data,
    );
  } finally {
    await c.close();
  }
});
test("missing and wrong CSRF rejected", async () => {
  const c = await client();
  try {
    assert.equal(
      (await c.request("preview", selection, { "X-CSRF-Token": "" })).status,
      403,
    );
    assert.equal(
      (await c.request("preview", selection, { "X-CSRF-Token": "wrong" }))
        .status,
      403,
    );
  } finally {
    await c.close();
  }
});
test("confirmation requires a matching reviewed selection", async () => {
  const c = await client();
  try {
    assert.equal(
      (await c.request("confirm", { token: "missing" })).status,
      409,
    );
    await c.request("preview", selection);
    assert.equal((await c.request("confirm", { token: "wrong" })).status, 409);
  } finally {
    await c.close();
  }
});
test("invalid dates, capacity, quantity, stock, room and guest data return useful 400s", async () => {
  const c = await client();
  try {
    for (const patch of [
      { checkin: "2020-01-01" },
      { checkout: "2026-11-09" },
      { roomId: 99 },
      { quantity: 0 },
      { quantity: 7 },
      { roomId: 1, guests: 6, quantity: 1 },
      { guest: { ...selection.guest, email: "person@real-domain.invalid" } },
      { guest: { ...selection.guest, name: "" } },
    ]) {
      const result = await c.request("preview", { ...selection, ...patch });
      assert.equal(result.status, 400, JSON.stringify(patch));
      assert.ok(result.data.error);
    }
  } finally {
    await c.close();
  }
});
test("catalog outage returns 503 without connection details", async () => {
  const repository = {
    mode: "mysql",
    list: async () => {
      throw Error("sensitive internal database detail");
    },
  };
  const c = await client(repository);
  try {
    const res = await c.request("rooms");
    assert.equal(res.status, 503);
    assert.doesNotMatch(JSON.stringify(res.data), /sensitive/);
    assert.equal((await c.request("preview", selection)).status, 503);
  } finally {
    await c.close();
  }
});
test("price changes after review require a fresh review", async () => {
  let price = 120;
  const repository = {
    mode: "synthetic",
    list: async () => R.catalog.map((r) => (r.id === 2 ? { ...r, price } : r)),
  };
  const c = await client(repository);
  try {
    const preview = await c.request("preview", selection);
    price = 140;
    assert.equal(
      (await c.request("confirm", { token: preview.data.token })).status,
      409,
    );
  } finally {
    await c.close();
  }
});
test("security headers and a catalog independent of client input", async () => {
  const c = await client();
  try {
    const res = await c.request("rooms");
    assert.equal(res.status, 200);
    assert.equal(res.data.rooms.length, 3);
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.match(res.headers.get("cache-control"), /no-store/);
  } finally {
    await c.close();
  }
});
