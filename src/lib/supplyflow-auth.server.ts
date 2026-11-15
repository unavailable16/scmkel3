import { demoEmailForUsername, type DemoUsername } from "./supplyflow-auth";

const DEMO_PASSWORD = "admin";

export async function prepareDemoAccount(username: DemoUsername, password: string) {
  if (password !== DEMO_PASSWORD) return false;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = demoEmailForUsername(username);
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) return false;
  if (data.users.some((user) => user.email?.toLowerCase() === email)) return true;

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { username },
  });

  return !createError;
}