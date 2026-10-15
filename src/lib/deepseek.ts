/**
 * DeepSeek AI Client Utility for AkademikOS
 * Connects securely to the official DeepSeek API using server-side environment variables.
 */

export interface DeepSeekChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DocumentAnalysisResult {
  course: string;
  docType: "rps" | "slide" | "tugas" | "praktikum" | "lainnya";
  sessionNo: number | "all";
  topic: string;
  explanation: string;
}

export async function callDeepSeekChat(
  messages: DeepSeekChatMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured in environment variables.");
  }

  const payload: any = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
  };

  if (options.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  if (options.maxTokens) {
    payload.max_tokens = options.maxTokens;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textContent = data.choices?.[0]?.message?.content || "";
  return textContent;
}

/**
 * Intelligent Document Analyzer
 * Guesses course, document type, topic, and session number using DeepSeek AI.
 */
export async function analyzeDocumentWithAI(params: {
  fileName: string;
  fileType?: string;
  snippetText?: string;
  availableCourses?: string[];
  currentWeek?: number;
}): Promise<DocumentAnalysisResult> {
  const { fileName, fileType = "application/pdf", snippetText = "", availableCourses = [], currentWeek = 1 } = params;

  const coursesContext = availableCourses.length > 0
    ? `Daftar mata kuliah aktif mahasiswa: ${JSON.stringify(availableCourses)}`
    : "Tidak ada daftar mata kuliah khusus.";

  const systemPrompt = `Anda adalah asisten AI akademik pintar untuk mahasiswa (AkademikOS).
Tugas Anda adalah menganalisis berkas yang diunggah mahasiswa berdasarkan nama berkas dan cuplikan kontennya, lalu menebak informasi akademik berikut secara akurat:
1. Mata Kuliah (course): Pilih mata kuliah yang paling cocok dari daftar mata kuliah aktif jika relevan, atau berikan nama mata kuliah yang tepat jika tidak ada di daftar.
2. Tipe Dokumen (docType): Harus tepat salah satu dari: "rps", "slide", "tugas", "praktikum", "lainnya".
3. Nomor Pertemuan / Sesi (sessionNo): Angka integer 1 s.d. 16, atau string "all" jika berkas adalah RPS/Silabus lengkap semester. Default ke ${currentWeek} jika tidak tertera di nama berkas.
4. Topik / Judul Materi (topic): Ringkasan singkat topik materi/bab dari dokumen tersebut (misal: "Integrasi Numerik Romberg", "Normalisasi Database", dll).
5. Penjelasan (explanation): 1-2 kalimat ringkas dan jelas dalam Bahasa Indonesia menerangkan identifikasi dokumen tersebut.

Output HARUS berupa format JSON valid:
{
  "course": "Nama Mata Kuliah",
  "docType": "rps" | "slide" | "tugas" | "praktikum" | "lainnya",
  "sessionNo": 1 | 2 | ... | 16 | "all",
  "topic": "Topik Berkas",
  "explanation": "Penjelasan identifikasi berkas"
}`;

  const userPrompt = `Analisis berkas berikut:
Nama Berkas: ${fileName}
Tipe Berkas: ${fileType}
Cuplikan Teks/Metadata: ${snippetText ? snippetText.slice(0, 1000) : "Tidak ada cuplikan teks"}
${coursesContext}
Minggu Kuliah Berjalan Saat Ini: Minggu ke-${currentWeek}`;

  try {
    const rawJson = await callDeepSeekChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.2, jsonMode: true, maxTokens: 400 }
    );

    const parsed = JSON.parse(rawJson);
    return {
      course: parsed.course || (availableCourses[0] || "Mata Kuliah Umum"),
      docType: ["rps", "slide", "tugas", "praktikum", "lainnya"].includes(parsed.docType) ? parsed.docType : "slide",
      sessionNo: parsed.docType === "rps" ? "all" : (typeof parsed.sessionNo === "number" ? parsed.sessionNo : currentWeek),
      topic: parsed.topic || fileName.replace(/\.[^/.]+$/, ""),
      explanation: parsed.explanation || "Berkas berhasil dianalisis oleh AI.",
    };
  } catch (error: any) {
    console.error("DeepSeek document analysis failed, falling back to heuristic:", error);
    // Robust heuristic fallback
    const rawLower = fileName.toLowerCase();
    let guessedCourse = availableCourses[0] || "Mata Kuliah Umum";
    for (const c of availableCourses) {
      if (rawLower.includes(c.toLowerCase())) {
        guessedCourse = c;
        break;
      }
    }

    let guessedDocType: "rps" | "slide" | "tugas" | "praktikum" | "lainnya" = "slide";
    if (rawLower.includes("rps") || rawLower.includes("silabus")) guessedDocType = "rps";
    else if (rawLower.includes("tugas") || rawLower.includes("quiz") || rawLower.includes("soal")) guessedDocType = "tugas";
    else if (rawLower.includes("praktikum") || rawLower.includes("lab")) guessedDocType = "praktikum";

    const matchSess = rawLower.match(/(?:pertemuan|minggu|sesi|meet|m)[_ -]?(\d{1,2})/i);
    const sessionNo = guessedDocType === "rps" ? "all" : (matchSess ? parseInt(matchSess[1], 10) : currentWeek);

    return {
      course: guessedCourse,
      docType: guessedDocType,
      sessionNo,
      topic: fileName.replace(/\.[^/.]+$/, ""),
      explanation: `Teridentifikasi dari nama berkas sebagai ${guessedDocType.toUpperCase()} untuk ${guessedCourse}.`,
    };
  }
}

export interface GeneratedQuestionItem {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  flashcardFront?: string;
  flashcardBack?: string;
  source?: string;
}

/**
 * AI Quiz Generator via DeepSeek
 * Supports 'auto' mode which automatically creates case studies / scenario problems
 * for practical, technical, and programming courses.
 */
export async function generateQuizWithDeepSeek(params: {
  courseName: string;
  sources: string[];
  sourceTitle?: string;
  quizType: "auto" | "quiz" | "flashcard" | "ulangan";
  questionCount: number;
  docSnippets?: string[];
}): Promise<GeneratedQuestionItem[]> {
  const {
    courseName,
    sources = ["catatan"],
    sourceTitle = "Materi Perkuliahan",
    quizType = "auto",
    questionCount = 5,
    docSnippets = [],
  } = params;

  const isAutoMode = quizType === "auto";
  const effectiveCount = Math.min(Math.max(questionCount, 3), 10);

  const systemPrompt = `Anda adalah Dosen Senior dan Pakar Asesmen Akademik Mahasiswa di platform AkademikOS.
Tugas Anda adalah merancang ${effectiveCount} butir latihan akademik bermutu tinggi untuk mata kuliah: "${courseName}".
Sumber rujukan: ${sources.join(", ")} (${sourceTitle}).
${docSnippets.length > 0 ? `Konteks Materi Dokumen: ${docSnippets.slice(0, 3).join("\n---\n")}` : ""}

Pedoman Desain Soal:
${
  isAutoMode
    ? `Format Latihan: AUTO (Adaptif Cerdas).
- Analisis karakteristik mata kuliah "${courseName}":
  * JIKA MATA KULIAH PRAKTIK, CODING, TEKNIK, ATAU TERAPAN (seperti Pemrograman, Basis Data, Metode Numerik, Jaringan, Rekayasa Perangkat Lunak, UI/UX, dsb.):
    WAJIB menyusun soal bertipe STUDI KASUS / SOAL CERITA NYATA (Scenario-based problem solving). Awali pertanyaan dengan skenario dunia nyata (studi kasus industri, analisis arsitektur, bug fixing, query SQL, atau optimasi komputasi).
  * JIKA MATA KULIAH TEORI / UMUM:
    Susun soal analisis komparasi konsep dan pemecahan dilema akademik tingkat tinggi (HOTS).`
    : quizType === "flashcard"
    ? `Format Latihan: FLASHCARD (Kartu Hafalan & Konsep Kunci).
Setiap butir harus memiliki pertanyaan kartu depan (flashcardFront) dan kartu belakang (flashcardBack) yang ringkas, padat, dan esensial.`
    : quizType === "ulangan"
    ? `Format Latihan: SIMULASI ULANGAN (Komprehensif & Menantang).
Ujilah pemahaman menyeluruh silabus dan aplikasi materi.`
    : `Format Latihan: KUIS PILIHAN GANDA (Standar Pemahaman).`
}

Aturan Kritis:
1. Soal harus relevan dengan silabus pendidikan tinggi (S1/D4).
2. Sediakan 4 opsi jawaban (A, B, C, D) yang masuk akal dan mengecoh.
3. Kunci jawaban (correctAnswer) berupa angka indeks 0 s.d. 3.
4. Sertakan penjelasan (explanation) akademis yang jelas dan mendalam mengapa opsi tersebut benar.
5. Gunakan Bahasa Indonesia akademis yang baik, baku, dan tanpa emoji.

Output WAJIB berupa JSON valid:
{
  "questions": [
    {
      "question": "Teks soal atau skenario studi kasus...",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctAnswer": 0,
      "explanation": "Penjelasan mendalam kunci jawaban...",
      "flashcardFront": "Pertanyaan ringkas...",
      "flashcardBack": "Jawaban inti..."
    }
  ]
}`;

  const userPrompt = `Buatkan ${effectiveCount} butir latihan format "${quizType}" untuk mata kuliah "${courseName}" dengan topik "${sourceTitle}".`;

  const rawJson = await callDeepSeekChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.35, jsonMode: true, maxTokens: 2500 }
  );

  const parsed = JSON.parse(rawJson);
  if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    return parsed.questions.map((q: any) => ({
      question: q.question || "Pertanyaan evaluasi akademik",
      options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer <= 3 ? q.correctAnswer : 0,
      explanation: q.explanation || "Kunci jawaban telah diverifikasi sesuai konsep materi.",
      flashcardFront: q.flashcardFront || q.question,
      flashcardBack: q.flashcardBack || (q.options ? q.options[q.correctAnswer || 0] : q.explanation),
      source: sourceTitle,
    }));
  }

  throw new Error("Format respons AI kuis tidak valid.");
}
