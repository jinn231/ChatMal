import { createSessionStorage } from "@remix-run/node";
import crypto from "crypto";
import dayjs from "dayjs";
import { createSessionToken, deleteSessionToken, getSessionToken } from "./session-token.server";

const SESSION_SECRET: string = process.env.SESSION_SECRET || "";

export const { getSession, commitSession, destroySession } =
  createSessionStorage({
    cookie: {
      name: "__session",
      // Normally you want this to be `secure: true`
      // but that doesn't work on localhost for Safari
      // https://web.dev/when-to-use-local-https/
      secure: process.env.NODE_ENV === "production",
      secrets: [SESSION_SECRET],
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
    },
    createData: async (data, expiresAt) => {
      const sessionToken = crypto.randomBytes(32).toString("base64");
      if (
        data.userId !== undefined &&
        (expiresAt === undefined || dayjs().isBefore(expiresAt))
      ) {
        await createSessionToken(sessionToken, data.userId, expiresAt);
      }
      return sessionToken;
    },
    readData: async (sessionToken) => await getSessionToken(sessionToken),
    updateData: async (_sessionToken, _data, _expiresAt) => {},
    deleteData: async (sessionToken) => {
      await deleteSessionToken(sessionToken);
    },
  });
