const express = require("express");
const session = require("express-session");
const path = require("node:path");
const { randomBytes, timingSafeEqual } = require("node:crypto");
const Rules = require("./booking");
const { createRoomRepository } = require("./room-repository");
function createApp({
  repository = createRoomRepository(),
  clock = Rules.today,
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'",
    });
    next();
  });
  app.use(express.json({ limit: "8kb" }));
  app.use(
    session({
      secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "strict", maxAge: 1800000 },
    }),
  );
  app.use(express.static(path.join(__dirname, "public")));
  app.get("/", (req, res) => res.render("hotel", { mode: "server" }));
  app.get("/api/session", (req, res) => {
    req.session.csrf ||= randomBytes(24).toString("hex");
    res
      .set("Cache-Control", "no-store")
      .json({ csrf: req.session.csrf, mode: repository.mode });
  });
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (req.method === "GET") return next();
    const actual = Buffer.from(String(req.get("X-CSRF-Token") || ""));
    const expected = Buffer.from(String(req.session.csrf || ""));
    if (
      !expected.length ||
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    )
      return res
        .status(403)
        .json({ error: "Your demo session expired. Reload and try again." });
    next();
  });
  app.get("/api/rooms", async (req, res) => {
    try {
      res.json({ rooms: await repository.list(), mode: repository.mode });
    } catch {
      res
        .status(503)
        .json({
          error:
            "The room catalog is temporarily unavailable. Please try again.",
        });
    }
  });
  app.post("/api/preview", async (req, res) => {
    let rooms;
    try {
      rooms = await repository.list();
    } catch {
      return res
        .status(503)
        .json({
          error:
            "The room catalog is temporarily unavailable. Please try again.",
        });
    }
    try {
      const quote = Rules.makeQuote(rooms, req.body, clock());
      const guest = Rules.validateGuest(req.body.guest);
      const token = randomBytes(16).toString("hex");
      req.session.preview = { quote, guest, token };
      delete req.session.receipt;
      res.json({ quote, guest, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  app.post("/api/confirm", async (req, res) => {
    const preview = req.session.preview;
    if (!preview || req.body?.token !== preview.token)
      return res
        .status(409)
        .json({
          error: "Review your stay before confirming the demonstration.",
        });
    if (req.session.receipt) return res.json(req.session.receipt);
    try {
      const quote = Rules.makeQuote(
        await repository.list(),
        preview.quote,
        clock(),
      );
      if (quote.totalCents !== preview.quote.totalCents)
        return res
          .status(409)
          .json({
            error: "The example price changed. Review your stay again.",
          });
      const receipt = {
        reference: "DEMO-" + randomBytes(4).toString("hex").toUpperCase(),
        quote,
        guest: preview.guest,
        demo: true,
      };
      req.session.receipt = receipt;
      res.json(receipt);
    } catch {
      res
        .status(503)
        .json({
          error:
            "We could not complete the demonstration. Review your stay and try again.",
        });
    }
  });
  for (const [route, step] of [
    ["booking", "stay"],
    ["select-room", "rooms"],
    ["login", "guest"],
    ["confirmation", "confirmation"],
  ])
    app.get("/" + route, (req, res) => res.redirect("/#" + step));
  app.use((error, req, res, next) =>
    res
      .status(error.type === "entity.too.large" ? 413 : 400)
      .json({
        error:
          "The request could not be read. Check your inputs and try again.",
      }),
  );
  app.locals.repository = repository;
  return app;
}
if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, "127.0.0.1", () =>
    console.log("Local hotel demo: http://127.0.0.1:" + port),
  );
  process.on("SIGINT", () =>
    server.close(async () => {
      await app.locals.repository.close();
      process.exit(0);
    }),
  );
}
module.exports = { createApp };
