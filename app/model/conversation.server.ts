import { CHAT_ROOM_TYPES, Conversation, Messages } from "@prisma/client";
import { db } from "~/utils/db.server";
import { UserInfo } from "./user.server";

export async function createConversation({ members }: { members: string[] }) {
  await db.conversation.create({
    data: {
      userIds: members,
      type:
        members.length > 2
          ? CHAT_ROOM_TYPES.GROUP_CHAT
          : CHAT_ROOM_TYPES.NORMAL_CHAT,
    },
  });
}

export async function getConversations({ userId }: { userId: string }): Promise<
  (Conversation & {
    Messages: Messages[];
    users: UserInfo[];
  })[]
> {
  return await db.conversation.findMany({
    where: {
      userIds: {
        has: userId,
      },
    },
    include: {
      Messages: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: false,
          role: true,
          followers: true,
          following: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function isConversationAlreadyExist({
  currentUserId,
  userId,
}: {
  currentUserId: string;
  userId: string;
}): Promise<boolean> {
  const conversation = await db.conversation.findFirst({
    where: {
      userIds: {
        hasEvery: [currentUserId, userId],
      },
    },
  });

  console.log(conversation);

  if (conversation) {
    return true;
  }

  return false;
}

export async function getConversationById(conversationId: string): Promise<
  | (Conversation & {
      Messages: Messages[];
      users: UserInfo[];
    })
  | null
> {
  return await db.conversation.findUnique({
    where: {
      id: conversationId,
    },
    include: {
      Messages: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: false,
          role: true,
          followers: true,
          following: true,
        },
      },
    }
  });
}
