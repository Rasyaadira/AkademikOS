const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "akademikos.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

console.log("Creating full 11-table academic schema...");

db.exec(`
  -- 1. Master Mahasiswa (Multi-tenant Users)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nim TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. Detail Profil Akademik
  CREATE TABLE IF NOT EXISTS profile (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nim TEXT NOT NULL,
    email TEXT NOT NULL,
    major TEXT NOT NULL,
    faculty TEXT NOT NULL,
    university TEXT NOT NULL,
    semester INTEGER NOT NULL,
    academic_advisor TEXT NOT NULL,
    target_gpa TEXT NOT NULL,
    max_sks INTEGER NOT NULL
  );

  -- 3. Master Dosen Pengampu & Pembimbing
  CREATE TABLE IF NOT EXISTS lecturers (
    id TEXT PRIMARY KEY,
    nip TEXT UNIQUE,
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone_wa TEXT,
    room TEXT,
    photo_url TEXT,
    department TEXT DEFAULT 'Departemen Teknik Elektro & Teknologi Informasi'
  );

  -- 4. Master Mata Kuliah
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sks INTEGER NOT NULL DEFAULT 3,
    semester INTEGER NOT NULL DEFAULT 5,
    primary_lecturer_id TEXT REFERENCES lecturers(id),
    room_default TEXT,
    lms_url TEXT,
    color_theme TEXT DEFAULT 'blue'
  );

  -- 5. Relasi Registrasi Matkul & Presensi Burn-down (Ambang 75%)
  CREATE TABLE IF NOT EXISTS course_enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026/2027 Ganjil',
    target_grade TEXT DEFAULT 'A',
    total_meetings INTEGER DEFAULT 16,
    attended_count INTEGER DEFAULT 0,
    excused_count INTEGER DEFAULT 0,
    alpha_count INTEGER DEFAULT 0,
    remaining_alpha INTEGER DEFAULT 4,
    status_burn_down TEXT DEFAULT 'aman'
  );

  -- 6. Jadwal Perkuliahan Mingguan & Kelas Pengganti
  CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'student-1' REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id),
    course TEXT NOT NULL,
    code TEXT NOT NULL,
    room TEXT NOT NULL,
    start_hour INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    lecturer TEXT NOT NULL,
    day TEXT NOT NULL,
    status TEXT NOT NULL,
    attendance_status TEXT NOT NULL,
    class_type TEXT DEFAULT 'reguler'
  );

  -- 7. Manajemen Tugas, Proyek & Praktikum
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'student-1' REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id),
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'sedang',
    task_type TEXT NOT NULL DEFAULT 'tugas',
    deadline_label TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    weight TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 8. Riwayat Presensi Pertemuan 1-16 (Attendance Logs)
  CREATE TABLE IF NOT EXISTS attendance_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    meeting_no INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    verification_method TEXT DEFAULT 'manual',
    notes TEXT
  );

  -- 9. Material Depot & RPS Repositori Dokumen
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    folder_category TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size TEXT,
    file_type TEXT DEFAULT 'pdf',
    meeting_no INTEGER,
    ai_indexed INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 10. Catatan Kuliah Markdown (Obsidian-Style)
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'student-1' REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id),
    folder TEXT NOT NULL DEFAULT 'Umum',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    is_starred INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 11. AI Quiz Active Recall H-3 (RAG Gemini)
  CREATE TABLE IF NOT EXISTS ai_quizzes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    material_id TEXT REFERENCES materials(id),
    title TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 5,
    questions_json TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log("Seeding data atomically...");

const seed = db.transaction(() => {
  // 1. Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, nim, email, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run("student-1", "Faras Pratama", "23/512948/TK/54321", "faras.pratama@mail.ugm.ac.id", "FR");
  insertUser.run("student-2", "Arya Wicaksono", "23/514210/TK/55123", "arya.wicaksono@mail.ugm.ac.id", "AW");
  insertUser.run("student-3", "Nabila Putri", "23/516789/TK/56234", "nabila.putri@mail.ugm.ac.id", "NP");

  // 2. Profiles
  const insertProfile = db.prepare(`
    INSERT OR REPLACE INTO profile (user_id, name, nim, email, major, faculty, university, semester, academic_advisor, target_gpa, max_sks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProfile.run("student-1", "Faras Pratama", "23/512948/TK/54321", "faras.pratama@mail.ugm.ac.id", "Teknik Informatika", "Fakultas Teknik", "Universitas Gadjah Mada", 5, "Dr. Ir. Budi Santoso, M.Kom.", "3.85", 24);
  insertProfile.run("student-2", "Arya Wicaksono", "23/514210/TK/55123", "arya.wicaksono@mail.ugm.ac.id", "Teknik Komputer", "Fakultas Teknik", "Universitas Gadjah Mada", 5, "Dr. Ahmad Fauzi, M.T.", "3.75", 22);
  insertProfile.run("student-3", "Nabila Putri", "23/516789/TK/56234", "nabila.putri@mail.ugm.ac.id", "Teknik Informatika", "Fakultas Teknik", "Universitas Gadjah Mada", 3, "Siti Rahmawati, S.Kom., M.Cs.", "3.90", 24);

  // 3. Lecturers
  const insertLecturer = db.prepare(`
    INSERT OR REPLACE INTO lecturers (id, nip, name, title, email, phone_wa, room, photo_url, department)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLecturer.run("lec-1", "197805122003121001", "Dr. Ir. Budi Santoso, M.Kom.", "Lektor Kepala / Dosen AI", "budi.santoso@ugm.ac.id", "6281234567890", "Ruang Dosen DTETI Lt. 3", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");
  insertLecturer.run("lec-2", "198203152008121002", "Dr. Ahmad Fauzi, M.T.", "Lektor / Dosen Sistem", "ahmad.fauzi@ugm.ac.id", "6281298765432", "Ruang Dosen DTETI Lt. 2", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");
  insertLecturer.run("lec-3", "198509202010122003", "Siti Rahmawati, S.Kom., M.Cs.", "Lektor / Dosen RPL", "siti.rahmawati@ugm.ac.id", "6285712345678", "Ruang Dosen DTETI Lt. 3", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");
  insertLecturer.run("lec-4", "197204101997021001", "Prof. Hendra Kusuma", "Guru Besar / Dosen Basis Data", "hendra.kusuma@ugm.ac.id", "6281345678901", "Gedung DTETI Sayap Barat Lt. 2", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");
  insertLecturer.run("lec-5", "198611052014041001", "Ir. Dian Pratama, M.Eng.", "Asisten Ahli / Dosen Jaringan", "dian.pratama@ugm.ac.id", "6287812345678", "Lab Jaringan Gd. D Lt. 1", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");
  insertLecturer.run("lec-6", "198902182016011002", "Eko Prasetyo, M.Kom.", "Lektor / Dosen Pemrograman", "eko.prasetyo@ugm.ac.id", "6281987654321", "Ruang Lab Software Lt. 2", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");
  insertLecturer.run("lec-7", "197508142000032001", "Dra. Ratna Dewi, M.Si.", "Lektor / Dosen Humaniora", "ratna.dewi@ugm.ac.id", "6285212345678", "Gedung Pusat Bahasa Lt. 1", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80", "Departemen Humaniora & Komunikasi");
  insertLecturer.run("lec-8", "198406122010121004", "Dr. Wahyu Utomo, S.T., M.Sc.", "Lektor / Dosen Grafika", "wahyu.utomo@ugm.ac.id", "6281122334455", "Lab Grafika Komputer Lt. 2", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80", "Departemen Teknik Elektro & Teknologi Informasi");

  // 4. Courses
  const insertCourse = db.prepare(`
    INSERT OR REPLACE INTO courses (id, code, name, sks, semester, primary_lecturer_id, room_default, lms_url, color_theme)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertCourse.run("cs-1", "IF-3104", "Kecerdasan Buatan & Sistem Pakar", 3, 5, "lec-1", "Lab AI - Gd. C 302", "https://elok.ugm.ac.id/course/ai-2026", "blue");
  insertCourse.run("cs-2", "IF-3101", "Sistem Operasi", 3, 5, "lec-2", "Lab Komputasi Dasar 2", "https://elok.ugm.ac.id/course/os-2026", "emerald");
  insertCourse.run("cs-3", "IF-3108", "Rekayasa Perangkat Lunak", 3, 5, "lec-3", "Ruang Teori 401", "https://elok.ugm.ac.id/course/rpl-2026", "indigo");
  insertCourse.run("cs-4", "IF-3102", "Basis Data Lanjut", 3, 5, "lec-4", "Lab Basis Data 1", "https://elok.ugm.ac.id/course/db-2026", "amber");
  insertCourse.run("cs-5", "IF-3103", "Jaringan Komputer", 3, 5, "lec-5", "Lab Jaringan Gd. D", "https://elok.ugm.ac.id/course/net-2026", "cyan");
  insertCourse.run("cs-6", "IF-3105", "Pemrograman Berorientasi Objek", 3, 5, "lec-6", "Lab Software 3", "https://elok.ugm.ac.id/course/pbo-2026", "purple");
  insertCourse.run("cs-7", "KU-3101", "Etika Profesi & Komunikasi", 2, 5, "lec-7", "Auditorium Lt. 2", "https://elok.ugm.ac.id/course/etika-2026", "rose");
  insertCourse.run("cs-8", "IF-3109", "Grafika Komputer & Multimedia", 3, 5, "lec-8", "Lab Multimedia Lt. 2", "https://elok.ugm.ac.id/course/grafika-2026", "teal");

  // 5. Course Enrollments (with Attendance Burn-down)
  const insertEnrollment = db.prepare(`
    INSERT OR REPLACE INTO course_enrollments (id, user_id, course_id, academic_year, target_grade, total_meetings, attended_count, excused_count, alpha_count, remaining_alpha, status_burn_down)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEnrollment.run("en-1", "student-1", "cs-1", "2026/2027 Ganjil", "A", 16, 7, 0, 0, 4, "aman");
  insertEnrollment.run("en-2", "student-1", "cs-2", "2026/2027 Ganjil", "A", 16, 6, 1, 0, 4, "aman");
  insertEnrollment.run("en-3", "student-1", "cs-3", "2026/2027 Ganjil", "A", 16, 7, 0, 0, 4, "aman");
  insertEnrollment.run("en-4", "student-1", "cs-4", "2026/2027 Ganjil", "B+", 16, 4, 1, 2, 2, "waspada");
  insertEnrollment.run("en-5", "student-1", "cs-5", "2026/2027 Ganjil", "A", 16, 7, 0, 0, 4, "aman");
  insertEnrollment.run("en-6", "student-1", "cs-6", "2026/2027 Ganjil", "A", 16, 7, 0, 0, 4, "aman");
  insertEnrollment.run("en-7", "student-1", "cs-7", "2026/2027 Ganjil", "A", 16, 6, 0, 1, 3, "aman");
  insertEnrollment.run("en-8", "student-1", "cs-8", "2026/2027 Ganjil", "A", 16, 7, 0, 0, 4, "aman");

  // 6. Schedules (Complete 15 Slots across Senin s.d. Sabtu)
  db.prepare("DELETE FROM schedule WHERE user_id = 'student-1'").run();
  const insertSched = db.prepare(`
    INSERT OR REPLACE INTO schedule (id, user_id, course_id, course, code, room, start_hour, duration_hours, start_time, end_time, lecturer, day, status, attendance_status, class_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // SENIN
  insertSched.run("sch-1", "student-1", "cs-2", "Sistem Operasi", "IF-3101", "Lab Komputasi Dasar 2", 7, 3, "07.30", "10.00", "Dr. Ahmad Fauzi, M.T.", "senin", "upcoming", "pending", "reguler");
  insertSched.run("sch-2", "student-1", "cs-4", "Basis Data Lanjut", "IF-3102", "Lab Basis Data 1", 10, 3, "10.15", "12.45", "Prof. Hendra Kusuma", "senin", "upcoming", "pending", "reguler");
  insertSched.run("sch-3", "student-1", "cs-2", "Praktikum Sistem Operasi", "IF-3101P", "Lab Komputasi 1", 13, 2, "13.30", "15.10", "Tim Asisten Dosen", "senin", "upcoming", "pending", "praktikum");

  // SELASA
  insertSched.run("sch-4", "student-1", "cs-5", "Jaringan Komputer", "IF-3103", "Lab Jaringan Gd. D", 8, 3, "08.00", "10.30", "Ir. Dian Pratama, M.Eng.", "selasa", "upcoming", "pending", "reguler");
  insertSched.run("sch-5", "student-1", "cs-3", "Rekayasa Perangkat Lunak", "IF-3108", "Ruang Teori 401", 13, 3, "13.00", "15.30", "Siti Rahmawati, S.Kom., M.Cs.", "selasa", "upcoming", "pending", "reguler");

  // RABU
  insertSched.run("sch-6", "student-1", "cs-6", "Pemrograman Berorientasi Objek", "IF-3105", "Lab Software 3", 8, 3, "08.00", "10.30", "Eko Prasetyo, M.Kom.", "rabu", "upcoming", "pending", "reguler");
  insertSched.run("sch-7", "student-1", "cs-8", "Grafika Komputer & Multimedia", "IF-3109", "Lab Multimedia Lt. 2", 10, 2, "10.45", "12.25", "Dr. Wahyu Utomo, S.T., M.Sc.", "rabu", "upcoming", "pending", "reguler");
  insertSched.run("sch-8", "student-1", "cs-6", "Pemrograman Berorientasi Objek", "IF-3105P", "Lab Software 3", 13, 3, "13.30", "16.00", "Tim Asisten Dosen", "rabu", "upcoming", "pending", "praktikum");

  // KAMIS
  insertSched.run("sch-9", "student-1", "cs-2", "Sistem Operasi", "IF-3101", "Ruang Sidang 201", 7, 2, "07.00", "08.40", "Dr. Ahmad Fauzi, M.T.", "kamis", "completed", "hadir", "reguler");
  insertSched.run("sch-10", "student-1", "cs-1", "Kecerdasan Buatan & Sistem Pakar", "IF-3104", "Lab AI - Gedung C 302", 9, 3, "09.00", "11.30", "Dr. Ir. Budi Santoso, M.Kom.", "kamis", "active", "hadir", "reguler");
  insertSched.run("sch-11", "student-1", "cs-3", "Rekayasa Perangkat Lunak", "IF-3108", "Ruang Teori 401", 13, 3, "13.00", "15.30", "Siti Rahmawati, S.Kom., M.Cs.", "kamis", "upcoming", "pending", "pengganti");

  // JUMAT
  insertSched.run("sch-12", "student-1", "cs-7", "Etika Profesi & Komunikasi", "KU-3101", "Auditorium Lt. 2", 8, 2, "08.00", "09.40", "Dra. Ratna Dewi, M.Si.", "jumat", "upcoming", "pending", "reguler");
  insertSched.run("sch-13", "student-1", "cs-1", "Kecerdasan Buatan & Sistem Pakar", "IF-3104", "Ruang Seminar DTETI", 13, 2, "13.30", "15.30", "Dr. Ir. Budi Santoso, M.Kom.", "jumat", "upcoming", "pending", "reguler");

  // SABTU
  insertSched.run("sch-14", "student-1", "cs-3", "Rekayasa Perangkat Lunak", "IF-3108", "Co-Working FT UGM Lt. 1", 9, 3, "09.00", "11.30", "Siti Rahmawati, S.Kom., M.Cs.", "sabtu", "upcoming", "pending", "praktikum");
  insertSched.run("sch-15", "student-1", "cs-1", "Kecerdasan Buatan & Sistem Pakar", "IF-3104", "Lab AI Daring (Google Meet)", 13, 2, "13.00", "15.00", "Tim Asisten Dosen", "sabtu", "upcoming", "pending", "praktikum");

  // 7. Tasks (Rich & Diverse: 14 Academic Tasks across All Courses & Days)
  db.prepare("DELETE FROM tasks WHERE user_id = 'student-1'").run();
  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO tasks (id, user_id, course_id, title, course, difficulty, task_type, deadline_label, deadline_date, weight, completed, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run(
    "task-1",
    "student-1",
    "cs-1",
    "Implementasi Breadth-First Search & Greedy di Python",
    "Kecerdasan Buatan & Sistem Pakar",
    "sulit",
    "praktik",
    "H-0 (Hari Ini)",
    "2026-10-02 23:59",
    "Tugas Praktikum (15%)",
    0,
    "high",
    "Kumpulkan file .py dan laporan PDF analisis kompleksitas O(b^d)."
  );
  insertTask.run(
    "task-2",
    "student-1",
    "cs-2",
    "Review Artikel Jurnal: Deadlock Avoidance Algorithm",
    "Sistem Operasi",
    "sedang",
    "dokumen",
    "H-1 (Besok)",
    "2026-10-03 23:59",
    "Esai Mandiri (10%)",
    0,
    "medium",
    "Ringkasan minimal 3 halaman IEEE format mengenai Banker's Algorithm pada sistem multi-core."
  );
  insertTask.run(
    "task-3",
    "student-1",
    "cs-4",
    "Normalisasi 3NF & Schema Relasional Basis Data Toko Online",
    "Basis Data Lanjut",
    "sulit",
    "dokumen",
    "H-2",
    "2026-10-04 18:00",
    "Tugas Teori (10%)",
    0,
    "high",
    "Pastikan dependensi fungsional sudah tidak memiliki transitif dan multivalued dependency."
  );
  insertTask.run(
    "task-4",
    "student-1",
    "cs-5",
    "Konfigurasi Subnetting VLSM & OSPF Routing Packet Tracer",
    "Jaringan Komputer",
    "sedang",
    "praktik",
    "H-3",
    "2026-10-05 23:59",
    "Laporan Praktikum (15%)",
    0,
    "medium",
    "Upload file .pkt simulasi jaringan beserta tabel routing tiap router."
  );
  insertTask.run(
    "task-5",
    "student-1",
    "cs-3",
    "Slide Presentasi Progress Proyek Web Sprint 1",
    "Rekayasa Perangkat Lunak",
    "sedang",
    "presentasi",
    "H-4",
    "2026-10-06 14:00",
    "Sprint Demo (10%)",
    0,
    "medium",
    "Siapkan 10 slide mencakup Product Backlog, Burndown Chart, dan Demo Interaktif."
  );
  insertTask.run(
    "task-6",
    "student-1",
    "cs-6",
    "Class Diagram UML & Inheritance Model Sistem Perpustakaan",
    "Pemrograman Berorientasi Objek",
    "mudah",
    "dokumen",
    "H-5",
    "2026-10-07 17:00",
    "Tugas Mandiri (5%)",
    0,
    "low",
    "Gunakan notation PlantUML atau Draw.io, cantumkan visibility attribute private/protected/public."
  );
  insertTask.run(
    "task-7",
    "student-1",
    "cs-8",
    "Algoritma Rasterisasi Garis Bresenham & Poligon 3D",
    "Grafika Komputer & Multimedia",
    "sulit",
    "praktik",
    "H-6",
    "2026-10-08 23:59",
    "Tugas Coding (15%)",
    0,
    "high",
    "Implementasi fungsi drawLine dan fillPolygon menggunakan OpenGL atau Canvas C++."
  );
  insertTask.run(
    "task-8",
    "student-1",
    "cs-3",
    "Dokumen SRS Bab 1 - 3 (Spesifikasi Kebutuhan Perangkat Lunak)",
    "Rekayasa Perangkat Lunak",
    "mudah",
    "dokumen",
    "H-7",
    "2026-10-09 17:00",
    "Milestone Proyek (25%)",
    0,
    "low",
    "Bab 1 Pendahuluan, Bab 2 Deskripsi Umum Sistem, Bab 3 Kebutuhan Fungsional & Non-Fungsional."
  );
  insertTask.run(
    "task-9",
    "student-1",
    "cs-7",
    "Makalah Etika: Hak Cipta AI Generatif & Plagiarisme Karya Koding",
    "Etika Profesi & Komunikasi",
    "sedang",
    "dokumen",
    "H-8",
    "2026-10-10 23:59",
    "Tugas Esai (15%)",
    0,
    "medium",
    "Kajian hukum UU ITE dan etika asosiasi profesi IEEE/ACM terhadap code assistant LLM."
  );
  insertTask.run(
    "task-10",
    "student-1",
    "cs-6",
    "Penerapan Design Pattern Singleton & Factory di Java Spring",
    "Pemrograman Berorientasi Objek",
    "sedang",
    "praktik",
    "H-9",
    "2026-10-11 23:59",
    "Tugas Praktikum (15%)",
    0,
    "medium",
    "Buat unit test JUnit 5 untuk memastikan instantiation hanya terjadi sekali pada singleton."
  );
  insertTask.run(
    "task-11",
    "student-1",
    "cs-4",
    "Benchmarking Kinerja InnoDB vs MyRocks di Server Linux",
    "Basis Data Lanjut",
    "sulit",
    "presentasi",
    "H-10",
    "2026-10-12 10:00",
    "Presentasi Riset (20%)",
    0,
    "high",
    "Ukur throughput QPS dan latensi I/O dengan Sysbench 1.0 pada beban write-heavy."
  );

  // Completed Tasks
  insertTask.run(
    "task-12",
    "student-1",
    "cs-2",
    "Latihan Shell Scripting Bash & Linux Process Management",
    "Sistem Operasi",
    "mudah",
    "praktik",
    "Selesai",
    "2026-09-28 23:59",
    "Kuis Mingguan (5%)",
    1,
    "low",
    "Lulus otomatis dengan nilai 100/100 pada autograder lab."
  );
  insertTask.run(
    "task-13",
    "student-1",
    "cs-1",
    "Instalasi Python Virtualenv & NumPy Matplotlib Test",
    "Kecerdasan Buatan & Sistem Pakar",
    "mudah",
    "praktik",
    "Selesai",
    "2026-09-29 23:59",
    "Setup Praktikum (5%)",
    1,
    "low",
    "Selesai diverifikasi oleh asisten praktikum."
  );
  insertTask.run(
    "task-14",
    "student-1",
    "cs-3",
    "Pembentukan Tim & Pemilihan Topik Aplikasi Proyek RPL",
    "Rekayasa Perangkat Lunak",
    "sedang",
    "dokumen",
    "Selesai",
    "2026-09-30 17:00",
    "Form Tim (5%)",
    1,
    "medium",
    "Tim Siklus.ai telah terdaftar resmi di portal akademik departemen."
  );

  // 8. Riwayat Presensi Pertemuan (Attendance Logs)
  db.prepare("DELETE FROM attendance_logs WHERE user_id = 'student-1'").run();
  const insertAttendance = db.prepare(`
    INSERT OR REPLACE INTO attendance_logs (id, user_id, course_id, meeting_no, date, status, verification_method, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let m = 1; m <= 7; m++) {
    insertAttendance.run(`att-ai-${m}`, "student-1", "cs-1", m, `2026-0${8 + Math.floor(m/4)}-${10 + (m * 7) % 20}`, "hadir", "qr_scan", "Hadir tepat waktu di Lab AI");
    insertAttendance.run(`att-os-${m}`, "student-1", "cs-2", m, `2026-0${8 + Math.floor(m/4)}-${11 + (m * 7) % 20}`, m === 5 ? "izin" : "hadir", "manual", m === 5 ? "Surat Izin Lomba Hackathon JOINTS" : "Hadir Lab Komputasi");
    insertAttendance.run(`att-db-${m}`, "student-1", "cs-4", m, `2026-0${8 + Math.floor(m/4)}-${12 + (m * 7) % 20}`, m === 3 || m === 6 ? "alfa" : "hadir", "manual", m === 3 || m === 6 ? "Tidak hadir tanpa keterangan" : "Hadir Lab Basis Data");
  }

  // 9. Study Notes (Obsidian Markdown Notes)
  db.prepare("DELETE FROM notes WHERE user_id = 'student-1'").run();
  const insertNote = db.prepare(`
    INSERT OR REPLACE INTO notes (id, user_id, course_id, folder, title, content, tags, is_starred)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertNote.run(
    "note-1",
    "student-1",
    "cs-1",
    "Kecerdasan Buatan",
    "Catatan_Kuliah_Sesi_01.md",
    "# Kecerdasan Buatan — Sesi 01: Agen Cerdas & State Space\n\n## 1. Definisi Agen Rasional\nAgen adalah entitas yang mengamati lingkungannya melalui sensor dan bertindak melalui aktuator.\n\n- **PEAS:** Performance measure, Environment, Actuators, Sensors.\n- **Sifat Lingkungan:** Deterministic vs Stochastic, Episodic vs Sequential, Static vs Dynamic.\n\n```python\n# Contoh struktur agen sederhana\nclass ReflexAgent:\n    def act(self, percept):\n        if percept == 'dirty':\n            return 'suck'\n        return 'move_forward'\n```\n\n## 2. To-Do Tindak Lanjut\n- [x] Baca Bab 2 Russell & Norvig\n- [ ] Buat ringkasan Breadth First Search (BFS)",
    "#ai #agent #search",
    1
  );
  insertNote.run(
    "note-2",
    "student-1",
    "cs-1",
    "Kecerdasan Buatan",
    "Catatan_Kuliah_Sesi_02.md",
    "# Kecerdasan Buatan — Sesi 02: Heuristic Search & Algoritma A*\n\n## 1. Algoritma A* Evaluasi Fungsi\nFungsi evaluasi A*:\n$$f(n) = g(n) + h(n)$$\n\n- $g(n)$: Biaya aktual dari node awal ke node $n$.\n- $h(n)$: Estimasi biaya heuristik dari node $n$ ke node tujuan.\n- Syarat keoptimalan: $h(n)$ harus **admissible** (tidak pernah overestimasi biaya riil).\n\n> Catatan Dosen: Dalam game development atau navigasi peta seperti Google Maps, Euclidean distance atau Manhattan distance sering dijadikan admissible heuristic.",
    "#ai #search #astar #heuristic",
    1
  );
  insertNote.run(
    "note-3",
    "student-1",
    "cs-2",
    "Sistem Operasi",
    "Catatan_Kuliah_Sesi_03.md",
    "# Sistem Operasi — Sesi 03: Penjadwalan CPU & Algoritma Round Robin\n\n## Kriteria Penjadwalan\n1. **CPU Utilization:** Persentase waktu CPU bekerja.\n2. **Throughput:** Jumlah proses selesai per satuan waktu.\n3. **Turnaround Time:** Total waktu dari kedatangan proses hingga selesai.\n4. **Waiting Time:** Total waktu proses menunggu di ready queue.\n5. **Response Time:** Waktu dari submit hingga output pertama.\n\n*Time Quantum:* Bila quantum terlalu besar, Round Robin menjadi FCFS. Bila terlalu kecil, context switch overhead mendominasi.",
    "#os #cpu #scheduling",
    0
  );

  // 9. Materials (RPS & Repositori Modul Kuliah)
  db.prepare("DELETE FROM materials").run();
  const insertMaterial = db.prepare(`
    INSERT OR REPLACE INTO materials (id, course_id, folder_category, title, file_name, file_path, file_size, file_type, meeting_no, ai_indexed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertMaterial.run("mat-1", "cs-1", "RPS & Silabus", "RPS Kecerdasan Buatan & Sistem Pakar 2026", "RPS_IF3104_AI_2026.pdf", "/docs/rps/IF3104_RPS.pdf", "1.8 MB", "pdf", 0, 1);
  insertMaterial.run("mat-2", "cs-1", "Pertemuan Teori", "Slide Pertemuan 01: Pengantar AI & Agen Cerdas", "IF3104_P01_Intelligent_Agents.pdf", "/docs/materi/IF3104_P01.pdf", "4.2 MB", "pdf", 1, 1);
  insertMaterial.run("mat-3", "cs-1", "Pertemuan Teori", "Slide Pertemuan 02: Uninformed & Heuristic Search", "IF3104_P02_Search_Algorithms.pdf", "/docs/materi/IF3104_P02.pdf", "5.1 MB", "pdf", 2, 1);
  insertMaterial.run("mat-4", "cs-2", "RPS & Silabus", "RPS Sistem Operasi 2026", "RPS_IF3101_OS_2026.pdf", "/docs/rps/IF3101_RPS.pdf", "1.5 MB", "pdf", 0, 1);
  insertMaterial.run("mat-5", "cs-2", "Pertemuan Teori", "Slide Pertemuan 03: Process Scheduling & Threads", "IF3101_P03_Scheduling.pdf", "/docs/materi/IF3101_P03.pdf", "3.9 MB", "pdf", 3, 1);

  // 10. AI Quiz Data
  db.prepare("DELETE FROM ai_quizzes").run();
  const insertQuiz = db.prepare(`
    INSERT OR REPLACE INTO ai_quizzes (id, user_id, course_id, material_id, title, score, total_questions, questions_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertQuiz.run(
    "qz-1",
    "student-1",
    "cs-1",
    "mat-3",
    "Active Recall H-3: Algoritma A* & Heuristik Admissible",
    90,
    5,
    JSON.stringify([
      {
        question: "Apa syarat utama suatu fungsi heuristik h(n) disebut admissible?",
        options: ["h(n) > biaya riil", "h(n) <= biaya riil (tidak pernah overestimasi)", "h(n) selalu konstan", "h(n) bernilai negatif"],
        answer: 1,
        explanation: "Admissible heuristic tidak boleh memprediksi biaya lebih besar dari biaya riil ke tujuan agar pencarian A* optimal."
      }
    ]),
    "completed"
  );
});

seed();
console.log("Database successfully seeded with 11 tables and full academic dataset!");
