import { NextResponse } from "next/server";
import { resetCleanDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    resetCleanDatabase();
    return NextResponse.json({ success: true, message: "Database dan profil berhasil dikosongkan total." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
