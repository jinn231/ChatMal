import { db } from "~/utils/db.server";

export async function createMessage({
  conversationId,
  senderId,
  message
}: {
  conversationId: string;
  senderId: string;
  message: string;
}): Promise<void> {
  await db.messages.create({
    data: {
      conversationId: conversationId,
      senderId: senderId,
      message: message
    }
  });
}

export async function deleteMessage({
  messageId,
  userId
}: {
  messageId: string;
  userId: string;
}): Promise<void> {
  await db.messages.update({
    where: {
      id: messageId
    },
    data: {
      deleteFor: {
        create: {
          userId: userId
        }
      }
    }
  });
}

export async function updateMessage({
  messageId,
  message,
  seenId
}: {
  messageId: string;
  message?: string;
  seenId?: string;
}): Promise<void> {
  await db.messages.update({
    where: {
      id: messageId
    },
    include: {
      seen: true
    },
    data: {
      seen: {
        connect: {
          id: seenId
        }
      }
    }
  });
}
