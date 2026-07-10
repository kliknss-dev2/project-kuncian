<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import JsonTreeNode from './JsonTreeNode.vue';

// ── Constants ──────────────────────────────────────────────
const MAX_TABS    = 8;
const STORAGE_KEY = 'kotak-jf-v1';

// ── ID counter ─────────────────────────────────────────────
const nextId = ref(1);

function makeTab() {
  const id = nextId.value++;
  return { id, name: `JSON ${id}`, input: '', indentSize: 2 };
}

// ── Core state ─────────────────────────────────────────────
const tabs        = ref([makeTab()]);
const activeTabId = ref(tabs.value[0].id);

// Rename state
const renamingTabId = ref(null);
const renameInput   = ref('');

// Output mode per tab: 'tree' | 'text'
const outputModeByTab = ref({});
// Text content per tab (minified/formatted string)
const textOutputByTab = ref({});
// Collapse state per tab: { [tabId]: string[] } — in-memory only
const collapsedByTab  = ref({});

// Compare mode
const compareMode   = ref(false);
const compareTabAId = ref(null);
const compareTabBId = ref(null);

// UI feedback
const copySuccess = ref(false);

// ── Error position + gutter ────────────────────────────────
const textareaEl = ref(null);
const gutterEl   = ref(null);

const lineCount = computed(() =>
  Math.max((activeInput.value || '').split('\n').length, 1)
);

// Parse line/col from browser error messages:
// Firefox: "...at line 25 column 3 of the JSON data"
// Safari:  "...on line 25"
const errorPosition = computed(() => {
  const err = activeParseResult.value.error;
  if (!err) return null;
  const lineM = err.match(/\bline[:\s]+(\d+)/i);
  const colM  = err.match(/\bcolumn[:\s]+(\d+)/i);
  if (lineM) return { line: +lineM[1], col: colM ? +colM[1] : null };
  return null;
});

const errorLine = computed(() => errorPosition.value?.line ?? null);
const errorCol  = computed(() => errorPosition.value?.col  ?? null);

function syncGutter() {
  if (gutterEl.value && textareaEl.value) {
    gutterEl.value.scrollTop = textareaEl.value.scrollTop;
  }
}

// ── Core Computed ──────────────────────────────────────────
const activeTab = computed(() =>
  tabs.value.find(t => t.id === activeTabId.value) ?? tabs.value[0]
);

const parsedByTab = computed(() => {
  const map = {};
  for (const tab of tabs.value) {
    const raw = tab.input?.trim();
    if (!raw) { map[tab.id] = { ok: false, empty: true, data: null, error: '' }; continue; }
    try     { map[tab.id] = { ok: true,  empty: false, data: JSON.parse(raw),  error: '' }; }
    catch(e){ map[tab.id] = { ok: false, empty: false, data: null, error: e.message }; }
  }
  return map;
});

const activeParseResult = computed(() =>
  parsedByTab.value[activeTabId.value] ?? { ok: false, empty: true, data: null, error: '' }
);
const activeOutputMode  = computed(() => outputModeByTab.value[activeTabId.value] ?? 'tree');
const activeTextOutput  = computed(() => textOutputByTab.value[activeTabId.value] ?? '');
const activeCollapsed   = computed(() => collapsedByTab.value[activeTabId.value] ?? []);

// v-model-compatible computed for active tab's input
const activeInput = computed({
  get: () => activeTab.value?.input ?? '',
  set: (v) => { if (activeTab.value) activeTab.value.input = v; }
});

// ── Compare Computed ───────────────────────────────────────
const compareTabA    = computed(() => tabs.value.find(t => t.id === compareTabAId.value));
const compareTabB    = computed(() => tabs.value.find(t => t.id === compareTabBId.value));
const compareResultA = computed(() => compareTabAId.value ? parsedByTab.value[compareTabAId.value] : null);
const compareResultB = computed(() => compareTabBId.value ? parsedByTab.value[compareTabBId.value] : null);
const collapsedA     = computed(() => collapsedByTab.value[compareTabAId.value] ?? []);
const collapsedB     = computed(() => collapsedByTab.value[compareTabBId.value] ?? []);
const canCompare     = computed(() => compareResultA.value?.ok && compareResultB.value?.ok);

const diffMap = computed(() => {
  if (!canCompare.value) return {};
  return buildDiffMap(compareResultA.value.data, compareResultB.value.data, '');
});

// ── Actions ────────────────────────────────────────────────
function format() {
  if (!activeParseResult.value.ok) return;
  const formatted = JSON.stringify(activeParseResult.value.data, null, activeTab.value?.indentSize ?? 2);
  
  // Update the textarea input with formatted JSON
  if (activeTab.value) {
    activeTab.value.input = formatted;
  }
  
  // Update the text output panel as well
  setTextOutput(activeTabId.value, formatted);
}

function minify() {
  if (!activeParseResult.value.ok) return;
  setTextOutput(activeTabId.value, JSON.stringify(activeParseResult.value.data));
  setOutputMode(activeTabId.value, 'text');
}

async function copyOutput() {
  let text = '';
  if (activeOutputMode.value === 'text' && activeTextOutput.value) {
    text = activeTextOutput.value;
  } else if (activeParseResult.value.ok) {
    text = JSON.stringify(activeParseResult.value.data, null, activeTab.value?.indentSize ?? 2);
  }
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
  copySuccess.value = true;
  setTimeout(() => (copySuccess.value = false), 2000);
}

function loadSample() {
  if (!activeTab.value) return;
  activeTab.value.input = `{
  "project": {
    "name": "kotak.lo",
    "version": "1.0.0",
    "description": "JSON Formatter dengan fitur perbandingan antar tab.",
    "features": ["Format", "Minify", "Compare", "Tabs"],
    "meta": { "author": "kotak.lo", "created": 2024, "tags": ["tools", "web"] }
  }
}`;
  setOutputMode(activeTabId.value, 'tree');
}

function clearTab() {
  if (!activeTab.value) return;
  activeTab.value.input = '';
  setOutputMode(activeTabId.value, 'tree');
  setTextOutput(activeTabId.value, '');
}

function setOutputMode(tabId, mode) {
  outputModeByTab.value = { ...outputModeByTab.value, [tabId]: mode };
}

function setTextOutput(tabId, text) {
  textOutputByTab.value = { ...textOutputByTab.value, [tabId]: text };
}

// ── Tab Management ─────────────────────────────────────────
function addTab() {
  if (tabs.value.length >= MAX_TABS) return;
  const tab = makeTab();
  tabs.value.push(tab);
  activeTabId.value = tab.id;
}

function removeTab(id) {
  if (tabs.value.length <= 1) return;
  const idx = tabs.value.findIndex(t => t.id === id);
  if (idx < 0) return;
  tabs.value.splice(idx, 1);
  if (activeTabId.value === id) {
    activeTabId.value = tabs.value[Math.max(0, idx - 1)].id;
  }
  if (compareTabAId.value === id) compareTabAId.value = tabs.value[0]?.id ?? null;
  if (compareTabBId.value === id) compareTabBId.value = tabs.value[1]?.id ?? tabs.value[0]?.id ?? null;
  const c = { ...collapsedByTab.value };
  delete c[id];
  collapsedByTab.value = c;
}

function switchTab(id) {
  if (renamingTabId.value) confirmRename();
  activeTabId.value = id;
}

function startRename(id, e) {
  e?.stopPropagation();
  renamingTabId.value = id;
  renameInput.value = tabs.value.find(t => t.id === id)?.name ?? '';
  nextTick(() => {
    const el = document.getElementById('jf-rename-input');
    el?.focus();
    el?.select();
  });
}

function confirmRename() {
  if (!renamingTabId.value) return;
  const tab = tabs.value.find(t => t.id === renamingTabId.value);
  if (tab && renameInput.value.trim()) tab.name = renameInput.value.trim();
  renamingTabId.value = null;
}

// ── Collapse ───────────────────────────────────────────────
function onToggle(tabId, path) {
  const list = [...(collapsedByTab.value[tabId] ?? [])];
  const i = list.indexOf(path);
  if (i >= 0) list.splice(i, 1);
  else list.push(path);
  collapsedByTab.value = { ...collapsedByTab.value, [tabId]: list };
}

// ── Compare ────────────────────────────────────────────────
function toggleCompare() {
  compareMode.value = !compareMode.value;
  if (compareMode.value && tabs.value.length >= 2) {
    compareTabAId.value = tabs.value[0].id;
    compareTabBId.value = tabs.value[1].id;
  }
}

function buildDiffMap(a, b, path) {
  const map = {};
  const aIsObj = a !== null && typeof a === 'object';
  const bIsObj = b !== null && typeof b === 'object';

  if (!aIsObj || !bIsObj) {
    map[path] = (a === b ? 'same' : 'modified');
    return map;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    map[path] = 'modified';
    return map;
  }

  const keysA = new Set(Object.keys(a));
  const keysB = new Set(Object.keys(b));
  const all   = [...new Set([...keysA, ...keysB])];
  let anyChange = false;

  for (const k of all) {
    const cp = path ? `${path}.${k}` : k;
    if (!keysA.has(k)) {
      markAllDiff(b[k], cp, 'added',   map); anyChange = true;
    } else if (!keysB.has(k)) {
      markAllDiff(a[k], cp, 'removed', map); anyChange = true;
    } else {
      const child = buildDiffMap(a[k], b[k], cp);
      Object.assign(map, child);
      if (child[cp] !== 'same') anyChange = true;
    }
  }
  map[path] = anyChange ? 'modified' : 'same';
  return map;
}

function markAllDiff(value, path, status, map) {
  map[path] = status;
  if (value !== null && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      markAllDiff(value[k], path ? `${path}.${k}` : k, status, map);
    }
  }
}

// ── Tab helpers ────────────────────────────────────────────
function tabDotClass(tab) {
  const r = parsedByTab.value[tab.id];
  if (!r || r.empty) return 'dot-empty';
  return r.ok ? 'dot-ok' : 'dot-err';
}

// ── LocalStorage ───────────────────────────────────────────
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      tabs: tabs.value.map(t => ({ id: t.id, name: t.name, input: t.input, indentSize: t.indentSize })),
      activeTabId: activeTabId.value,
      nextId: nextId.value,
    }));
  } catch {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.tabs) && data.tabs.length > 0) {
      tabs.value        = data.tabs;
      activeTabId.value = data.activeTabId ?? data.tabs[0].id;
      nextId.value      = data.nextId ?? (Math.max(...data.tabs.map(t => t.id)) + 1);
    }
  } catch {}
}

onMounted(loadFromStorage);
watch(tabs, saveToStorage, { deep: true });
watch(activeTabId, saveToStorage);
</script>

<template>
  <div class="jf-root">

    <!-- ── Topbar ── -->
    <div class="jf-topbar">
      <a href="/" class="jf-back-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Kembali
      </a>
    </div>

    <!-- ── Header ── -->
    <header class="jf-header">
      <div class="jf-emoji-wrap">🧩</div>
      <div>
        <h1 class="jf-title">JSON Formatter</h1>
        <p class="jf-subtitle">Format · Minify · Validasi · Bandingkan antar Tab</p>
      </div>
    </header>

    <!-- ── Tab Bar + Compare Toggle ── -->
    <div class="jf-toolbar">
      <div class="jf-tablist" role="tablist">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="jf-tab"
          :class="{ 'jf-tab-active': tab.id === activeTabId }"
          role="tab"
          :aria-selected="tab.id === activeTabId"
          @click="switchTab(tab.id)"
        >
          <span class="jf-tab-dot" :class="tabDotClass(tab)"></span>
          <!-- Rename input or display name -->
          <input
            v-if="renamingTabId === tab.id"
            id="jf-rename-input"
            v-model="renameInput"
            class="jf-tab-rename"
            @keydown.enter.stop="confirmRename"
            @keydown.escape.stop="renamingTabId = null"
            @blur="confirmRename"
            @click.stop
          />
          <span v-else class="jf-tab-name" @dblclick.stop="startRename(tab.id, $event)">
            {{ tab.name }}
          </span>
          <button
            v-if="tabs.length > 1"
            class="jf-tab-close"
            @click.stop="removeTab(tab.id)"
            aria-label="Tutup tab"
          >×</button>
        </div>
        <!-- Add Tab -->
        <button
          class="jf-add-tab"
          @click="addTab"
          :disabled="tabs.length >= MAX_TABS"
          :title="tabs.length >= MAX_TABS ? 'Maksimal 8 tab' : 'Tambah tab baru'"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Compare toggle -->
      <button
        class="jf-compare-btn"
        :class="{ active: compareMode }"
        @click="toggleCompare"
        :disabled="tabs.length < 2"
        title="Bandingkan dua tab"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="8 9 3 12 8 15"/><polyline points="16 9 21 12 16 15"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
        </svg>
        Compare
      </button>
    </div>

    <!-- ── Compare selector bar ── -->
    <div v-if="compareMode" class="jf-compare-bar">
      <div class="jf-compare-selects">
        <label class="jf-ctrl-label">Tab A</label>
        <select v-model="compareTabAId" class="jf-select">
          <option v-for="t in tabs" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <span class="jf-compare-vs">vs</span>
        <label class="jf-ctrl-label">Tab B</label>
        <select v-model="compareTabBId" class="jf-select">
          <option v-for="t in tabs" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <span v-if="!canCompare" class="jf-compare-hint">— Kedua tab harus berisi JSON yang valid</span>
      </div>
      <div class="jf-diff-legend">
        <span class="jf-legend-item" style="--c: #10b981">⬤ Ditambah</span>
        <span class="jf-legend-item" style="--c: #ef4444">⬤ Dihapus</span>
        <span class="jf-legend-item" style="--c: #f59e0b">⬤ Berubah</span>
      </div>
    </div>

    <!-- ══ NORMAL EDITOR ══ -->
    <div v-if="!compareMode" class="jf-editor">

      <!-- Input Panel -->
      <div class="jf-panel">
        <div class="jf-panel-header">
          <span class="jf-panel-label">Input</span>
          <div class="jf-panel-actions">
            <button class="jf-action-btn" @click="loadSample">Sample</button>
            <button class="jf-action-btn jf-btn-danger" @click="clearTab" :disabled="!activeInput">Clear</button>
          </div>
        </div>
        <!-- Line gutter + textarea -->
        <div class="jf-input-area">
          <div class="jf-line-gutter" ref="gutterEl">
            <div
              v-for="n in lineCount"
              :key="n"
              class="jf-gutter-line"
              :class="{ 'jf-gutter-err': n === errorLine }"
            >
              <span v-if="n === errorLine" class="jf-gutter-err-arrow">▶</span>
              <span v-else>{{ n }}</span>
            </div>
          </div>
          <textarea
            id="jf-input"
            ref="textareaEl"
            v-model="activeInput"
            class="jf-textarea"
            placeholder='Paste JSON di sini…&#10;{"key": "value"}'
            spellcheck="false"
            autocomplete="off"
            @scroll="syncGutter"
          />
        </div>
        <!-- Status bar -->
        <div class="jf-status-bar">
          <div v-if="activeParseResult.error" class="jf-status-error">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span class="jf-status-errmsg">{{ activeParseResult.error }}</span>
            <span v-if="errorLine" class="jf-err-loc-badge">
              Line {{ errorLine }}{{ errorCol ? `, Col ${errorCol}` : '' }}
            </span>
          </div>
          <div v-else-if="activeParseResult.ok" class="jf-status-ok">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            JSON valid
          </div>
          <div v-else class="jf-status-empty">Menunggu input…</div>
        </div>
      </div>

      <!-- Action Column -->
      <div class="jf-actions-col">
        <div class="jf-indent-ctrl">
          <label for="jf-indent" class="jf-ctrl-label">Indent</label>
          <select id="jf-indent" v-model="activeTab.indentSize" @change="format" class="jf-select">
            <option :value="2">2 spasi</option>
            <option :value="4">4 spasi</option>
            <option :value="'\t'">Tab</option>
          </select>
        </div>
        <button id="jf-btn-format" class="jf-main-btn" style="--btn-bg:#f6bd4f" @click="format" :disabled="!activeParseResult.ok">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          Format
        </button>
        <button id="jf-btn-minify" class="jf-main-btn" style="--btn-bg:#9bd7e5" @click="minify" :disabled="!activeParseResult.ok">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          Minify
        </button>
        <button
          id="jf-btn-copy"
          class="jf-main-btn"
          :style="copySuccess ? '--btn-bg:#d1fae5' : '--btn-bg:#c9b6ea'"
          @click="copyOutput"
          :disabled="!activeParseResult.ok && !activeTextOutput"
        >
          {{ copySuccess ? '✅' : '📋' }} {{ copySuccess ? 'Tersalin!' : 'Copy' }}
        </button>
      </div>

      <!-- Output Panel -->
      <div class="jf-panel">
        <div class="jf-panel-header">
          <div class="jf-output-tabs">
            <button class="jf-out-tab" :class="{ active: activeOutputMode === 'tree' }" @click="setOutputMode(activeTabId, 'tree')">
              🌳 Tree
            </button>
            <button class="jf-out-tab" :class="{ active: activeOutputMode === 'text' }" @click="setOutputMode(activeTabId, 'text')" :disabled="!activeTextOutput">
              📄 Text
            </button>
          </div>
        </div>

        <!-- Tree view -->
        <div v-if="activeOutputMode === 'tree'" class="jf-output">
          <div v-if="activeParseResult.ok" class="jf-tree-wrap jf-tree-numbered">
            <JsonTreeNode
              :nodeKey="null"
              :value="activeParseResult.data"
              :depth="0"
              path=""
              :collapsedPaths="activeCollapsed"
              :diffMap="{}"
              :isLast="true"
              :isArrayChild="false"
              @toggle="onToggle(activeTabId, $event)"
            />
          </div>
          <div v-else-if="!activeParseResult.empty" class="jf-output-msg jf-msg-error">
            JSON tidak valid — perbaiki input terlebih dahulu.
          </div>
          <div v-else class="jf-output-msg jf-msg-empty">
            Tree view muncul otomatis setelah JSON valid ✨
          </div>
        </div>

        <!-- Text view -->
        <div v-else class="jf-output">
          <pre v-if="activeTextOutput" class="jf-pre">{{ activeTextOutput }}</pre>
          <div v-else class="jf-output-msg jf-msg-empty">Klik Minify untuk melihat output teks.</div>
        </div>
      </div>
    </div>

    <!-- ══ COMPARE VIEW ══ -->
    <div v-else class="jf-compare-editor">

      <!-- Panel A -->
      <div class="jf-panel">
        <div class="jf-panel-header jf-compare-panel-hdr">
          <span class="jf-panel-label">{{ compareTabA?.name ?? 'Tab A' }}</span>
          <span v-if="compareResultA?.ok"    class="jf-badge jf-badge-ok">✓ Valid</span>
          <span v-else-if="!compareResultA?.empty" class="jf-badge jf-badge-err">✗ Error</span>
        </div>
        <div class="jf-output jf-compare-output">
          <div v-if="compareResultA?.ok" class="jf-tree-wrap jf-tree-numbered">
            <JsonTreeNode
              :nodeKey="null"
              :value="compareResultA.data"
              :depth="0"
              path=""
              :collapsedPaths="collapsedA"
              :diffMap="diffMap"
              :isLast="true"
              :isArrayChild="false"
              @toggle="onToggle(compareTabAId, $event)"
            />
          </div>
          <div v-else class="jf-output-msg jf-msg-error">
            {{ compareResultA?.empty ? 'Tab kosong.' : compareResultA?.error }}
          </div>
        </div>
      </div>

      <!-- Panel B -->
      <div class="jf-panel">
        <div class="jf-panel-header jf-compare-panel-hdr">
          <span class="jf-panel-label">{{ compareTabB?.name ?? 'Tab B' }}</span>
          <span v-if="compareResultB?.ok"    class="jf-badge jf-badge-ok">✓ Valid</span>
          <span v-else-if="!compareResultB?.empty" class="jf-badge jf-badge-err">✗ Error</span>
        </div>
        <div class="jf-output jf-compare-output">
          <div v-if="compareResultB?.ok" class="jf-tree-wrap jf-tree-numbered">
            <JsonTreeNode
              :nodeKey="null"
              :value="compareResultB.data"
              :depth="0"
              path=""
              :collapsedPaths="collapsedB"
              :diffMap="diffMap"
              :isLast="true"
              :isArrayChild="false"
              @toggle="onToggle(compareTabBId, $event)"
            />
          </div>
          <div v-else class="jf-output-msg jf-msg-error">
            {{ compareResultB?.empty ? 'Tab kosong.' : compareResultB?.error }}
          </div>
        </div>
      </div>

    </div><!-- /compare -->

  </div>
</template>

<style scoped>
/* ── Root ─────────────────────────────────────────────────── */
.jf-root {
  min-height: 100vh;
  padding: 1.25rem 1.25rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

/* ── Topbar ───────────────────────────────────────────────── */
.jf-back-btn {
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
.jf-back-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}

/* ── Header ───────────────────────────────────────────────── */
.jf-header {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.jf-emoji-wrap {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  border: 2.5px solid var(--ink);
  background: rgba(155,215,229,0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 4px 4px 0 var(--ink);
  flex-shrink: 0;
}
.jf-title {
  font-size: 1.5rem;
  font-weight: 900;
  margin: 0 0 0.1rem;
  line-height: 1.1;
}
.jf-subtitle {
  font-size: 0.83rem;
  font-weight: 600;
  color: #666;
  margin: 0;
}

/* ── Toolbar (tab bar + compare) ─────────────────────────── */
.jf-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid var(--ink);
  padding-bottom: 0.5rem;
}

.jf-tablist {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  overflow-x: auto;
  min-width: 0;
}

/* ── Tabs ─────────────────────────────────────────────────── */
.jf-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32em 0.7em;
  border: 2px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 700;
  color: #666;
  background: transparent;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
  user-select: none;
}
.jf-tab:hover { background: rgba(0,0,0,0.05); }
.jf-tab-active {
  background: white;
  border-color: var(--ink);
  color: var(--ink);
  box-shadow: 3px 3px 0 var(--ink);
}

.jf-tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid currentColor;
}
.dot-ok  { background: #10b981; border-color: #059669; }
.dot-err { background: #ef4444; border-color: #dc2626; }
.dot-empty { background: transparent; border-color: #9ca3af; }

.jf-tab-name { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }

.jf-tab-rename {
  width: 80px;
  border: 1.5px solid var(--ink);
  border-radius: 5px;
  padding: 1px 4px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  outline: none;
  background: white;
}

.jf-tab-close {
  font-size: 0.9rem;
  line-height: 1;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #9ca3af;
  padding: 0;
}
.jf-tab-close:hover { background: rgba(239,68,68,0.15); color: #dc2626; }

.jf-add-tab {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ink);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  color: var(--ink);
  box-shadow: 2px 2px 0 var(--ink);
  flex-shrink: 0;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.jf-add-tab:hover:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--ink);
}
.jf-add-tab:disabled { opacity: 0.35; cursor: not-allowed; }

/* Compare toggle */
.jf-compare-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 800;
  font-family: inherit;
  padding: 0.35em 0.85em;
  border: 2px solid var(--ink);
  border-radius: 9px;
  background: white;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform 130ms ease, box-shadow 130ms ease, background 130ms ease;
}
.jf-compare-btn:hover:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}
.jf-compare-btn.active { background: #f5a6b4; }
.jf-compare-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Compare bar ──────────────────────────────────────────── */
.jf-compare-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.6rem 0.75rem;
  background: rgba(155,215,229,0.15);
  border: 2px solid var(--ink);
  border-radius: 12px;
  box-shadow: 4px 4px 0 var(--ink);
}
.jf-compare-selects {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.jf-compare-vs {
  font-weight: 900;
  color: #888;
  font-size: 0.85rem;
}
.jf-compare-hint {
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  font-style: italic;
}
.jf-diff-legend {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
  flex-wrap: wrap;
}
.jf-legend-item {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--c, #888);
}

/* ── Editor (normal mode) ─────────────────────────────────── */
.jf-editor {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  flex: 1;
}

/* ── Compare Editor ───────────────────────────────────────── */
.jf-compare-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  flex: 1;
}

/* ── Panels ───────────────────────────────────────────────── */
.jf-panel {
  display: flex;
  flex-direction: column;
  border: 2.5px solid var(--ink);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 7px 7px 0 var(--ink);
  background: white;
  min-height: 480px;
}

.jf-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.9rem;
  border-bottom: 2px solid var(--ink);
  background: #f8f8f5;
  flex-shrink: 0;
}

.jf-compare-panel-hdr { gap: 0.5rem; }

.jf-panel-label {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #666;
}

.jf-panel-actions { display: flex; gap: 0.4rem; }

/* ── Panel action buttons ─────────────────────────────────── */
.jf-action-btn {
  font-size: 0.75rem;
  font-weight: 800;
  font-family: inherit;
  padding: 0.22em 0.65em;
  border: 2px solid var(--ink);
  border-radius: 7px;
  background: white;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 2px 2px 0 var(--ink);
  transition: transform 110ms ease, box-shadow 110ms ease;
}
.jf-action-btn:hover:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--ink);
}
.jf-action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.jf-btn-danger { color: #b91c1c; border-color: #b91c1c; box-shadow: 2px 2px 0 #b91c1c; }

/* ── Badge ────────────────────────────────────────────────── */
.jf-badge {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2em 0.55em;
  border-radius: 999px;
}
.jf-badge-ok  { background: #d1fae5; color: #065f46; }
.jf-badge-err { background: #fee2e2; color: #991b1b; }

/* ── Input area (gutter + textarea) ──────────────────────── */
.jf-input-area {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 300px;
}

.jf-line-gutter {
  width: 44px;
  min-width: 44px;
  overflow: hidden;
  background: #f4f4f0;
  border-right: 1.5px solid rgba(34,34,34,0.12);
  flex-shrink: 0;
  padding: 0.9rem 0; /* match textarea padding-top */
  display: flex;
  flex-direction: column;
}

.jf-gutter-line {
  height: 1.32rem; /* 0.8rem * 1.65 = textarea line height */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  font-size: 0.65rem;
  font-family: 'Space Mono', 'Courier New', monospace;
  color: #b0b0a8;
  user-select: none;
  flex-shrink: 0;
  transition: background 100ms ease;
}

.jf-gutter-err {
  background: rgba(239, 68, 68, 0.13);
  color: #ef4444;
  font-weight: 700;
}

.jf-gutter-err-arrow {
  font-size: 0.6rem;
  animation: jf-blink 900ms ease-in-out infinite;
}

@keyframes jf-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* ── Textarea ─────────────────────────────────────────────── */
.jf-textarea {
  flex: 1;
  resize: none;
  border: none;
  outline: none;
  padding: 0.9rem;
  font-family: 'Space Mono', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.65;
  background: white;
  color: var(--ink);
  min-height: 0;
}

/* ── Status bar ───────────────────────────────────────────── */
.jf-status-bar {
  padding: 0.4rem 0.9rem;
  border-top: 2px solid var(--ink);
  font-size: 0.74rem;
  font-weight: 700;
  flex-shrink: 0;
}
.jf-status-error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #b91c1c;
  line-height: 1.4;
  flex-wrap: wrap;
}
.jf-status-errmsg {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.jf-err-loc-badge {
  flex-shrink: 0;
  background: #ef4444;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.15em 0.55em;
  border-radius: 999px;
  white-space: nowrap;
  font-family: 'Space Mono', monospace;
}
.jf-status-ok { display: flex; align-items: center; gap: 0.35rem; color: #059669; }
.jf-status-empty { color: #9ca3af; }

/* ── Action column ────────────────────────────────────────── */
.jf-actions-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 0.5rem 0;
}

.jf-indent-ctrl {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;
  margin-bottom: 0.3rem;
}
.jf-ctrl-label {
  font-size: 0.67rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #888;
}

.jf-select {
  border: 2px solid var(--ink);
  border-radius: 8px;
  background: white;
  color: var(--ink);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.28em 0.5em;
  box-shadow: 3px 3px 0 var(--ink);
  cursor: pointer;
  outline: none;
}

.jf-main-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.79rem;
  font-weight: 800;
  font-family: inherit;
  padding: 0.5em 0.85em;
  border: 2.5px solid var(--ink);
  border-radius: 10px;
  background: var(--btn-bg, white);
  color: var(--ink);
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--ink);
  white-space: nowrap;
  width: 110px;
  justify-content: center;
  transition: transform 130ms ease, box-shadow 130ms ease;
}
.jf-main-btn:hover:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--ink);
}
.jf-main-btn:disabled { opacity: 0.38; cursor: not-allowed; }

/* ── Output sub-tabs ──────────────────────────────────────── */
.jf-output-tabs { display: flex; gap: 0.3rem; }
.jf-out-tab {
  font-size: 0.73rem;
  font-weight: 800;
  font-family: inherit;
  padding: 0.22em 0.65em;
  border: 2px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #888;
  cursor: pointer;
  transition: background 110ms ease, border-color 110ms ease, color 110ms ease;
}
.jf-out-tab:hover:not(:disabled) { background: rgba(0,0,0,0.06); }
.jf-out-tab.active {
  border-color: var(--ink);
  background: white;
  color: var(--ink);
  box-shadow: 2px 2px 0 var(--ink);
}
.jf-out-tab:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Output area ──────────────────────────────────────────── */
.jf-output {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.jf-compare-output { min-height: 420px; }

.jf-tree-wrap {
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
}

/* ── Tree line numbers (CSS counter via :deep) ────────────── */
.jf-tree-numbered {
  counter-reset: jf-line;
}
.jf-tree-numbered :deep(.jt-row) {
  counter-increment: jf-line;
}
.jf-tree-numbered :deep(.jt-row)::before {
  content: counter(jf-line);
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 36px;
  width: 36px;
  padding-right: 8px;
  margin-right: 2px;
  color: #b0b0a8;
  font-size: 0.63rem;
  font-family: 'Space Mono', 'Courier New', monospace;
  user-select: none;
  flex-shrink: 0;
  border-right: 1.5px solid rgba(34,34,34,0.1);
}

.jf-output-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem 1rem;
  font-size: 0.83rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
}
.jf-msg-empty { color: #bbb; }
.jf-msg-error { color: #b91c1c; }

.jf-pre {
  margin: 0;
  padding: 0.9rem;
  font-family: 'Space Mono', 'Courier New', monospace;
  font-size: 0.79rem;
  line-height: 1.65;
  white-space: pre;
  color: var(--ink);
  flex: 1;
}

/* ── Dark Mode Overrides ──────────────────────────────────── */
html.dark .jf-panel          { background: #0f172a; border-color: #000; box-shadow: 7px 7px 0 #000; }
html.dark .jf-panel-header   { background: #1e293b; border-bottom-color: #000; }
html.dark .jf-panel-label    { color: #94a3b8; }
html.dark .jf-textarea       { background: #0f172a; color: #f1f5f9; }
html.dark .jf-pre            { color: #f1f5f9; }
html.dark .jf-tab-active     { background: #1e293b; color: #f1f5f9; border-bottom-color: #1e293b; }
html.dark .jf-action-btn     { background: #1e293b; color: #f1f5f9; border-color: #000; box-shadow: 2px 2px 0 #000; }
html.dark .jf-action-btn:hover:not(:disabled) { box-shadow: 1px 1px 0 #000; }
html.dark .jf-out-tab.active { background: #1e293b; color: #f1f5f9; border-color: #000; box-shadow: 2px 2px 0 #000; }
html.dark .jf-select         { background: #1e293b; color: #f1f5f9; border-color: #000; box-shadow: 3px 3px 0 #000; }
html.dark .jf-main-btn       { border-color: #000; box-shadow: 4px 4px 0 #000; }
html.dark .jf-main-btn:hover:not(:disabled) { box-shadow: 2px 2px 0 #000; }
html.dark #jf-btn-clear      { background: #1e293b; color: #f1f5f9; }
html.dark #jf-btn-paste      { background: #1e293b; color: #f1f5f9; }
html.dark #jf-btn-format     { color: #000; } /* Yellow */
html.dark #jf-btn-minify     { background: #1e293b; color: #f1f5f9; }
html.dark #jf-btn-copy       { color: #000; } /* Purple/Green */
html.dark .jf-add-tab        { background: #1e293b; color: #f1f5f9; border-color: #000; box-shadow: 2px 2px 0 #000; }
html.dark .jf-add-tab:hover  { box-shadow: 1px 1px 0 #000; }
html.dark .jf-back-btn       { background: #1e293b; color: #f1f5f9; border-color: #000; box-shadow: 3px 3px 0 #000; }
html.dark .jf-back-btn:hover { box-shadow: 1px 1px 0 #000; }
html.dark .jf-compare-btn    { background: #1e293b; color: #f1f5f9; border-color: #000; box-shadow: 3px 3px 0 #000; }
html.dark .jf-compare-btn:hover { box-shadow: 1px 1px 0 #000; }
html.dark .jf-tab-rename     { background: #0f172a; color: #f1f5f9; }
html.dark .jf-subtitle       { color: #94a3b8; }
html.dark .jf-ctrl-label     { color: #94a3b8; }
html.dark .jf-compare-bar    { background: rgba(30,41,59,0.8); border-color: #000; box-shadow: 4px 4px 0 #000; }
html.dark .jf-status-bar     { border-top-color: #000; }
html.dark .jf-title          { color: #f8fafc; }
html.dark .jf-badge          { border-color: #000; box-shadow: 2px 2px 0 #000; }
html.dark .jf-line-gutter    { background: #1a2235; border-right-color: #000; }
html.dark .jf-gutter-line    { color: #4b5563; }
html.dark .jf-gutter-err     { background: rgba(239,68,68,0.18); color: #f87171; }
html.dark .jf-tree-numbered :deep(.jt-row)::before {
  color: #374151;
  border-right-color: rgba(255,255,255,0.08);
}


/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 960px) {
  .jf-editor {
    grid-template-columns: 1fr;
  }
  .jf-actions-col {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  .jf-main-btn  { width: auto; }
  .jf-indent-ctrl { flex-direction: row; align-items: center; }
  .jf-panel { min-height: 280px; }
  .jf-compare-editor { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .jf-diff-legend { margin-left: 0; }
  .jf-compare-bar { gap: 0.6rem; }
}
</style>
