import { NextResponse } from "next/server";
import db, { DEFAULT_USER_ID } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;

    const profile: any = db
      .prepare("SELECT opencode_api_key, opencode_base_url, opencode_model FROM profile WHERE user_id = ? LIMIT 1")
      .get(userId);

    const hasKey = Boolean(profile?.opencode_api_key && profile.opencode_api_key.trim().length > 0);

    return NextResponse.json({
      configured: hasKey,
      baseUrl: profile?.opencode_base_url || "https://api.opencode.ai/v1",
      model: profile?.opencode_model || "opencode/gpt-4o",
      status: hasKey ? "ready" : "awaiting_api_key",
      message: hasKey
        ? "Koneksi OpenCode AI siap digunakan."
        : "Integrasi OpenCode AI telah terpasang. Menunggu API Key dari pengaturan pengguna.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, action = "generate", userId = DEFAULT_USER_ID } = body;

    const profile: any = db
      .prepare("SELECT opencode_api_key, opencode_base_url, opencode_model FROM profile WHERE user_id = ? LIMIT 1")
      .get(userId);

    const apiKey = profile?.opencode_api_key?.trim();
    const baseUrl = (profile?.opencode_base_url || "https://api.opencode.ai/v1").replace(/\/+$/, "");
    const model = profile?.opencode_model || "opencode/gpt-4o";

    // If user clicks "test_connection"
    if (action === "test") {
      if (!apiKey) {
        return NextResponse.json({
          success: false,
          status: "missing_key",
          message: "API Key OpenCode belum diisi. Masukkan API Key Anda pada pengaturan terlebih dahulu.",
        });
      }

      try {
        const testRes = await fetch(`${baseUrl}/models`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (testRes.ok) {
          return NextResponse.json({
            success: true,
            status: "connected",
            message: "Koneksi ke OpenCode AI API berhasil diverifikasi!",
          });
        } else {
          return NextResponse.json({
            success: false,
            status: "error",
            message: `OpenCode mengembalikan kode status ${testRes.status}. Periksa kembali Base URL dan API Key.`,
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          status: "network_error",
          message: `Gagal menghubungi endpoint OpenCode (${baseUrl}): ${err.message}`,
        });
      }
    }

    // Default generate action
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        status: "missing_key",
        message: "API Key OpenCode belum diisi.",
      }, { status: 400 });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({
        success: false,
        error: `OpenCode API error: ${response.status} ${errText}`,
      }, { status: response.status });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      content: reply,
      model,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
