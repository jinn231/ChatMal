import {
  CHAT_ROOM_STATUS,
  CHAT_ROOM_TYPES,
  Conversation,
  DeleteForUserIds,
  Messages
} from "@prisma/client";
import { db } from "~/utils/db.server";
import { UserInfo } from "./user.server";

export async function createConversation({
  members,
  status
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
      status: status
    }
  });
}

export async function getConversations({ userId }: { userId: string }): Promise<
  (Conversation & {
    Messages: (Messages & { sender: { name: string } })[];
    users: UserInfo[];
  })[]
> {
  return await db.conversation.findMany({
    where: {
      userIds: {
        has: userId
      },
      status: CHAT_ROOM_STATUS.NORMAL,
      Messages: {
        some: {}
      }
    },
    include: {
      Messages: {
        select: {
          id: true,
          conversation: false,
          conversationId: true,
          message: true,
          seen: true,
          seenIds: true,
          sender: {
            select: {
              name: true
            }
          },
          senderId: true,
          createdAt: true,
          updatedAt: true
        }
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
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      updatedAt: "asc"
    }
  });
}

export async function getRequestedConversations({
  userId
}: {
  userId: string;
}): Promise<
  (Conversation & {
    Messages: (Messages & { sender: { name: string } })[];
    users: UserInfo[];
  })[]
> {
  return await db.conversation.findMany({
    where: {
      userIds: {
        has: userId
      },
      status: CHAT_ROOM_STATUS.REQUEST,
      Messages: {
        some: {}
      }
    },
    include: {
      Messages: {
        select: {
          id: true,
          conversation: false,
          conversationId: true,
          message: true,
          seen: true,
          seenIds: true,
          sender: {
            select: {
              name: true
            }
          },
          senderId: true,
          createdAt: true,
          updatedAt: true
        }
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
          createdAt: true,
          updatedAt: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}

export async function isConversationAlreadyExist({
  currentUserId,
  userId
}: {
  currentUserId: string;
  userId: string;
}): Promise<boolean> {
  const conversation = await db.conversation.findFirst({
    where: {
      userIds: {
        hasEvery: [currentUserId, userId]
      }
    }
  });

  if (conversation) {
    return true;
  }

  return false;
}

export async function getConversationById(conversationId: string): Promise<
  | (Conversation & {
      Messages: (Messages & { deleteFor: DeleteForUserIds[] } & {
        sender: { name: string };
      })[];
      users: UserInfo[];
    })
  | null
> {
  return await db.conversation.findUnique({
    where: {
      id: conversationId
    },
    include: {
      Messages: {
        select: {
          id: true,
          conversationId: true,
          message: true,
          seen: true,
          seenIds: true,
          senderId: true,
          sender: {
            select: {
              name: true
            }
          },
          deleteFor: true,
          createdAt: true,
          updatedAt: true
        }
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
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });
}

export async function deleteConversationById(
  conversationId: string
): Promise<void> {
  await db.messages.deleteMany({
    where: {
      conversationId: conversationId
    }
  });
  await db.conversation.delete({
    where: {
      id: conversationId
    }
  });
}

export async function getConversationByUserIds({
  firstId,
  secondId
}: {
  firstId: string;
  secondId: string;
}): Promise<Conversation | null> {
  return await db.conversation.findFirst({
    where: {
      userIds: {
        hasEvery: [firstId, secondId]
      }
    }
  });
}

export async function updateConversation({
  conversationId,
  status
}: {
  conversationId: string;
  status: CHAT_ROOM_STATUS;
}) {
  await db.conversation.update({
    where: {
      id: conversationId
    },
    data: {
      status: status
    }
  });
}
