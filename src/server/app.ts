import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import path from "node:path";
import { ZodError } from "zod";
import { config } from "./config";
import { api } from "./routes";
import { HttpError } from "./services/errors";
import { Prisma } from "./generated/prisma/client";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", (req, _res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.headers.origin !== config.origin)
      throw new HttpError(403, "Origem da requisição inválida.");
    if (!req.is("application/json"))
      throw new HttpError(415, "Envie application/json.");
  }
  next();
});
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", api);
app.use("/api", (_req, _res, next) =>
  next(new HttpError(404, "Rota não encontrada.")),
);

if (config.NODE_ENV === "production") {
  const root = path.resolve("dist/client");
  app.use(express.static(root));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(root, "index.html")),
  );
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res
      .status(422)
      .json({
        message: err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    return;
  }
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    res.status(409).json({ message: "Este registro já existe." });
    return;
  }
  if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
    res
      .status(err.status)
      .json({ message: "Corpo JSON inválido ou muito grande." });
    return;
  }
  console.error(
    "Falha interna:",
    err instanceof Error ? err.message : "Erro desconhecido",
  );
  res.status(500).json({ message: "Não foi possível concluir a operação." });
};
app.use(errorHandler);
