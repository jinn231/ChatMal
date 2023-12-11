import { LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { json, redirect } from "react-router-dom";
import LeftArrowIcon from "~/components/icons/LeftArrowIcon";
import MessageIcon from "~/components/icons/MessageIcon";
import { authenticate } from "~/model/auth.server";
import { UserInfo, getUserById } from "~/model/user.server";

export async function loader({ request, params }: LoaderFunctionArgs): Promise<
  TypedResponse<{
    user: UserInfo;
  }>
> {
  await authenticate(request, (userId) => getUserById(userId));

  const { userId } = params;

  if (!userId) {
    throw redirect("/friends");
  }

  const user = await getUserById(userId);

  if (!user) {
    throw redirect("/friends");
  }

  return json({
    user,
  });
}

export default function UsersProfileLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <main className="w-full p-5">
      <Link to={"/friends"}>
        <LeftArrowIcon />
      </Link>
      <div className="max-w-[240px] flex flex-col gap-3">
        <img
          className="w-60 h-60 rounded-full"
          src="/images/avatars/gentleman.png"
          alt="profile_picture"
        />
        <div className="flex gap-2 items-center">
          <h2 className="text-xl font-medium text-center">@ {user.name}</h2>
          <Link to={"/chat/abcd"}>
            <MessageIcon />
          </Link>
        </div>
      </div>
      <div className="w-full border my-1"></div>
      <div className="flex flex-col items-center">
        <h1>Coming Soon...</h1>
      </div>
    </main>
  );
}
