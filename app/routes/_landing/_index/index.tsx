import React from "react";
import { type LoaderFunctionArgs } from "react-router-dom";
import { authenticate } from "~/model/auth.server";
import { getUserById } from "~/model/user.server";

export async function loader({
  request
}: LoaderFunctionArgs): Promise<Response | null> {
  await authenticate(request, userId => getUserById(userId));

  return null;
}

export default function IndexRoute(): React.JSX.Element {
  return <div>index</div>;
}
