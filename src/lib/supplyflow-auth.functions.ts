import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DEMO_USERNAMES } from "./supplyflow-auth";

export const prepareSupplyFlowLogin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ username: z.enum(DEMO_USERNAMES), password: z.string().min(1).max(128) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { prepareDemoAccount } = await import("./supplyflow-auth.server");
    return { ready: await prepareDemoAccount(data.username, data.password) };
  });