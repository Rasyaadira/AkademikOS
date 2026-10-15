/**
 * OpenCode AI API Adapter with Local Fallback for AkademikOS
 * Supports OpenAI-compatible endpoints (https://api.opencode.ai/v1, OpenCode models, etc.)
 */

export interface OpenCodeConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface QuizGenerationParams {
  courseName: string;
  sources: string[];
  sourceTitle: string;
  quizType: "quiz" | "flashcard" | "ulangan";
  questionCount: number;
  config?: OpenCodeConfig;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  flashcardFront?: string;
  flashcardBack?: string;
  source?: string;
}

export function isOpenCodeConfigured(apiKey?: string): boolean {
  return typeof apiKey === "string" && apiKey.trim().length > 5;
}

export async function generateQuizWithOpenCode(
  params: QuizGenerationParams
): Promise<{ success: boolean; questions?: GeneratedQuestion[]; provider: "opencode" | "local_offline"; error?: string }> {
  const { courseName, sources, sourceTitle, quizType, questionCount, config } = params;
  const apiKey = config?.apiKey || process.env.OPENCODE_API_KEY || "";
  const baseUrl = (config?.baseUrl || process.env.OPENCODE_BASE_URL || "https://api.opencode.ai/v1").replace(/\/+$/, "");
  const model = config?.model || process.env.OPENCODE_MODEL || "opencode/gpt-4o";

  if (!isOpenCodeConfigured(apiKey)) {
    return {
      success: false,
      provider: "local_offline",
      error: "OpenCode API Key belum disetel. Beralih ke bank materi lokal AkademikOS.",
    };
  }

  const promptSystem = `Anda adalah asisten dosen AI ahli dalam kurikulum Teknik Informatika perguruan tinggi Indonesia. 
Tugas Anda adalah menghasilkan soal kuis dan kartu flashcard akademik berkualitas tinggi, akurat secara konsep, dan edukatif berdasarkan silabus mata kuliah.`;

  const promptUser = `Buatkan ${questionCount} butir ${
    quizType === "flashcard" ? "kartu flashcard" : quizType === "ulangan" ? "soal simulasi ujian komprehensif" : "soal kuis pilihan ganda"
  } untuk mata kuliah: "${courseName}".
Sumber materi: ${sources.join(", ")} (Spesifik: ${sourceTitle}).

Format output WAJIB HANYA berupa JSON array valid tanpa pembungkus markdown (tanpa \`\`\`json):
[
  {
    "id": "q-1",
    "question": "Pertanyaan berbobot konseptual...",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
    "correctAnswer": 0,
    "explanation": "Penjelasan ilmiah mendalam mengenai jawaban yang benar...",
    "flashcardFront": "Istilah Utama / Pertanyaan Ringkas",
    "flashcardBack": "Definisi padat atau rumus yang harus dihafal",
    "source": "${courseName} - ${sourceTitle}"
  }
]
Ketentuan:
- correctAnswer adalah index integer 0-3 yang menunjuk opsi yang tepat.
- Pilihan ganda harus memiliki 4 opsi yang masuk akal dan menantang (tidak ada opsi 'semua benar').
- Bahasa Indonesia baku akademis.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        provider: "local_offline",
        error: `OpenCode API Error (${response.status}): ${errText.substring(0, 120)}`,
      };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Clean JSON markdown fences if present
    const cleaned = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const questions: GeneratedQuestion[] = JSON.parse(cleaned);

    if (Array.isArray(questions) && questions.length > 0) {
      return {
        success: true,
        provider: "opencode",
        questions: questions.map((q, idx) => ({
          id: `opencode-q-${Date.now()}-${idx + 1}`,
          question: q.question,
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["Benar", "Salah"],
          correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
          explanation: q.explanation || "Pembahasan materi kuliah.",
          flashcardFront: q.flashcardFront || q.question.substring(0, 50),
          flashcardBack: q.flashcardBack || q.explanation,
          source: q.source || `${courseName} (OpenCode AI)`,
        })),
      };
    }

    return {
      success: false,
      provider: "local_offline",
      error: "Gagal memproses respon JSON dari OpenCode AI.",
    };
  } catch (error: any) {
    return {
      success: false,
      provider: "local_offline",
      error: error.name === "AbortError" ? "Request timeout ke OpenCode API." : error.message,
    };
  }
}
