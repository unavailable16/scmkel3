export const DEMO_USERNAMES = ["ahdhan", "ghina", "adlina"] as const;

export type DemoUsername = (typeof DEMO_USERNAMES)[number];

export function demoEmailForUsername(username: DemoUsername) {
  return `${username}@supplyflow.local`;
}

export function getDemoUsernameFromEmail(email: string | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  return DEMO_USERNAMES.find((username) => demoEmailForUsername(username) === normalizedEmail) ?? null;
}