import {
  LoaderFunctionArgs,
  type LinksFunction,
  type MetaFunction,
  TypedResponse,
  json,
} from "@remix-run/node";
import { Form, Link, NavLink, Outlet, isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import styles from "./style.css";
import HomeIcon from "~/components/icons/HomeIcon";
import ChatIcon from "~/components/icons/ChatIcon";
import UsersIcon from "~/components/icons/UsersIcon";
import RecommendIcon from "~/components/icons/RecommendIcon";
import SettingIcon from "~/components/icons/SettingIcon";
import LogoutIcon from "~/components/icons/LogoutIcon";
import MobileSettingIcon from "~/components/icons/MobileSettingIcon";
import { authenticate } from "~/model/auth.server";
import type { UserInfo} from "~/model/user.server";
import { getUserById } from "~/model/user.server";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<TypedResponse<UserInfo>> {
  const user = await authenticate(request, (userId) => getUserById(userId));

  return json(user);
}


export default function LandingRoute() {
  const { name } = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen overflow-hidden">
      <nav className="nav-container py-5 h-full relative">
        <ul className="desktop-menu flex flex-col ">
          <div className="flex flex-col items-center border-b p-2">
            <img
              className="w-20 h-20 rounded-full"
              src="/images/avatars/gentleman.png"
              alt="profile"
            />
            <Link to={"/setting"} className="flex items-center">
              <p className="underline underline-offset-1 whitespace-nowrap">
                <strong>{name}</strong>
              </p>
              <SettingIcon />
            </Link>
          </div>
          <NavLink className="nav-link" to={"/"}>
            <button className="active:scale-90 transition-all duration-300">
              Home
            </button>
          </NavLink>
          <NavLink className="nav-link" to={"/chat"}>
            <button className="active:scale-90 transition-all duration-300">
              Chat
            </button>
          </NavLink>
          <NavLink className="nav-link" to={"/users"}>
            <button className="active:scale-90 transition-all duration-300">
              Friends
            </button>
          </NavLink>
          <NavLink className="nav-link" to={"/active"}>
            <button className="active:scale-90 transition-all duration-300">
              Active
            </button>
          </NavLink>
          <NavLink className="nav-link" to={"/recommended"}>
            <button className="active:scale-90 transition-all duration-300">
              Recommeded
            </button>
          </NavLink>
          <div className="absolute bottom-0 p-2 right-0">
            <Form method="POST" action="/logout">
              <button type="submit">
                <LogoutIcon fill="white" />
              </button>
            </Form>
          </div>
        </ul>
        <ul className="mobile-menu flex flex-col p-2 gap-3">
          <NavLink to={"/"}>
            <button className="active:scale-90 transition-all duration-300">
              <HomeIcon />
            </button>
          </NavLink>
          <NavLink to={"/chat"}>
            <button className="active:scale-90 transition-all duration-300">
              <ChatIcon />
            </button>
          </NavLink>
          <NavLink to={"/active"}>
            <button className="active:scale-90 transition-all duration-300">
              <UsersIcon />
            </button>
          </NavLink>
          <NavLink to={"/recommended"}>
            <button className="active:scale-90 transition-all duration-300">
              <RecommendIcon />
            </button>
          </NavLink>
          <NavLink to={"/setting"}>
            <button className="active:scale-90 transition-all duration-300">
              <MobileSettingIcon />
            </button>
          </NavLink>
          <div className="absolute bottom-0 p-2 right-0">
            <Form method="POST" action="/logout">
              <button type="submit">
                <LogoutIcon fill="var(--primary-color)" />
              </button>
            </Form>
          </div>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}