import { CHAT_ROOM_STATUS } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { z } from "zod";
import { authenticate } from "~/model/auth.server";
import {
  createConversation,
  getConversationByUserIds
} from "~/model/conversation.server";
import { getUserById, isUserFollowEachOther } from "~/model/user.server";

const RedirectChatFormSchema = z.object({
  requestUserId: z.string()
});

export async function action({
  request
}: ActionFunctionArgs): Promise<Response> {
  const { id } = await authenticate(request, userId => getUserById(userId));

  const fields = Object.fromEntries(await request.formData());

  const parsedResult = RedirectChatFormSchema.safeParse(fields);

  if (!parsedResult.success) {
    throw redirect("/users");
  }

  const { requestUserId } = parsedResult.data;

  const conversation = await getConversationByUserIds({
    firstId: id,
    secondId: requestUserId
  });

  if (conversation === null) {
    const isUsersFollowed = await isUserFollowEachOther({
      userId1: id,
      userId2: requestUserId
    });

    const createdConversation = await createConversation({
      members: [id, requestUserId],
      status: isUsersFollowed
        ? CHAT_ROOM_STATUS.NORMAL
        : CHAT_ROOM_STATUS.REQUEST
    });

    throw redirect(`/chat/${createdConversation.id}`);
  }

  throw redirect(`/chat/${conversation.id}`);
}
