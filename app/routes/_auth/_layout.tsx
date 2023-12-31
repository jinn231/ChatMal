import { type LinksFunction } from "@remix-run/node";
import styles from "./style.css";
import { Outlet } from "@remix-run/react";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

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
