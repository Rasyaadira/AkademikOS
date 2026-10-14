// Google Gemini API Integration for AkademikOS
// Models: gemini-flash-latest, gemini-flash-lite-latest, gemini-3.8-flash

import db, { DEFAULT_USER_ID } from "./db";

const DEFAULT_GEMINI_KEY =
  process.env.GEMINI_API_KEY || "AQ.Ab8RN6KCVOZPSaaZcgHxIli8tOGdN8bR9tkJSLjlNNdg2gy0pQ";

const CANDIDATE_MODELS = [
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
];

interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string; // base64
  };
}

interface TextPart {
  text: string;
}

type ContentPart = TextPart | InlineDataPart;

export async function callGemini(
  parts: ContentPart[],
  options: {
    apiKey?: string;
    responseMimeType?: string;
    temperature?: number;
  } = {}
): Promise<string> {
  const apiKey = options.apiKey || DEFAULT_GEMINI_KEY;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload: any = {
        contents: [
          {
            parts,
          },
        ],
      };

      if (options.responseMimeType) {
        payload.generationConfig = {
          responseMimeType: options.responseMimeType,
        };
      }

      if (typeof options.temperature === "number") {
        payload.generationConfig = {
          ...payload.generationConfig,
          temperature: options.temperature,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        // If 503 (high load), 404, or 429, try next candidate model
        if (res.status === 503 || res.status === 404 || res.status === 429) {
          lastError = new Error(`Model ${model} (${res.status}): ${errorText.slice(0, 100)}`);
          continue;
        }
        throw new Error(`Gemini API Error (${res.status}): ${errorText.slice(0, 200)}`);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      // Catat penggunaan token ke database
      if (data.usageMetadata?.totalTokenCount) {
        try {
          db.prepare(
            "UPDATE profile SET ai_token_usage = COALESCE(ai_token_usage, 0) + ? WHERE user_id = ?"
          ).run(data.usageMetadata.totalTokenCount, DEFAULT_USER_ID);
        } catch (e) {
          console.warn("Gagal mencatat pemakaian token AI:", e);
        }
      }

      if (!text) {
        throw new Error("Tidak ada respon teks dari model Gemini");
      }

      return text;
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("Semua model Gemini gagal merespons.");
}

export interface ExtractedCourseSchedule {
  course: string;
  day: "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu" | "minggu";
  startTime: string; // "07.30"
  endTime: string; // "10.50"
  room?: string;
  lecturer?: string;
  sks?: number;
}

/**
 * Ekstraksi jadwal kuliah dari teks dokumen atau base64 gambar
 */
export async function extractScheduleWithGemini(
  content: string,
  options: {
    className?: string;
    semesterYear?: string;
    isImageBase64?: boolean;
    mimeType?: string;
  } = {}
): Promise<ExtractedCourseSchedule[]> {
  const parts: ContentPart[] = [];

  const targetClass = options.className || "";
  const targetSemester = options.semesterYear || "";

  const promptText = `
Anda adalah asisten AI ekstraksi jadwal perkuliahan.
Tugas Anda adalah membaca data jadwal perkuliahan (dari gambar atau teks) dan mengekstrak semua mata kuliah menjadi JSON array.
${targetClass ? `Fokuskan ekstraksi pada kelas: "${targetClass}".` : "Ekstrak semua mata kuliah yang tertera."}
${targetSemester ? `Semester / Tahun: "${targetSemester}".` : ""}

ATURAN STRUKTUR JSON:
1. Kembalikan array of objects JSON murni dengan format:
[
  {
    "course": "Nama Mata Kuliah",
    "day": "senin",
    "startTime": "07.30",
    "endTime": "10.50",
    "room": "Ruang",
    "lecturer": "Dosen"
  }
]
2. "day" HARUS salah satu dari (huruf kecil): "senin", "selasa", "rabu", "kamis", "jumat", "sabtu".
3. "startTime" dan "endTime" HARUS format jam "HH.MM" (contoh: "07.30", "08.00", "10.50", "13.20", "15.00").
4. Jika jam kuliah bersambung di hari yang sama untuk mata kuliah yang sama, gabungkan menjadi satu sesi (misal 07.30 s.d 10.50).
5. HANYA kembalikan JSON array valid. Tanpa markdown ticks, tanpa teks pendahuluan.
`;

  if (options.isImageBase64 && options.mimeType) {
    parts.push({
      inlineData: {
        mimeType: options.mimeType,
        data: content,
      },
    });
    parts.push({ text: promptText });
  } else {
    parts.push({
      text: `${promptText}\n\n=== DOKUMEN JADWAL ===\n${content}`,
    });
  }

  const rawResponse = await callGemini(parts, {
    temperature: 0.1,
    responseMimeType: "application/json",
  });

  // Robust JSON Extraction (catch arrays or objects with array properties)
  try {
    let clean = rawResponse.trim();
    const arrayMatch = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      clean = arrayMatch[0];
    } else {
      clean = clean.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const parsed = JSON.parse(clean);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed.schedules || parsed.courses || parsed.data || [];

    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any) => ({
        course: String(item.course || item.name || item.mataKuliah || "Mata Kuliah").trim(),
        day: (String(item.day || item.hari || "senin").toLowerCase().trim() as any),
        startTime: String(item.startTime || item.jamMulai || item.start || "08.00").trim().replace(":", "."),
        endTime: String(item.endTime || item.jamSelesai || item.end || "10.00").trim().replace(":", "."),
        room: item.room || item.ruang || item.ruangan ? String(item.room || item.ruang || item.ruangan).trim() : undefined,
        lecturer: item.lecturer || item.dosen ? String(item.lecturer || item.dosen).trim() : undefined,
        sks: item.sks ? Number(item.sks) : undefined,
      }));
    }
    return [];
  } catch (err: any) {
    console.error("Gagal parse JSON dari respon Gemini:", rawResponse);
    throw new Error("Gagal membaca struktur jadwal dari respon AI.");
  }
}
