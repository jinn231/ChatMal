import { CHAT_ROOM_TYPES } from "@prisma/client";
import { db } from "~/utils/db.server";

export async function createConversation({
  senderId,
  members,
}: {
  senderId: string;
  members: string[];
}) {
  await db.conversation.create({
    data: {
      senderId: senderId,
      members: members.filter((m) => m !== senderId),
      type:
        members.length === 1
          ? CHAT_ROOM_TYPES.NORMAL_CHAT
          : CHAT_ROOM_TYPES.GROUP_CHAT,
    },
  });
}

export async function getConversations({ userId }: { userId: string }) {
  await db.conversation.findMany({
    where: {
      senderId: userId,
    },
    include: {
      Messages: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}
