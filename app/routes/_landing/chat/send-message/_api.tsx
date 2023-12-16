import { LoaderFunctionArgs } from "@remix-run/node";
import { eventStream } from "remix-utils/sse/server";
import { authenticate } from "~/model/auth.server";
import { getUserById } from "~/model/user.server";
import { emitter } from "~/utils/event.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate(request, (userId) => getUserById(userId));

  return eventStream(request.signal, function setup(send) {
    const handle = (id: number) => {
      send({ event: "send-message", data: id.toString() });
    };
    emitter.on("send-message", handle);
    return function clear() {
      emitter.off("send-message", handle);
    };
  });
}
