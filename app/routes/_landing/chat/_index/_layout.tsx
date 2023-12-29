import { CHAT_ROOM_STATUS, Conversation, Messages } from "@prisma/client";
import type {
  ActionFunctionArgs,
  LinksFunction,
  LoaderFunctionArgs,
  SerializeFrom,
  TypedResponse
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import Dialog from "~/components/Dialog";
import BlockIcon from "~/components/icons/BlockIcon";
import DeleteIcon from "~/components/icons/DeleteIcon";
import { authenticate } from "~/model/auth.server";
import {
  deleteConversationById,
  getConversations,
  getRequestedConversations
} from "~/model/conversation.server";
import { UserInfo, getUserById } from "~/model/user.server";
import { FormError } from "~/utils/error.server";
import { Result } from "~/utils/result.server";
import styles from "./style.css";

type ConversationForm = z.infer<typeof ConversationFormSchema>;

const ConversationFormSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("delete"),
    conversationId: z.string()
  })
]);

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    currentUser: UserInfo;
    normalConversations: (Conversation & {
      Messages: (Messages & { sender: { name: string } })[];
      users: UserInfo[];
    })[];
    requestConversations: (Conversation & {
      Messages: (Messages & { sender: { name: string } })[];
      users: UserInfo[];
    })[];
  }>
> {
  const user = await authenticate(request, userId => getUserById(userId));

  const conversation = await getConversations({
    userId: user.id
  });

  const requestedConversations = await getRequestedConversations({
    userId: user.id
  });

  return json({
    currentUser: user,
    normalConversations: conversation,
    requestConversations: requestedConversations
  });
}

export async function action({
  request
}: ActionFunctionArgs): Promise<
  TypedResponse<Result<null, FormError<ConversationForm, string>>>
> {
  await authenticate(request, userId => getUserById(userId));

  const fields = Object.fromEntries(await request.formData());

  const parsedResult = ConversationFormSchema.safeParse(fields);

  if (!parsedResult.success) {
    return json({
      ok: false,
      error: {
        fields: fields,
        errors: parsedResult.error.format()
      }
    });
  }

  if (parsedResult.data.type === "delete") {
    const { conversationId } = parsedResult.data;
    await deleteConversationById(conversationId);
  }

  return json({ ok: true, data: null });
}

export default function ChatRoute() {
  const { normalConversations, currentUser, requestConversations } =
    useLoaderData<typeof loader>();
  const [messageType, setMessageType] = useState<CHAT_ROOM_STATUS>();

  useEffect(() => {
    if (
      localStorage.getItem("message-filter-type") === CHAT_ROOM_STATUS.REQUEST
    ) {
      setMessageType("REQUEST");
    } else {
      setMessageType("NORMAL");
    }
  }, []);

  return (
    <div className="w-full h-full overflow-auto">
      <div className="px-5 py-3 flex justify-between items-center">
        <h1 className="text-2xl">Chat Mal</h1>

        <div className="btn-group m-2">
          <button
            className={`button  ${
              messageType === CHAT_ROOM_STATUS.NORMAL ? "selected" : "btn"
            }`}
            onClick={() => {
              localStorage.setItem(
                "message-filter-type",
                CHAT_ROOM_STATUS.NORMAL
              );
              setMessageType(CHAT_ROOM_STATUS.NORMAL);
            }}
          >
            <p>Normal</p>
          </button>
          <button
            className={`button  ${
              messageType === CHAT_ROOM_STATUS.REQUEST ? "selected" : "btn"
            }`}
            onClick={() => {
              localStorage.setItem(
                "message-filter-type",
                CHAT_ROOM_STATUS.REQUEST
              );
              setMessageType(CHAT_ROOM_STATUS.REQUEST);
            }}
          >
            <p>Request Messages</p>
          </button>
        </div>
      </div>
      <div className="w-[90%] mx-auto flex flex-col gap-3">
        {messageType === "NORMAL" && normalConversations.length !== 0 ? (
          normalConversations.map(conversation => (
            <ContactUser
              key={conversation.id}
              conversation={conversation}
              currentUser={currentUser}
            />
          ))
        ) : messageType === "REQUEST" && requestConversations.length !== 0 ? (
          requestConversations.map(conversation => (
            <ContactUser
              key={conversation.id}
              conversation={conversation}
              currentUser={currentUser}
            />
          ))
        ) : (
          <div className="text-center my-2">
            <h2 className="text-2xl">You don't have any conversation yet !</h2>
            <p className="text-md font-semibold my-3">
              Find new friends and chat with them{" "}
              <Link to={"/users"} className="underline">
                <span className="text-[#43ff3d]">Go To Friends</span>
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ContactUser({
  conversation,
  currentUser
}: {
  conversation: SerializeFrom<
    Conversation & {
      Messages: (Messages & { sender: { name: string } })[];
      users: UserInfo[];
    }
  >;
  currentUser: SerializeFrom<UserInfo>;
}): JSX.Element {
  const deleteRef = useRef<HTMLDialogElement>(null);
  const fetcher = useFetcher();

  if (fetcher.state === "loading" || fetcher.state === "submitting") {
    return <></>;
  }
  return (
    <section className="text-white border border-[var(--primary-color)] w-full p-2 rounded-md shadow shadow-[var(--primary-color)] flex justify-between items-center">
      <Link
        className="flex-1"
        key={conversation.id}
        to={`/chat/${conversation.id}`}
      >
        <div className="flex items-center gap-3">
          <img
            className="w-[60px] h-[60px] rounded-full"
            src="/images/avatars/gentleman.png"
            alt="profile"
          />
          <div>
            <div className="flex item-center gap-1">
              <p>
                {conversation.users.map(user => (
                  <strong key={user.id}>
                    {user.id !== currentUser.id && user.name}
                  </strong>
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
                    <p>
                      <small className="font-[900] text-[12px] font-mono">
                        {timeDifference <= 3
                          ? "(Active now)"
                          : `(Active ${lastActiveTime.fromNow()})`}
                      </small>
                    </p>
                  );
                }
              })}
            </div>

            <strong className="font-[900] text-[12px] font-mono">
              {conversation.Messages[conversation.Messages.length - 1]
                .senderId === currentUser.id
                ? "You : "
                : `${
                    conversation.Messages[conversation.Messages.length - 1]
                      .sender.name
                  } : `}
            </strong>
            <small
              className={`font-mono ${
                conversation.Messages[
                  conversation.Messages.length - 1
                ].seenIds.includes(currentUser.id)
                  ? "font-normal text-gray-500"
                  : "font-semibold"
              }`}
            >
              {conversation.Messages[conversation.Messages.length - 1].message}
            </small>
          </div>
        </div>
      </Link>
      <div className="flex gap-3">
        <button onClick={() => deleteRef.current?.showModal()}>
          <DeleteIcon />
        </button>
        <Dialog
          className="border-2 bg-black w-[500px] min-w-[300px] border-[var(--primary-color)] rounded"
          ref={deleteRef}
        >
          <h2 className="bg-[var(--primary-color)] p-2">Delete</h2>
          <div className="flex flex-col items-center gap-5 p-5">
            <p className="font-medium">
              Are you sure you want to delete{" "}
              {conversation.users.map(
                user => user.id !== currentUser.id && user.name
              )}
              {" from your contact ?"}
            </p>
            <span className="self-start font-medium">
              ⚠️ That will also delete for{" "}
              {conversation.users.map(
                user => user.id !== currentUser.id && user.name
              )}{" "}
              !
            </span>
            <div className="flex gap-5">
              <fetcher.Form method="POST">
                <input
                  type="hidden"
                  name="conversationId"
                  value={conversation.id}
                />
                <input type="hidden" name="type" value="delete" />
                <button className="text-white px-4 py-[.5rem] rounded bg-[#ff0a0a]">
                  <span>Delete</span>
                </button>
              </fetcher.Form>
              <button
                className="text-white border button border-red-500"
                onClick={() => deleteRef.current?.close()}
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </Dialog>

        <button>
          <BlockIcon />
        </button>
      </div>
    </section>
  );
}
