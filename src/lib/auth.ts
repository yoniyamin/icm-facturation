import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function getAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS || "";
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
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
      const allowed = getAllowedEmails();
      if (allowed.size === 0) return true;
      return allowed.has(user.email?.toLowerCase() ?? "");
    },
  },
  pages: {
    error: "/",
  },
};
