import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { extractScheduleWithGemini } from "@/lib/gemini";
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
      // Cari pola "Kelas: TI 1A" atau "KELAS: 3A" dsb
      const classMatches = extractedText.matchAll(/(?:Kelas|KELAS|Kls)\s*:\s*([A-Za-z0-9\-\/ ]{2,20})/gi);
      for (const m of classMatches) {
        const cleanName = m[1].trim().replace(/[\r\n].*$/, "").trim();
        if (cleanName && !detectedClasses.includes(cleanName) && cleanName.length < 25) {
          detectedClasses.push(cleanName);
        }
      }

      // Deteksi semester
      const semMatch = extractedText.match(/(?:SEMESTER|Semester)\s+(?:GANJIL|GENAP|GASAL|[0-9]+)\s+[0-9]{4}\/[0-9]{4}/i);
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
        hasMultipleClasses: detectedClasses.length > 1,
      });
    }

    // 3. Ekstraksi Jadwal Kuliah dengan Gemini AI
    let courses: any[] = [];

    if (isImage) {
      const imageBuffer = fs.readFileSync(filePath);
      const base64Data = imageBuffer.toString("base64");
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

      courses = await extractScheduleWithGemini(base64Data, {
        className,
        semesterYear: semesterYear || detectedSemester,
        isImageBase64: true,
        mimeType,
      });
    } else if (extractedText) {
      let textForGemini = extractedText;
      if (className) {
        const classRegex = new RegExp(`(?:Kelas|KELAS)\\s*:\\s*${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i");
        const parts = extractedText.split(classRegex);
        if (parts.length > 1) {
          const afterClass = parts[1];
          const nextClassParts = afterClass.split(/(?:Kelas|KELAS)\s*:/i);
          textForGemini = `KELAS: ${className}\n` + nextClassParts[0];
        }
      }

      courses = await extractScheduleWithGemini(textForGemini, {
        className: className || detectedClasses[0] || "Semua Kelas",
        semesterYear: semesterYear || detectedSemester,
      });
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
