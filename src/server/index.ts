import { app } from "./app";
import { config } from "./config";
import { db } from "./models/database";

await db.$connect();
const server = app.listen(config.PORT, () =>
  console.log(`Partida Certa em http://localhost:${config.PORT}`),
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close(() => {
      void db.$disconnect().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
