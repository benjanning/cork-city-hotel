const { catalog } = require("./booking");
function createRoomRepository(env = process.env) {
  if (env.MYSQL_MODE !== "1")
    return {
      mode: "synthetic",
      list: async () => structuredClone(catalog),
      close: async () => {},
    };
  if (!env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME)
    throw Error("MySQL mode requires DB_USER, DB_PASSWORD and DB_NAME.");
  const pool = require("mysql2").createPool({
    host: env.DB_HOST || "127.0.0.1",
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 3,
    connectTimeout: 3000,
  });
  return {
    mode: "mysql",
    list: () =>
      new Promise((resolve, reject) =>
        pool.query(
          "SELECT id,name,price,capacity,stock FROM demo_rooms ORDER BY id",
          (error, rows) => {
            if (error) return reject(error);
            const rooms = rows.map((row) => ({
              ...catalog.find((r) => r.id === row.id),
              ...row,
              price: Number(row.price),
            }));
            if (
              rooms.length !== 3 ||
              rooms.some(
                (r) =>
                  !r.kind ||
                  !Number.isFinite(r.price) ||
                  r.price <= 0 ||
                  !Number.isInteger(r.capacity) ||
                  r.capacity < 1 ||
                  !Number.isInteger(r.stock) ||
                  r.stock < 0,
              )
            )
              return reject(Error("Invalid demonstration catalog"));
            resolve(rooms);
          },
        ),
      ),
    close: () =>
      new Promise((resolve, reject) =>
        pool.end((error) => (error ? reject(error) : resolve())),
      ),
  };
}
module.exports = { createRoomRepository };
