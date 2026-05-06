# Kuncian Viewer

Project Astro + Vue + Tailwind untuk melihat daftar kunci jawaban yang sudah dibagi per-folder.

## Menjalankan

```bash
npm install
npm run dev
```

Lalu buka URL yang ditampilkan Astro, biasanya `http://localhost:4321`.

## Struktur

- Folder topik disimpan di `public/content/kuncian/`, misalnya `public/content/kuncian/SOP Absensi/`.
- App membaca folder tersebut melalui endpoint lokal.
- Gambar dan dokumen disajikan sebagai static file dari folder `public`.
