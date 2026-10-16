import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { extractScheduleWithGemini } from "@/lib/gemini";
import { extractScheduleWithDeepSeek } from "@/lib/deepseek";
import db, { DEFAULT_USER_ID } from "@/lib/db";

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let filePath = "";
    let className = "";
    let semesterYear = "";
    let detectClassesOnly = false;
    let autoSave = false;

    const storageDir = path.join(process.cwd(), "public/storage");
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      className = (formData.get("className") as string) || "";
      semesterYear = (formData.get("semesterYear") as string) || "";
      detectClassesOnly = formData.get("detectClassesOnly") === "true";
      autoSave = formData.get("autoSave") === "true";
      const directFilePath = formData.get("filePath") as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const targetPath = path.join(storageDir, safeName);
        fs.writeFileSync(targetPath, buffer);
        filePath = targetPath;
      } else if (directFilePath) {
        const base = path.basename(directFilePath);
        filePath = path.join(storageDir, base);
      }
    } else {
      const body = await req.json();
      const inputPath = body.filePath || "";
      className = body.className || "";
      semesterYear = body.semesterYear || "";
      detectClassesOnly = !!body.detectClassesOnly;
      autoSave = !!body.autoSave;

      const base = path.basename(inputPath);
      filePath = path.join(storageDir, base);
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Berkas tidak ditemukan atau belum diunggah." },
        { status: 400 }
      );
    }

    const ext = path.extname(filePath).toLowerCase();
    const isPdf = ext === ".pdf";
    const isImage = [".jpg", ".jpeg", ".png", ".webp"].includes(ext);

    // 1. Ekstraksi Teks jika PDF
    let extractedText = "";
    if (isPdf) {
      try {
        const { stdout } = await execFileAsync("pdftotext", [filePath, "-"]);
        extractedText = stdout;
      } catch (err: any) {
        console.warn("pdftotext error, fallback to empty text:", err);
      }
    }

    // 2. Deteksi Kelas jika ada banyak halaman / jadwal jurusan
    const detectedClasses: string[] = [];
    let detectedSemester = "";

    if (extractedText) {
      // Cari pola "Kelas: TI 1A" atau "KELAS: 3A" atau "Rombel: 3A"
      const classMatches = extractedText.matchAll(/(?:Kelas|KELAS|Kls|Rombel|Tingkat)\s*[:\-\s]\s*([A-Za-z0-9\-\/ ]{1,15})/gi);
      for (const m of classMatches) {
        const cleanName = m[1].trim().replace(/[\r\n].*$/, "").trim();
        if (cleanName && !detectedClasses.includes(cleanName) && cleanName.length <= 15) {
          detectedClasses.push(cleanName);
        }
      }

      // Cari token kelas umum di kampus (contoh: 3A, 3B, TI-3A, IF-2B, dsb)
      const tokenMatches = extractedText.matchAll(/\b([1-8]\s*[A-E]|[A-Za-z]{2,5}[-\s]?[1-8][A-E]?)\b/g);
      for (const tm of tokenMatches) {
        const val = tm[1].trim().toUpperCase();
        if (val && !detectedClasses.includes(val) && detectedClasses.length < 8 && val.length <= 10) {
          detectedClasses.push(val);
        }
      }

      // Deteksi semester
      const semMatch = extractedText.match(/(?:SEMESTER|Semester)\s+(?:GANJIL|GENAP|GASAL|[0-9IVX]+)(?:\s+[0-9]{4}\/[0-9]{4})?/i);
      if (semMatch) {
        detectedSemester = semMatch[0].trim();
      }
    }

    // Jika client hanya meminta daftar kelas untuk ditampilkan di dropdown/pertanyaan
    if (detectClassesOnly) {
      return NextResponse.json({
        success: true,
        detectedClasses,
        detectedSemester: detectedSemester || "Semester Ganjil 2026/2027",
        hasMultipleClasses: detectedClasses.length > 0,
      });
    }

    // 3. Ekstraksi Jadwal Kuliah dengan DeepSeek AI (Primary) dan Gemini (Fallback)
    let courses: any[] = [];

    // Jika target kelas dipilih "Semua Kelas" atau kosong, jangan filter kelas
    const isExtractAll = !className || className.toLowerCase().includes("semua") || className.toLowerCase().includes("seluruh");
    const targetClass = isExtractAll ? "" : className;

    if (extractedText) {
      // 3A. Gunakan DeepSeek AI (Sangat cepat & handal untuk ekstraksi teks/PDF)
      try {
        let textForAi = extractedText;
        if (targetClass) {
          const classRegex = new RegExp(`(?:Kelas|KELAS)\\s*:\\s*${targetClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i");
          const parts = extractedText.split(classRegex);
          if (parts.length > 1) {
            const afterClass = parts[1];
            const nextClassParts = afterClass.split(/(?:Kelas|KELAS)\s*:/i);
            textForAi = `KELAS: ${targetClass}\n` + nextClassParts[0];
          }
        }

        courses = await extractScheduleWithDeepSeek(textForAi, {
          className: targetClass,
          semesterYear: semesterYear || detectedSemester,
        });
      } catch (dsErr) {
        console.warn("DeepSeek extraction failed, falling back to Gemini:", dsErr);
      }

      // 3B. Fallback ke Gemini jika DeepSeek gagal atau kosong
      if (courses.length === 0) {
        try {
          courses = await extractScheduleWithGemini(extractedText, {
            className: targetClass || detectedClasses[0] || "Semua Kelas",
            semesterYear: semesterYear || detectedSemester,
          });
        } catch (gemErr) {
          console.warn("Gemini extraction also failed:", gemErr);
        }
      }
    } else if (isImage) {
      // 3C. Jika berkas berupa foto/gambar, gunakan Gemini multimodal
      try {
        const imageBuffer = fs.readFileSync(filePath);
        const base64Data = imageBuffer.toString("base64");
        const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

        courses = await extractScheduleWithGemini(base64Data, {
          className: targetClass,
          semesterYear: semesterYear || detectedSemester,
          isImageBase64: true,
          mimeType,
        });
      } catch (imgErr) {
        console.warn("Gemini multimodal image extraction failed:", imgErr);
      }
    }

    // 3D. Jika AI mengembalikan kosong karena jadwal tabel rapat, coba cari baris mata kuliah heuristik
    if (courses.length === 0 && extractedText) {
      const lines = extractedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const possibleDays = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
      let curDay = "senin";
      for (const line of lines) {
        const lower = line.toLowerCase();
        for (const d of possibleDays) {
          if (lower.startsWith(d)) curDay = d;
        }
        // Cari jam format 08.00 - 10.30
        const timeMatch = line.match(/(\d{1,2}[:.]\d{2})\s*[-–s.d]+\s*(\d{1,2}[:.]\d{2})/);
        if (timeMatch && line.length > 15) {
          const rawCourse = line.replace(timeMatch[0], "").replace(/senin|selasa|rabu|kamis|jumat|sabtu/gi, "").trim();
          if (rawCourse.length >= 3 && !rawCourse.toLowerCase().includes("istirahat")) {
            courses.push({
              course: rawCourse.slice(0, 40).replace(/^[0-9.\-\s]+/, ""),
              day: curDay,
              startTime: timeMatch[1].replace(":", "."),
              endTime: timeMatch[2].replace(":", "."),
              room: "Ruang Kuliah",
              lecturer: "Dosen Pengampu",
              sks: 3,
            });
          }
        }
      }
    }

    // 4. Auto-save ke Database jika diminta
    const savedSchedules = [];
    if (autoSave && courses.length > 0) {
      for (const item of courses) {
        const id = `sch-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const startHour = parseInt(item.startTime?.split(".")[0] || "8", 10);
        const endHour = parseInt(item.endTime?.split(".")[0] || "10", 10);
        const duration = Math.max(1, endHour - startHour);

        // Upsert course
        const courseSlug = item.course.toLowerCase().replace(/[^a-z0-9]/g, "-") || `c-${Date.now()}`;
        const existingCourse = db.prepare("SELECT id FROM courses WHERE name = ?").get(item.course);
        if (!existingCourse) {
          db.prepare(`
            INSERT OR IGNORE INTO courses (id, code, name, sks, primary_lecturer_id, room_default)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(courseSlug, "", item.course, item.sks || 3, null, item.room || "Ruang Kuliah");
        }

        db.prepare(`
          INSERT INTO schedule (
            id, user_id, course_id, course, code, room,
            start_hour, duration_hours, start_time, end_time,
            lecturer, day, status, attendance_status, class_type
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          DEFAULT_USER_ID,
          courseSlug,
          item.course,
          "",
          item.room || "Ruang Kuliah",
          startHour,
          duration,
          item.startTime,
          item.endTime,
          item.lecturer || "Dosen Pengampu",
          item.day,
          "upcoming",
          "pending",
          "reguler"
        );

        savedSchedules.push({
          id,
          userId: DEFAULT_USER_ID,
          course: item.course,
          room: item.room || "Ruang Kuliah",
          lecturer: item.lecturer || "Dosen Pengampu",
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime,
          startHour,
          durationHours: duration,
        });
      }
    }

    return NextResponse.json({
      success: true,
      className: className || detectedClasses[0] || "",
      semesterYear: semesterYear || detectedSemester,
      detectedClasses,
      courses,
      savedCount: savedSchedules.length,
      savedSchedules: autoSave ? savedSchedules : undefined,
    });
  } catch (error: any) {
    console.error("Error in parse-schedule route:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses berkas jadwal." },
      { status: 500 }
    );
  }
}
