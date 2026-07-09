<script setup>
import { computed } from 'vue';
import JsonTreeNode from './JsonTreeNode.vue'; // self-reference for recursion

const props = defineProps({
  nodeKey:        { default: null },           // key name (string) or null for root
  value:          { required: true },           // the JSON value
  depth:          { type: Number, default: 0 },
  path:           { type: String, default: '' }, // dot-notation path, '' = root
  collapsedPaths: { type: Array, default: () => [] }, // array of collapsed paths
  diffMap:        { type: Object, default: () => ({}) },
  isLast:         { type: Boolean, default: true },
  isArrayChild:   { type: Boolean, default: false },
});

const emit = defineEmits(['toggle']);

const isArr        = computed(() => Array.isArray(props.value));
const isObj        = computed(() => props.value !== null && typeof props.value === 'object' && !isArr.value);
const isExpandable = computed(() => isArr.value || isObj.value);
const isCollapsed  = computed(() => props.collapsedPaths.includes(props.path));
const diffStatus   = computed(() => props.diffMap[props.path] ?? null);

const childEntries = computed(() => {
  if (!isExpandable.value) return [];
  const entries = Object.entries(props.value);
  return entries.map(([k, v], i) => ({
    key: k,
    value: v,
    isArrayChild: isArr.value,
    childPath: props.path ? `${props.path}.${k}` : k,
    isLast: i === entries.length - 1,
  }));
});

const openBracket  = computed(() => isArr.value ? '[' : '{');
const closeBracket = computed(() => isArr.value ? ']' : '}');
const previewText  = computed(() => {
  if (isArr.value) {
    const n = props.value.length;
    return `${n} item${n !== 1 ? 's' : ''}`;
  }
  const n = Object.keys(props.value).length;
  return `${n} key${n !== 1 ? 's' : ''}`;
});

const INDENT_PX = 18;

function toggle() { emit('toggle', props.path); }
function forwardToggle(path) { emit('toggle', path); }

function primitiveClass(v) {
  if (v === null)             return 'jt-null';
  if (typeof v === 'boolean') return 'jt-bool';
  if (typeof v === 'number')  return 'jt-num';
  return 'jt-str';
}

function formatPrimitive(v) {
  if (v === null)            return 'null';
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

const diffClass = computed(() => ({
  'jt-diff-added':    diffStatus.value === 'added',
  'jt-diff-removed':  diffStatus.value === 'removed',
  'jt-diff-modified': diffStatus.value === 'modified',
}));
</script>

<template>
  <!-- display:contents so parent diff coloring bleeds through correctly -->
  <div style="display:contents">

    <!-- ── Expandable (object / array) ─────────────────── -->
    <template v-if="isExpandable">
      <!-- Header row -->
      <div class="jt-row jt-clickable" :class="diffClass" @click="toggle">
        <span class="jt-indent" :style="{ width: depth * INDENT_PX + 'px' }"></span>
        <span class="jt-chevron" :class="{ collapsed: isCollapsed }">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2.5 3.5 5 6.5 7.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <template v-if="nodeKey !== null">
          <span v-if="isArrayChild" class="jt-index">{{ nodeKey }}</span>
          <span v-else class="jt-key">"{{ nodeKey }}"</span>
          <span class="jt-punct">:&nbsp;</span>
        </template>
        <span class="jt-bracket">{{ openBracket }}</span>
        <template v-if="isCollapsed">
          <span class="jt-preview">&nbsp;{{ previewText }}&nbsp;</span>
          <span class="jt-bracket">{{ closeBracket }}</span>
          <span v-if="!isLast" class="jt-punct">,</span>
        </template>
        <span v-else class="jt-ellipsis">&nbsp;···</span>
      </div>

      <!-- Children -->
      <template v-if="!isCollapsed">
        <JsonTreeNode
          v-for="entry in childEntries"
          :key="entry.childPath"
          :nodeKey="entry.key"
          :value="entry.value"
          :depth="depth + 1"
          :path="entry.childPath"
          :collapsedPaths="collapsedPaths"
          :diffMap="diffMap"
          :isLast="entry.isLast"
          :isArrayChild="entry.isArrayChild"
          @toggle="forwardToggle"
        />
        <!-- Closing bracket row -->
        <div class="jt-row">
          <span class="jt-indent" :style="{ width: depth * INDENT_PX + 'px' }"></span>
          <span class="jt-chevron-ph"></span>
          <span class="jt-bracket">{{ closeBracket }}</span>
          <span v-if="!isLast" class="jt-punct">,</span>
        </div>
      </template>
    </template>

    <!-- ── Primitive ────────────────────────────────────── -->
    <template v-else>
      <div class="jt-row" :class="diffClass">
        <span class="jt-indent" :style="{ width: depth * INDENT_PX + 'px' }"></span>
        <span class="jt-chevron-ph"></span>
        <template v-if="nodeKey !== null">
          <span v-if="isArrayChild" class="jt-index">{{ nodeKey }}</span>
          <span v-else class="jt-key">"{{ nodeKey }}"</span>
          <span class="jt-punct">:&nbsp;</span>
        </template>
        <span :class="primitiveClass(value)">{{ formatPrimitive(value) }}</span>
        <span v-if="!isLast" class="jt-punct">,</span>
      </div>
    </template>

  </div>
</template>

<style scoped>
.jt-row {
  display: flex;
  align-items: center;
  min-height: 23px;
  padding: 1px 6px 1px 4px;
  border-radius: 4px;
  font-family: 'Space Mono', 'Courier New', monospace;
  font-size: 0.79rem;
  line-height: 1.5;
  white-space: nowrap;
}

.jt-clickable { cursor: pointer; user-select: none; }
.jt-clickable:hover { background: rgba(0,0,0,0.04); }

.jt-indent     { display: inline-block; flex-shrink: 0; }
.jt-chevron-ph { display: inline-block; width: 18px; flex-shrink: 0; }

.jt-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: #9ca3af;
  transition: transform 130ms ease;
}
.jt-chevron.collapsed { transform: rotate(-90deg); }

.jt-key     { color: #7c3aed; font-weight: 700; }
.jt-index   { color: #6b7280; }
.jt-punct   { color: #9ca3af; }
.jt-bracket { color: #374151; font-weight: 600; }
.jt-preview { color: #9ca3af; font-style: italic; font-size: 0.74rem; }
.jt-ellipsis { color: #d1d5db; }

.jt-str  { color: #059669; }
.jt-num  { color: #d97706; }
.jt-bool { color: #2563eb; font-weight: 700; }
.jt-null { color: #9ca3af; font-style: italic; }

/* ── Diff highlights ── */
.jt-diff-added {
  background: rgba(16,185,129,0.12);
  border-left: 3px solid #10b981;
  padding-left: 1px;
}
.jt-diff-removed {
  background: rgba(239,68,68,0.09);
  border-left: 3px solid #ef4444;
  padding-left: 1px;
}
.jt-diff-modified {
  background: rgba(245,158,11,0.09);
  border-left: 3px solid #f59e0b;
  padding-left: 1px;
}

/* ── Dark mode ── */
html.dark .jt-clickable:hover { background: rgba(255,255,255,0.06); }
html.dark .jt-bracket  { color: #e2e8f0; }
html.dark .jt-key      { color: #a78bfa; }
html.dark .jt-index    { color: #94a3b8; }
html.dark .jt-str      { color: #34d399; }
html.dark .jt-num      { color: #fbbf24; }
html.dark .jt-bool     { color: #60a5fa; }
html.dark .jt-null     { color: #6b7280; }
html.dark .jt-punct    { color: #64748b; }
html.dark .jt-ellipsis { color: #475569; }
html.dark .jt-preview  { color: #64748b; }
</style>
