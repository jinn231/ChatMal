import {
  type LinksFunction,
  type LoaderFunctionArgs,
  type TypedResponse
} from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { json, redirect } from "react-router-dom";
import LeftArrowIcon from "~/components/icons/LeftArrowIcon";
import MessageIcon from "~/components/icons/MessageIcon";
import { authenticate } from "~/model/auth.server";
import type { UserInfo } from "~/model/user.server";
import { getUserById, getUserByList } from "~/model/user.server";
import styles from "./style.css";
import UsernameTag from "~/components/UsernameTag";
import dayjs from "dayjs";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request, params }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    currentUser: UserInfo;
    user: UserInfo;
    followers: UserInfo[];
    following: UserInfo[];
  }>
> {
  const currentUser = await authenticate(request, userId =>
    getUserById(userId)
  );

  const { userId } = params;

  if (!userId) {
    throw redirect("/users");
  }
  if (currentUser.id === userId) {
    throw redirect("/setting");
  }

  const user = await getUserById(userId);

  if (!user) {
    throw redirect("/users");
  }

  const followers = await getUserByList(user.followers);
  const following = await getUserByList(user.following);

  return json({
    currentUser,
    user,
    followers,
    following
  });
}

export default function UsersProfileLayout() {
  const { user, currentUser, followers, following } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [tab, setTab] = useState<"profile" | "followers" | "following">(
    "profile"
  );

  return (
    <main className="w-full p-5">
      <button onClick={() => history.back()}>
        <LeftArrowIcon />
      </button>
      <div className="max-w-[240px] flex flex-col gap-3">
        <img
          className="w-40 h-40 rounded-full"
          src="/images/avatars/gentleman.png"
          alt="profile_picture"
        />
        <div className="flex gap-3 items-center">
          <h2 className="text-xl font-medium text-center">@ {user.name}</h2>
          <button
            onClick={() =>
              fetcher.submit(
                { requestUserId: user.id },
                { method: "POST", action: "/users/redirect-chat/" }
              )
            }
          >
            <MessageIcon />
          </button>
          {!currentUser.following.includes(user.id) &&
            fetcher.state !== "loading" &&
            fetcher.state !== "submitting" && (
              <button
                className="bg-[green]  px-1 text-center flex items-center rounded-[.2rem]"
                onClick={() =>
                  fetcher.submit(
                    JSON.stringify({
                      type: "follow",
                      userId: user.id
                    }),
                    {
                      method: "POST",
                      action: "/users"
                    }
                  )
                }
              >
                <small>Follow</small>
              </button>
            )}
        </div>
      </div>
      <div className="w-full border my-1"></div>
      <div>
        <div className="btn-group">
          <button
            className={`button  ${tab === "profile" ? "selected" : "btn"}`}
            onClick={() => setTab("profile")}
          >
            <p>Profile</p>
          </button>
          <button
            className={`button  ${tab === "followers" ? "selected" : "btn"}`}
            onClick={() => setTab("followers")}
          >
            <p>Followers ({followers.length})</p>
          </button>
          <button
            className={`button ${tab === "following" ? "selected" : "btn"}`}
            onClick={() => setTab("following")}
          >
            <p>Following ({following.length})</p>
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {tab === "profile" ? (
            <>
              <h2>Profile</h2>
              <div className="flex flex-col gap-[.1px]">
                <span>
                  {followers.length} followers , {following.length} following
                </span>
                <span>
                  Joined At : {dayjs(user.createdAt).format("YYYY . MMM . DD")}
                </span>
              </div>
            </>
          ) : tab === "followers" ? (
            followers.map(u => (
              <div className="flex gap-2 items-center border border-[var(--primary-color)] shadow-md hover:bg-[gray] transition-all delay-100 ease-in-out p-1 rounded-md">
                <img
                  className="w-[35px] h-[35px] rounded-full"
                  src="/images/avatars/gentleman.png"
                  alt="profile"
                />{" "}
                <div>
                  <UsernameTag name={u.name} id={u.id} />
                </div>
              </div>
            ))
          ) : (
            tab === "following" &&
            following.map(u => (
              <div className="flex gap-2 items-center border border-[var(--primary-color)] shadow-md hover:bg-[gray] transition-all delay-100 ease-in-out p-1 rounded-md">
                <img
                  className="w-[35px] h-[35px] rounded-full"
                  src="/images/avatars/gentleman.png"
                  alt="profile"
                />{" "}
                <div>
                  <UsernameTag name={u.name} id={u.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
