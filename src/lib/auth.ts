import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { readAllowedUsers } from "./allowed-users";

export function getSeedAdmins(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || process.env.ALLOWED_EMAILS || "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
}

export async function checkIsAdmin(
  email: string | null | undefined
): Promise<boolean> {
  if (!email) return false;
  const normalized = email.toLowerCase();
  if (getSeedAdmins().has(normalized)) return true;
  const users = await readAllowedUsers();
  return users.some((u) => u.email === normalized && u.isAdmin);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const seeds = getSeedAdmins();
      if (seeds.has(email)) return true;
      const users = await readAllowedUsers();
      if (seeds.size === 0 && users.length === 0) return true;
      return users.some((u) => u.email === email);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.isAdmin = await checkIsAdmin(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { isAdmin?: boolean }).isAdmin = !!token.isAdmin;
      }
      return session;
    },
  },
  pages: {
    error: "/",
  },
};
