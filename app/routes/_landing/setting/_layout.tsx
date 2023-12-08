import type { LoaderFunctionArgs, TypedResponse} from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/model/auth.server";
import type { UserInfo } from "~/model/user.server";

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<TypedResponse<UserInfo>> {
  const user = await authenticate(request);

  return json(user);
}

export default function ProfileSettingLayout() {
  return <div>ProfileSettingLayout</div>;
}
