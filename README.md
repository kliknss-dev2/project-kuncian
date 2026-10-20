# kotak.lo

**kotak.lo** adalah *multi-tool web application* modern yang dibangun menggunakan Astro dan Vue 3. Proyek ini mengusung gaya desain **Brutalist / Neo-Brutalism** dengan dukungan *Dark Mode* penuh. *Styling* menggunakan **Tailwind CSS** yang dipadukan dengan CSS kustom (variabel warna & kelas utilitas di `global.css`) serta `<style scoped>` di tiap komponen.

## Fitur Utama

### 1. JSON Formatter & Editor 🔧
Alat pengeditan JSON yang sangat interaktif dan tangguh, menggunakan **CodeMirror 6**:
- **Format & Minify:** Rapikan JSON kotor atau kompres (*minify*) hanya dengan satu klik.
- **Smart IDE Editor:** Dilengkapi dengan *syntax highlighting*, *bracket matching*, dan *code folding* layaknya editor profesional (VS Code).
- **Free Form Edit:** Anda dapat mengedit teks JSON baik di panel *Raw Input* maupun *Formatted Output* dengan sinkronisasi *real-time*.
- **Compare Mode:** Bandingkan dua tab JSON secara visual (*diffing* hijau/merah) untuk menemukan perubahan sekecil apapun.
- **Multi-Tab Support:** Buka banyak file JSON sekaligus dalam sesi yang sama (tersimpan rapi di `localStorage`).

### 2. Kuncian Viewer 📚
Penampil dokumen dan modul interaktif yang disajikan dari folder statis.
- Menyajikan struktur dokumen PDF/Gambar per folder.
- Pengalaman membaca (viewer) yang halus dan responsif.
- **Pencarian teks di gambar** berbasis OCR (Tesseract, bahasa Indonesia + Inggris).
- Label topik **baru** / **diperbarui** berdasarkan riwayat git, serta topik favorit.

### 3. Lorem Ipsum Generator 📝
Generate teks *placeholder* lorem ipsum berdasarkan jumlah kata, kalimat, atau paragraf.

## Menjalankan Proyek Secara Lokal

Pastikan Anda sudah menginstal Node.js di sistem Anda.

```bash
# 1. Instal dependencies
npm install

# 2. Generate metadata topik (wajib sekali setelah clone, file ini tidak di-commit)
node scripts/generate-topic-meta.mjs

# 3. Jalankan development server
npm run dev
```

Buka URL yang ditampilkan di terminal, biasanya `http://localhost:4321`.

## Menambah Topik Kuncian

1. Buat folder baru di `public/content/kuncian/<Nama Topik>/` lalu masukkan gambar & dokumennya.
2. Jalankan `npm run ocr` untuk memperbarui indeks pencarian teks (`src/generated/ocr-index.json`). Proses ini inkremental — gambar yang sudah terindeks akan dilewati.
3. Commit folder baru beserta `ocr-index.json`. Tanggal dibuat/diperbarui topik diambil dari riwayat git saat build.

## Struktur Proyek

- **`/src/components/`**: Komponen UI utama berbasis Vue (seperti `JsonFormatter.vue`, `KuncianViewer.vue`, `LoremGenerator.vue`, dll).
- **`/src/styles/`**: CSS global (direktif Tailwind, variabel warna, palet desain Brutalisme, dan tema gelap).
- **`/src/lib/library.js`** & **`/src/pages/api/`**: Pembaca folder kuncian dan endpoint `/api/library.json`.
- **`/scripts/`**: Script generate metadata topik (dari git) dan indeks OCR.
- **`/public/content/kuncian/`**: Menyimpan folder-folder dokumen untuk Kuncian Viewer.
- **`package.json`**: Menampung daftar dependensi modern seperti `vue-codemirror`, `@codemirror/lang-json`, `tesseract.js`, dan konfigurasi Astro.
