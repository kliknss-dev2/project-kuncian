# kotak.lo

**kotak.lo** adalah *multi-tool web application* modern yang dibangun menggunakan Astro dan Vue 3. Proyek ini mengusung gaya desain **Brutalist / Neo-Brutalism** dengan dukungan *Dark Mode* penuh, serta menggunakan *Vanilla CSS* kustom tanpa *framework styling* eksternal.

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

## Menjalankan Proyek Secara Lokal

Pastikan Anda sudah menginstal Node.js di sistem Anda.

```bash
# 1. Instal dependencies
npm install

# 2. Jalankan development server
npm run dev
```

Buka URL yang ditampilkan di terminal, biasanya `http://localhost:4321`.

## Struktur Proyek

- **`/src/components/`**: Komponen UI utama berbasis Vue (seperti `JsonFormatter.vue`, `JsonTreeNode.vue`, dll).
- **`/src/styles/`**: File *Vanilla CSS* kustom yang menyimpan variabel warna, palet desain Brutalisme, dan tema gelap.
- **`/public/content/kuncian/`**: Menyimpan folder-folder dokumen untuk Kuncian Viewer.
- **`package.json`**: Menampung daftar dependensi modern seperti `vue-codemirror`, `@codemirror/lang-json`, dan konfigurasi Astro.
