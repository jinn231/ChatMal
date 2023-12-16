import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { authenticate } from "~/model/auth.server";
import { getUserById } from "~/model/user.server";
import { emitter } from "~/utils/event.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticate(request, (userId) => getUserById(userId));

  console.log("userId: ", user.id)
  
  return eventStream(request.signal, function setup(send) {
    const handle = (id: number) => {
      console.log(" Event Id : ",id);
      send({ event: "on-input", data: id.toString() });
    };
    emitter.on("on-input", handle);
    return function clear() {
      emitter.off("on-input", handle);
    };
  });
}

export async function action({ request }: ActionFunctionArgs): Promise<null> {
  await authenticate(request, (userId) => getUserById(userId));

  const fields = Object.fromEntries(await request.formData());

  emitter.emit("on-input", fields.id);

  return null;
}