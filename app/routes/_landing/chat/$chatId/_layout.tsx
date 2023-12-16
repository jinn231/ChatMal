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
import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useRevalidator,
} from "@remix-run/react";
import { z } from "zod";
import { Result } from "~/utils/result.server";
import { FormError } from "~/utils/error.server";
import { createMessage } from "~/model/message.server";
import SeeMoreIcon from "~/components/icons/SeeMoreIcon";
import { useEffect, useRef, useState } from "react";
import { emitter } from "~/utils/event.server";
import { useEventSource } from "remix-utils/sse/react";
import dayjs from "dayjs";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

type MessageForm = z.infer<typeof MessageFormSchema>;

const MessageFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("send"),
    senderId: z.string(),
    receiverId: z.string(),
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
      Messages: (Messages & { sender: { name: string } })[];
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
    const { conversationId, message, senderId, receiverId } = parsedResult.data;

    emitter.emit("send-message", receiverId);
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
  const [message, setMessage] = useState<string>("");
  const eventSource = useEventSource("/chat/send-message", {
    event: "send-message",
  });
  const onInputEventSource = useEventSource("/chat/oninput/", {
    event: "on-input",
  });
  const { revalidate } = useRevalidator();
  const messageRef = useRef<HTMLDivElement>(null);
  const [showTypingIcon, setShowTypingIcon] = useState<boolean>(false);
  const fetcher = useFetcher();

  useEffect(() => {
    messageRef.current?.scrollTo(0, Number(messageRef.current?.scrollHeight));
    if (eventSource === currentUser.id) {
      revalidate();
    }
  }, [eventSource]);

  useEffect(() => {
    if (onInputEventSource === currentUser.id) {
      setShowTypingIcon(true);
    } else {
      setShowTypingIcon(false);
    }
  }, [onInputEventSource]);

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

      <div
        ref={messageRef}
        className="h-full flex flex-col overflow-auto mx-3 pb-[10rem] no-scrollbar scroll-smooth"
      >
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
            {showTypingIcon && (
              <div className="flex flex-col relative select-none">
                <div className="flex items-center">
                  <p className="text-gray-500">
                    {conversation.users.map((user) => (
                      <span key={user.id}>
                        {user.id !== currentUser.id && user.name}
                      </span>
                    ))}{" "}
                    is typing
                  </p>
                  <img
                    className="w-10 h-10"
                    src="/gifs/typing_img.gif"
                    alt="typing"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Form
        className="absolute bottom-0 flex bg-black bg-opacity-90 border-t gap-3 border-t-[silver] w-full items-center p-3"
        method="POST"
        onSubmit={(e) => {
          setMessage("");
        }}
      >
        <input type="hidden" name="type" value={"send"} />
        <input type="hidden" name="conversationId" value={conversation.id} />
        <input type="hidden" name="senderId" value={currentUser.id} />
        <input
          type="hidden"
          name="receiverId"
          value={
            conversation.users.filter((user) => user.id !== currentUser.id)[0]
              .id
          }
        />
        <input
          type="text"
          className="flex-1 border-none outline-none"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onInput={(e) => {
            if (message !== "") {
              fetcher.submit(
                {
                  id: conversation.users.filter(
                    (user) => user.id !== currentUser.id
                  )[0].id,
                  isTyping: true,
                },
                {
                  method: "POST",
                  action: "/chat/oninput",
                }
              );
            }
          }}
        />
        <button>
          <SendIcon />
        </button>
      </Form>
    </div>
  );
}

function SenderMessage({
  message,
}: {
  message: SerializeFrom<Messages & { sender: { name: string } }>;
}) {
  return (
    <div className="flex flex-col my-1 relative py-4">
      <div className="self-end">
        <small className="text-gray-500">
          sent at {dayjs(message.createdAt).format("h:mm")}
        </small>
        <span className="mx-2 text-sm font-bold">{message.sender.name}</span>
      </div>
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

function ReceiverMessage({
  message,
}: {
  message: SerializeFrom<Messages & { sender: { name: string } }>;
}) {
  return (
    <div className="flex flex-col my-1 relative py-4">
      <div>
        <span className="mx-2 text-sm font-bold">{message.sender.name}</span>
        <small className="text-gray-500">
          sent at {dayjs(message.createdAt).format("h:mm")}
        </small>
      </div>
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
