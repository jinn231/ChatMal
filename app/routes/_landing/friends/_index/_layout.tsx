import {
  ActionFunctionArgs,
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
  type TypedResponse,
} from "@remix-run/node";
import styles from "./style.css";
import { useState } from "react";
import { authenticate } from "~/model/auth.server";
import type { UserInfo } from "~/model/user.server";
import {
  follow,
  getAllFriends,
  getUserById,
  getUserByList,
  unfollow,
} from "~/model/user.server";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { z } from "zod";
import { Result } from "~/utils/result.server";
import { FormError } from "~/utils/error.server";
import { createConversation } from "~/model/conversation.server";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

type FriendRequestForm = z.infer<typeof FriendActionSchema>;

const FriendActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("follow"),
    userId: z.string(),
  }),
  z.object({
    type: z.literal("unfollow"),
    userId: z.string(),
  }),
]);

export async function action({
  request,
}: ActionFunctionArgs): Promise<
  TypedResponse<Result<null, FormError<FriendRequestForm, string>>>
> {
  const { id, following } = await authenticate(request, (userId) =>
    getUserById(userId)
  );

  const fields = Object.fromEntries(await request.formData());

  const parseResult = FriendActionSchema.safeParse(fields);

  if (!parseResult.success) {
    return json({
      ok: false,
      error: {
        fields,
        errors: parseResult.error.format(),
      },
    });
  }

  const { userId, type } = parseResult.data;

  if (type === "follow") {
    if (following.includes(userId)) {
      return json({
        ok: false,
        error: {
          fields,
          message: "Already followed this user",
        },
      });
    }

    await createConversation({
      senderId: id,
      members: [userId],
    });
    await follow({
      id: userId,
      followerId: id,
    });
  } else {
    // unfollow
    await unfollow({
      id: userId,
      unFollowerId: id,
    });
  }

  return json({
    ok: true,
    data: null,
  });
}

export async function loader({ request }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    friends: UserInfo[];
    followers: UserInfo[];
    following: UserInfo[];
    currentUserId: string;
  }>
> {
  const { id, followers, following } = await authenticate(request, (userId) =>
    getUserById(userId)
  );

  const users = await getAllFriends(id);
  const filteredFriends = users.filter(
    (user) => !user.followers.includes(id) && !user.following.includes(id)
  );
  const followedUsers = await getUserByList(followers);
  const followingUsers = await getUserByList(following);

  return json({
    friends: filteredFriends,
    currentUserId: id,
    followers: followedUsers,
    following: followingUsers,
  });
}

export default function FriendRoute() {
  const [filterFriend, setFilterFriendType] = useState<
    "friends" | "following" | "followers"
  >("friends");
  const { friends, followers, following } = useLoaderData<typeof loader>();

  return (
    <main className="w-full">
      <div className="flex justify-end">
        <div className="btn-group m-2">
          <button
            className={`button  ${
              filterFriend === "friends" ? "selected" : "btn"
            }`}
            onClick={() => setFilterFriendType("friends")}
          >
            <p>Friends</p>
          </button>
          <button
            className={`button  ${
              filterFriend === "followers" ? "selected" : "btn"
            }`}
            onClick={() => setFilterFriendType("followers")}
          >
            <p>Followers</p>
          </button>
          <button
            className={`button ${
              filterFriend === "following" ? "selected" : "btn"
            }`}
            onClick={() => setFilterFriendType("following")}
          >
            <p>Following</p>
          </button>
        </div>
      </div>

      <div className="border-t border-t-white flex flex-col p-2">
        {filterFriend === "friends" ? (
          <>
            {friends.map((friend) => (
              <NewFriends key={friend.id} user={friend} />
            ))}
          </>
        ) : filterFriend === "following" ? (
          <>
            {following.map((friend) => (
              <Following user={friend} />
            ))}
          </>
        ) : filterFriend === "followers" ? (
          followers.map((user) => (
            <Follower user={user} following={following} />
          ))
        ) : null}
      </div>
    </main>
  );
}

function NewFriends({ user }: { user: UserInfo }): JSX.Element {
  const fetcher = useFetcher();

  if (fetcher.state === "submitting" || fetcher.state === "loading") {
    return <></>;
  }

  return (
    <div className="flex items-center gap-2 border-b py-2">
      <img
        className="w-[45px] h-[45px] rounded-full"
        src="/images/avatars/gentleman.png"
        alt="profile"
      />
      <div className="flex flex-col gap-1">
        <Link to={`/friends/${user.id}`}>
          <p className="underline">{user.name}</p>
        </Link>
        <div className="flex gap-1">
          <fetcher.Form method="POST">
            <input type="hidden" name="type" value={"follow"} />
            <input type="hidden" name="userId" value={user.id} />
            <button className="bg-[green]  px-1 text-center flex items-center rounded-[.2rem]">
              <small>Follow</small>
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}

function Following({ user }: { user: UserInfo }): JSX.Element {
  const fetcher = useFetcher();

  if (fetcher.state === "submitting" || fetcher.state === "loading") {
    return <></>;
  }

  return (
    <div className="flex items-center gap-2 border-b py-2">
      <img
        className="w-[45px] h-[45px] rounded-full"
        src="/images/avatars/gentleman.png"
        alt="profile"
      />
      <div className="flex flex-col gap-1">
        <Link to={`/friends/${user.id}`}>
          <p className="underline">{user.name}</p>
        </Link>
        <div className="flex gap-1">
          <fetcher.Form method="POST">
            <input type="hidden" name="type" value={"unfollow"} />
            <input type="hidden" name="userId" value={user.id} />
            <button className="bg-[var(--error-color)]  px-1 text-center flex items-center rounded-[.2rem]">
              <small>Unfollow</small>
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}

function Follower({
  user,
  following,
}: {
  user: UserInfo;
  following: UserInfo[];
}): JSX.Element {
  const fetcher = useFetcher();
  const userExists = following.find((item) => item.id === user.id);

  if (fetcher.state === "loading" || fetcher.state === "submitting") {
    return <></>;
  }

  return (
    <div className="flex items-center gap-2 border-b py-2">
      <img
        className="w-[45px] h-[45px] rounded-full"
        src="/images/avatars/gentleman.png"
        alt="profile"
      />
      <div>
        <Link to={`/friends/${user.id}`}>
          <p className="underline">{user.name}</p>
        </Link>
        {!userExists && (
          <fetcher.Form method="POST">
            <input type="hidden" name="type" value={"follow"} />
            <input type="hidden" name="userId" value={user.id} />
            <button className="bg-[#eee]  px-1 text-center flex items-center rounded-[.2rem]">
              <small className="text-black">Follow Back</small>
            </button>
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
