import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "react-router-dom";
import { logout } from "~/model/auth.server";

export async function loader(): Promise<Response> {
  return redirect("/");
}

export async function action({
  request,
}: ActionFunctionArgs): Promise<Response> {
  return await logout(request);
}
