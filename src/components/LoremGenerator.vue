<script setup>
import { ref, computed, onMounted } from 'vue';

// ── Dark mode sync ──────────────────────────────────────────
const isDarkMode = ref(false);
onMounted(() => {
  if (typeof document !== 'undefined') {
    isDarkMode.value = document.documentElement.classList.contains('dark');
    const observer = new MutationObserver(() => {
      isDarkMode.value = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
});

// ── Lorem ipsum data ────────────────────────────────────────
const WORDS = [
  'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua',
  'enim','ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris',
  'nisi','aliquip','ex','ea','commodo','consequat','duis','aute','irure','in',
  'reprehenderit','voluptate','velit','esse','cillum','eu','fugiat','nulla',
  'pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt',
  'culpa','qui','officia','deserunt','mollit','anim','id','est','laborum',
  'perspiciatis','unde','omnis','iste','natus','error','accusantium','doloremque',
  'laudantium','totam','rem','aperiam','eaque','ipsa','quae','ab','illo','inventore',
  'veritatis','quasi','architecto','beatae','vitae','dicta','explicabo','nemo',
  'ipsam','quia','voluptas','aspernatur','aut','odit','fugit','consequuntur',
  'magni','dolores','ratione','sequi','nesciunt','neque','porro','quisquam',
  'dolorem','adipisci','numquam','eius','modi','tempora','incidunt','quaerat',
];

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function makeSentence() {
  const length = Math.floor(Math.random() * 10) + 5; // 5–14 words
  const words = Array.from({ length }, randomWord);
  return capitalize(words.join(' ')) + '.';
}

function makeParagraph() {
  const count = Math.floor(Math.random() * 4) + 3; // 3–6 sentences
  return Array.from({ length: count }, makeSentence).join(' ');
}

// ── State ───────────────────────────────────────────────────
const mode   = ref('paragraf');  // 'kata' | 'kalimat' | 'paragraf'
const count  = ref(3);
const output = ref('');
const copySuccess = ref(false);
const hasGenerated = ref(false);

const modeOptions = [
  { value: 'kata',     label: 'Kata',      icon: '🔤' },
  { value: 'kalimat',  label: 'Kalimat',   icon: '📝' },
  { value: 'paragraf', label: 'Paragraf',  icon: '📄' },
];

const countLabel = computed(() => {
  const map = { kata: 'kata', kalimat: 'kalimat', paragraf: 'paragraf' };
  return map[mode.value];
});

const maxCount = computed(() => {
  return { kata: 1000, kalimat: 200, paragraf: 50 }[mode.value];
});

// ── Core logic ──────────────────────────────────────────────
function generate() {
  const n = Math.max(1, Math.min(Number(count.value) || 1, maxCount.value));
  count.value = n;

  if (mode.value === 'kata') {
    const words = Array.from({ length: n }, randomWord);
    // Capitalize first, end with period
    output.value = capitalize(words.join(' ')) + '.';
  } else if (mode.value === 'kalimat') {
    output.value = Array.from({ length: n }, makeSentence).join(' ');
  } else {
    output.value = Array.from({ length: n }, makeParagraph).join('\n\n');
  }
  hasGenerated.value = true;
  copySuccess.value = false;
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2200);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = output.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2200);
  }
}

const wordCount = computed(() => {
  if (!output.value) return 0;
  return output.value.trim().split(/\s+/).length;
});

const charCount = computed(() => output.value.length);

// Generate on first load
generate();
</script>

<template>
  <div class="lg-root">

    <!-- ── Topbar ── -->
    <div class="lg-topbar">
      <a href="/" class="lg-back-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Kembali
      </a>
    </div>

    <!-- ── Header ── -->
    <header class="lg-header">
      <div class="lg-emoji-wrap">✍️</div>
      <div>
        <h1 class="lg-title">Lorem Ipsum Generator</h1>
        <p class="lg-subtitle">Generate teks placeholder sesuai kebutuhan lo.</p>
      </div>
    </header>

    <!-- ── Controls ── -->
    <div class="lg-controls">

      <!-- Mode selector -->
      <div class="lg-control-group">
        <label class="lg-ctrl-label">Tipe</label>
        <div class="lg-mode-btns">
          <button
            v-for="opt in modeOptions"
            :key="opt.value"
            class="lg-mode-btn"
            :class="{ active: mode === opt.value }"
            @click="mode = opt.value"
          >
            <span>{{ opt.icon }}</span>
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Count -->
      <div class="lg-control-group">
        <label class="lg-ctrl-label" for="lg-count-input">Jumlah {{ countLabel }}</label>
        <div class="lg-count-wrap">
          <button class="lg-count-btn" @click="count = Math.max(1, count - 1)">−</button>
          <input
            id="lg-count-input"
            v-model.number="count"
            type="number"
            :min="1"
            :max="maxCount"
            class="lg-count-input"
          />
          <button class="lg-count-btn" @click="count = Math.min(maxCount, count + 1)">+</button>
        </div>
      </div>

      <!-- Generate button -->
      <div class="lg-control-group lg-generate-wrap">
        <button id="lg-btn-generate" class="lg-gen-btn" @click="generate">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Generate!
        </button>
      </div>
    </div>

    <!-- ── Output ── -->
    <div class="lg-output-panel" v-if="hasGenerated">
      <!-- Panel header -->
      <div class="lg-output-header">
        <span class="lg-output-label">Hasil</span>
        <div class="lg-output-meta">
          <span class="lg-meta-pill">{{ wordCount }} kata</span>
          <span class="lg-meta-pill">{{ charCount }} karakter</span>
        </div>
        <button
          id="lg-btn-copy"
          class="lg-copy-btn"
          :class="{ success: copySuccess }"
          @click="copyOutput"
        >
          <svg v-if="!copySuccess" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ copySuccess ? 'Tersalin!' : 'Copy' }}
        </button>
      </div>

      <!-- Text output -->
      <div class="lg-output-body">
        <p
          v-for="(para, i) in output.split('\n\n')"
          :key="i"
          class="lg-para"
        >{{ para }}</p>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Root ────────────────────────────────────────────────── */
.lg-root {
  min-height: 100vh;
  padding: 1.25rem 1.25rem 3rem;
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Topbar ──────────────────────────────────────────────── */
.lg-topbar {
  display: flex;
  align-items: center;
}
.lg-back-btn {
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
.lg-back-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}
html.dark .lg-back-btn {
  background: #1e293b;
  color: #f8fafc;
  border-color: #020617;
  box-shadow: 3px 3px 0 #020617;
}

/* ── Header ──────────────────────────────────────────────── */
.lg-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.lg-emoji-wrap {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  border: 2.5px solid var(--ink);
  background: rgba(201,182,234,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 4px 4px 0 var(--ink);
  flex-shrink: 0;
}
.lg-title {
  font-size: 1.55rem;
  font-weight: 900;
  margin: 0 0 0.1rem;
  line-height: 1.1;
}
.lg-subtitle {
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin: 0;
}
html.dark .lg-subtitle { color: #94a3b8; }
html.dark .lg-title { color: #f8fafc; }

/* ── Controls ────────────────────────────────────────────── */
.lg-controls {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  flex-wrap: wrap;
  padding: 1.25rem 1.5rem;
  border: 2.5px solid var(--ink);
  border-radius: 18px;
  box-shadow: 6px 6px 0 var(--ink);
  background: white;
}
html.dark .lg-controls {
  background: #1e293b;
  border-color: #020617;
  box-shadow: 6px 6px 0 #020617;
}

.lg-control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.lg-generate-wrap {
  margin-left: auto;
}
.lg-ctrl-label {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #888;
}
html.dark .lg-ctrl-label { color: #64748b; }

/* Mode buttons */
.lg-mode-btns {
  display: flex;
  gap: 0.4rem;
}
.lg-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38em 0.85em;
  font-family: inherit;
  font-size: 0.83rem;
  font-weight: 700;
  border: 2px solid var(--ink);
  border-radius: 9px;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
}
.lg-mode-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--ink);
}
.lg-mode-btn.active {
  background: var(--ink);
  color: white;
}
html.dark .lg-mode-btn {
  color: #f8fafc;
  border-color: #020617;
  box-shadow: 3px 3px 0 #020617;
}
html.dark .lg-mode-btn.active {
  background: #f8fafc;
  color: #0f172a;
}

/* Count input */
.lg-count-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  border: 2px solid var(--ink);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 3px 3px 0 var(--ink);
}
html.dark .lg-count-wrap {
  border-color: #020617;
  box-shadow: 3px 3px 0 #020617;
}
.lg-count-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0;
  background: var(--ink);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 120ms;
}
.lg-count-btn:hover { opacity: 0.8; }
.lg-count-input {
  width: 64px;
  height: 36px;
  border: none;
  border-left: 2px solid var(--ink);
  border-right: 2px solid var(--ink);
  text-align: center;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  background: white;
  color: var(--ink);
  outline: none;
  -moz-appearance: textfield;
}
.lg-count-input::-webkit-outer-spin-button,
.lg-count-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
html.dark .lg-count-input {
  background: #0f172a;
  color: #f8fafc;
  border-color: #020617;
}
html.dark .lg-count-btn {
  background: #020617;
}

/* Generate button */
.lg-gen-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5em 1.4em;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 900;
  background: #c9b6ea;
  color: var(--ink);
  border: 2.5px solid var(--ink);
  border-radius: 11px;
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--ink);
  transition: transform 130ms ease, box-shadow 130ms ease;
}
.lg-gen-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--ink);
}
html.dark .lg-gen-btn {
  border-color: #020617;
  box-shadow: 4px 4px 0 #020617;
  color: #0f172a;
}

/* ── Output Panel ────────────────────────────────────────── */
.lg-output-panel {
  display: flex;
  flex-direction: column;
  border: 2.5px solid var(--ink);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 7px 7px 0 var(--ink);
  background: white;
  flex: 1;
}
html.dark .lg-output-panel {
  background: #1e293b;
  border-color: #020617;
  box-shadow: 7px 7px 0 #020617;
}

.lg-output-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border-bottom: 2px solid var(--ink);
  background: #f8f8f5;
  flex-shrink: 0;
}
html.dark .lg-output-header {
  background: #0f172a;
  border-color: #020617;
}

.lg-output-label {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #555;
}
html.dark .lg-output-label { color: #94a3b8; }

.lg-output-meta {
  display: flex;
  gap: 0.4rem;
  margin-left: 0.25rem;
}
.lg-meta-pill {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(201,182,234,0.35);
  border: 1.5px solid var(--ink);
  border-radius: 999px;
  padding: 0.15em 0.6em;
  color: var(--ink);
}
html.dark .lg-meta-pill {
  background: rgba(201,182,234,0.15);
  border-color: #334155;
  color: #cbd5e1;
}

.lg-copy-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.32em 0.85em;
  border: 2px solid var(--ink);
  border-radius: 8px;
  background: white;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
}
.lg-copy-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--ink);
}
.lg-copy-btn.success {
  background: #d1fae5;
}
html.dark .lg-copy-btn {
  background: #1e293b;
  color: #f8fafc;
  border-color: #020617;
  box-shadow: 3px 3px 0 #020617;
}
html.dark .lg-copy-btn.success {
  background: #064e3b;
}

/* Output text body */
.lg-output-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
  font-family: 'Space Mono', 'Courier New', monospace;
  font-size: 0.87rem;
  line-height: 1.8;
  color: #333;
}
html.dark .lg-output-body {
  color: #cbd5e1;
}

.lg-para {
  margin: 0 0 1rem;
  text-align: justify;
}
.lg-para:last-child { margin-bottom: 0; }

/* ── Dark mode ink tweaks ────────────────────────────────── */
html.dark .lg-emoji-wrap {
  border-color: #020617;
  box-shadow: 4px 4px 0 #020617;
}
</style>
