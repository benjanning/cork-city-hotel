const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createRoomRepository } = require("./room-repository");
test(
  "isolated MySQL synthetic catalog integration",
  { skip: process.env.RUN_MYSQL_TESTS !== "1" },
  async () => {
    const repo = createRoomRepository({ ...process.env, MYSQL_MODE: "1" });
    try {
      const rooms = await repo.list();
      assert.equal(rooms.length, 3);
      assert.equal(rooms.find((r) => r.id === 2).price, 120);
    } finally {
      await repo.close();
    }
  },
);
