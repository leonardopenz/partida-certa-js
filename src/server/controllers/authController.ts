import type { RequestHandler, Response } from "express";
import { z } from "zod";
import { db } from "../models/database";
import { publicUser } from "../models/groupModel";
import { config } from "../config";
import {
  hashPassword,
  verifyPassword,
  newToken,
  tokenHash,
} from "../services/security";
import { HttpError } from "../services/errors";

const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(10).max(128),
});
const cookie = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: config.NODE_ENV === "production",
  path: "/",
};

async function createSession(userId: string, res: Response) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.session.create({
    data: { id: tokenHash(token), userId, expiresAt },
  });
  res.cookie("session", token, { ...cookie, expires: expiresAt });
}

export const register: RequestHandler = async (req, res) => {
  const { name, email, password } = credentials
    .extend({ name: z.string().trim().min(2).max(100) })
    .parse(req.body);
  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
    select: publicUser,
  });
  await createSession(user.id, res);
  res.status(201).json(user);
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const user = await db.user.findUnique({ where: { email } });
  // Mesmo trabalho de derivação para e-mails inexistentes.
  const valid = await verifyPassword(
    password,
    user?.passwordHash ?? `${"0".repeat(32)}:${"0".repeat(128)}`,
  );
  if (!user || !valid) throw new HttpError(401, "E-mail ou senha inválidos.");
  await createSession(user.id, res);
  res.json({ id: user.id, name: user.name, email: user.email });
};

export const logout: RequestHandler = async (_req, res) => {
  await db.session.delete({ where: { id: res.locals.sessionId } });
  res.clearCookie("session", cookie).sendStatus(204);
};
