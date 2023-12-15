import {
  json,
  redirect,
  type LinksFunction,
  TypedResponse,
  ActionFunctionArgs,
  SerializeFrom,
} from "@remix-run/node";
import SendIcon from "~/components/icons/SendIcon";
import styles from "./style.css";
import LeftArrowIcon from "~/components/icons/LeftArrowIcon";
import { authenticate } from "~/model/auth.server";
import { UserInfo, getUserById } from "~/model/user.server";
import { LoaderFunctionArgs } from "react-router-dom";
import { getConversationById } from "~/model/conversation.server";
import { Conversation, Messages } from "@prisma/client";
import { Form, useLoaderData } from "@remix-run/react";
import { z } from "zod";
import { Result } from "~/utils/result.server";
import { FormError } from "~/utils/error.server";
import { createMessage } from "~/model/message.server";
import SeeMoreIcon from "~/components/icons/SeeMoreIcon";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

type MessageForm = z.infer<typeof MessageFormSchema>;

const MessageFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("send"),
    senderId: z.string(),
    message: z.string().min(1),
    conversationId: z.string(),
  }),
  z.object({
    type: z.literal("delete"),
    messageId: z.string(),
  }),
]);

export async function loader({ request, params }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    currentUser: UserInfo;
    conversation: Conversation & {
      Messages: Messages[];
      users: UserInfo[];
    };
  }>
> {
  const user = await authenticate(request, (userId) => getUserById(userId));

  const { chatId } = params;

  if (!chatId) {
    throw redirect("/chat");
  }

  const conversation = await getConversationById(chatId);

  if (!conversation) {
    throw redirect("/chat");
  }

  return json({
    currentUser: user,
    conversation: conversation,
  });
}

export async function action({
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<Result<null, FormError<MessageForm, string>>>
> {
  const { id } = await authenticate(request, (userId) => getUserById(userId));

  const fields = Object.fromEntries(await request.formData());

  const parsedResult = MessageFormSchema.safeParse(fields);
  if (!parsedResult.success) {
    return json({
      ok: false,
      error: {
        fields,
        errors: parsedResult.error.format(),
      },
    });
  }

  if (parsedResult.data.type === "send") {
    const { conversationId, message, senderId } = parsedResult.data;

    await createMessage({
      conversationId,
      message,
      senderId,
    });

    return json({ ok: true, data: null });
  }

  return json({ ok: true, data: null });
}

export default function ChatSessionRoute() {
  const { conversation, currentUser } = useLoaderData<typeof loader>();

  console.log(conversation);

  return (
    <div className="w-full h-full relative">
      <nav className="flex items-center p-3 gap-3 border-b border-[var(--primary-color)] mx-3">
        <button onClick={() => history.back()}>
          <LeftArrowIcon />
        </button>

        <img
          className="w-[50px] h-[50px] rounded-full"
          src="/images/avatars/gentleman.png"
          alt="profile"
        />
        <div>
          <p>
            {conversation.users.map((user) => (
              <strong key={user.id}>
                {user.id !== currentUser.id && user.name}
              </strong>
            ))}
            <strong></strong>
          </p>
          <small>Active now</small>
        </div>
      </nav>

      <div className="h-full flex flex-col overflow-auto mx-3 pb-[10rem] no-scrollbar">
        {conversation.Messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-5">
            <button>
              <h1 className="text-2xl">
                Say "Hi" to{" "}
                {
                  conversation.users.filter(
                    (user) => user.id !== currentUser.id
                  )[0].name
                }{" "}
                !
              </h1>
            </button>
            <button>
              <img className="w-40 h-40" src="/gifs/say-hi.gif" alt="hi" />
            </button>
          </div>
        ) : (
          <>
            {conversation.Messages.map((message) => (
              <>
                {message.senderId === currentUser.id ? (
                  <SenderMessage message={message} />
                ) : (
                  <ReceiverMessage message={message} />
                )}
              </>
            ))}
          </>
        )}
      </div>

      <Form
        className="absolute bottom-0 flex bg-black bg-opacity-90 border-t gap-3 border-t-[silver] w-full items-center p-3"
        method="POST"
      >
        <input type="hidden" name="type" value={"send"} />
        <input type="hidden" name="conversationId" value={conversation.id} />
        <input type="hidden" name="senderId" value={currentUser.id} />
        <input
          type="text"
          className="flex-1 border-none outline-none"
          name="message"
        />
        <button>
          <SendIcon />
        </button>
      </Form>
    </div>
  );
}

function SenderMessage({ message }: { message: SerializeFrom<Messages> }) {
  return (
    <div className="flex flex-col my-1 relative py-4">
      <div className="receiver">
        <p className="message">
          <span>{message.message}</span>
        </p>
      </div>
      <button className="absolute bottom-0 right-0">
        <SeeMoreIcon />
      </button>
    </div>
  );
}

function ReceiverMessage({ message }: { message: SerializeFrom<Messages> }) {
  return (
    <div className="flex flex-col my-1 relative py-4">
      <div className="sender">
        <p className="message">
          <span>{message.message}</span>
        </p>
      </div>
      <button className="absolute bottom-0 left-0">
        <SeeMoreIcon />
      </button>
    </div>
  );
}
