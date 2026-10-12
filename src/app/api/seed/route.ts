import { NextResponse } from "next/server";
import { seedFullDatabase } from "@/lib/db";

export async function POST() {
  try {
    seedFullDatabase();
    return NextResponse.json({ success: true, message: "Data contoh (dummy) berhasil dipulihkan." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
