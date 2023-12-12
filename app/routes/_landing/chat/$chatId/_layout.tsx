import { json, redirect, type LinksFunction, TypedResponse } from "@remix-run/node";
import SendIcon from "~/components/icons/SendIcon";
import styles from "./style.css";
import LeftArrowIcon from "~/components/icons/LeftArrowIcon";
import { authenticate } from "~/model/auth.server";
import { UserInfo, getUserById } from "~/model/user.server";
import { LoaderFunctionArgs } from "react-router-dom";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export default function ChatSessionRoute() {
  return (
    <div className="w-full h-full relative">
      <nav className="flex items-center p-3 gap-3 border-b border-[var(--primary-color)] mx-3">
        <button onClick={() => history.back()}>
          <LeftArrowIcon />
        </button>

        <img
          className="w-[50px] h-[50px] rounded-full"
          src="/images/avatars/gentleman.png"
          alt="profile"
        />
        <div>
          <p>
            <strong>Mg Mg</strong>
          </p>
          <small>Active now</small>
        </div>
      </nav>

      <div className="h-full flex flex-col overflow-auto mx-3 pb-[10rem] no-scrollbar">
        <SenderMessage />
        <ReceiverMessage />
        <ReceiverMessage />
        <SenderMessage />
      </div>

      <div className="absolute bottom-0 flex bg-black bg-opacity-90 border-t gap-3 border-t-[silver] w-full items-center p-3">
        <input type="text" className="flex-1 border-none outline-none" />
        <button>
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function SenderMessage() {
  return (
    <div className="sender">
      <p className="message">
        <span>
          Hello, Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Dolorem, quibusdam provident! Accusantium eveniet dolore officia
          labore. Nesciunt, recusandae facere at consequatur repudiandae, natus
          iusto, ea fugiat repellendus fugit ipsum qui.
        </span>
      </p>
    </div>
  );
}

function ReceiverMessage() {
  return (
    <div className="receiver">
      <p className="message">
        <span>
          Hello, Lorem ipsum dolor sit amet consectetur adipisicing elit.
          Dolorem, quibusdam provident! Accusantium eveniet dolore officia
          labore. Nesciunt, recusandae facere at consequatur repudiandae, natus
          iusto, ea fugiat repellendus fugit ipsum qui.
        </span>
      </p>
    </div>
  );
}
