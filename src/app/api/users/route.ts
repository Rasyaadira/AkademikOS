import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const users = db.prepare("SELECT * FROM users ORDER BY created_at ASC").all();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
