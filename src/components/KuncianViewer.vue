<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ocrIndex from '../generated/ocr-index.json';


const library = ref(null);
const activeTopicName = ref(null);
const query = ref('');
const imageQuery = ref('');   // search teks di dalam gambar (OCR)
const selectedImage = ref(null);
const loading = ref(true);
const error = ref('');

// --- New States ---
const isDarkMode = computed(() => document.documentElement.classList.contains('dark'));
const favorites = ref([]);
const zoomLevel = ref(1);
const showScrollTop = ref(false);
const copySuccess = ref(false);

const encodePublicPathSegment = (segment) => {
  return encodeURI(segment)
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F');
};

const encodeFilePath = (filePath) => filePath.split('/').map(encodePublicPathSegment).join('/');

const fileUrl = (file) => file.url || `/content/kuncian/${encodeFilePath(file.path)}`;

const imageFiles = computed(() => activeTopic.value?.files.filter((file) => file.type === 'image') || []);
const documentFiles = computed(() => activeTopic.value?.files.filter((file) => file.type !== 'image') || []);

const filteredTopics = computed(() => {
  const keyword = query.value.trim().toLowerCase();

  if (!library.value) {
    return [];
  }

  let topics = library.value.topics;

  if (keyword) {
    topics = topics.filter((topic) => topic.name.toLowerCase().includes(keyword));
  }

  return topics.slice().sort((a, b) => {
    const aLabel = (isTopicNew(a) || isTopicUpdated(a)) ? 2 : 0;
    const bLabel = (isTopicNew(b) || isTopicUpdated(b)) ? 2 : 0;
    const aFav = favorites.value.includes(a.name) ? 1 : 0;
    const bFav = favorites.value.includes(b.name) ? 1 : 0;
    return (bLabel + bFav) - (aLabel + aFav);
  });
});

const activeTopic = computed(() => {
  if (!library.value || activeTopicName.value === null) {
    return null;
  }
  return filteredTopics.value.find((topic) => topic.name === activeTopicName.value) || null;
});

// true = mode picker (belum pilih topik), false = mode viewer
const isPickerMode = computed(() => activeTopicName.value === null);

const filteredImages = computed(() => {
  const kw = imageQuery.value.trim().toLowerCase();
  if (!kw) return imageFiles.value;

  return imageFiles.value.filter((file) => {
    // Key in ocrIndex is: "TopicName/filename.ext"
    const key = `${activeTopic.value?.name ?? ''}/${file.name}`;
    const text = ocrIndex[key] ?? '';
    return text.includes(kw) || file.name.toLowerCase().includes(kw);
  });
});
const filteredDocuments = computed(() => documentFiles.value);

const selectedImageIndex = computed(() => {
  if (!selectedImage.value) {
    return -1;
  }

  return filteredImages.value.findIndex((file) => file.path === selectedImage.value.path);
});

const selectedImagePosition = computed(() => {
  if (selectedImageIndex.value < 0) {
    return '';
  }

  return `${selectedImageIndex.value + 1} / ${filteredImages.value.length}`;
});

const stats = computed(() => {
  if (!library.value) {
    return [
      { label: 'Topik', value: '...' },
      { label: 'File', value: '...' },
      { label: 'Gambar', value: '...' }
    ];
  }

  const totalImages = library.value.topics.reduce((sum, topic) => sum + topic.images, 0);

  return [
    { label: 'Topik', value: library.value.totalTopics },
    { label: 'File', value: library.value.totalFiles },
    { label: 'Gambar', value: totalImages }
  ];
});

function setActiveTopic(topicName) {
  activeTopicName.value = topicName;
  selectedImage.value = null;
  imageQuery.value = '';  // reset image search saat ganti topik

  const url = new URL(window.location);
  url.searchParams.set('q', topicName);
  window.history.pushState({}, '', url);
}

function backToPicker() {
  activeTopicName.value = null;
  selectedImage.value = null;
  query.value = '';

  const url = new URL(window.location);
  url.searchParams.delete('q');
  window.history.pushState({}, '', url);
}

function selectImage(file) {
  selectedImage.value = file;
  zoomLevel.value = 1;
}

function selectImageByIndex(index) {
  const images = filteredImages.value;

  if (images.length === 0) {
    return;
  }

  const normalizedIndex = (index + images.length) % images.length;
  selectedImage.value = images[normalizedIndex];
  zoomLevel.value = 1;
}

function showPreviousImage() {
  if (!selectedImage.value) {
    return;
  }

  selectImageByIndex(selectedImageIndex.value - 1);
}

function showNextImage() {
  if (!selectedImage.value) {
    return;
  }

  selectImageByIndex(selectedImageIndex.value + 1);
}

function closeImage() {
  selectedImage.value = null;
  zoomLevel.value = 1;
}

function handleKeydown(event) {
  if (!selectedImage.value) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    showPreviousImage();
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    showNextImage();
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeImage();
  }
}

async function loadLibrary() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/library.json');

    if (!response.ok) {
      throw new Error('Data kuncian belum bisa dibaca.');
    }

    library.value = await response.json();

    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');

    if (q && library.value.topics.some((t) => t.name === q)) {
      // URL sudah mengandung topik — langsung masuk viewer
      activeTopicName.value = q;
    } else {
      // Tidak ada query → tampilkan picker, bersihkan URL
      activeTopicName.value = null;
      const url = new URL(window.location);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url);
    }
  } catch (loadError) {
    error.value = loadError.message;
  } finally {
    loading.value = false;
  }
}

function handlePopState() {
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  if (q && library.value?.topics.some((t) => t.name === q)) {
    activeTopicName.value = q;
    selectedImage.value = null;
  } else {
    // Tombol back browser → kembali ke picker
    activeTopicName.value = null;
    selectedImage.value = null;
  }
}

// --- New Functions ---

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function isTopicNew(topic) {
  if (!topic.createdAtMs) return false;
  return (Date.now() - topic.createdAtMs) < THREE_DAYS_MS;
}

function isTopicUpdated(topic) {
  if (!topic.updatedAtMs || !topic.createdAtMs) return false;
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const isModifiedRecently = (Date.now() - topic.updatedAtMs) < THREE_DAYS_MS;
  const isActuallyUpdated = (topic.updatedAtMs - topic.createdAtMs) > ONE_HOUR_MS;
  return isModifiedRecently && isActuallyUpdated && !isTopicNew(topic);
}

function toggleFavorite(topicName, event) {
  event.stopPropagation();
  if (favorites.value.includes(topicName)) {
    favorites.value = favorites.value.filter((t) => t !== topicName);
  } else {
    favorites.value.push(topicName);
  }
  localStorage.setItem('kuncian_favorites', JSON.stringify(favorites.value));
}

function highlight(text) {
  const keyword = query.value.trim();
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-[#fff3c4] dark:bg-[#b08e12] dark:text-white text-inherit rounded px-0.5">$1</mark>');
}

function copyTopicLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2000);
  });
}

function zoomIn() {
  if (zoomLevel.value < 5) zoomLevel.value += 0.5;
}

function zoomOut() {
  if (zoomLevel.value > 0.5) zoomLevel.value -= 0.5;
}

function resetZoom() {
  zoomLevel.value = 1;
}

async function copyImage() {
  if (!selectedImage.value) return;
  try {
    const response = await fetch(fileUrl(selectedImage.value));
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    alert('Gambar berhasil disalin ke clipboard!');
  } catch (err) {
    console.error('Gagal menyalin gambar:', err);
    alert('Gagal menyalin gambar. Pastikan browser Anda mendukung fitur ini.');
  }
}

function downloadImage() {
  if (!selectedImage.value) return;
  const a = document.createElement('a');
  a.href = fileUrl(selectedImage.value);
  a.download = selectedImage.value.name || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function handleScroll() {
  showScrollTop.value = window.scrollY > 300;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

onMounted(() => {
  loadLibrary();
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('scroll', handleScroll);

  const savedFavs = localStorage.getItem('kuncian_favorites');
  if (savedFavs) favorites.value = JSON.parse(savedFavs);
  // Dark mode state is applied globally by BaseLayout + AppHub
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('popstate', handlePopState);
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <section class="saw-dots mx-auto flex w-full max-w-7xl flex-col gap-7 rounded-[2rem] px-1 py-3 sm:px-3">
    <!-- Back button: ke home jika picker, ke picker jika viewer -->
    <div class="flex justify-start px-4 sm:px-6">
      <a
        v-if="isPickerMode"
        href="/"
        class="kv-back-btn"
        aria-label="Kembali ke halaman utama"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Kembali
      </a>
      <button
        v-else
        class="kv-back-btn"
        aria-label="Kembali ke daftar topik"
        @click="backToPicker"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Semua Topik
      </button>
    </div>

    <header class="relative overflow-hidden rounded-[2rem] px-2 pb-2 pt-3 text-center sm:px-5">
      <div class="mx-auto mb-2 flex w-fit items-end justify-center gap-2">
        <span class="h-10 w-10 rotate-[-10deg] rounded-full border-2 border-[#222] bg-[#f6bd4f] shadow-saw-sm dark:border-black dark:shadow-[5px_5px_0_#000]"></span>
        <span class="h-8 w-12 rotate-[6deg] rounded-[45%] border-2 border-[#222] bg-white shadow-saw-sm dark:bg-slate-300 dark:border-black dark:shadow-[5px_5px_0_#000]"></span>
        <span class="h-11 w-11 rotate-[12deg] rounded-2xl border-2 border-[#222] bg-[#c9b6ea] shadow-saw-sm dark:border-black dark:shadow-[5px_5px_0_#000]"></span>
      </div>

      <p class="font-display text-5xl font-black tracking-[-0.08em] text-[#3c3c3c] dark:text-white sm:text-7xl">
        kuncian.lo
      </p>
      <h1 class="mx-auto mt-6 max-w-3xl font-display text-3xl font-black leading-tight tracking-[-0.04em] text-[#111] dark:text-slate-100 sm:text-5xl">
        Solusi singkat menuju pulang cepat!
      </h1>
      <p class="mx-auto mt-4 max-w-2xl font-monoish text-sm leading-7 text-slate-700 dark:text-slate-400 sm:text-base">
        Kerjaan banyak? Mau pulang cepat, tapi ada kuncian? Tenang... kini hadir kuncian.lo! 😎
      </p>

      <div class="mt-7 flex flex-wrap justify-center gap-4">
        <button @click="scrollToId('daftar-topik')" class="saw-button bg-[#9bd7e5] px-7 py-3 font-monoish text-lg font-bold text-[#111] dark:border-black dark:shadow-[5px_5px_0_#000]">
          Lihat topik
        </button>
        <button @click="scrollToId('dokumen-panel')" class="saw-button bg-[#f6bd4f] px-7 py-3 font-monoish text-lg font-bold text-[#111] dark:border-black dark:shadow-[5px_5px_0_#000]">
          Dokumen
        </button>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-4xl grid-cols-3 gap-3 px-2">
      <div
        v-for="item in stats"
        :key="item.label"
        class="saw-card bg-white dark:bg-slate-800 dark:border-black dark:shadow-[5px_5px_0_#000] px-3 py-4 text-center"
      >
        <p class="font-monoish text-3xl font-bold text-[#111] dark:text-white">{{ item.value }}</p>
        <p class="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">{{ item.label }}</p>
      </div>
    </div>

    <div v-if="error" class="saw-card bg-[#ffe4e9] dark:bg-red-950 dark:border-black dark:shadow-[5px_5px_0_#000] p-5 font-monoish text-red-800 dark:text-red-300">
      {{ error }}
    </div>

    <!-- ══ PICKER MODE: Tampilkan grid semua topik ══ -->
    <div v-if="isPickerMode">

      <!-- Search bar -->
      <div class="mx-auto max-w-2xl px-2">
        <label class="block">
          <span class="mb-2 block font-monoish text-sm font-bold text-[#222] dark:text-slate-200">Cari topik</span>
          <input
            v-model="query"
            class="saw-input w-full px-4 py-3 font-monoish text-sm font-bold text-[#222] dark:text-white dark:bg-slate-700 dark:border-black outline-none transition focus:bg-[#fff3c4] dark:focus:bg-slate-600"
            placeholder="Contoh: cuti, absensi..."
            type="search"
          />
        </label>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mt-6 grid gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="n in 8" :key="n" class="h-36 animate-pulse rounded-2xl border-2 border-[#222] dark:border-slate-700 bg-white dark:bg-slate-700 shadow-saw-sm"></div>
      </div>

      <!-- Topic card grid -->
      <div v-else class="mt-4 grid gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <button
          v-for="topic in filteredTopics"
          :key="topic.name"
          class="kv-topic-card group text-left"
          type="button"
          @click="setActiveTopic(topic.name)"
        >
          <!-- Badge row -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-1.5">
              <span v-if="isTopicNew(topic)" class="text-[9px] uppercase tracking-wider font-bold bg-[#f5a6b4] text-[#111] px-1.5 py-0.5 rounded border border-[#222] dark:border-black leading-none">New</span>
              <span v-else-if="isTopicUpdated(topic)" class="text-[9px] uppercase tracking-wider font-bold bg-[#9bd7e5] text-[#111] px-1.5 py-0.5 rounded border border-[#222] dark:border-black leading-none">Update</span>
              <span v-if="favorites.includes(topic.name)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f6bd4f" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
            </div>
            <span class="rounded-full border-2 border-[#222] dark:border-black bg-[#9bd7e5] dark:bg-slate-600 px-2.5 py-0.5 font-monoish text-xs font-bold text-[#111] dark:text-white">
              {{ topic.total }}
            </span>
          </div>

          <!-- Topic name -->
          <p class="text-sm font-black leading-snug text-[#111] dark:text-white line-clamp-2 flex-1" v-html="highlight(topic.name)"></p>

          <!-- Meta -->
          <p class="mt-2 font-monoish text-xs text-slate-500 dark:text-slate-400">
            {{ topic.images }} gambar · {{ topic.documents }} dokumen
          </p>

          <!-- Arrow CTA -->
          <div class="mt-3 flex items-center gap-1 font-monoish text-xs font-bold text-[#111] dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Buka
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        </button>

        <div v-if="filteredTopics.length === 0" class="col-span-full rounded-xl border-2 border-[#222] dark:border-black bg-white dark:bg-slate-700 p-6 text-center font-monoish text-sm text-slate-600 dark:text-slate-300 shadow-saw-sm">
          Tidak ada topik yang cocok dengan pencarian.
        </div>
      </div>
    </div>

    <!-- ══ VIEWER MODE: Sidebar + konten topik ══ -->
    <div v-else class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside id="daftar-topik" class="saw-card-soft dark:bg-slate-800 dark:border-black dark:shadow-[5px_5px_0_#000] h-fit p-4 lg:sticky lg:top-5">
        <label class="block">
          <span class="mb-2 block font-monoish text-sm font-bold text-[#222] dark:text-slate-200">Cari topik</span>
          <input
            v-model="query"
            class="saw-input w-full px-4 py-3 font-monoish text-sm font-bold text-[#222] dark:text-white dark:bg-slate-700 dark:border-black outline-none transition focus:bg-[#fff3c4] dark:focus:bg-slate-600"
            placeholder="Contoh: cuti, absensi..."
            type="search"
          />
        </label>

        <div class="mt-5 max-h-[68vh] space-y-3 overflow-auto pr-1 pb-2">
          <button
            v-for="topic in filteredTopics"
            :key="topic.name"
            class="group flex w-full items-center justify-between border-2 border-[#222] dark:border-black px-4 py-3 text-left transition"
            :class="activeTopic?.name === topic.name ? 'translate-x-[3px] translate-y-[3px] rounded-xl bg-[#f6bd4f] shadow-pressed dark:shadow-[3px_3px_0_#000]' : 'rounded-xl bg-white dark:bg-slate-700 shadow-saw-sm dark:shadow-[5px_5px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed'"
            type="button"
            @click="setActiveTopic(topic.name)"
          >
            <div class="flex items-start gap-3 min-w-0">
              <button @click="(e) => toggleFavorite(topic.name, e)" class="mt-0.5 shrink-0 transition-colors" aria-label="Pin Topic">
                <svg v-if="favorites.includes(topic.name)" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#f6bd4f" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dark:stroke-white dark:fill-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
              <span class="min-w-0 flex-1">
                <span class="flex flex-wrap items-center gap-1.5 text-sm font-black leading-tight text-[#111] dark:text-white">
                  <span class="truncate" v-html="highlight(topic.name)"></span>
                  <span v-if="isTopicNew(topic)" class="text-[9px] uppercase tracking-wider font-bold bg-[#f5a6b4] text-[#111] px-1.5 py-0.5 rounded border border-[#222] dark:border-black shrink-0 leading-none shadow-saw-sm">New</span>
                  <span v-else-if="isTopicUpdated(topic)" class="text-[9px] uppercase tracking-wider font-bold bg-[#9bd7e5] text-[#111] px-1.5 py-0.5 rounded border border-[#222] dark:border-black shrink-0 leading-none shadow-saw-sm">Update</span>
                </span>
                <span class="mt-1.5 block font-monoish text-xs text-slate-600 dark:text-slate-400">
                  {{ topic.images }} gambar · {{ topic.documents }} dokumen
                </span>
              </span>
            </div>
            <span
              class="rounded-full border-2 border-[#222] dark:border-black px-3 py-1 font-monoish text-xs font-bold shrink-0 ml-2"
              :class="activeTopic?.name === topic.name ? 'bg-white dark:bg-slate-800 text-[#111] dark:text-white' : 'bg-[#9bd7e5] dark:bg-slate-600 text-[#111] dark:text-white group-hover:bg-[#f5a6b4] dark:group-hover:bg-slate-500'"
            >
              {{ topic.total }}
            </span>
          </button>

          <div v-if="!loading && filteredTopics.length === 0" class="rounded-xl border-2 border-[#222] dark:border-black bg-white dark:bg-slate-700 p-4 font-monoish text-sm text-slate-600 dark:text-slate-300 shadow-saw-sm dark:shadow-[5px_5px_0_#000]">
            Tidak ada topik yang cocok dengan pencarian.
          </div>
        </div>
      </aside>

      <section class="min-w-0">
        <div class="saw-card bg-[#fffdf8] dark:bg-slate-800 dark:border-black dark:shadow-[5px_5px_0_#000] p-4 sm:p-6">
          <div class="flex flex-col gap-3 border-b-2 border-[#222] dark:border-slate-700 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div class="min-w-0 flex-1">
              <p class="font-monoish text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Topik aktif</p>
              <div class="flex items-center gap-3 mt-1">
                <h2 class="font-display text-3xl font-black tracking-[-0.04em] text-[#111] dark:text-white sm:text-4xl truncate">
                  {{ activeTopic?.name || 'Pilih topik...' }}
                </h2>
                <button 
                  v-if="activeTopic" 
                  @click="copyTopicLink"
                  class="shrink-0 p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 shadow-saw-sm dark:shadow-[3px_3px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed transition"
                  :title="copySuccess ? 'Tersalin!' : 'Copy Link Topik'"
                >
                  <svg v-if="!copySuccess" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-[#111] dark:text-white"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
              </div>
            </div>

            <button
              v-if="activeTopic"
              class="saw-button inline-flex shrink-0 items-center justify-center bg-[#f5a6b4] px-5 py-3 font-monoish text-sm font-bold text-[#111] dark:border-black dark:shadow-[5px_5px_0_#000]"
              @click="scrollToId('dokumen-panel')"
            >
              Lihat dokumen
            </button>
          </div>

          <div v-if="loading" class="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 6" :key="item" class="h-64 animate-pulse rounded-2xl border-2 border-[#222] dark:border-slate-700 bg-white dark:bg-slate-700 shadow-saw-sm dark:shadow-[5px_5px_0_#000]"></div>
          </div>

          <div v-else class="py-4">
            <!-- Image text search bar -->
            <div class="mb-4 flex items-center gap-2 rounded-xl border-2 border-[#222] dark:border-black bg-[#fffdf8] dark:bg-slate-700 px-4 py-2.5 shadow-saw-sm dark:shadow-[3px_3px_0_#000]">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-slate-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                v-model="imageQuery"
                type="search"
                placeholder="Cari teks di dalam gambar..."
                class="w-full bg-transparent font-monoish text-sm font-bold text-[#222] dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span v-if="imageQuery" class="shrink-0 rounded-full bg-[#9bd7e5] dark:bg-slate-600 border-2 border-[#222] dark:border-black px-2 py-0.5 font-monoish text-xs font-bold text-[#111] dark:text-white">
                {{ filteredImages.length }} hasil
              </span>
              <span v-else class="shrink-0 rounded-full bg-[#eef8f5] dark:bg-slate-600 border border-[#ccc] dark:border-black px-2 py-0.5 font-monoish text-xs text-slate-400 dark:text-slate-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>
                OCR
              </span>
            </div>

            <div v-if="filteredImages.length > 0" class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
              <button
                v-for="file in filteredImages"
                :key="file.path"
                class="group overflow-hidden rounded-2xl border-2 border-[#222] dark:border-black bg-white dark:bg-slate-700 p-2 text-left shadow-saw-sm dark:shadow-[5px_5px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed"
                type="button"
                @click="selectImage(file)"
              >
                <div class="aspect-[5/3] overflow-hidden rounded-xl border-2 border-[#222] dark:border-slate-900 bg-[#fffaf0] dark:bg-slate-800">
                  <img
                    class="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-105"
                    :alt="file.name"
                    loading="lazy"
                    :src="fileUrl(file)"
                  />
                </div>
                <div class="px-2 py-3">
                  <p class="line-clamp-2 text-xs font-black text-[#111] dark:text-white">{{ file.name }}</p>
                  <p class="mt-1 font-monoish text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{{ file.extension }}</p>
                </div>
              </button>
            </div>

            <div v-else class="rounded-2xl border-2 border-[#222] dark:border-black bg-[#eef8f5] dark:bg-slate-700 p-8 text-center font-monoish text-slate-600 dark:text-slate-300 shadow-saw-sm dark:shadow-[5px_5px_0_#000]">
              <span v-if="imageQuery">
                Tidak ada gambar yang mengandung teks "<strong>{{ imageQuery }}</strong>". Coba kata kunci lain.
              </span>
              <span v-else>Belum ada gambar di topik ini.</span>
            </div>
          </div>
        </div>

        <div
          v-if="activeTopic"
          class="saw-card mt-6 bg-[#eef8f5] dark:bg-slate-800 dark:border-black dark:shadow-[5px_5px_0_#000] p-4 sm:p-6"
        >
          <div id="dokumen-panel" class="mb-4 flex items-center justify-between gap-3">
            <div>
              <p class="font-monoish text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">File pendukung</p>
              <h3 class="font-display text-2xl font-black tracking-[-0.03em] text-[#111] dark:text-white">Dokumen</h3>
            </div>
            <span class="rounded-full border-2 border-[#222] dark:border-black bg-white dark:bg-slate-700 px-4 py-2 font-monoish text-sm font-bold text-[#111] dark:text-white">
              {{ filteredDocuments.length }} file
            </span>
          </div>

          <div v-if="filteredDocuments.length > 0" class="grid gap-3 md:grid-cols-2">
            <a
              v-for="file in filteredDocuments"
              :key="file.path"
              class="flex items-center gap-3 rounded-2xl border-2 border-[#222] dark:border-black bg-white dark:bg-slate-700 p-4 shadow-saw-sm dark:shadow-[5px_5px_0_#000] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed"
              :href="fileUrl(file)"
              target="_blank"
              rel="noreferrer"
            >
              <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#222] dark:border-black bg-[#f6bd4f] font-monoish text-xs font-bold text-[#111]">
                {{ file.extension }}
              </span>
              <span class="min-w-0">
                <span class="line-clamp-1 break-all text-sm font-black text-[#111] dark:text-white" :title="file.name">{{ file.name }}</span>
                <span class="mt-1 block font-monoish text-xs font-bold text-slate-500 dark:text-slate-400">Buka di tab baru</span>
              </span>
            </a>
          </div>

          <div v-else class="rounded-2xl border-2 border-[#222] dark:border-black bg-white dark:bg-slate-700 p-6 text-center font-monoish text-slate-600 dark:text-slate-300 shadow-saw-sm dark:shadow-[5px_5px_0_#000]">
            Tidak ada dokumen yang cocok.
          </div>
        </div>
      </section>
    </div>

    <!-- Image Viewer Modal -->
    <div
      v-if="selectedImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#222]/90 dark:bg-slate-950/90 p-2 sm:p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="closeImage"
    >
      <div class="flex max-h-full w-full max-w-7xl flex-col overflow-hidden rounded-2xl border-2 border-[#222] dark:border-black bg-white dark:bg-slate-800 shadow-saw dark:shadow-[8px_8px_0_#000]">
        
        <!-- Header / Toolbar Modal -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-3 border-b-2 border-[#222] dark:border-black bg-[#f6bd4f] dark:bg-[#b08e12] px-4 py-3 text-[#111] dark:text-white">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black">{{ selectedImage.name }}</p>
            <p class="font-monoish text-xs text-slate-800 dark:text-slate-200">{{ selectedImage.topic }} · {{ selectedImagePosition }}</p>
          </div>
          
          <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <!-- Action buttons (Zoom, Copy, Download) -->
            <button @click="zoomOut" class="p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition shadow-pressed dark:shadow-[2px_2px_0_#000]" title="Zoom Out">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
            </button>
            <button @click="resetZoom" class="p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition shadow-pressed dark:shadow-[2px_2px_0_#000]" title="Reset Zoom">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM12 8v8M8 12h8"/></svg>
            </button>
            <button @click="zoomIn" class="p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition shadow-pressed dark:shadow-[2px_2px_0_#000]" title="Zoom In">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
            <div class="w-px h-6 bg-black/20 dark:bg-white/20 mx-1"></div>
            <button @click="copyImage" class="p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition shadow-pressed dark:shadow-[2px_2px_0_#000]" title="Copy Image">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
            <button @click="downloadImage" class="p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition shadow-pressed dark:shadow-[2px_2px_0_#000]" title="Download Image">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>

            <!-- Navigation and Close -->
            <div class="hidden sm:flex shrink-0 items-center gap-2 ml-2">
              <button class="saw-button bg-[#9bd7e5] dark:bg-slate-600 dark:border-black dark:text-white px-4 py-2 font-monoish text-sm font-bold" type="button" @click="showPreviousImage">Prev</button>
              <button class="saw-button bg-[#f5a6b4] dark:bg-slate-600 dark:border-black dark:text-white px-4 py-2 font-monoish text-sm font-bold" type="button" @click="showNextImage">Next</button>
              <button class="saw-button bg-white dark:bg-slate-700 dark:border-black dark:text-white px-4 py-2 font-monoish text-sm font-bold" type="button" @click="closeImage">Tutup</button>
            </div>
            
            <button class="sm:hidden ml-1 p-2 border-2 border-[#222] dark:border-black rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition shadow-pressed" type="button" @click="closeImage">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Image Content (Overflow Auto for Panning) -->
        <div class="relative flex-1 overflow-auto bg-[#fffaf0] dark:bg-slate-900" style="min-height: 60vh;">
          <div class="flex min-h-full min-w-full p-4" :class="zoomLevel > 1 ? 'items-start justify-start' : 'items-center justify-center'">
            <img 
              class="transition-transform duration-200" 
              :class="zoomLevel > 1 ? 'h-auto max-h-none w-auto max-w-none' : 'max-h-[75vh] max-w-full object-contain'"
              :style="{ transform: `scale(${zoomLevel})`, transformOrigin: zoomLevel > 1 ? 'top left' : 'center' }"
              :alt="selectedImage.name" 
              :src="fileUrl(selectedImage)" 
            />
          </div>
        </div>
        
        <!-- Mobile Bottom Navigation -->
        <div class="flex sm:hidden items-center justify-between border-t-2 border-[#222] dark:border-black bg-white dark:bg-slate-800 p-3">
          <button class="saw-button bg-[#9bd7e5] dark:bg-slate-600 dark:border-black dark:text-white px-5 py-2 font-monoish text-sm font-bold" type="button" @click="showPreviousImage">Prev</button>
          <span class="font-monoish text-sm font-bold text-[#111] dark:text-white">{{ selectedImagePosition }}</span>
          <button class="saw-button bg-[#f5a6b4] dark:bg-slate-600 dark:border-black dark:text-white px-5 py-2 font-monoish text-sm font-bold" type="button" @click="showNextImage">Next</button>
        </div>
      </div>
    </div>

    <!-- Scroll To Top FAB -->
    <button
      v-show="showScrollTop"
      @click="scrollToTop"
      class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#222] bg-[#f6bd4f] shadow-saw-sm transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed dark:border-black dark:shadow-[5px_5px_0_#000]"
      aria-label="Scroll to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    </button>
  </section>
</template>

<style scoped>
.kv-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--ink);
  text-decoration: none;
  background: white;
  border: 2px solid var(--ink);
  border-radius: 9px;
  padding: 0.32em 0.8em;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 130ms ease, box-shadow 130ms ease;
}
.kv-back-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}
html.dark .kv-back-btn {
  background: #1e293b;
  color: #f1f5f9;
  border-color: #000;
  box-shadow: 3px 3px 0 #000;
}
html.dark .kv-back-btn:hover {
  box-shadow: 1px 1px 0 #000;
}

.kv-topic-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid var(--ink);
  border-radius: 16px;
  padding: 1rem 1.1rem;
  box-shadow: 5px 5px 0 var(--ink);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
}
.kv-topic-card:hover {
  transform: translate(2px, 2px);
  box-shadow: 3px 3px 0 var(--ink);
  background: rgba(246, 189, 79, 0.12);
}
html.dark .kv-topic-card {
  background: #1e293b;
  border-color: #000;
  box-shadow: 5px 5px 0 #000;
  color: #f8fafc;
}
html.dark .kv-topic-card:hover {
  background: rgba(246, 189, 79, 0.08);
  box-shadow: 3px 3px 0 #000;
}
</style>
