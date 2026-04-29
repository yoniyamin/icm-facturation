import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin, getSeedAdmins } from "@/lib/auth";
import { readAllowedUsers, addUser, removeUser } from "@/lib/allowed-users";

async function getAdminEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  return (await checkIsAdmin(email)) ? email : null;
}

export async function GET() {
  const admin = await getAdminEmail();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await readAllowedUsers();
  const seedAdmins = Array.from(getSeedAdmins());
  return NextResponse.json({ users, seedAdmins });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminEmail();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const makeAdmin = !!body.isAdmin;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (getSeedAdmins().has(email)) {
    return NextResponse.json(
      { error: "This email is already a seed admin" },
      { status: 400 }
    );
  }
  try {
    const users = await addUser(email, makeAdmin, admin);
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminEmail();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (getSeedAdmins().has(email)) {
    return NextResponse.json(
      { error: "Cannot remove a seed admin" },
      { status: 400 }
    );
  }
  try {
    const users = await removeUser(email);
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
