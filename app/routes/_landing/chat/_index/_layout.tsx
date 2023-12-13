import { Conversation, Messages } from "@prisma/client";
import { LoaderFunctionArgs, TypedResponse, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { authenticate } from "~/model/auth.server";
import { getConversations } from "~/model/conversation.server";
import { UserInfo, getUserById } from "~/model/user.server";

export async function loader({ request }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    currentUser: UserInfo;
    conversations: (Conversation & {
      Messages: Messages[];
      users: UserInfo[];
    })[];
  }>
> {
  const user = await authenticate(request, (userId) => getUserById(userId));

  const conversation = await getConversations({
    userId: user.id,
  });

  return json({
    currentUser: user,
    conversations: conversation,
  });
}

export default function ChatRoute() {
  const { conversations, currentUser } = useLoaderData<typeof loader>();
  console.log(conversations);

  return (
    <div className="w-full h-full overflow-auto">
      <h1 className="p-5 text-2xl">Chat Mal</h1>
      <div className="w-[90%] mx-auto flex flex-col gap-3">
        {conversations.map((conversation) => (
          <Link key={conversation.id} to={`/chat/${conversation.id}`}>
            <section className="text-white border border-[var(--primary-color)] w-full p-2 rounded-md shadow shadow-[var(--primary-color)]">
              <div className="flex items-center gap-3">
                <img
                  className="w-[60px] h-[60px] rounded-full"
                  src="/images/avatars/gentleman.png"
                  alt="profile"
                />
                <div>
                  <p>
                    {conversation.users.map((user) => (
                      <strong key={user.id}>{user.id !== currentUser.id && user.name}</strong>
                    ))}
                  </p>
                  <small>Ko Ko: Nay Kg Lr</small>
                </div>
              </div>
            </section>
          </Link>
        ))}
      </div>
    </div>
  );
}
