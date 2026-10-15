const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SOURCE_DIR = '/home/rasaaa/Collage life/Semester 3';
const TARGET_STORAGE_DIR = path.join(__dirname, '../public/storage');
const DB_PATH = path.join(__dirname, '../data/akademikos.db');

if (!fs.existsSync(TARGET_STORAGE_DIR)) {
  fs.mkdirSync(TARGET_STORAGE_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const COURSE_MAP = {
  'Analisis dan desain sistem informasi': {
    id: 'adsi-3',
    code: 'ADSI301',
    name: 'Analisis dan Desain Sistem Informasi',
    lecturer: 'Dr. Anita',
    room: 'GSG202',
    sks: 3,
    color: 'emerald'
  },
  'Grafika Komputer': {
    id: 'grafika-3',
    code: 'GRAF302',
    name: 'Grafika Komputer',
    lecturer: 'Anggi Mardiyono',
    room: 'GSG211',
    sks: 3,
    color: 'purple'
  },
  'Kecerdasan buatan': {
    id: 'ai-3',
    code: 'AI303',
    name: 'Kecerdasan Buatan',
    lecturer: 'Rizki Elisa',
    room: 'AA301',
    sks: 3,
    color: 'indigo'
  },
  'Manajemen Proyek TIK': {
    id: 'mptik-3',
    code: 'MPTIK304',
    name: 'Manajemen Proyek TIK',
    lecturer: 'Bambang Warsuta',
    room: 'GSG203',
    sks: 3,
    color: 'amber'
  },
  'Metode Numerik': {
    id: 'metnum-3',
    code: 'NUM305',
    name: 'Metode Numerik',
    lecturer: 'Fajar Septian',
    room: 'GSG211',
    sks: 3,
    color: 'cyan'
  },
  'Pemprograman Basis Data': {
    id: 'pbd-3',
    code: 'PBD306',
    name: 'Pemrograman Basis Data',
    lecturer: 'Risna Sari',
    room: 'PUT311',
    sks: 3,
    color: 'blue'
  },
  'Pemprograman Visual': {
    id: 'visual-3',
    code: 'VIS307',
    name: 'Pemrograman Visual',
    lecturer: 'Chairul Fikri',
    room: 'AA303',
    sks: 3,
    color: 'rose'
  },
  'Pemprograman Web Lanjut': {
    id: 'web-lanjut-3',
    code: 'PWL308',
    name: 'Pemrograman Web Lanjut',
    lecturer: 'Asep Taufik',
    room: 'AA301',
    sks: 3,
    color: 'orange'
  },
  'Sistem Terdistribusi': {
    id: 'sisdis-3',
    code: 'SISDIS309',
    name: 'Sistem Terdistribusi',
    lecturer: 'Dr. Defiana',
    room: 'AA304',
    sks: 3,
    color: 'teal'
  },
  'UIUX': {
    id: 'desain-ui-ux',
    code: 'UIUX310',
    name: 'Desain UI/UX',
    lecturer: 'Iwan Sonjaya',
    room: 'GSG210',
    sks: 3,
    color: 'blue'
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function detectDocType(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes('rps')) return 'RPS Silabus';
  if (lower.includes('modul praktikum') || lower.includes('praktikum')) return 'Modul Praktikum';
  if (lower.includes('modul ajar') || lower.includes('modul')) return 'Modul Kuliah';
  if (lower.includes('quiz') || lower.includes('kuis')) return 'Kuis & Evaluasi';
  if (lower.includes('tugas') || lower.includes('project charter') || lower.includes('wbs') || lower.includes('gantt')) return 'Tugas & Proyek';
  if (lower.includes('pertemuan') || lower.includes('kuliah') || lower.includes('lesson') || lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'Slide Kuliah';
  return 'Dokumen Perkuliahan';
}

function extractSessionNo(fileName) {
  const match = fileName.match(/(?:pertemuan|kuliah|lesson|modul)\s*[-_]?\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

function sanitizeForStorage(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function main() {
  console.log('🚀 Starting ingestion of Semester 3 course materials...');

  // 1. Sync courses and lecturers
  for (const [folderName, info] of Object.entries(COURSE_MAP)) {
    // Upsert lecturer
    const lecturerId = 'lec-' + info.id;
    db.prepare(`
      INSERT OR REPLACE INTO lecturers (id, name, room, department)
      VALUES (?, ?, ?, 'Jurusan Teknik Informatika & Komputer (TIK) PNJ')
    `).run(lecturerId, info.lecturer, info.room);

    // Upsert course
    db.prepare(`
      INSERT OR REPLACE INTO courses (id, code, name, sks, semester, primary_lecturer_id, room_default, color_theme)
      VALUES (?, ?, ?, ?, 3, ?, ?, ?)
    `).run(info.id, info.code, info.name, info.sks, lecturerId, info.room, info.color);

    // Upsert enrollment
    db.prepare(`
      INSERT OR REPLACE INTO course_enrollments (id, user_id, course_id, academic_year, target_grade, total_meetings, attended_count)
      VALUES (?, 'user-me', ?, '2026/2027 Ganjil', 'A', 16, 4)
    `).run('enr-' + info.id, info.id);
  }

  console.log('✅ Registered 10 Semester 3 courses into courses table.');

  let totalCopied = 0;
  let totalDocsInserted = 0;

  const folderEntries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });

  for (const entry of folderEntries) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;
    const courseMeta = COURSE_MAP[folderName];
    if (!courseMeta) {
      console.log(`⚠️ Unrecognized course folder: "${folderName}", skipping.`);
      continue;
    }

    const folderPath = path.join(SOURCE_DIR, folderName);
    const files = fs.readdirSync(folderPath);

    console.log(`\n📂 Processing: ${courseMeta.name} (${files.length} files)`);

    for (const file of files) {
      if (file.startsWith('.')) continue;

      const sourceFilePath = path.join(folderPath, file);
      const stat = fs.statSync(sourceFilePath);
      if (!stat.isFile()) continue;

      const ext = path.extname(file).replace('.', '').toLowerCase() || 'bin';
      const cleanFileName = sanitizeForStorage(file);
      const targetStorageFileName = `sem3_${courseMeta.id}_${cleanFileName}`;
      const targetFilePath = path.join(TARGET_STORAGE_DIR, targetStorageFileName);

      // Copy file
      fs.copyFileSync(sourceFilePath, targetFilePath);
      totalCopied++;

      const docType = detectDocType(file);
      const sessionNo = extractSessionNo(file);
      const topic = file.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      const fileSize = formatBytes(stat.size);
      const docId = `doc-sem3-${courseMeta.id}-${cleanFileName.substring(0, 32)}`;
      const matId = `mat-sem3-${courseMeta.id}-${cleanFileName.substring(0, 32)}`;
      const publicPath = `/api/storage/${targetStorageFileName}`;

      // Insert into uploaded_documents
      db.prepare(`
        INSERT OR REPLACE INTO uploaded_documents (
          id, course_name, file_name, file_path, file_type, doc_type, session_no, topic, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        docId,
        courseMeta.name,
        file,
        publicPath,
        ext,
        docType,
        sessionNo,
        topic
      );

      // Insert into materials
      db.prepare(`
        INSERT OR REPLACE INTO materials (
          id, course_id, folder_category, title, file_name, file_path, file_size, file_type, meeting_no, ai_indexed, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      `).run(
        matId,
        courseMeta.id,
        docType,
        topic,
        file,
        publicPath,
        fileSize,
        ext,
        sessionNo || 1
      );

      totalDocsInserted++;
    }
  }

  console.log(`\n🎉 Ingestion complete!`);
  console.log(`📦 Copied ${totalCopied} files to prototype/public/storage/`);
  console.log(`📊 Inserted/updated ${totalDocsInserted} document records in database.`);
}

main();
