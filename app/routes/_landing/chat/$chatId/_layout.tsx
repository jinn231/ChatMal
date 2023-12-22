import {
  json,
  redirect,
  type LinksFunction,
  TypedResponse,
  ActionFunctionArgs,
  SerializeFrom,
  LoaderFunctionArgs
} from "@remix-run/node";
import SendIcon from "~/components/icons/SendIcon";
import styles from "./style.css";
import LeftArrowIcon from "~/components/icons/LeftArrowIcon";
import { authenticate } from "~/model/auth.server";
import { UserInfo, getUserById } from "~/model/user.server";
import { getConversationById } from "~/model/conversation.server";
import { Conversation, DeleteForUserIds, Messages } from "@prisma/client";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useRevalidator,
  useSubmit
} from "@remix-run/react";
import { z } from "zod";
import { Result } from "~/utils/result.server";
import { FormError } from "~/utils/error.server";
import {
  createMessage,
  deleteMessage,
  updateMessage
} from "~/model/message.server";
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
    conversationId: z.string()
  }),
  z.object({
    type: z.literal("delete"),
    messageId: z.string()
  }),
  z.object({
    type: z.literal("seen"),
    messageId: z.string()
  })
]);

export async function loader({ request, params }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    currentUser: UserInfo;
    conversation: Conversation & {
      Messages: (Messages & { deleteFor: DeleteForUserIds[] } & {
        sender: { name: string };
      })[];
      users: UserInfo[];
    };
  }>
> {
  const user = await authenticate(request, userId => getUserById(userId));

  const { chatId } = params;

  if (!chatId) {
    throw redirect("/chat");
  }

  const conversation = await getConversationById(chatId);

  if (!conversation) {
    throw redirect("/chat");
  }

  console.log(conversation.Messages);

  return json({
    currentUser: user,
    conversation: conversation
  });
}

export async function action({
  request
}: ActionFunctionArgs): Promise<
  TypedResponse<Result<null, FormError<MessageForm, string>>>
> {
  const { id } = await authenticate(request, userId => getUserById(userId));

  const fields = Object.fromEntries(await request.formData());

  const parsedResult = MessageFormSchema.safeParse(fields);
  if (!parsedResult.success) {
    return json({
      ok: false,
      error: {
        fields,
        errors: parsedResult.error.format()
      }
    });
  }

  if (parsedResult.data.type === "send") {
    const { conversationId, message, senderId, receiverId } = parsedResult.data;

    emitter.emit("send-message", receiverId);
    await createMessage({
      conversationId,
      message,
      senderId
    });

    return json({ ok: true, data: null });
  } else if (parsedResult.data.type === "delete") {
    const { messageId } = parsedResult.data;

    await deleteMessage({ messageId, userId: id });
  } else if (parsedResult.data.type === "seen") {
    const { messageId } = parsedResult.data;

    await updateMessage({
      messageId: messageId,
      seenId: id
    });
  }

  return json({ ok: true, data: null });
}

export default function ChatSessionRoute() {
  const { conversation, currentUser } = useLoaderData<typeof loader>();
  const [message, setMessage] = useState<string>("");
  const eventSource = useEventSource("/chat/send-message", {
    event: "send-message"
  });
  const { revalidate } = useRevalidator();
  const messageRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    messageRef.current?.scrollTo(0, Number(messageRef.current?.scrollHeight));
    if (eventSource === currentUser.id) {
      revalidate();
    }
  }, [eventSource]);

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
            {conversation.users.map(user => (
              <>
                {user.id !== currentUser.id && (
                  <Link key={user.id} to={`/users/${user.id}`}>
                    <strong>{user.name}</strong>
                  </Link>
                )}
              </>
            ))}
          </p>

          {conversation.users.map(user => {
            if (user.id !== currentUser.id) {
              const lastActiveTime = dayjs(user.lastActiveAt);
              const currentTime = dayjs();
              const timeDifference = currentTime.diff(
                lastActiveTime,
                "minutes"
              );

              return (
                <small key={timeDifference.toString()}>
                  {timeDifference <= 3
                    ? "Active now"
                    : `Active ${lastActiveTime.fromNow()}`}
                </small>
              );
            }
          })}
        </div>
      </nav>

      {!currentUser.following.includes(
        conversation.users.filter(user => user.id !== currentUser.id)[0].id
      ) && (
        <div className="flex mx-3 py-1 items-center gap-2">
          <small>
            You haven't follow{" "}
            {
              conversation.users.filter(user => user.id !== currentUser.id)[0]
                .name
            }
            !{" "}
          </small>
          <button
            onClick={() =>
              fetcher.submit(
                {
                  type: "follow",
                  userId: conversation.userIds.filter(
                    id => id !== currentUser.id
                  )[0]
                },
                {
                  method: "POST",
                  action: "/users"
                }
              )
            }
            className="bg-[green]  px-1 text-center flex items-center rounded-[.2rem]"
          >
            <small>Follow Now</small>
          </button>
        </div>
      )}

      <div
        ref={messageRef}
        className="h-full flex flex-col overflow-auto mx-3 pb-[10rem] no-scrollbar scroll-smooth"
      >
        {conversation.Messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-5">
            <button
              onClick={() =>
                fetcher.submit(
                  {
                    type: "send",
                    senderId: currentUser.id,
                    receiverId: conversation.users.filter(
                      user => user.id !== currentUser.id
                    )[0].id,
                    message: "Hi",
                    conversationId: conversation.id
                  },
                  {
                    method: "POST",
                    action: `/chat/${conversation.id}`
                  }
                )
              }
            >
              <h1
                className="text-2xl"
                onClick={() =>
                  fetcher.submit(
                    {
                      type: "send",
                      senderId: currentUser.id,
                      receiverId: conversation.users.filter(
                        user => user.id !== currentUser.id
                      )[0].id,
                      message: "Hi",
                      conversationId: conversation.id
                    },
                    {
                      method: "POST",
                      action: `/chat/${conversation.id}`
                    }
                  )
                }
              >
                Say "Hi" to{" "}
                {
                  conversation.users.filter(
                    user => user.id !== currentUser.id
                  )[0].name
                }{" "}
                !
              </h1>
            </button>
            <button
              onClick={() =>
                fetcher.submit(
                  {
                    type: "send",
                    senderId: currentUser.id,
                    receiverId: conversation.users.filter(
                      user => user.id !== currentUser.id
                    )[0].id,
                    message: "Hi",
                    conversationId: conversation.id
                  },
                  {
                    method: "POST",
                    action: `/chat/${conversation.id}`
                  }
                )
              }
            >
              <img className="w-40 h-40" src="/gifs/say-hi.gif" alt="hi" />
            </button>
          </div>
        ) : (
          <>
            {conversation.Messages.map(message => (
              <>
                {message.senderId === currentUser.id ? (
                  <SenderMessage
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    conversationId={conversation.id}
                  />
                ) : (
                  <ReceiverMessage
                    key={message.id}
                    message={message}
                    currentUser={currentUser}
                    conversationId={conversation.id}
                  />
                )}
              </>
            ))}
          </>
        )}
      </div>

      <Form
        className="absolute bottom-0 flex bg-black bg-opacity-90 border-t gap-3 border-t-[silver] w-full items-center p-3"
        method="POST"
        onSubmit={e => {
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
            conversation.users.filter(user => user.id !== currentUser.id)[0].id
          }
        />
        <input
          type="text"
          className="flex-1 border-none outline-none"
          name="message"
          value={message}
          onChange={e => setMessage(e.target.value)}
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
  currentUser,
  conversationId
}: {
  message: SerializeFrom<
    Messages & { deleteFor: DeleteForUserIds[] } & { sender: { name: string } }
  >;
  currentUser: SerializeFrom<UserInfo>;
  conversationId: string;
}) {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const fetcher = useFetcher();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (e.target instanceof HTMLDivElement) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", onClickOutside);

    return () => {
      document.removeEventListener("click", onClickOutside);
    };
  });

  useEffect(() => {
    fetcher.submit(
      {
        type: "seen",
        messageId: message.id
      },
      {
        method: "POST",
        action: `/chat/${conversationId}`
      }
    );
  }, [conversationId]);

  return (
    <div className="flex flex-col my-1 relative py-4">
      <div className="self-end">
        <small className="text-gray-500">
          sent at {dayjs(message.createdAt).format("h:mm")}
        </small>
        <span className="mx-2 text-sm font-bold">{message.sender.name}</span>
      </div>
      <div className="receiver">
        {message.deleteFor.length !== 0 &&
        !message.deleteFor.find(u => u.userId === currentUser.id) ? (
          <p className="message">
            <span>{detectLinks(message.message)}</span>
          </p>
        ) : (
          <p className="sender-deleted-message">
            <span>Deleted Message</span>
          </p>
        )}
      </div>
      <button
        className="absolute bottom-0 right-0"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <SeeMoreIcon />
      </button>
      {showDropdown && (
        <ul className="bottom-[-80%] right-0 absolute bg-[silver] text-[15px] p-2 rounded z-[99999999]">
          <li className="hover:bg-[gray] p-1 rounded">
            <button>
              <span className="text-black text-sm">Update</span>
            </button>
          </li>
          <li className="hover:bg-[gray] p-1 rounded">
            <Form method="POST">
              <input type="hidden" name="type" value="delete" />
              <input type="hidden" name="messageId" value={message.id} />
              <button>
                <span className="text-black text-sm">Delete</span>
              </button>
            </Form>
          </li>
        </ul>
      )}
    </div>
  );
}

function ReceiverMessage({
  message,
  currentUser,
  conversationId
}: {
  message: SerializeFrom<
    Messages & { deleteFor: DeleteForUserIds[] } & { sender: { name: string } }
  >;
  currentUser: SerializeFrom<UserInfo>;
  conversationId: string;
}) {
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const fetcher = useFetcher();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (e.target instanceof HTMLDivElement) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", onClickOutside);

    return () => {
      document.removeEventListener("click", onClickOutside);
    };
  });

  useEffect(() => {
    fetcher.submit(
      {
        type: "seen",
        messageId: message.id
      },
      {
        method: "POST",
        action: `/chat/${conversationId}`
      }
    );
  }, [conversationId]);

  return (
    <div className="flex flex-col my-1 relative py-4">
      <div>
        <span className="mx-2 text-sm font-bold">{message.sender.name}</span>
        <small className="text-gray-500">
          sent at {dayjs(message.createdAt).format("h:mm")}
        </small>
      </div>
      <div className="sender">
        {message.deleteFor.length !== 0 &&
        message.deleteFor.find(u => u.userId === currentUser.id) ? (
          <p className="deleted-message">
            <span>Deleted Message</span>
          </p>
        ) : (
          <p className="message">
            <span>{detectLinks(message.message)}</span>
          </p>
        )}
      </div>
      <button
        className="absolute bottom-0 left-0"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <SeeMoreIcon />
      </button>
      {showDropdown && (
        <ul className="bottom-[-38%] absolute bg-[silver] text-[15px] p-1 rounded z-[99999999]">
          <li className="hover:bg-[gray] p-1 rounded">
            <Form method="POST">
              <input type="hidden" name="type" value="delete" />
              <input type="hidden" name="messageId" value={message.id} />
              <button>
                <span className="text-black text-sm">Delete</span>
              </button>
            </Form>
          </li>
        </ul>
      )}
    </div>
  );
}

function detectLinks(message: string): (string | JSX.Element)[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = message.split(urlRegex);

  const messageWithLinks = parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a key={index} href={part} className="underline" target="_blank">
          {part}
        </a>
      );
    } else {
      return part;
    }
  });

  return messageWithLinks;
}
