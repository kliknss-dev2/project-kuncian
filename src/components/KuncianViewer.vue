<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

const library = ref(null);
const activeTopicName = ref('');
const query = ref('');
const selectedImage = ref(null);
const loading = ref(true);
const error = ref('');

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

  if (!keyword) {
    return library.value.topics;
  }

  return library.value.topics.filter((topic) => {
    const topicMatch = topic.name.toLowerCase().includes(keyword);
    const fileMatch = topic.files.some((file) => file.name.toLowerCase().includes(keyword));

    return topicMatch || fileMatch;
  });
});

const activeTopic = computed(() => {
  if (!library.value) {
    return null;
  }

  return filteredTopics.value.find((topic) => topic.name === activeTopicName.value) || filteredTopics.value[0] || library.value.topics[0];
});

const filteredImages = computed(() => filterFiles(imageFiles.value));
const filteredDocuments = computed(() => filterFiles(documentFiles.value));

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

function filterFiles(files) {
  const keyword = query.value.trim().toLowerCase();

  if (!keyword) {
    return files;
  }

  return files.filter((file) => {
    return file.name.toLowerCase().includes(keyword) || file.topic.toLowerCase().includes(keyword);
  });
}

function setActiveTopic(topicName) {
  activeTopicName.value = topicName;
  selectedImage.value = null;
}

function selectImage(file) {
  selectedImage.value = file;
}

function selectImageByIndex(index) {
  const images = filteredImages.value;

  if (images.length === 0) {
    return;
  }

  const normalizedIndex = (index + images.length) % images.length;
  selectedImage.value = images[normalizedIndex];
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
    activeTopicName.value = library.value.topics[0]?.name || '';
  } catch (loadError) {
    error.value = loadError.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadLibrary();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <section class="saw-dots mx-auto flex w-full max-w-7xl flex-col gap-7 rounded-[2rem] px-1 py-3 sm:px-3">
    <header class="relative overflow-hidden rounded-[2rem] px-2 pb-2 pt-3 text-center sm:px-5">
      <div class="mx-auto mb-2 flex w-fit items-end justify-center gap-2">
        <span class="h-10 w-10 rotate-[-10deg] rounded-full border-2 border-[#222] bg-[#f6bd4f] shadow-saw-sm"></span>
        <span class="h-8 w-12 rotate-[6deg] rounded-[45%] border-2 border-[#222] bg-white shadow-saw-sm"></span>
        <span class="h-11 w-11 rotate-[12deg] rounded-2xl border-2 border-[#222] bg-[#c9b6ea] shadow-saw-sm"></span>
      </div>

      <p class="font-display text-5xl font-black tracking-[-0.08em] text-[#3c3c3c] sm:text-7xl">
        kuncian.lo
      </p>
      <h1 class="mx-auto mt-6 max-w-3xl font-display text-3xl font-black leading-tight tracking-[-0.04em] text-[#111] sm:text-5xl">
        Jembatan cepat menuju pulang cepat!
      </h1>
      <p class="mx-auto mt-4 max-w-2xl font-monoish text-sm leading-7 text-slate-700 sm:text-base">
        Kerjaan banyak? Mau pulang cepat, tapi ada kuncian? Tenang, kini hadir kuncian.lo! 😎
      </p>

      <div class="mt-7 flex flex-wrap justify-center gap-4">
        <a class="saw-button bg-[#9bd7e5] px-7 py-3 font-monoish text-lg font-bold text-[#111]" href="#daftar-topik">
          Lihat topik
        </a>
        <a class="saw-button bg-[#f6bd4f] px-7 py-3 font-monoish text-lg font-bold text-[#111]" href="#dokumen-panel">
          Dokumen
        </a>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-4xl grid-cols-3 gap-3 px-2">
      <div
        v-for="item in stats"
        :key="item.label"
        class="saw-card bg-white px-3 py-4 text-center"
      >
        <p class="font-monoish text-3xl font-bold text-[#111]">{{ item.value }}</p>
        <p class="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600">{{ item.label }}</p>
      </div>
    </div>

    <div v-if="error" class="saw-card bg-[#ffe4e9] p-5 font-monoish text-red-800">
      {{ error }}
    </div>

    <div class="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside id="daftar-topik" class="saw-card-soft h-fit p-4 lg:sticky lg:top-5">
        <label class="block">
          <span class="mb-2 block font-monoish text-sm font-bold text-[#222]">Cari topik atau file</span>
          <input
            v-model="query"
            class="saw-input w-full px-4 py-3 font-monoish text-sm font-bold text-[#222] outline-none transition focus:bg-[#fff3c4]"
            placeholder="Contoh: cuti, absensi..."
            type="search"
          />
        </label>

        <div class="mt-5 max-h-[68vh] space-y-3 overflow-auto pr-1">
          <button
            v-for="topic in filteredTopics"
            :key="topic.name"
            class="group flex w-full items-center justify-between border-2 border-[#222] px-4 py-3 text-left transition"
            :class="activeTopic?.name === topic.name ? 'translate-x-[3px] translate-y-[3px] rounded-xl bg-[#f6bd4f] shadow-pressed' : 'rounded-xl bg-white shadow-saw-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed'"
            type="button"
            @click="setActiveTopic(topic.name)"
          >
            <span>
              <span class="block text-sm font-black leading-tight text-[#111]">{{ topic.name }}</span>
              <span class="mt-1 block font-monoish text-xs text-slate-600">
                {{ topic.images }} gambar · {{ topic.documents }} dokumen
              </span>
            </span>
            <span
              class="rounded-full border-2 border-[#222] px-3 py-1 font-monoish text-xs font-bold"
              :class="activeTopic?.name === topic.name ? 'bg-white text-[#111]' : 'bg-[#9bd7e5] text-[#111] group-hover:bg-[#f5a6b4]'"
            >
              {{ topic.total }}
            </span>
          </button>

          <div v-if="!loading && filteredTopics.length === 0" class="rounded-xl border-2 border-[#222] bg-white p-4 font-monoish text-sm text-slate-600 shadow-saw-sm">
            Tidak ada topik yang cocok dengan pencarian.
          </div>
        </div>
      </aside>

      <section class="min-w-0">
        <div class="saw-card bg-[#fffdf8] p-4 sm:p-6">
          <div class="flex flex-col gap-3 border-b-2 border-[#222] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="font-monoish text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Topik aktif</p>
              <h2 class="mt-1 font-display text-3xl font-black tracking-[-0.04em] text-[#111] sm:text-4xl">
                {{ activeTopic?.name || 'Memuat data...' }}
              </h2>
            </div>

            <a
              v-if="activeTopic"
              class="saw-button inline-flex items-center justify-center bg-[#f5a6b4] px-5 py-3 font-monoish text-sm font-bold text-[#111]"
              href="#dokumen-panel"
            >
              Lihat dokumen
            </a>
          </div>

          <div v-if="loading" class="grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 6" :key="item" class="h-64 animate-pulse rounded-2xl border-2 border-[#222] bg-white shadow-saw-sm"></div>
          </div>

          <div v-else class="py-6">
            <div v-if="filteredImages.length > 0" class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
              <button
                v-for="file in filteredImages"
                :key="file.path"
                class="group overflow-hidden rounded-2xl border-2 border-[#222] bg-white p-2 text-left shadow-saw-sm transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed"
                type="button"
                @click="selectImage(file)"
              >
                <div class="aspect-[5/3] overflow-hidden rounded-xl border-2 border-[#222] bg-[#fffaf0]">
                  <img
                    class="h-full w-full object-contain p-1 transition duration-500 group-hover:scale-105"
                    :alt="file.name"
                    loading="lazy"
                    :src="fileUrl(file)"
                  />
                </div>
                <div class="px-2 py-3">
                  <p class="line-clamp-2 text-xs font-black text-[#111]">{{ file.name }}</p>
                  <p class="mt-1 font-monoish text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{{ file.extension }}</p>
                </div>
              </button>
            </div>

            <div v-else class="rounded-2xl border-2 border-[#222] bg-[#eef8f5] p-8 text-center font-monoish text-slate-600 shadow-saw-sm">
              Belum ada gambar yang cocok di topik ini.
            </div>
          </div>
        </div>

        <div
          v-if="activeTopic"
          class="saw-card mt-6 bg-[#eef8f5] p-4 sm:p-6"
        >
          <div id="dokumen-panel" class="mb-4 flex items-center justify-between gap-3">
            <div>
              <p class="font-monoish text-sm font-bold uppercase tracking-[0.18em] text-slate-500">File pendukung</p>
              <h3 class="font-display text-2xl font-black tracking-[-0.03em] text-[#111]">Dokumen</h3>
            </div>
            <span class="rounded-full border-2 border-[#222] bg-white px-4 py-2 font-monoish text-sm font-bold text-[#111]">
              {{ filteredDocuments.length }} file
            </span>
          </div>

          <div v-if="filteredDocuments.length > 0" class="grid gap-3 md:grid-cols-2">
            <a
              v-for="file in filteredDocuments"
              :key="file.path"
              class="flex items-center gap-3 rounded-2xl border-2 border-[#222] bg-white p-4 shadow-saw-sm transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pressed"
              :href="fileUrl(file)"
              target="_blank"
              rel="noreferrer"
            >
              <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#222] bg-[#f6bd4f] font-monoish text-xs font-bold text-[#111]">
                {{ file.extension }}
              </span>
              <span class="min-w-0">
                <span class="line-clamp-2 text-sm font-black text-[#111]">{{ file.name }}</span>
                <span class="mt-1 block font-monoish text-xs font-bold text-slate-500">Buka di tab baru</span>
              </span>
            </a>
          </div>

          <div v-else class="rounded-2xl border-2 border-[#222] bg-white p-6 text-center font-monoish text-slate-600 shadow-saw-sm">
            Tidak ada dokumen yang cocok.
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="selectedImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#222]/80 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="closeImage"
    >
      <div class="max-h-full w-full max-w-6xl overflow-hidden rounded-2xl border-2 border-[#222] bg-white shadow-saw">
        <div class="flex items-center justify-between gap-3 border-b-2 border-[#222] bg-[#f6bd4f] px-4 py-3 text-[#111]">
          <div class="min-w-0">
            <p class="truncate text-sm font-black">{{ selectedImage.name }}</p>
            <p class="font-monoish text-xs text-slate-700">{{ selectedImage.topic }} · {{ selectedImagePosition }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              class="saw-button bg-[#9bd7e5] px-4 py-2 font-monoish text-sm font-bold"
              type="button"
              aria-label="Gambar sebelumnya"
              @click="showPreviousImage"
            >
              Prev
            </button>
            <button
              class="saw-button bg-[#f5a6b4] px-4 py-2 font-monoish text-sm font-bold"
              type="button"
              aria-label="Gambar berikutnya"
              @click="showNextImage"
            >
              Next
            </button>
            <button
              class="saw-button bg-white px-4 py-2 font-monoish text-sm font-bold"
              type="button"
              @click="closeImage"
            >
              Tutup
            </button>
          </div>
        </div>
        <div class="relative max-h-[85vh] overflow-auto bg-[#fffaf0]">
          <img class="mx-auto h-auto max-h-none w-auto max-w-full" :alt="selectedImage.name" :src="fileUrl(selectedImage)" />
        </div>
      </div>
    </div>
  </section>
</template>
