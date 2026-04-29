export interface AllowedUser {
  email: string;
  isAdmin: boolean;
  addedBy: string;
  addedAt: string;
}

const KEY = "allowedUsers";

function getEdgeConfigConnection(): { id: string; token: string } | null {
  const raw = process.env.EDGE_CONFIG;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const id = url.pathname.replace(/^\//, "");
    const token = url.searchParams.get("token");
    if (!id || !token) return null;
    return { id, token };
  } catch {
    return null;
  }
}

export async function readAllowedUsers(): Promise<AllowedUser[]> {
  const conn = getEdgeConfigConnection();
  if (!conn) return [];
  try {
    const res = await fetch(
      `https://edge-config.vercel.com/${conn.id}/item/${KEY}?token=${conn.token}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const value = await res.json();
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function writeAllowedUsers(users: AllowedUser[]): Promise<void> {
  const conn = getEdgeConfigConnection();
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!conn) throw new Error("Missing EDGE_CONFIG env var");
  if (!apiToken) {
    throw new Error("Missing VERCEL_API_TOKEN env var (needed to update Edge Config)");
  }
  const teamId = process.env.VERCEL_TEAM_ID;
  const url = teamId
    ? `https://api.vercel.com/v1/edge-config/${conn.id}/items?teamId=${teamId}`
    : `https://api.vercel.com/v1/edge-config/${conn.id}/items`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: KEY, value: users }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Edge Config update failed (${res.status}): ${errText}`);
  }
}

export async function addUser(
  email: string,
  isAdmin: boolean,
  addedBy: string
): Promise<AllowedUser[]> {
  const normalized = email.trim().toLowerCase();
  const users = await readAllowedUsers();
  const existing = users.find((u) => u.email === normalized);
  const updated: AllowedUser[] = existing
    ? users.map((u) => (u.email === normalized ? { ...u, isAdmin } : u))
    : [
        ...users,
        {
          email: normalized,
          isAdmin,
          addedBy,
          addedAt: new Date().toISOString(),
        },
      ];
  await writeAllowedUsers(updated);
  return updated;
}

export async function removeUser(email: string): Promise<AllowedUser[]> {
  const normalized = email.trim().toLowerCase();
  const users = await readAllowedUsers();
  const updated = users.filter((u) => u.email !== normalized);
  if (updated.length === users.length) return users;
  await writeAllowedUsers(updated);
  return updated;
}
