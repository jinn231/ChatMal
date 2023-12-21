import { db } from "./../app/utils/db.server";

async function main() {
  await db.conversation.deleteMany();
}

main()