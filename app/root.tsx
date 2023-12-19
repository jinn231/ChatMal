import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import style from "./styles/global.css";
import preludeStyle from "./styles/prelude.css";
import React from "react";
import { getUserId, updateUser } from "./model/user.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: style },
  { rel: "stylesheet", href: preludeStyle },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export async function loader({ request }: LoaderFunctionArgs): Promise<null> {
  const userId = await getUserId(request);

  if (userId !== null) {
    updateUser({
      userId: userId,
      lastActiveAt: new Date(),
    });
  }

  return null;
}

export default function App(): React.JSX.Element {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

export function ErrorBoundary(): React.JSX.Element {
  const error = useRouteError();
  let status = 500;
  let errorMessage = "Internal Server Error";
  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status == 404) {
      errorMessage = "Not Found";
    }
  }

  return (
    <Document>
      <main className="error-page-container">
        <div className="flex items-center gap-[1.5rem]">
          <h1 className="text-4xl">{status}</h1>
          <div className="h-[50px] bg-white w-[1px]"></div>
          <div className="flex flex-col">
            <h3 className="text-xl">{errorMessage}</h3>
            <Link className="text-white underline" to={"/"}>
              <span className="text-md">Go Back</span>
            </Link>
          </div>
        </div>
      </main>
    </Document>
  );
}

function Document({
  children,
}: {
  children: React.JSX.Element;
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
