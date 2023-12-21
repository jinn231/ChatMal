import {
  ActionFunctionArgs,
  json,
  SerializeFrom,
  type LinksFunction,
  type LoaderFunctionArgs,
  type TypedResponse,
} from "@remix-run/node";
import styles from "./style.css";
import { useEffect, useState } from "react";
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
import {
  createConversation,
  isConversationAlreadyExist,
} from "~/model/conversation.server";
import { CHAT_ROOM_STATUS } from "@prisma/client";
import UsernameTag from "~/components/UsernameTag";

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
  const { id, following, followers } = await authenticate(request, (userId) =>
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

    if (
      !(await isConversationAlreadyExist({
        currentUserId: id,
        userId: userId,
      }))
    ) {
      await createConversation({
        members: [id, userId],
        status: followers.includes(userId)
          ? CHAT_ROOM_STATUS.NORMAL
          : CHAT_ROOM_STATUS.REQUEST,
      });
    }

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
    "friends" | "following" | "followers" | string
  >();
  const { friends, followers, following } = useLoaderData<typeof loader>();

  useEffect(() => {
    if (
      localStorage.getItem("user-filter-type") === "followers" ||
      localStorage.getItem("user-filter-type") === "following" ||
      localStorage.getItem("user-filter-type") === "friends"
    ) {
      setFilterFriendType(
        localStorage.getItem("user-filter-type") ?? "friends"
      );
    } else {
      setFilterFriendType("friends");
    }
  }, []);

  return (
    <main className="w-full">
      <div className="flex justify-end">
        <div className="btn-group m-2">
          <button
            className={`button  ${
              filterFriend === "friends" ? "selected" : "btn"
            }`}
            onClick={() => {
              localStorage.setItem("user-filter-type", "friends");
              setFilterFriendType("friends");
            }}
          >
            <p>Friends</p>
          </button>
          <button
            className={`button  ${
              filterFriend === "followers" ? "selected" : "btn"
            }`}
            onClick={() => {
              localStorage.setItem("user-filter-type", "followers");
              setFilterFriendType("followers");
            }}
          >
            <p>Followers</p>
          </button>
          <button
            className={`button ${
              filterFriend === "following" ? "selected" : "btn"
            }`}
            onClick={() => {
              localStorage.setItem("user-filter-type", "following");
              setFilterFriendType("following");
            }}
          >
            <p>Following</p>
          </button>
        </div>
      </div>

      <div className="border-t border-t-white flex flex-col p-2">
        {filterFriend === "friends" ? (
          <>
            {friends.length === 0 ? (
              <>
                <h2>No friend to show</h2>
              </>
            ) : (
              friends.map((friend) => (
                <NewFriends key={friend.id} user={friend} />
              ))
            )}
          </>
        ) : filterFriend === "following" ? (
          <>
            {following.length === 0 ? (
              <>
                <h2>You don't follow anyone</h2>
              </>
            ) : (
              following.map((friend) => <Following user={friend} />)
            )}
          </>
        ) : filterFriend === "followers" ? (
          followers.length === 0 ? (
            <>
              <h2>You have no follower</h2>
            </>
          ) : (
            followers.map((user) => (
              <Follower user={user} following={following} />
            ))
          )
        ) : null}
      </div>
    </main>
  );
}

function NewFriends({ user }: { user: SerializeFrom<UserInfo> }): JSX.Element {
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
        <UsernameTag name={user.name} id={user.id} />
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

function Following({ user }: { user: SerializeFrom<UserInfo> }): JSX.Element {
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
        <Link to={`/users/${user.id}`}>
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
  user: SerializeFrom<UserInfo>;
  following: SerializeFrom<UserInfo>[];
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
        <Link to={`/users/${user.id}`}>
          <p className="underline">{user.name}</p>
        </Link>
        {!userExists ? (
          <fetcher.Form method="POST">
            <input type="hidden" name="type" value={"follow"} />
            <input type="hidden" name="userId" value={user.id} />
            <button className="bg-[#eee]  px-1 text-center flex items-center rounded-[.2rem]">
              <small className="text-black">Follow Back</small>
            </button>
          </fetcher.Form>
        ) : (
          <p className="bg-[var(--highlight-color)] px-1 font-semibold text-center flex items-center rounded-[.2rem]">
            <small className="text-silver">Followed</small>
          </p>
        )}
      </div>
    </div>
  );
}
