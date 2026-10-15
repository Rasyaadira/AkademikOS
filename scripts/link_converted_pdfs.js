const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const STORAGE_DIR = path.join(__dirname, '../public/storage');
const DB_PATH = path.join(__dirname, '../data/akademikos.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Ensure columns exist
try {
  const cols = db.prepare("PRAGMA table_info(uploaded_documents)").all();
  if (!cols.some((c) => c.name === "preview_path")) {
    db.exec("ALTER TABLE uploaded_documents ADD COLUMN preview_path TEXT;");
  }
  if (!cols.some((c) => c.name === "original_path")) {
    db.exec("ALTER TABLE uploaded_documents ADD COLUMN original_path TEXT;");
  }
} catch (e) {
  console.log("Migration error:", e);
}

function main() {
  console.log('🔗 Linking converted PDF previews to documents...');

  const docs = db.prepare('SELECT * FROM uploaded_documents').all();
  let updatedCount = 0;

  for (const doc of docs) {
    const ext = path.extname(doc.file_name).toLowerCase();
    const baseName = path.basename(doc.file_name, ext);
    const originalPath = doc.file_path;

    if (ext === '.pdf') {
      db.prepare(`
        UPDATE uploaded_documents
        SET preview_path = ?, original_path = ?
        WHERE id = ?
      `).run(originalPath, originalPath, doc.id);
      continue;
    }

    // Candidate 1: Direct name with .pdf
    const directPdfName = `${baseName}.pdf`;
    const directPdfPath = path.join(STORAGE_DIR, directPdfName);

    // Candidate 2: Storage file name converted to .pdf
    const storageFileName = path.basename(doc.file_path);
    const storageExt = path.extname(storageFileName);
    const convertedStorageName = `${path.basename(storageFileName, storageExt)}.pdf`;
    const convertedStoragePath = path.join(STORAGE_DIR, convertedStorageName);

    let foundPdfFile = null;

    if (fs.existsSync(directPdfPath)) {
      foundPdfFile = directPdfName;
      // Copy to convertedStorageName as well for URL safety
      if (!fs.existsSync(convertedStoragePath)) {
        try {
          fs.copyFileSync(directPdfPath, convertedStoragePath);
          foundPdfFile = convertedStorageName;
        } catch {}
      }
    } else if (fs.existsSync(convertedStoragePath)) {
      foundPdfFile = convertedStorageName;
    }

    if (foundPdfFile) {
      const previewUrl = `/api/storage/${encodeURIComponent(foundPdfFile)}`;
      db.prepare(`
        UPDATE uploaded_documents
        SET preview_path = ?, original_path = ?
        WHERE id = ?
      `).run(previewUrl, originalPath, doc.id);
      updatedCount++;
      console.log(`✅ [${doc.course_name}] ${doc.file_name} -> Preview: ${foundPdfFile}`);
    } else {
      console.log(`⚠️ No PDF found for: ${doc.file_name}`);
    }
  }

  console.log(`\n🎉 Successfully linked ${updatedCount} converted Office documents with high-fidelity PDF previews!`);
}

main();
