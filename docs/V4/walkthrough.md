# Walkthrough: AkademikOS Prototype V4.0.4

Prototipe interaktif **AkademikOS** di:
[`/home/rasaaa/Project/Hackathon/Joinst/prototype/`](file:///home/rasaaa/Project/Hackathon/Joinst/prototype/)
telah diperbarui dan beroperasi penuh pada port 3001 ([http://localhost:3001](http://localhost:3001)) sesuai seluruh arahan dan sketsa tangan pengguna (`media_1790914403562.png`).

---

## 1. Ringkasan Fitur Baru & Penyempurnaan V4.0.4

### A. Pemadatan Timeline Jadwal Perkuliahan (Minimal Scroll)
- **Mode 1 Hari:**
  - Baris jam kosong kini menggunakan tinggi ramping (`min-h-[26px] py-0.5`).
  - Baris dengan kelas atau tugas mengembang secara adaptif (`min-h-[44px]`).
  - Seluruh rentang 1-24 jam dapat dipantau tanpa harus melakukan scroll panjang.
- **Mode 7 Hari:**
  - Tinggi baris jam dipadatkan menjadi `min-h-[38px]`.
  - Matriks sepekan penuh (07.00 - 21.00 WIB) muat rapi dalam kontainer monitor.

### B. Filter Checkbox Tampilan Jadwal Terintegrasi
- Ditambahkan filter interaktif di bar navigasi jadwal:
  - `[✓] Mata Kuliah`
  - `[✓] Tenggat Tugas`
  - `[✓] Agenda & Ujian`
- Filter ini berlaku serentak pada mode 1 Hari, 7 Hari, dan 1 Bulan.

### C. Tab Kalender & Agenda Dilengkapi Panel TaskList
- Menerapkan layout 2 kolom:
  - **Sisi Kiri (Col-8):** Kalender jadwal perkuliahan lega dengan filter tampilan.
  - **Sisi Kanan (Col-4):** Panel **Tenggat Tugas** (TaskList) dengan checklist animasi halus, filter status, dan tombol `+ Tugas`.

### D. RPS & Materi: Scroll Terisolasi (Independent Scrolling)
- Kontainer RPS dikunci pada ketinggian layar (`h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] overflow-hidden`).
- **Kolom Kiri (Folder Tree ~40%):** Pinned / statis dengan pencarian tetap dan scroll mandiri.
- **Kolom Kanan (Pratinjau Dokumen ~60%):** Hanya area lembar silabus akademik yang di-scroll saat membaca matriks 14 pertemuan.

### E. Catatan Kuliah: Penamaan Berkas Akademik Bersih
- Menghapus pola penamaan id acak seperti `catatan_7752`.
- Saat membuat catatan baru, otomatis diberikan nama berkas berurutan yang rapi seperti `Catatan_Kuliah_Sesi_[N].md`.

### F. Redesain Total "Matkul dan Dosen" Sesuai Sketsa Tangan
- **Grid 3 Kolom Responsif (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`):**
  - **Sisi Kiri:** Foto dosen persegi panjang potret (`w-24 h-32 rounded-2xl object-cover`).
  - **Sisi Kanan:**
    - Nama Mata Kuliah (posisi atas, tebal).
    - Nama Dosen (teks kecil di bawahnya).
    - Jam Kelas & Ruangan bersandingan (`Kamis, 09.00 • Lab AI - Gd. C 302`).
    - Presensi bersih tanpa angka/persentase (`Presensi Aman` / `Perhatian Presensi`).
    - Tombol aksi kondisional:
      - Ikon **WhatsApp** (link ke `https://wa.me/...`) jika nomor ada.
      - Ikon **LMS Kampus** (link ke eLOK) jika URL ada.
      - Ikon **Edit** untuk membuka modal sunting.
- **Modal Interaktif:**
  - Klik kartu membuka modal untuk mengedit detail mata kuliah dan dosen.
  - Tombol **"+ Tambah Mata Kuliah & Dosen"** untuk mendaftarkan mata kuliah baru.

### G. Penghapusan Radar Presensi
- Menu "Radar Presensi" telah dihapus dari bilah navigasi (`Sidebar.tsx`) dan tampilan sistem (`OtherViews.tsx`).

---

## 2. Pembaruan V4.0.5: Skema 11 Tabel Database & Pengayaan Data Dummy

### A. Ekspansi Arsitektur Database Menjadi 11 Tabel Relasional
Database lokal SQLite (`prototype/data/akademikos.db`) yang sebelumnya hanya memiliki 4 tabel prototipe kini telah diekspansi menjadi **11 tabel relasional penuh** sesuai PRD Hackathon JOINTS UGM:
1. `users` (3 akun mahasiswa: Faras Pratama, Arya Wicaksono, Nabila Putri)
2. `profile` (Profil akademik lengkap TI & Tekkom FT UGM)
3. `lecturers` (8 dosen pengampu dengan kontak WA, email, ruang, foto)
4. `courses` (8 mata kuliah semester 5 dengan kode, SKS, LMS ELOK UGM, dan warna M3)
5. `course_enrollments` (8 pendaftaran KRS dengan Smart Attendance Burn-Down ambang batas 75%)
6. `schedule` (15 slot jadwal perkuliahan lengkap dari **Senin sampai Sabtu**)
7. `tasks` (14 tugas akademik bervariasi: praktik, dokumen, presentasi, tugas mandiri dari H-0 s.d. H-10)
8. `attendance_logs` (21 log presensi mahasiswa per pertemuan)
9. `materials` (5 berkas RPS dan materi PDF)
10. `notes` (3 catatan kuliah format Markdown Obsidian)
11. `ai_quizzes` (Sesi kuis simulasi active recall RAG AI)

### B. Penyelesaian Isu Tampilan Data Kalender
- **Format Deadline:** Menyelesaikan pencocokan tanggal tugas pada matriks 7-hari menggunakan pencocokan prefix tanggal (`.startsWith(datePrefix)`).
- **Row Khusus Tenggat:** Menambahkan baris penanda tenggat tugas langsung di bawah header hari kalender 7-hari.
- **Rentang Jam Lengkap:** Matriks kalender kini mencakup jam 06.00 hingga 22.00 WIB.

### C. Dokumentasi Lengkap ERD
- Berkas dokumentasi ERD lengkap telah dibuat di [`erd-database.md`](file:///home/rasaaa/Project/Hackathon/Joinst/prototype/docs/V4/erd-database.md) dan disinkronkan ke Obsidian Vault di `/home/rasaaa/Vault/02 - Projects/Hackathon/Joinst/Document/V4/erd-database.md`.

---

## 3. Status Verifikasi

| Komponen / Fitur | Status | Catatan Teknis |
|---|---|---|
| **Next.js Production Build** | **PASS** | 8/8 routes compiled sukses via Turbopack tanpa error tipe |
| **Server HTTP (Port 3001)** | **PASS** | Berjalan di `http://localhost:3001` (merespons 200 OK) |
| **Database SQLite (11 Tabel)** | **PASS** | `data/akademikos.db` terisi 11 tabel & 94 total record |
| **API Tasks (`/api/tasks`)** | **PASS** | Mengembalikan 14 tasks akademik (H-0 s.d. H-10) |
| **API Schedule (`/api/schedule`)** | **PASS** | Mengembalikan 15 jadwal kelas dari Senin s.d. Sabtu |
| **Git Safety** | **PASS** | Tidak ada `git add`, `git commit`, atau `git push` yang dijalankan |
| **Anti-Slop Compliance** | **PASS** | 0 emoji, 0 gradient sintetis, tampilan M3 minimalis |
