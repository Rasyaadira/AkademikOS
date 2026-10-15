const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/akademikos.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const ELEARNING_HTML_PATH = '/home/rasaaa/Collage life/Semester 3/UIUX/Quiz 1_ Reviu pengerjaan kuis _ eLearning.html';

// 1. Extract 20 authentic questions from eLearning HTML
function extractAuthenticElearningQuestions() {
  if (!fs.existsSync(ELEARNING_HTML_PATH)) {
    console.warn('⚠️ eLearning HTML file not found at:', ELEARNING_HTML_PATH);
    return [];
  }

  const html = fs.readFileSync(ELEARNING_HTML_PATH, 'utf-8');
  const blocks = html.match(/<div id="question-[^"]+"[\s\S]*?(?=<div id="question-|\Z)/g) || [];
  const parsed = [];

  const explanations = [
    "Operator INTERSECT mengembalikan perpotongan (irisan) baris yang muncul di kedua query. Query kiri menghasilkan {1, 2}, query kanan menghasilkan {2, 3}. Irisannya adalah 2.",
    "Operator perbandingan skalar seperti =, <, >, <=, >=, != hanya dapat digunakan dengan single-row subquery (subquery yang mengembalikan tepat satu nilai/baris).",
    "UNION ALL menggabungkan seluruh baris dari kedua himpunan tanpa mengeliminasi duplikasi. Masing-masing menghasilkan {2}, sehingga hasilnya dua baris bernilai 2.",
    "Kondisi NILAI > ALL (2, 4, 6) berarti nilai harus lebih besar dari SEMUA elemen, yang setara dengan lebih besar dari nilai maksimumnya (NILAI > 6).",
    "Klausul WHERE IPK >= 3.50 memfilter mahasiswa dengan nilai IPK minimal 3.50 (inklusif).",
    "Fungsi agregat MAX(kolom) digunakan dalam SQL untuk mencari nilai terbesar dari suatu kolom.",
    "Pola '%i' pada operator LIKE mencocokkan string apa pun yang diakhiri dengan karakter 'i'.",
    "Operator UNION menggabungkan baris dan secara otomatis mengeliminasi baris duplikat, sehingga hasilnya hanya satu baris bernilai 1.",
    "Klausa GROUP BY KODE_PRODI mengelompokkan data berdasarkan prodi dan COUNT(*) menghitung total baris untuk masing-masing grup prodi.",
    "Dalam sintaks gabungan UNION / INTERSECT / MINUS, klausul ORDER BY hanya boleh diletakkan satu kali di akhir query gabungan secara keseluruhan.",
    "NOT IN (subquery) mengembalikan baris yang nilainya tidak cocok dengan elemen apa pun dalam himpunan hasil subquery.",
    "Kata kunci DISTINCT mengeliminasi duplikasi nilai kolom dalam hasil SELECT sehingga setiap nilai hanya muncul satu kali.",
    "Perintah UPDATE nama_tabel SET kolom = nilai WHERE kondisi digunakan untuk memodifikasi baris yang memenuhi kriteria.",
    "LEFT OUTER JOIN memastikan seluruh baris dari tabel sisi kiri tetap ditampilkan meskipun tidak memiliki pasangan yang cocok di tabel kanan (diisi NULL).",
    "Subquery (SELECT AVG(GAJI) FROM PEGAWAI) menghasilkan nilai rata-rata 5.000.000, sehingga kondisi GAJI > ... memilih pegawai bergaji di atas nilai tersebut.",
    "Subquery dalam klausa WHERE dengan operator IN memfilter baris mahasiswa yang KODE_PRODI-nya termasuk dalam daftar prodi yang berstatus AKTIF.",
    "Operator MINUS (atau EXCEPT) mengembalikan himpunan baris di query pertama yang tidak ada di query kedua: {10, 20, 30} MINUS {20, 40} = {10, 30}.",
    "Perintah DELETE FROM tabel WHERE kondisi digunakan untuk menghapus baris spesifik tanpa menghapus struktur tabel.",
    "Sintaks standar INSERT INTO tabel (kolom1, kolom2) VALUES (nilai1, nilai2) digunakan untuk menyisipkan data baru.",
    "Sintaks proyeksi standar SQL adalah SELECT nama_kolom1, nama_kolom2 FROM nama_tabel;"
  ];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const qtextMatch = block.match(/<div class="qtext">([\s\S]*?)<\/div>\s*<fieldset/);
    if (!qtextMatch) continue;

    let qtext = qtextMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const ansDivs = block.match(/<div class="r[01][^"]*">([\s\S]*?)<\/div>\s*(?=<div class="r[01]|\Z)/g) || [];
    const options = [];
    let correctIdx = 0;

    for (let optIdx = 0; optIdx < ansDivs.length; optIdx++) {
      const optHtml = ansDivs[optIdx];
      const textMatch = optHtml.match(/<div class="flex-fill ms-1">([\s\S]*?)<\/div>/);
      let optText = textMatch ? textMatch[1] : optHtml;
      optText = optText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      options.push(optText);

      if (optHtml.includes('correct')) {
        correctIdx = optIdx;
      }
    }

    parsed.push({
      id: `q-pbd-${i + 1}`,
      question: qtext,
      options: options,
      correctAnswer: correctIdx,
      explanation: explanations[i] || "Konsep query SQL relasional standar.",
      flashcardFront: qtext.length > 60 ? qtext.substring(0, 57) + '...' : qtext,
      flashcardBack: `Jawaban: ${options[correctIdx]}\n\nPenjelasan: ${explanations[i]}`,
      source: "Catatan Kuliah & Latihan E-Learning - Pemrograman Basis Data"
    });
  }

  return parsed;
}

// 2. High-quality questions for other courses
const COURSE_QUIZZES_SEED = [
  {
    courseId: "ai-3",
    courseName: "Kecerdasan Buatan",
    quizTitle: "Quiz: Fondasi Kecerdasan Buatan & Agen Cerdas",
    quizType: "quiz",
    sourceType: "catatan",
    sourceTitle: "Slide Pengantar AI & Agen Cerdas",
    questions: [
      {
        id: "q-ai-1",
        question: "Dalam definisi AI menurut Russell & Norvig, pendekatan yang paling ideal dan pragmatis untuk implementasi sistem modern adalah...",
        options: ["Thinking Humanly", "Acting Humanly (Turing Test)", "Thinking Rationally", "Acting Rationally (Rational Agent)"],
        correctAnswer: 3,
        explanation: "Modern AI berpusat pada Acting Rationally (Agen Rasional) yang bertindak untuk memaksimalkan ukuran kinerja yang diharapkan (expected performance measure).",
        flashcardFront: "Rational Agent (Agen Rasional)",
        flashcardBack: "Entitas yang mempersepsi lingkungannya melalui sensor dan bertindak melalui aktuator untuk memaksimalkan utilitas atau ukuran kinerja yang diharapkan.",
        source: "Slide Agen Cerdas - Kecerdasan Buatan"
      },
      {
        id: "q-ai-2",
        question: "Framework PEAS yang digunakan untuk mendeskripsikan lingkungan tugas seorang agen cerdas merupakan singkatan dari...",
        options: [
          "Performance, Environment, Actuators, Sensors",
          "Program, Execution, Action, State",
          "Perception, Entity, Architecture, System",
          "Process, Environment, Analysis, Strategy"
        ],
        correctAnswer: 0,
        explanation: "PEAS merupakan akronim dari Performance measure, Environment, Actuators, dan Sensors.",
        flashcardFront: "PEAS Framework",
        flashcardBack: "Singkatan dari Performance, Environment, Actuators, Sensors; kerangka kerja untuk mendefinisikan domain masalah agen cerdas.",
        source: "Slide Agen Cerdas - Kecerdasan Buatan"
      },
      {
        id: "q-ai-3",
        question: "Algoritma pencarian Breadth-First Search (BFS) menjamin solusi optimal dengan syarat...",
        options: [
          "Fungsi heuristik bernilai admissible",
          "Biaya setiap langkah (step cost) adalah konstan sama",
          "Graf tidak memiliki siklus (cycle)",
          "Ruang keadaan berukuran berhingga (finite)"
        ],
        correctAnswer: 1,
        explanation: "BFS menjamin menemukan solusi dengan lintasan terpendek (shallowest goal node). Jika semua step cost bernilai sama, solusi tersebut juga bernilai optimal biaya.",
        flashcardFront: "BFS (Breadth-First Search)",
        flashcardBack: "Strategi uninformed search yang mengeksplorasi graf lapis demi lapis menggunakan struktur antrean FIFO; optimal jika semua biaya langkah bernilai sama.",
        source: "Slide Problem Solving by Searching - Kecerdasan Buatan"
      },
      {
        id: "q-ai-4",
        question: "Fungsi evaluasi f(n) pada algoritma pencarian A* didefinisikan sebagai...",
        options: ["f(n) = g(n) - h(n)", "f(n) = g(n) + h(n)", "f(n) = g(n) * h(n)", "f(n) = max(g(n), h(n))"],
        correctAnswer: 1,
        explanation: "f(n) = g(n) + h(n), di mana g(n) adalah biaya sebenarnya dari titik awal ke n, dan h(n) adalah perkiraan biaya dari n ke titik tujuan.",
        flashcardFront: "Fungsi Evaluasi A* Search",
        flashcardBack: "f(n) = g(n) + h(n). g(n) = akumulasi jarak dari start node; h(n) = perkiraan heuristik ke goal node. Menjamin optimal jika h(n) admissible.",
        source: "Slide Problem Solving by Searching - Kecerdasan Buatan"
      },
      {
        id: "q-ai-5",
        question: "Sebuah fungsi heuristik h(n) dikatakan admissible (dapat diterima) jika...",
        options: [
          "Nilainya selalu lebih besar dari biaya sebenarnya h*(n)",
          "Tidak pernah menaksir lebih tinggi (never overestimates) dari biaya sebenarnya untuk mencapai goal",
          "Bernilai nol di semua titik selain simpul awal",
          "Memiliki nilai negatif pada simpul daun"
        ],
        correctAnswer: 1,
        explanation: "Heuristik admissible berarti 0 <= h(n) <= h*(n), di mana h*(n) adalah biaya riil terpendek ke tujuan, menjamin A* tree search bersifat optimal.",
        flashcardFront: "Admissible Heuristic",
        flashcardBack: "Fungsi heuristik yang optimis (tidak pernah memperkirakan biaya lebih tinggi dari biaya riil ke tujuan). Syarat wajib optimalitas A* Search.",
        source: "Slide Problem Solving by Searching - Kecerdasan Buatan"
      }
    ]
  },
  {
    courseId: "ai-3",
    courseName: "Kecerdasan Buatan",
    quizTitle: "Flashcards: Istilah & Konsep Utama AI Semester 3",
    quizType: "flashcard",
    sourceType: "catatan",
    sourceTitle: "Catatan & Glosarium AI",
    questions: [
      {
        id: "fc-ai-1",
        question: "Jelaskan konsep Rational Agent dalam AI!",
        options: ["Benar", "Salah"],
        correctAnswer: 0,
        explanation: "Agen rasional memilih tindakan yang memaksimalkan ekspektasi kinerjanya berdasarkan persepsi dan pengetahuannya.",
        flashcardFront: "Rational Agent",
        flashcardBack: "Entitas otonom yang bertindak untuk mencapai hasil terbaik (atau ekspektasi hasil terbaik jika terdapat ketidakpastian) berdasarkan pengetahuannya.",
        source: "Catatan Kuliah - Kecerdasan Buatan"
      },
      {
        id: "fc-ai-2",
        question: "Apa perbedaan antara Simple Reflex Agent dan Model-Based Reflex Agent?",
        options: ["Benar", "Salah"],
        correctAnswer: 0,
        explanation: "Simple reflex hanya melihat kondisi saat ini; Model-based menyimpan kondisi internal dunia untuk mengatasi lingkungan yang partially observable.",
        flashcardFront: "Simple vs Model-Based Reflex Agent",
        flashcardBack: "Simple Reflex: Bertindak hanya berdasarkan percept saat ini (aturan kondisi-aksi).\nModel-Based: Memelihara internal state untuk melacak aspek dunia yang tidak terlihat saat ini.",
        source: "Catatan Kuliah - Kecerdasan Buatan"
      },
      {
        id: "fc-ai-3",
        question: "Apa sifat algoritma Minimax dalam Game Playing?",
        options: ["Benar", "Salah"],
        correctAnswer: 0,
        explanation: "Minimax mengasumsikan lawan bermain secara optimal untuk meminimalkan utilitas kita.",
        flashcardFront: "Algoritma Minimax",
        flashcardBack: "Algoritma penentuan keputusan pada permainan zero-sum dua pemain; pemain MAX berusaha memaksimalkan skor sementara pemain MIN berusaha meminimalkan skor MAX.",
        source: "Slide AI for Game - Kecerdasan Buatan"
      },
      {
        id: "fc-ai-4",
        question: "Apa fungsi Alpha-Beta Pruning pada Minimax?",
        options: ["Benar", "Salah"],
        correctAnswer: 0,
        explanation: "Alpha-beta pruning memotong cabang pencarian yang terbukti tidak akan mempengaruhi keputusan akhir, menghemat waktu komputasi secara drastis.",
        flashcardFront: "Alpha-Beta Pruning",
        flashcardBack: "Teknik optimasi pencarian game tree yang memangkas evaluasi simpul yang tidak mungkin dipilih oleh pemain rasional tanpa mengubah keputusan akhir.",
        source: "Slide AI for Game - Kecerdasan Buatan"
      }
    ]
  },
  {
    courseId: "metnum-3",
    courseName: "Metode Numerik",
    quizTitle: "Quiz: Analisis Galat, Deret Taylor & Pencarian Akar",
    quizType: "quiz",
    sourceType: "rps",
    sourceTitle: "RPS & Modul Metode Numerik",
    questions: [
      {
        id: "q-mn-1",
        question: "Galat yang timbul akibat penghentian suatu deret tak berhingga menjadi suku berhingga disebut...",
        options: ["Galat Pembulatan (Round-off error)", "Galat Pemotongan (Truncation error)", "Galat Inheren (Inherent error)", "Galat Absolut"],
        correctAnswer: 1,
        explanation: "Galat pemotongan terjadi ketika operasi matematika kontinu atau deret tak terhingga dihampiri dengan aproksimasi berhingga (misalnya memotong suku deret Taylor).",
        flashcardFront: "Galat Pemotongan (Truncation Error)",
        flashcardBack: "Kesalahan aproksimasi akibat mengganti prosedur matematika tak berhingga (seperti deret Taylor tak hingga) dengan rumus berhingga.",
        source: "Pertemuan 3 - Teori Galat Metode Numerik"
      },
      {
        id: "q-mn-2",
        question: "Deret Taylor dari suatu fungsi f(x) yang diekspansi di sekitar titik x_0 = 0 secara khusus dinamakan...",
        options: ["Deret Fourier", "Deret Maclaurin", "Deret Laurent", "Deret Binomial"],
        correctAnswer: 1,
        explanation: "Deret Maclaurin adalah kasus khusus dari Deret Taylor dengan titik ekspansi x_0 = 0.",
        flashcardFront: "Deret Maclaurin",
        flashcardBack: "Bentuk khusus ekspansi deret Taylor di sekitar titik nol: f(x) = f(0) + f'(0)x + f''(0)x^2/2! + ...",
        source: "Pertemuan 4 - Deret Maclaurin"
      },
      {
        id: "q-mn-3",
        question: "Pada metode Biseksi, syarat interval [a, b] memuat minimal satu akar riil dari fungsi kontinu f(x) adalah...",
        options: ["f(a) + f(b) = 0", "f(a) * f(b) < 0", "f(a) / f(b) > 0", "f'(a) * f'(b) < 0"],
        correctAnswer: 1,
        explanation: "Berdasarkan Teorema Nilai Antara, jika f(a) dan f(b) berlawanan tanda (f(a) * f(b) < 0), maka terdapat minimal satu akar di dalam interval [a, b].",
        flashcardFront: "Syarat Pengurung Akar Biseksi",
        flashcardBack: "f(a) * f(b) < 0 menandakan terjadi pergantian tanda fungsi, menjamin adanya titik potong kurva dengan sumbu x pada interval [a, b].",
        source: "Pertemuan 6 - Metode Bagi Dua"
      },
      {
        id: "q-mn-4",
        question: "Rumus iterasi untuk mencari akar fungsi f(x) = 0 menggunakan metode Newton-Raphson adalah...",
        options: [
          "x_{n+1} = x_n - f(x_n) / f'(x_n)",
          "x_{n+1} = x_n + f(x_n) / f'(x_n)",
          "x_{n+1} = (a + b) / 2",
          "x_{n+1} = x_n - f'(x_n) / f(x_n)"
        ],
        correctAnswer: 0,
        explanation: "Iterasi Newton-Raphson diturunkan dari kemiringan garis singgung kurva: x_{n+1} = x_n - f(x_n)/f'(x_n).",
        flashcardFront: "Rumus Newton-Raphson",
        flashcardBack: "x_{n+1} = x_n - [f(x_n) / f'(x_n)]. Menggunakan garis singgung kurva dengan laju konvergensi kuadratik O(h^2).",
        source: "Pertemuan 6 - Newton Raphson"
      }
    ]
  },
  {
    courseId: "desain-ui-ux",
    courseName: "Desain UI/UX",
    quizTitle: "Quiz: Prinsip Desain Antarmuka & Pengalaman Pengguna",
    quizType: "quiz",
    sourceType: "catatan",
    sourceTitle: "Modul Ajar Desain UI/UX & Slide Kuliah",
    questions: [
      {
        id: "q-ux-1",
        question: "Hukum UX yang menyatakan bahwa pengguna menghabiskan sebagian besar waktunya di situs lain, sehingga antarmuka Anda diharapkan bekerja serupa adalah...",
        options: ["Hick's Law", "Jakob's Law", "Miller's Law", "Fitts's Law"],
        correctAnswer: 1,
        explanation: "Jakob's Law dirumuskan oleh Jakob Nielsen: Pengguna menginginkan situs/aplikasi baru memiliki model mental yang serupa dengan aplikasi yang biasa mereka gunakan.",
        flashcardFront: "Jakob's Law",
        flashcardBack: "Pengguna mengharapkan antarmuka baru bekerja mirip dengan antarmuka yang sudah familiar bagi mereka. Mencegah cognitive overload.",
        source: "Modul Ajar Desain UI/UX"
      },
      {
        id: "q-ux-2",
        question: "Dalam 10 Heuristik Usability Nielsen, prinsip 'Visibility of System Status' berarti...",
        options: [
          "Aplikasi harus selalu memberikan umpan balik (feedback) yang jelas dan tepat waktu mengenai apa yang sedang terjadi",
          "Desain harus menampilkan seluruh menu di satu layar",
          "Semua teks harus menggunakan kontras warna tertinggi",
          "Aplikasi harus selalu meminta konfirmasi kata sandi"
        ],
        correctAnswer: 0,
        explanation: "Visibility of system status memastikan pengguna tidak bingung melalui indikator loading, pesan status, notifikasi toast, dan konfirmasi aksi.",
        flashcardFront: "Visibility of System Status",
        flashcardBack: "Prinsip heuristik Nielsen #1: Sistem harus selalu mengabari pengguna tentang apa yang sedang berlangsung melalui umpan balik yang relevan dan tepat waktu.",
        source: "Modul Ajar Desain UI/UX"
      },
      {
        id: "q-ux-3",
        question: "Rasio kontras minimum yang diwajibkan oleh WCAG 2.2 AA untuk elemen UI grafis dan komponen interaktif (tombol, input border) terhadap latar belakangnya adalah...",
        options: ["1.5:1", "3.0:1", "4.5:1", "7.0:1"],
        correctAnswer: 1,
        explanation: "WCAG 2.2 AA mensyaratkan rasio kontras 3.0:1 untuk non-text contrast (grafis, border kontrol form, ikon penting) dan 4.5:1 untuk teks standar.",
        flashcardFront: "WCAG 2.2 Non-Text Contrast",
        flashcardBack: "Komponen interaktif dan elemen grafis bermakna wajib memiliki rasio kontras minimal 3.0:1 terhadap warna sekitarnya.",
        source: "Modul Ajar Desain UI/UX"
      }
    ]
  },
  {
    courseId: "sisdis-3",
    courseName: "Sistem Terdistribusi",
    quizTitle: "Quiz: Komunikasi Antar Proses & Middleware Terdistribusi",
    quizType: "quiz",
    sourceType: "tugas",
    sourceTitle: "Tugas & Modul Sistem Terdistribusi",
    questions: [
      {
        id: "q-sd-1",
        question: "Mekanisme komunikasi terdistribusi yang menyamarkan pemanggilan prosedur di mesin remote seolah-olah terjadi pada mesin lokal adalah...",
        options: ["Remote Procedure Call (RPC)", "Message Queuing Telemetry", "Polling Socket", "FTP Stream"],
        correctAnswer: 0,
        explanation: "RPC (Remote Procedure Call) mengabstraksi detail komunikasi jaringan dan serialisasi data menggunakan stub client dan skeleton server.",
        flashcardFront: "Remote Procedure Call (RPC)",
        flashcardBack: "Protokol yang memungkinkan sebuah program mengeksekusi subrutin di alamat ruang memori yang berbeda (komputer lain dalam jaringan) dengan sintaks pemanggilan fungsi lokal.",
        source: "Modul 3 Komunikasi Antar Proses - Sistem Terdistribusi"
      },
      {
        id: "q-sd-2",
        question: "Protokol konsensus Two-Phase Commit (2PC) pada sistem terdistribusi terdiri dari dua fase yaitu...",
        options: ["Start dan Finish", "Prepare (Voting) dan Commit/Abort", "Request dan Response", "Lock dan Unlock"],
        correctAnswer: 1,
        explanation: "2PC memastikan transaksi terdistribusi bersifat atomik: Koordinator mengirim PREPARE, jika semua partisipan setuju (VOTE YES), koordinator mengirim GLOBAL COMMIT.",
        flashcardFront: "Two-Phase Commit (2PC)",
        flashcardBack: "Protokol transaksi terdistribusi yang terdiri atas Fase 1: Prepare (pengumpulan suara/vote) dan Fase 2: Commit/Abort untuk menjamin sifat Atomicity.",
        source: "Modul 6 Pengelolaan Transaksi - Sistem Terdistribusi"
      }
    ]
  },
  {
    courseId: "mptik-3",
    courseName: "Manajemen Proyek TIK",
    quizTitle: "Simulasi Ulangan: Inisiasi Proyek, WBS, & Penjadwalan TIK",
    quizType: "ulangan",
    sourceType: "prediksi",
    sourceTitle: "Prediksi UTS Manajemen Proyek TIK",
    questions: [
      {
        id: "q-mp-1",
        question: "Dokumen resmi yang memberikan wewenang kepada Manajer Proyek untuk menggunakan sumber daya organisasi dalam pelaksanaan proyek adalah...",
        options: ["Project Charter", "WBS Dictionary", "Statement of Work (SOW)", "Risk Register"],
        correctAnswer: 0,
        explanation: "Project Charter adalah dokumen inisiasi formal yang disahkan oleh sponsor proyek yang memberikan mandat kepada Project Manager.",
        flashcardFront: "Project Charter",
        flashcardBack: "Dokumen formal yang menyatakan eksistensi sebuah proyek dan memberikan wewenang kepada project manager untuk mengalokasikan sumber daya organisasi.",
        source: "Inisiasi Proyek dan Project Charter - MPTIK"
      },
      {
        id: "q-mp-2",
        question: "Prinsip '100% Rule' pada penyusunan Work Breakdown Structure (WBS) menyatakan bahwa...",
        options: [
          "WBS harus mencakup 100% dari ruang lingkup proyek dan pekerjaan yang disepakati, tidak lebih dan tidak kurang",
          "Seluruh anggota tim harus bekerja 100% full time",
          "Tingkat keberhasilan proyek harus mencapai 100%",
          "Anggaran harus 100% dialokasikan di awal proyek"
        ],
        correctAnswer: 0,
        explanation: "100% Rule adalah kaidah fundamental WBS: dekomposisi harus mencakup seluruh ruang lingkup pekerjaan proyek tanpa pekerjaan di luar lingkup yang disepakati.",
        flashcardFront: "Aturan 100% (100% Rule WBS)",
        flashcardBack: "Kaidah bahwa WBS harus memuat 100% ruang lingkup yang didefinisikan oleh scope statement, mencakup deliverables internal, eksternal, dan manajemen proyek.",
        source: "Ruang Lingkup Proyek dan WBS - MPTIK"
      }
    ]
  }
];

function main() {
  console.log('🎯 Seeding authentic and curated quizzes into database...');

  // 1. Authentic eLearning Database Quiz
  const authenticQuestions = extractAuthenticElearningQuestions();
  console.log(`📑 Extracted ${authenticQuestions.length} questions from eLearning HTML review.`);

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  if (authenticQuestions.length > 0) {
    const pbdQuizId = 'quiz-sem3-pbd-elearning-2026';
    const initialSession = JSON.stringify({
      currentQIndex: 0,
      selectedAnswers: {},
      showAnswer: {},
      isFlipped: false,
      flashcardMastered: {}
    });

    db.prepare(`
      INSERT OR REPLACE INTO ai_quizzes (
        id, user_id, course_id, title, score, total_questions, questions_json,
        status, quiz_type, source_type, source_title, session_state, expires_at, created_at
      )
      VALUES (?, 'user-me', 'pbd-3', ?, 0, ?, ?, 'in_progress', 'quiz', 'catatan', 'Quiz 1 Reviu E-Learning (20 Soal Resmi PNJ)', ?, ?, datetime('now'))
    `).run(
      pbdQuizId,
      'Kuis Asli E-Learning: Pemrograman Basis Data (20 Soal SQL)',
      authenticQuestions.length,
      JSON.stringify(authenticQuestions),
      initialSession,
      expiresAt
    );

    // Also create a Flashcard deck from the first 10 questions
    const flashcardItems = authenticQuestions.slice(0, 10).map((q, idx) => ({
      id: `fc-pbd-${idx + 1}`,
      question: q.question,
      options: ["Paham", "Ulangi"],
      correctAnswer: 0,
      explanation: q.explanation,
      flashcardFront: q.flashcardFront,
      flashcardBack: q.flashcardBack,
      source: q.source
    }));

    db.prepare(`
      INSERT OR REPLACE INTO ai_quizzes (
        id, user_id, course_id, title, score, total_questions, questions_json,
        status, quiz_type, source_type, source_title, session_state, expires_at, created_at
      )
      VALUES (?, 'user-me', 'pbd-3', ?, 0, ?, ?, 'in_progress', 'flashcard', 'catatan', 'Flashcards SQL & Subquery', ?, ?, datetime('now'))
    `).run(
      'fc-sem3-pbd-subquery',
      'Flashcards: Sintaks & Konsep SQL Subquery (Basis Data)',
      flashcardItems.length,
      JSON.stringify(flashcardItems),
      initialSession,
      expiresAt
    );
  }

  // 2. Insert curated quizzes for AI, Metnum, UIUX, Sisdis, MPTIK
  for (let i = 0; i < COURSE_QUIZZES_SEED.length; i++) {
    const item = COURSE_QUIZZES_SEED[i];
    const quizId = `quiz-sem3-${item.courseId}-${item.quizType}-${i + 1}`;
    const initialSession = JSON.stringify({
      currentQIndex: 0,
      selectedAnswers: {},
      showAnswer: {},
      isFlipped: false,
      flashcardMastered: {}
    });

    db.prepare(`
      INSERT OR REPLACE INTO ai_quizzes (
        id, user_id, course_id, title, score, total_questions, questions_json,
        status, quiz_type, source_type, source_title, session_state, expires_at, created_at
      )
      VALUES (?, 'user-me', ?, ?, 0, ?, ?, 'in_progress', ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      quizId,
      item.courseId,
      item.quizTitle,
      item.questions.length,
      JSON.stringify(item.questions),
      item.quizType,
      item.sourceType,
      item.sourceTitle,
      initialSession,
      expiresAt
    );
  }

  const count = db.prepare('SELECT count(*) as c FROM ai_quizzes').get().c;
  console.log(`✨ Done! Total active quizzes in database: ${count}`);
}

main();
