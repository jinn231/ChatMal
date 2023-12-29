import { db } from "../app/utils/db.server";

async function main(): Promise<void> {
  await db.conversation.deleteMany();
}

main();
