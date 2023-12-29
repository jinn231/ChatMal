import { type SessionToken } from "@prisma/client";
import crypto from "crypto";
import { db } from "./db.server";

export async function createSessionToken(
  token: string,
  userId: string,
  expiredAt?: Date
): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("base64");

  await db.sessionToken.create({
    data: { userId: userId, token: tokenHash, experiedAt: expiredAt }
  });
}

export async function getSessionToken(
  token: string
): Promise<SessionToken | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("base64");
  return await db.sessionToken.findUnique({ where: { token: tokenHash } });
}

export async function deleteSessionToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("base64");
  await db.sessionToken.delete({ where: { token: tokenHash } });
}
