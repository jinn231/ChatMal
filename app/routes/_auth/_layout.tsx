import {
  type LinksFunction,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import styles from "./style.css";
import { Outlet } from "@remix-run/react";
import { authenticate } from "~/model/auth.server";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<Response | null> {
  await authenticate(request);

  return null;
}

export default function login() {
  return (
    <div className="container">
      <Outlet />

      <div className="sec-page">
        <img src="/images/connect.png" alt="connect" />
      </div>
    </div>
  );
}
