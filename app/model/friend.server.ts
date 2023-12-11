import { db } from "~/utils/db.server";

export async function createFriendRequest({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
    await db.user.update({
        where: {
            id: id
        },
        data: {
            friends: {
                create: {
                    
                }
            }
        }
    })
}
