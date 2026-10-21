import "dotenv/config";
import { z } from "zod";

const env = z
  .object({
    DATABASE_URL: z.string().startsWith("postgresql://"),
    APP_URL: z.url().default("http://localhost:5173"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .parse(process.env);

export const config = { ...env, origin: new URL(env.APP_URL).origin };
if (
  config.NODE_ENV === "production" &&
  !config.APP_URL.startsWith("https://")
) {
  throw new Error("APP_URL deve usar HTTPS em produção.");
}
