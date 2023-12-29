import { type User, type UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { db } from "~/utils/db.server";
import { getSession } from "~/utils/session.server";

export type UserInfo = Pick<
  User,
  | "id"
  | "email"
  | "name"
  | "followers"
  | "following"
  | "lastActiveAt"
  | "createdAt"
  | "updatedAt"
>;

export async function getUserByEmail(email: string): Promise<UserInfo | null> {
  return await db.user.findFirst({
    where: { email: email }
  });
}

export async function getUserById(id: string): Promise<UserInfo | null> {
  return await db.user.findFirst({
    where: { id: id }
  });
}

export async function createUser({
  name,
  email,
  password,
  ip
}: {
  name: string;
  email: string;
  password: string;
  ip: string | null;
}): Promise<UserInfo> {
  const passwordHash = await bcrypt.hash(password, 12);
  return await db.user.create({
    data: {
      email: email,
      name: name,
      passwordHash: passwordHash,
      lastLoginIp: ip
    }
  });
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get("Cookie"));

  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    return null;
  }
  return userId;
}

export async function getUserForAuthentication(
  email: string
): Promise<User | null> {
  return await db.user.findFirst({
    where: {
      email: email
    }
  });
}

export async function getAllFriends(userId: string): Promise<UserInfo[]> {
  return await db.user.findMany({
    where: {
      id: {
        not: userId
      }
    }
  });
}

export async function follow({
  id,
  followerId
}: {
  id: string;
  followerId: string;
}): Promise<void> {
  await db.user.update({
    where: {
      id: id
    },
    data: {
      followers: {
        push: followerId
      }
    }
  });
  await db.user.update({
    where: {
      id: followerId
    },
    data: {
      following: {
        push: id
      }
    }
  });
}

export async function unfollow({
  id,
  unFollowerId
}: {
  id: string;
  unFollowerId: string;
}): Promise<void> {
  const currentUser = await db.user.findFirst({
    where: {
      id: unFollowerId
    }
  });

  const user = await db.user.findFirst({
    where: {
      id: id
    }
  });

  await db.user.update({
    where: {
      id: id
    },
    data: {
      followers: user?.followers.filter(i => i !== unFollowerId)
    }
  });
  await db.user.update({
    where: {
      id: unFollowerId
    },
    data: {
      following: currentUser?.following.filter(i => i !== id)
    }
  });
}

export async function getUserByList(users: string[]): Promise<UserInfo[]> {
  const newUsers = await Promise.all(
    users.map(async userId => {
      return await getUserById(userId);
    })
  );

  const filteredUsers = newUsers.filter(user => user !== null) as UserInfo[];

  return filteredUsers;
}

export async function updateUser({
  userId,
  name,
  email,
  role,
  lastActiveAt
}: {
  userId: string;
  name?: string;
  email?: string;
  role?: UserRole;
  lastActiveAt?: Date;
}): Promise<void> {
  await db.user.update({
    where: {
      id: userId
    },
    data: {
      name: name,
      email: email,
      role: role,
      lastActiveAt: lastActiveAt
    }
  });
}

export async function isUserFollowEachOther({
  userId1,
  userId2
}: {
  userId1: string;
  userId2: string;
}): Promise<boolean> {
  const user = await db.user.findUnique({
    where: {
      id: userId1
    }
  });

  if (user?.following.includes(userId2) && user.followers.includes(userId2)) {
    return true;
  }

  return false;
}
