import { NextResponse } from "next/server";
import db, { DEFAULT_USER_ID } from "@/lib/db";

// Helper knowledge bank for smart generation based on academic topics
const KNOWLEDGE_BANK: Record<string, Array<{ q: string; opts: string[]; ans: number; exp: string; term: string; def: string }>> = {
  "metode numerik": [
    {
      q: "Manakah metode pencarian akar persamaan non-linier yang menjamin selalu konvergen selama interval awal mengurung akar?",
      opts: ["Metode Newton-Raphson", "Metode Biseksi (Bisection)", "Metode Secant", "Metode Iterasi Titik Tetap"],
      ans: 1,
      exp: "Metode Biseksi selalu konvergen karena menggunakan prinsip teorema nilai antara dengan membagi dua interval secara konsisten.",
      term: "Metode Biseksi (Bisection)",
      def: "Metode pengurung akar persamaan f(x)=0 dengan membagi interval [a, b] menjadi dua bagian sama besar secara iteratif."
    },
    {
      q: "Kelemahan utama dari metode Newton-Raphson dalam mencari akar persamaan f(x) = 0 adalah...",
      opts: ["Konvergensi lambat linier", "Memerlukan turunan pertama f'(x) yang tidak boleh bernilai nol", "Tidak bisa digunakan untuk fungsi polinom", "Selalu membutuhkan 3 tebakan awal"],
      ans: 1,
      exp: "Rumus Newton-Raphson adalah x_{n+1} = x_n - f(x_n)/f'(x_n). Jika f'(x_n) = 0, terjadi pembagian dengan nol.",
      term: "Konvergensi Newton-Raphson",
      def: "Metode terbuka dengan laju konvergensi kuadratik, membutuhkan turunan f'(x) kontinu dan tebakan awal cukup dekat dengan akar."
    },
    {
      q: "Metode eliminasi Gauss dengan tata ancang poros (partial pivoting) bertujuan untuk mengatasi...",
      opts: ["Waktu komputasi yang lambat", "Pembagian dengan elemen poros bernilai nol atau sangat kecil", "Kebutuhan memori matriks yang besar", "Keterbatasan matriks non-persegi"],
      ans: 1,
      exp: "Pivoting menukar baris agar elemen diagonal memiliki nilai mutlak terbesar guna meminimalkan galat pembulatan (round-off error).",
      term: "Pivoting Parsial Gauss",
      def: "Teknik memilih elemen berbobot mutlak terbesar pada kolom sebagai pivot untuk mencegah pembagian dengan nilai mendekati nol."
    },
    {
      q: "Pada integrasi numerik aturan Simpson 1/3, kurva fungsi f(x) dihampiri oleh...",
      opts: ["Garis lurus (polinom derajat 1)", "Parabola (polinom kuadrat derajat 2)", "Polinom kubik derajat 3", "Fungsi eksponensial"],
      ans: 1,
      exp: "Aturan Simpson 1/3 menggunakan polinom interpolasi kuadrat yang menghubungkan 3 titik data berjarak sama.",
      term: "Aturan Simpson 1/3",
      def: "Metode integrasi numerik berorde galat O(h^4) yang menghampiri luasan di bawah kurva dengan segmen parabola."
    },
    {
      q: "Metode Runge-Kutta Orde 4 (RK4) sering digunakan untuk menyelesaikan...",
      opts: ["Sistem Persamaan Linier", "Persamaan Diferensial Biasa (PDB)", "Interpolasi Polinom", "Optimasi Tanpa Kendala"],
      ans: 1,
      exp: "RK4 adalah metode satu langkah paling populer untuk menyelesaikan Masalah Nilai Awal pada Persamaan Diferensial Biasa.",
      term: "Metode Runge-Kutta 4",
      def: "Metode numerik PDB dengan ketelitian tinggi berorde galat O(h^5) tanpa perlu menghitung turunan tingkat tinggi secara analitik."
    }
  ],
  "basis data": [
    {
      q: "Bentuk Normalisasi Ketiga (3NF) mensyaratkan bahwa relasi sudah berada dalam 2NF dan tidak memiliki...",
      opts: ["Ketergantungan Parsial", "Ketergantungan Transitif antar atribut non-kunci", "Atribut bernilai ganda", "Kunci tamu (Foreign Key) ganda"],
      ans: 1,
      exp: "3NF mengharuskan tidak adanya ketergantungan transitif X -> Y dan Y -> Z di mana X adalah superkey.",
      term: "Bentuk Normal Ketiga (3NF)",
      def: "Kondisi tabel relasional di mana setiap atribut non-kunci hanya bergantung langsung pada primary key (tidak ada ketergantungan transitif)."
    },
    {
      q: "Karakteristik ACID pada sistem manajemen basis data yang menjamin transaksi tuntas secara penuh atau batal sama sekali adalah...",
      opts: ["Atomicity", "Consistency", "Isolation", "Durability"],
      ans: 0,
      exp: "Atomicity ('All or Nothing') menjamin seluruh operasi dalam transaksi berhasil dieksekusi atau semuanya di-rollback jika terjadi kegagalan.",
      term: "Atomicity (ACID)",
      def: "Prinsip bahwa sebuah transaksi basis data adalah unit kerja tunggal yang tidak dapat dibagi: semua berhasil atau semua dibatalkan."
    },
    {
      q: "Struktur data indeks yang paling umum digunakan pada basis data relasional untuk mempercepat query rentang (range search) adalah...",
      opts: ["Hash Table", "B+ Tree", "Binary Search Tree", "Linked List"],
      ans: 1,
      exp: "B+ Tree menyimpan seluruh data pada daun (leaf nodes) yang saling terhubung berurutan, sangat optimal untuk range scan.",
      term: "Indeks B+ Tree",
      def: "Pohon pencarian seimbang multi-cabang yang efisien untuk operasi baca disk, penyortiran, dan pencarian rentang nilai."
    },
    {
      q: "Klausa SQL yang digunakan untuk memfilter baris hasil setelah dilakukan pengelompokan (GROUP BY) adalah...",
      opts: ["WHERE", "HAVING", "ORDER BY", "FILTER"],
      ans: 1,
      exp: "WHERE memfilter baris sebelum agregasi, sedangkan HAVING memfilter grup data hasil fungsi agregasi (COUNT, SUM, AVG).",
      term: "Klausa HAVING",
      def: "Filter pasca-agregasi dalam SQL yang bekerja pada kelompok baris (grup) yang dihasilkan klausa GROUP BY."
    }
  ],
  "desain ui/ux": [
    {
      q: "Hukum UX yang menyatakan bahwa waktu yang dibutuhkan untuk mencapai target berbanding lurus dengan jarak dan berbanding terbalik dengan ukuran target adalah...",
      opts: ["Hick's Law", "Fitts's Law", "Miller's Law", "Jakob's Law"],
      ans: 1,
      exp: "Fitts's Law memodelkan gerakan manusia menuju target UI: tombol yang lebih besar dan lebih dekat lebih cepat diklik.",
      term: "Fitts's Law",
      def: "Prinsip ergonomi antarmuka: target interaksi harus memiliki ukuran tap/click yang cukup dan mudah dijangkau pengguna."
    },
    {
      q: "Dalam standar aksesibilitas WCAG 2.2 Level AA, rasio kontras minimum antara teks normal dan latar belakang adalah...",
      opts: ["3.0:1", "4.5:1", "7.0:1", "2.5:1"],
      ans: 1,
      exp: "WCAG 2.2 AA mewajibkan rasio kontras minimal 4.5:1 untuk teks standar (< 18pt) dan 3.0:1 untuk teks besar.",
      term: "Rasio Kontras WCAG AA",
      def: "Kebutuhan rasio kecerahan warna minimal 4.5:1 untuk memastikan keterbacaan antarmuka bagi pengguna dengan gangguan penglihatan."
    },
    {
      q: "Tahapan pertama dalam metodologi Design Thinking yang berfokus pada memahami kebutuhan dan kendala pengguna secara mendalam adalah...",
      opts: ["Define", "Empathize", "Ideate", "Prototype"],
      ans: 1,
      exp: "Empathize melibatkan wawancara, observasi langsung, dan pembuatan persona untuk merasakan masalah yang dialami pengguna.",
      term: "Tahap Empathize",
      def: "Fase observasi dan empati mendalam terhadap perilaku, kebiasaan, dan frustrasi pengguna sebelum merumuskan solusi."
    }
  ],
  "sistem operasi": [
    {
      q: "Kondisi di mana sekelompok proses saling menunggu sumber daya yang sedang ditahan oleh proses lain tanpa ada yang bisa berjalan disebut...",
      opts: ["Starvation", "Deadlock", "Race Condition", "Thrashing"],
      ans: 1,
      exp: "Deadlock terjadi jika 4 syarat Coffman terpenuhi: Mutual Exclusion, Hold & Wait, No Preemption, dan Circular Wait.",
      term: "Deadlock",
      def: "Situasi kebuntuan permanen sistem saat dua atau lebih proses saling menunggu pelepasan resource secara melingkar."
    },
    {
      q: "Fenomena di mana sistem operasi menghabiskan sebagian besar waktu CPU untuk melakukan swapping halaman memori daripada mengeksekusi instruksi disebut...",
      opts: ["Paging Fragmentation", "Thrashing", "Deadlock", "Context Switching"],
      ans: 1,
      exp: "Thrashing terjadi saat alokasi frame memori fisik tidak mencukupi working set proses, menyebabkan page fault berulang kali.",
      term: "Thrashing",
      def: "Penurunan performa drastis sistem karena tingkat page fault yang sangat tinggi dan aktivitas transfer I/O swap yang berlebihan."
    }
  ]
};

// Fallback general computer science questions
const GENERAL_CS_QUESTIONS = [
  {
    q: "Kompleksitas waktu rata-rata (average time complexity) dari algoritma pengurutan Quicksort adalah...",
    opts: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
    ans: 1,
    exp: "Quicksort rata-rata membagi array menjadi dua bagian log n kali dengan partisi linear O(n), menghasilkan O(n log n).",
    term: "Kompleksitas Quicksort",
    def: "Algoritma Divide and Conquer dengan efisiensi O(n log n) rata-rata dan O(n^2) pada skenario terburuk jika pivot tidak seimbang."
  },
  {
    q: "Protokol transport internet yang berorientasi koneksi (connection-oriented) dan menjamin pengiriman paket secara andal serta berurutan adalah...",
    opts: ["UDP", "TCP", "IP", "ICMP"],
    ans: 1,
    exp: "TCP (Transmission Control Protocol) menggunakan 3-way handshake dan mekanisme ACK untuk memastikan keandalan transmisi.",
    term: "Protokol TCP",
    def: "Protokol layer transport andal yang menjamin urutan data dan pencegahan duplikasi paket melalui kendali aliran dan kongesti."
  },
  {
    q: "Dalam pemrograman berorientasi objek (OOP), kemampuan objek untuk memiliki banyak bentuk melalui overriding metode disebut...",
    opts: ["Encapsulation", "Polymorphism", "Inheritance", "Abstraction"],
    ans: 1,
    exp: "Polimorfisme memungkinkan objek turunan memberikan implementasi spesifik dari metode yang didefinisikan pada kelas induk.",
    term: "Polymorphism (OOP)",
    def: "Prinsip OOP di mana antarmuka yang sama dapat diimplementasikan dengan perilaku yang berbeda oleh kelas-kelas turunan."
  },
  {
    q: "Prinsip SOLID dalam rekayasa perangkat lunak huruf 'S' mewakili...",
    opts: ["Shared Responsibility Principle", "Single Responsibility Principle", "Scope Isolation Principle", "Static Typing Principle"],
    ans: 1,
    exp: "Single Responsibility Principle (SRP) menyatakan bahwa satu kelas hanya boleh memiliki satu alasan untuk berubah.",
    term: "Single Responsibility Principle",
    def: "Prinsip desain bahwa setiap modul, kelas, atau fungsi harus bertanggung jawab hanya atas satu bagian fungsionalitas sistem."
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;
    const courseId = searchParams.get("courseId");

    let query = "SELECT * FROM ai_quizzes WHERE user_id = ?";
    const params: any[] = [userId];

    if (courseId) {
      query += " AND course_id = ?";
      params.push(courseId);
    }

    query += " ORDER BY created_at DESC";
    const quizzes = db.prepare(query).all(...params);
    const now = Date.now();

    const parsed = quizzes.map((q: any) => {
      let questions = [];
      try {
        questions = JSON.parse(q.questions_json || "[]");
      } catch {}

      let sessionState = null;
      try {
        if (q.session_state) {
          sessionState = typeof q.session_state === "string" ? JSON.parse(q.session_state) : q.session_state;
        }
      } catch {}

      const expiresAt = q.expires_at || null;
      const isExpired = expiresAt ? now > new Date(expiresAt).getTime() : false;
      const daysRemaining = expiresAt
        ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / (24 * 60 * 60 * 1000)))
        : 7;

      return {
        id: q.id,
        courseId: q.course_id,
        materialId: q.material_id,
        title: q.title,
        score: q.score,
        totalQuestions: q.total_questions,
        quizType: q.quiz_type || "quiz",
        sourceType: q.source_type || "catatan",
        sourceTitle: q.source_title || "",
        status: q.status || "in_progress",
        sessionState,
        expiresAt,
        isExpired,
        daysRemaining,
        createdAt: q.created_at,
        questions,
      };
    });

    return NextResponse.json({ quizzes: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = DEFAULT_USER_ID,
      courseName = "Umum",
      sources = ["catatan"],
      sourceType = "catatan",
      sourceTitle = "Catatan Kuliah",
      quizType = "quiz",
      questionCount = 5,
    } = body;

    // Resolve course_id
    let courseRow: any = db.prepare("SELECT id, name FROM courses WHERE name LIKE ? LIMIT 1").get(`%${courseName}%`);
    if (!courseRow) {
      courseRow = db.prepare("SELECT id, name FROM courses LIMIT 1").get();
    }
    const courseId = courseRow?.id || "course-general";

    // Match questions from knowledge bank
    const lowerCourse = courseName.toLowerCase();
    const matchedBankKey = Object.keys(KNOWLEDGE_BANK).find((k) => lowerCourse.includes(k) || lowerCourse.includes(k.split(" ")[0]));
    const bank = matchedBankKey ? KNOWLEDGE_BANK[matchedBankKey] : GENERAL_CS_QUESTIONS;

    // Build question items combining selected sources
    const selectedItems = [...bank, ...GENERAL_CS_QUESTIONS].slice(0, Math.min(questionCount, 10));
    const activeSources = Array.isArray(sources) && sources.length > 0 ? sources : [sourceType || "catatan"];

    const generatedQuestions = selectedItems.map((item, idx) => {
      const sourceForThisQ = activeSources[idx % activeSources.length];
      const sourceLabelMap: Record<string, string> = {
        catatan: "Catatan Kuliah",
        tugas: "Tugas Kuliah",
        rps: "RPS Silabus",
        prediksi: "Prediksi Ujian",
      };
      const label = sourceLabelMap[sourceForThisQ] || "Materi Kuliah";

      return {
        id: `q-${idx + 1}`,
        question: item.q,
        options: item.opts,
        correctAnswer: item.ans,
        explanation: item.exp,
        flashcardFront: item.term,
        flashcardBack: `${item.def}\n\nCatatan: ${item.exp}`,
        source: `${label} - ${courseName}`,
      };
    });

    const quizId = `quiz-${Date.now()}`;
    const displayQuizType = quizType === "flashcard" ? "Flashcards" : quizType === "ulangan" ? "Simulasi Ulangan" : "Quiz";
    const quizTitle = `${displayQuizType}: ${courseName} (${sourceTitle})`;

    // 7 days expiration from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const initialSessionState = JSON.stringify({
      currentQIndex: 0,
      selectedAnswers: {},
      showAnswer: {},
      isFlipped: false,
      flashcardMastered: {},
    });

    const primarySource = activeSources.join(", ");

    db.prepare(`
      INSERT INTO ai_quizzes (
        id, user_id, course_id, title, score, total_questions, questions_json, status, quiz_type, source_type, source_title, session_state, expires_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      quizId,
      userId,
      courseId,
      quizTitle,
      0,
      generatedQuestions.length,
      JSON.stringify(generatedQuestions),
      "in_progress",
      quizType,
      primarySource,
      sourceTitle,
      initialSessionState,
      expiresAt
    );

    return NextResponse.json({
      success: true,
      quiz: {
        id: quizId,
        title: quizTitle,
        quizType,
        sourceType: primarySource,
        sourceTitle,
        totalQuestions: generatedQuestions.length,
        questions: generatedQuestions,
        status: "in_progress",
        sessionState: JSON.parse(initialSessionState),
        expiresAt,
        daysRemaining: 7,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, score, status, sessionState } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
    }

    const serializedState = sessionState ? (typeof sessionState === "string" ? sessionState : JSON.stringify(sessionState)) : null;

    if (score !== undefined && status !== undefined && serializedState) {
      db.prepare(`
        UPDATE ai_quizzes
        SET score = ?, status = ?, session_state = ?
        WHERE id = ?
      `).run(score, status, serializedState, id);
    } else if (score !== undefined && status !== undefined) {
      db.prepare(`
        UPDATE ai_quizzes
        SET score = ?, status = ?
        WHERE id = ?
      `).run(score, status, id);
    } else if (status !== undefined && serializedState) {
      db.prepare(`
        UPDATE ai_quizzes
        SET status = ?, session_state = ?
        WHERE id = ?
      `).run(status, serializedState, id);
    } else if (serializedState) {
      db.prepare(`
        UPDATE ai_quizzes
        SET session_state = ?
        WHERE id = ?
      `).run(serializedState, id);
    }

    return NextResponse.json({ success: true, id, score, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing quiz id" }, { status: 400 });
    }

    db.prepare("DELETE FROM ai_quizzes WHERE id = ?").run(id);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
