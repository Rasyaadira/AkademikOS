import { NextResponse } from "next/server";
import db, { DEFAULT_USER_ID } from "@/lib/db";

export async function GET() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || "";

  let deepseekStatus = "not_configured";
  let deepseekLatency = 0;

  if (deepseekKey) {
    try {
      const start = Date.now();
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });
      deepseekLatency = Date.now() - start;
      deepseekStatus = res.ok ? "connected" : `error_${res.status}`;
    } catch (err: any) {
      deepseekStatus = `unreachable: ${err.message || "timeout"}`;
    }
  }

  let dbStatus = "connected";
  try {
    db.prepare("SELECT user_id FROM profile WHERE user_id = ?").get(DEFAULT_USER_ID);
  } catch (e: any) {
    dbStatus = `error: ${e.message}`;
  }

  const isHealthy = deepseekStatus === "connected";

  return NextResponse.json({
    status: isHealthy ? "ready" : "warning",
    message: isHealthy
      ? "AI Engine AkademikOS Aktif dan Siap Digunakan!"
      : "AI Engine belum terhubung sempurna. Periksa DEEPSEEK_API_KEY di .env.local",
    engines: {
      deepseek: {
        configured: !!deepseekKey,
        status: deepseekStatus,
        latencyMs: deepseekLatency,
      },
      gemini: {
        configured: !!geminiKey,
        status: geminiKey ? "configured" : "fallback",
      },
    },
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}
