import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticate } from "./middleware/auth";
import * as auth from "./controllers/authController";
import * as groups from "./controllers/groupController";
import * as matches from "./controllers/matchController";

export const api = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Tente novamente em 15 minutos." },
});
const guestLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Muitas solicitações. Tente novamente mais tarde." },
});

api.post("/auth/register", authLimit, auth.register);
api.post("/auth/login", authLimit, auth.login);
api.get("/presence/:token", matches.showPublicMatch);
api.post("/presence/:token", guestLimit, matches.confirmGuest);
api.delete("/presence/:token", guestLimit, matches.cancelGuest);

api.use(authenticate);
api.get("/auth/me", (_req, res) => res.json(res.locals.user));
api.post("/auth/logout", auth.logout);
api.get("/groups", groups.listGroups);
api.post("/groups", groups.createGroup);
api.post("/groups/join", groups.joinGroup);
api.get("/groups/:groupId", groups.showGroup);
api.post("/groups/:groupId/matches", matches.createMatch);
api.get("/groups/:groupId/matches/:matchId", matches.showMatch);
api.post("/groups/:groupId/matches/:matchId/cancel", matches.cancelMatch);
api.post("/groups/:groupId/matches/:matchId/presence", matches.confirmMember);
api.delete("/groups/:groupId/matches/:matchId/presence", matches.cancelMember);
api.post("/groups/:groupId/matches/:matchId/teams", matches.saveDraw);
