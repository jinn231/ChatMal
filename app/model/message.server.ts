import { db } from "~/utils/db.server";

export async function createMessage({
  conversationId,
  senderId,
  message,
}: {
  conversationId: string;
  senderId: string;
  message: string;
}) {
  await db.messages.create({
    data: {
      conversationId: conversationId,
      senderId: senderId,
      message: message,
    },
  });
}
