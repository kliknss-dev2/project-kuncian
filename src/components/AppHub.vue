<script setup>
import { ref, onMounted } from 'vue';

const isDark = ref(false);

function toggleDark() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('kotak_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('kotak_theme', 'light');
  }
}

onMounted(() => {
  // Sync with whatever BaseLayout already applied
  isDark.value = document.documentElement.classList.contains('dark');
});

const apps = [
  {
    id: 'kuncian',
    name: 'Kuncian.lo',
    description: 'Viewer simpel & modern untuk daftar kunci jawaban per topik. Cari, filter, dan zoom gambar dengan mudah.',
    href: '/kuncian',
    emoji: '🗝️',
    accent: '#f6bd4f',
    accentLight: 'rgba(246,189,79,0.18)',
    tag: 'Belajar',
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Format, minify, dan validasi JSON dengan cepat. Tampilan tree-view yang bersih dengan syntax highlight.',
    href: '/json-formatter',
    emoji: '🧩',
    accent: '#9bd7e5',
    accentLight: 'rgba(155,215,229,0.22)',
    tag: 'Dev Tool',
  },
];
</script>

<template>
  <div class="hub-root">
    <!-- Topbar with dark mode toggle -->
    <div class="hub-topbar">
      <button
        id="hub-dark-toggle"
        class="hub-dark-btn"
        :aria-label="isDark ? 'Mode Terang' : 'Mode Gelap'"
        @click="toggleDark"
      >
        <!-- Moon icon (light mode → switch to dark) -->
        <svg v-if="!isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <!-- Sun icon (dark mode → switch to light) -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hub-sun-icon">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/><path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/><path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
        </svg>
        <span>{{ isDark ? 'Terang' : 'Gelap' }}</span>
      </button>
    </div>

    <!-- Header -->
    <header class="hub-header">
      <div class="hub-logo">
        <span class="hub-logo-icon">⚡</span>
        <span class="hub-logo-text">kotak<span class="hub-logo-dot">.lo</span></span>
      </div>
      <p class="hub-tagline">Kumpulan alat & aplikasi mini yang gw buat untuk lo.</p>
    </header>

    <!-- App Grid -->
    <main class="hub-grid">
      <a
        v-for="app in apps"
        :key="app.id"
        :href="app.href"
        class="app-card"
        :style="{ '--accent': app.accent, '--accent-light': app.accentLight }"
      >
        <div class="app-card-inner">
          <div class="app-card-top">
            <div class="app-emoji-wrap">
              <span class="app-emoji">{{ app.emoji }}</span>
            </div>
            <span class="app-tag">{{ app.tag }}</span>
          </div>
          <h2 class="app-name">{{ app.name }}</h2>
          <p class="app-desc">{{ app.description }}</p>
          <div class="app-cta">
            <span>Buka aplikasi</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </a>
    </main>

    <!-- Footer -->
    <footer class="hub-footer">
      <span>Made with ☕</span>
    </footer>
  </div>
</template>

<style scoped>
.hub-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem 1.25rem 2rem;
  gap: 0;
}

/* ── Topbar ── */
.hub-topbar {
  width: 100%;
  max-width: 760px;
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.hub-dark-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.4em 0.9em;
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: white;
  color: var(--ink);
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 130ms ease, box-shadow 130ms ease;
}
.hub-dark-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--ink);
}
html.dark .hub-dark-btn {
  background: #1e293b;
  color: #f8fafc;
}
.hub-sun-icon { color: #f6bd4f; }

/* ── Header ── */
.hub-header {
  text-align: center;
  margin-bottom: 3rem;
}

.hub-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Nunito", sans-serif;
  font-weight: 900;
  font-size: clamp(2rem, 6vw, 3.25rem);
  color: var(--ink);
  letter-spacing: -1px;
  margin-bottom: 0.75rem;
}

.hub-logo-icon {
  font-size: 0.85em;
  line-height: 1;
}

.hub-logo-dot {
  color: #9bd7e5;
}

.hub-tagline {
  font-size: 1rem;
  font-weight: 600;
  color: #555;
  margin: 0;
}

/* ── Grid ── */
.hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 760px;
  flex: 1;
}

/* ── App Card ── */
.app-card {
  display: block;
  text-decoration: none;
  color: var(--ink);
  border-radius: 20px;
  border: 2.5px solid var(--ink);
  box-shadow: 8px 8px 0 var(--ink);
  background: var(--accent-light);
  transition: transform 160ms ease, box-shadow 160ms ease;
  position: relative;
  overflow: hidden;
}

.app-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-light);
  opacity: 0;
  transition: opacity 200ms ease;
  z-index: 0;
}

.app-card:hover {
  transform: translate(3px, 3px);
  box-shadow: 4px 4px 0 var(--ink);
}

.app-card:hover::before {
  opacity: 1;
}

.app-card-inner {
  position: relative;
  z-index: 1;
  padding: 1.5rem 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.app-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.app-emoji-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 2px solid var(--ink);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 4px 4px 0 var(--ink);
}

.app-tag {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--ink);
  color: white;
  padding: 0.3em 0.7em;
  border-radius: 999px;
}

.app-name {
  font-size: 1.35rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.2;
}

.app-desc {
  font-size: 0.88rem;
  font-weight: 600;
  color: #444;
  margin: 0;
  line-height: 1.5;
}

.app-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--ink);
  background: white;
  border: 2px solid var(--ink);
  border-radius: 9px;
  padding: 0.4em 0.9em;
  box-shadow: 3px 3px 0 var(--ink);
  align-self: flex-start;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.app-card:hover .app-cta {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--ink);
}

/* ── Footer ── */
.hub-footer {
  margin-top: 3rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #888;
}

/* ── Dark mode ── */
html.dark .hub-logo {
  color: #f8fafc;
}

html.dark .hub-tagline, html.dark .app-desc {
  color: #94a3b8;
}

html.dark .hub-footer {
  color: #64748b;
}

html.dark .app-card {
  color: #f8fafc;
  background: rgba(30, 41, 59, 0.8);
  border-color: #020617;
  box-shadow: 8px 8px 0 #020617;
}

html.dark .app-card:hover {
  box-shadow: 4px 4px 0 #020617;
}

html.dark .app-tag {
  background: #020617;
  color: #f8fafc;
}

html.dark .app-emoji-wrap {
  background: #0f172a;
  border-color: #020617;
  box-shadow: 4px 4px 0 #020617;
}

html.dark .app-cta {
  background: #0f172a;
  color: #f8fafc;
  border-color: #020617;
  box-shadow: 3px 3px 0 #020617;
}

html.dark .app-card:hover .app-cta {
  box-shadow: 1px 1px 0 #020617;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .hub-grid {
    grid-template-columns: 1fr;
  }
}
</style>
