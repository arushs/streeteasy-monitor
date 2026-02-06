import { query } from "./_generated/server";
import { auth } from "./auth";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    return await auth.getUserIdentity(ctx);
  },
});