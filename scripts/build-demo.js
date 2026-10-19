const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const root = path.resolve(__dirname, "..");
const dest = path.join(root, "docs");
fs.mkdirSync(dest, { recursive: true });
for (const item of ["css", "js", "images", "credits.html"])
  fs.cpSync(path.join(root, "public", item), path.join(dest, item), {
    recursive: true,
  });
fs.writeFileSync(
  path.join(dest, "index.html"),
  ejs.render(fs.readFileSync(path.join(root, "views/hotel.ejs"), "utf8"), {
    mode: "static",
  }),
);
fs.writeFileSync(path.join(dest, ".nojekyll"), "");
console.log("Built docs/ from the shared EJS shell and booking rules.");
