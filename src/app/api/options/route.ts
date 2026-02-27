import { NextResponse } from "next/server";
import { getUniqueOptions } from "@/lib/google-sheets";

export const dynamic = "force-dynamic";

const DEFAULT_SUBJECT_KEYS = [
  "food",
  "arts_and_craft",
  "snacks",
  "office_supplies",
  "transportation",
  "cleaning",
  "equipment",
  "other",
];

export async function GET() {
  try {
    const { projects, subjects } = await getUniqueOptions();

    const customSubjects = subjects.filter(
      (s) => !DEFAULT_SUBJECT_KEYS.includes(s)
    );

    return NextResponse.json({ projects, customSubjects });
  } catch {
    return NextResponse.json({ projects: [], customSubjects: [] });
  }
}
