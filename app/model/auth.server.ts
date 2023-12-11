import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import {
  createUser,
  getUserByEmail,
  getUserForAuthentication,
  getUserId,
} from "./user.server";
import {
  commitSession,
  destroySession,
  getSession,
} from "~/utils/session.server";
import { redirect } from "@remix-run/node";
import { safeRedirect } from "remix-utils/safe-redirect";
import type { Result } from "~/utils/result.server";
import bcrypt from "bcrypt";

export async function register(
  request: Request,
  { name, email, password }: { name: string; email: string; password: string }
): Promise<Result<Response, { message: string }>> {
  const ip = getClientIPAddress(request);

  const isUserExist = await getUserByEmail(email);

  if (isUserExist) {
    return {
      ok: false,
      error: {
        message: "User with this email already exists",
      },
    };
  }

  const { id } = await createUser({
    email,
    name,
    password,
    ip,
  });

  const session = await getSession();
  session.set("userId", id);

  return {
    ok: true,
    data: redirect(safeRedirect("/"), {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }),
  };
}

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<Result<Response, { message: string }>> {
  const user = await getUserForAuthentication(email);

  if (user === null) {
    return {
      ok: false,
      error: {
        message: "Invalid email or passwords",
      },
    };
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordCorrect) {
    return {
      ok: false,
      error: {
        message: "Invalid email or passwords",
      },
    };
  }

  const session = await getSession();
  session.set("userId", user.id);

  return {
    ok: true,
    data: redirect(safeRedirect("/"), {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }),
  };
}

export async function authenticate<T>(
  request: Request,
  getUser: (userId: string) => Promise<T | null>
): Promise<T> {
  const userId = await getUserId(request);

  console.log(userId)

  const user = userId !== null ? await getUser(userId) : null;

  if (user === null) {
    throw redirect("/login");
  }

  return user;
}

export async function logout(request: Request): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect(safeRedirect("/"), {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
