import { db } from "./database";
import { HttpError } from "../services/errors";

export async function requireMembership(
  groupId: string,
  userId: string,
  admin = false,
) {
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw new HttpError(404, "Grupo não encontrado.");
  if (admin && membership.role !== "admin")
    throw new HttpError(
      403,
      "Apenas administradores podem realizar esta ação.",
    );
  return membership;
}

export const publicUser = { id: true, name: true, email: true } as const;
export const playerUser = { id: true, name: true } as const;
