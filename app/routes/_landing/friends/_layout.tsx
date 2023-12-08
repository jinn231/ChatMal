import {
  json,
  type LinksFunction,
  type LoaderFunctionArgs,
  type TypedResponse,
} from "@remix-run/node";
import styles from "./style.css";
import React, { useState } from "react";
import { authenticate } from "~/model/auth.server";
import type { UserInfo } from "~/model/user.server";
import { getAllUnfriendUser } from "~/model/user.server";
import { useLoaderData } from "@remix-run/react";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    suggestFriends: UserInfo[];
  }>
> {
  const { id } = await authenticate(request);

  const users = await getAllUnfriendUser(id);

  return json({
    suggestFriends: users,
  });
}

export default function FriendRoute() {
  const [filterFriend, setFilterFriendType] = useState<"friends" | "requests">(
    "friends"
  );
  const { suggestFriends } = useLoaderData<typeof loader>();

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
            <p>New Friends</p>
          </button>
          <button
            className={`button ${
              filterFriend === "requests" ? "selected" : "btn"
            }`}
            onClick={() => setFilterFriendType("requests")}
          >
            <p>Friend Request</p>
          </button>
        </div>
      </div>

      <div className="border-t border-t-white flex flex-col p-2">
        {filterFriend === "friends" ? (
          <>
            {suggestFriends.map((friend) => (
              <NewFriends key={friend.id} user={friend} />
            ))}
          </>
        ) : (
          <RequestedFriend />
        )}
      </div>
    </main>
  );
}

function NewFriends({ user }: { user: UserInfo }): JSX.Element {
  return (
    <div className="flex items-center gap-2 border-b py-2">
      <img
        className="w-[45px] h-[45px] rounded-full"
        src="/images/avatars/gentleman.png"
        alt="profile"
      />
      <div>
        <p>{user.name}</p>
        <div className="flex gap-1">
          <button className="bg-[green]  px-1 text-center flex items-center rounded-[.2rem]">
            <small>Friend request</small>
          </button>
          <button className="bg-[var(--primary-color)]  px-1 text-center flex items-center rounded-[.2rem]">
            <small>Follow</small>
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestedFriend(): JSX.Element {
  return (
    <div className="flex items-center gap-2 border-b py-2">
      <img
        className="w-[45px] h-[45px] rounded-full"
        src="/images/avatars/gentleman.png"
        alt="profile"
      />
      <div>
        <p>Mg Mg</p>
        <div className="flex gap-1">
          <button className="bg-[green]  px-1 text-center flex items-center rounded-[.2rem]">
            <small>Approve</small>
          </button>
          <button className="bg-[var(--error-color)]  px-1 text-center flex items-center rounded-[.2rem]">
            <small>Decline</small>
          </button>
        </div>
      </div>
    </div>
  );
}
