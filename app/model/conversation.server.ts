import {
  CHAT_ROOM_STATUS,
  CHAT_ROOM_TYPES,
  Conversation,
  Messages,
} from "@prisma/client";
import { db } from "~/utils/db.server";
import { UserInfo } from "./user.server";

export async function createConversation({
  members,
  status,
}: {
  members: string[];
  status: CHAT_ROOM_STATUS;
}): Promise<Conversation> {
  return await db.conversation.create({
    data: {
      userIds: members,
      type:
        members.length > 2
          ? CHAT_ROOM_TYPES.GROUP_CHAT
          : CHAT_ROOM_TYPES.NORMAL_CHAT,
      status: status,
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
      Messages: {
        some: {},
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
          lastActiveAt: true,
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

  if (conversation) {
    return true;
  }

  return false;
}

export async function getConversationById(conversationId: string): Promise<
  | (Conversation & {
      Messages: (Messages & { sender: { name: string } })[];
      users: UserInfo[];
    })
  | null
> {
  return await db.conversation.findUnique({
    where: {
      id: conversationId,
    },
    include: {
      Messages: {
        select: {
          id: true,
          conversationId: true,
          message: true,
          seen: true,
          senderId: true,
          sender: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: false,
          role: true,
          followers: true,
          following: true,
          lastActiveAt: true,
        },
      },
    },
  });
}

export async function deleteConversationById(
  conversationId: string
): Promise<void> {
  await db.messages.deleteMany({
    where: {
      conversationId: conversationId,
    },
  });
  await db.conversation.delete({
    where: {
      id: conversationId,
    },
  });
}

export async function getConversationByUserIds({
  firstId,
  secondId,
}: {
  firstId: string;
  secondId: string;
}): Promise<Conversation | null> {
  return await db.conversation.findFirst({
    where: {
      userIds: {
        hasEvery: [firstId, secondId],
      },
    },
  });
}
