import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "akademikos.db");

const globalForDb = globalThis as unknown as {
  db: InstanceType<typeof Database> | undefined;
};

const db = globalForDb.db ?? new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 10000");

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export const DEFAULT_USER_ID = "user-me";

// ==========================================
// ACADEMIC OS SCHEMA (CLEAN PERSONAL INSTANCE)
// ==========================================
db.exec(`
  -- 1. Master Mahasiswa (Single Personal User)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nim TEXT NOT NULL,
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
    academic_advisor TEXT,
    target_gpa TEXT,
    max_sks INTEGER DEFAULT 24,
    photo_url TEXT
  );

  -- 3. Master Dosen Pengampu & Pembimbing
  CREATE TABLE IF NOT EXISTS lecturers (
    id TEXT PRIMARY KEY,
    nip TEXT,
    name TEXT NOT NULL,
    title TEXT,
    email TEXT,
    phone_wa TEXT,
    room TEXT,
    photo_url TEXT,
    department TEXT
  );

  -- 4. Master Mata Kuliah
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    sks INTEGER NOT NULL DEFAULT 3,
    semester INTEGER NOT NULL DEFAULT 1,
    primary_lecturer_id TEXT REFERENCES lecturers(id),
    room_default TEXT,
    lms_url TEXT,
    color_theme TEXT DEFAULT 'blue'
  );

  -- 5. Relasi Registrasi Matkul
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
    user_id TEXT NOT NULL DEFAULT 'user-me' REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id),
    course TEXT NOT NULL,
    code TEXT,
    room TEXT,
    day TEXT NOT NULL,
    start_hour INTEGER NOT NULL,
    duration_hours INTEGER NOT NULL DEFAULT 2,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    lecturer TEXT,
    status TEXT DEFAULT 'upcoming',
    attendance_status TEXT DEFAULT 'pending',
    class_type TEXT DEFAULT 'reguler'
  );

  -- 7. Task Management
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'user-me' REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id),
    title TEXT NOT NULL,
    course TEXT NOT NULL,
    deadline_label TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    difficulty TEXT DEFAULT 'sedang',
    task_type TEXT DEFAULT 'tugas',
    notes TEXT,
    completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 8. RPS & File Storage Metadata
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    folder_category TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size TEXT,
    file_type TEXT NOT NULL,
    meeting_no INTEGER DEFAULT 0,
    ai_indexed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 9. AI Quiz Mandiri
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

// Migration safety: Ensure new columns exist in existing tables
try {
  const profCols: any[] = db.prepare("PRAGMA table_info(profile)").all();
  if (!profCols.some((c) => c.name === "photo_url")) {
    db.exec("ALTER TABLE profile ADD COLUMN photo_url TEXT;");
  }
  if (!profCols.some((c) => c.name === "no_ai_mode")) {
    db.exec("ALTER TABLE profile ADD COLUMN no_ai_mode INTEGER DEFAULT 0;");
  }
} catch (e) {
  console.log("Migration check profile:", e);
}

try {
  const taskCols: any[] = db.prepare("PRAGMA table_info(tasks)").all();
  if (!taskCols.some((c) => c.name === "difficulty")) {
    db.exec("ALTER TABLE tasks ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'sedang';");
  }
} catch (e) {
  console.log("Migration check tasks:", e);
}

// Clean initialization: Single personal student profile, zero mock tasks/schedules
export function initializeCleanDatabase() {
  const init = db.transaction(() => {
    const existingUser = db.prepare("SELECT id FROM users WHERE id = ?").get(DEFAULT_USER_ID);
    if (!existingUser) {
      db.prepare(`
        INSERT INTO users (id, name, nim, email, avatar)
        VALUES (?, ?, ?, ?, ?)
      `).run(DEFAULT_USER_ID, "Mahasiswa", "23/------/TK/00000", "mahasiswa@mail.ugm.ac.id", "");
    }

    const existingProfile = db.prepare("SELECT user_id FROM profile WHERE user_id = ?").get(DEFAULT_USER_ID);
    if (!existingProfile) {
      db.prepare(`
        INSERT INTO profile (user_id, name, nim, email, major, faculty, university, semester, academic_advisor, target_gpa, max_sks, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        DEFAULT_USER_ID,
        "Mahasiswa",
        "23/------/TK/00000",
        "mahasiswa@mail.ugm.ac.id",
        "Teknik Informatika",
        "Fakultas Teknik",
        "Universitas Gadjah Mada",
        5,
        "",
        "3.80",
        24,
        ""
      );
    }
  });
  init();
}

// Reset entire database to a pure 100% clean state (0 tasks, 0 schedules, 0 courses)
export function resetCleanDatabase() {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM tasks;
    DELETE FROM schedule;
    DELETE FROM materials;
    DELETE FROM ai_quizzes;
    DELETE FROM course_enrollments;
    DELETE FROM courses;
    DELETE FROM lecturers;
    PRAGMA foreign_keys = ON;
  `);
}

export function resetUserData(_userId?: string) {
  resetCleanDatabase();
}

export function seedFullDatabase() {
  // Kept for backward compatibility if needed, but keeps data clean
  resetCleanDatabase();
}

// Run clean initialization
initializeCleanDatabase();

export default db;
