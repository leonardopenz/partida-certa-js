import type { RequestHandler } from "express";
import { db } from "../models/database";
import { publicUser } from "../models/groupModel";
import { tokenHash } from "../services/security";
import { HttpError } from "../services/errors";

export const authenticate: RequestHandler = async (req, res, next) => {
  const token = req.headers.cookie?.match(
    /(?:^|;\s*)session=([a-f0-9]{64})(?:;|$)/,
  )?.[1];
  if (!token) throw new HttpError(401, "Entre na sua conta.");
  const session = await db.session.findUnique({
    where: { id: tokenHash(token) },
    include: { user: { select: publicUser } },
  });
  if (!session || session.expiresAt <= new Date())
    throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  res.locals.user = session.user;
  res.locals.sessionId = session.id;
  next();
};
