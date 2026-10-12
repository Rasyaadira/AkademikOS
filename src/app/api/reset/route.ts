import { NextResponse } from "next/server";
import { resetUserData } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "student-clean";
    
    resetUserData(userId);
    return NextResponse.json({ success: true, message: `Data untuk ${userId} berhasil dikosongkan.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
