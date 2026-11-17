'use strict';

const STORAGE_KEY = 'vokabeln.progress.v1';
const EXAMPLES_KEY = 'vokabeln.examples.v1';
const SESSION_SIZE = 10;
const INTERVALS = [0, 10 * 60_000, 24 * 3_600_000, 3 * 86_400_000, 7 * 86_400_000, 21 * 86_400_000];
const MAX_BOX = INTERVALS.length - 1;
const KNOWN_BOX = 3;

const store = {
  data: {},
  load() {
    try {
      this.data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch {
      this.data = {};
    }
  },
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* private mode / quota */
    }
  },
  box(key) {
    return this.data[key]?.[0] ?? 0;
  },
  due(key) {
    return this.data[key]?.[1] ?? 0;
  },
  grade(key, ok) {
    const box = ok ? Math.min(this.box(key) + 1, MAX_BOX) : 0;
    this.data[key] = [box, Date.now() + INTERVALS[box]];
    this.save();
  },
  reset() {
    this.data = {};
    this.save();
  },
};

const state = {
  tab: 'lernen',
  quiz: null,
  cards: null,
  query: '',
  lesson: null,
  prompts: [],
  error: null,
  showExamples: false,
};

/* ---------- data ---------- */

function buildPrompts(lesson) {
  const out = [];
  for (const v of lesson.verben || []) {
    const paradigm = `${v.infinitiv} · ${v.praesens} · ${v.praeteritum} · ${v.perfekt}`;
    const example = v.beispiel || null;
    out.push({ key: `v|${v.infinitiv}|p3`, subject: v.infinitiv, ask: '3. Person Singular Präsens', answer: v.praesens, paradigm, example });
    out.push({ key: `v|${v.infinitiv}|praet`, subject: v.infinitiv, ask: 'Präteritum', answer: v.praeteritum, paradigm, example });
    out.push({ key: `v|${v.infinitiv}|perf`, subject: v.infinitiv, ask: 'Perfekt', answer: v.perfekt, paradigm, example });
  }
  for (const n of lesson.nomen || []) {
    const paradigm = n.singular === n.plural ? n.singular : `${n.singular} · ${n.plural}`;
    const example = n.beispiel || null;
    if (n.plural && n.plural !== n.singular) {
      out.push({ key: `n|${n.singular}|pl`, subject: n.singular, ask: 'Plural', answer: n.plural, paradigm, example });
    }
    const [artikel, ...rest] = n.singular.split(' ');
    if (rest.length) {
      out.push({
        key: `n|${n.singular}|art`,
        subject: rest.join(' '),
        ask: 'Artikel',
        answer: artikel,
        paradigm,
        example,
        options: ['der', 'die', 'das'],
      });
    }
  }
  const andere = lesson.andere || [];
  const pool = andere.map((w) => w.uebersetzung);
  for (const w of andere) {
    const distractors = shuffle(pool.filter((t) => t !== w.uebersetzung)).slice(0, 3);
    out.push({
      key: `a|${w.wort}`,
      subject: w.wort,
      ask: 'Französisch',
      answer: w.uebersetzung,
      paradigm: `${w.wort} · ${w.uebersetzung}`,
      example: w.beispiel || null,
      options: shuffle([w.uebersetzung, ...distractors]),
    });
  }
  return out;
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!]+$/, '');
}

function matches(prompt, input) {
  if (prompt.options) return input.trim() === prompt.answer;
  return normalize(input) === normalize(prompt.answer);
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function pickSession(size) {
  const now = Date.now();
  const due = [];
  const later = [];
  for (const p of state.prompts) (store.due(p.key) <= now ? due : later).push(p);
  shuffle(due);
  later.sort((a, b) => store.box(a.key) - store.box(b.key) || store.due(a.key) - store.due(b.key));
  return [...due, ...later].slice(0, size);
}

/* ---------- views ---------- */

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function homeView() {
  const now = Date.now();
  const total = state.prompts.length;
  const known = state.prompts.filter((p) => store.box(p.key) >= KNOWN_BOX).length;
  const due = state.prompts.filter((p) => store.due(p.key) <= now).length;
  const pct = total ? Math.round((known / total) * 100) : 0;
  const verbs = state.lesson.verben?.length ?? 0;
  const nouns = state.lesson.nomen?.length ?? 0;
  const others = state.lesson.andere?.length ?? 0;

  return `
  <header class="hero">
    <p class="eyebrow">Lektion ${esc(state.lesson.lektion ?? '')}</p>
    <h1>Vokabeln</h1>
    <p class="sub">${verbs} Verben · ${nouns} Nomen · ${others} weitere</p>
  </header>
  <section class="panel">
    <div class="row">
      <div><span class="big">${known}</span><span class="unit"> / ${total}</span></div>
      <span class="pill ${due ? 'warn' : ''}">${due} fällig</span>
    </div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <p class="muted small">Sicher ab ${KNOWN_BOX} richtigen Antworten in Folge.</p>
  </section>
  <div style="height:4px"></div>
  <button class="primary" id="start">Quiz starten<small>${Math.min(SESSION_SIZE, total)} Fragen</small></button>
  <button class="secondary" id="cards">Karten durchgehen</button>
  <button class="toggle" id="toggleExamples" aria-pressed="${state.showExamples}">
    <span>Beispielsätze</span>
    <span class="track"><i></i></span>
  </button>
  <button class="secondary" id="exportAnki">Nach Anki exportieren</button>
  ${installHint()}`;
}

function exampleBlock(beispiel) {
  if (!state.showExamples || !beispiel) return '';
  return `<p class="example">${esc(beispiel.de)}<span>${esc(beispiel.fr)}</span></p>`;
}

function installHint() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!ios) return '';
  return `<p class="hint">Zum Installieren: <b>Teilen</b> → <b>Zum Home-Bildschirm</b>.</p>`;
}

function quizView() {
  const q = state.quiz;
  if (q.done) return summaryView();

  const p = q.queue[q.index];
  const total = q.queue.length;
  const answered = q.verdict !== null;

  return `
  <header class="topbar">
    <button class="ghost" id="quit">Zurück</button>
    <span class="counter">${q.index + 1} / ${total}</span>
  </header>
  <div class="bar thin"><i style="width:${(q.index / total) * 100}%"></i></div>
  <section class="prompt">
    <p class="ask">${esc(p.ask)}</p>
    <h2 class="subject">${esc(p.subject)}</h2>
  </section>
  ${answered ? feedbackView(p, q.verdict) : answerView(p)}`;
}

function answerView(p) {
  if (p.options) {
    return `<div class="choices">${shuffle([...p.options])
      .map((o) => `<button class="choice" data-choice="${esc(o)}">${esc(o)}</button>`)
      .join('')}</div>`;
  }
  return `
  <form class="answer" id="form" autocomplete="off">
    <input id="answer" class="input" type="text" enterkeyhint="done" autocapitalize="none"
           autocorrect="off" spellcheck="false" placeholder="Antwort">
    <div class="umlauts">
      ${['ä', 'ö', 'ü', 'ß'].map((c) => `<button type="button" class="key" data-umlaut="${c}">${c}</button>`).join('')}
    </div>
    <button class="primary" type="submit">Prüfen</button>
  </form>`;
}

function feedbackView(p, ok) {
  const last = state.quiz.index + 1 >= state.quiz.queue.length;
  return `
  <section class="feedback ${ok ? 'ok' : 'bad'}">
    <p class="verdict">${ok ? 'Richtig' : 'Falsch'}</p>
    <p class="solution">${esc(p.answer)}</p>
    <p class="paradigm">${esc(p.paradigm)}</p>
    ${exampleBlock(p.example)}
  </section>
  <button class="primary" id="next">${last ? 'Auswertung' : 'Weiter'}</button>`;
}

function summaryView() {
  const q = state.quiz;
  const pct = q.queue.length ? Math.round((q.correct / q.queue.length) * 100) : 0;
  return `
  <section class="summary">
    <p class="eyebrow">Ergebnis</p>
    <h2>${q.correct} / ${q.queue.length}</h2>
    <p class="muted">${pct}% richtig</p>
  </section>
  <button class="primary" id="again">Nochmal</button>
  <button class="secondary" id="quit">Zur Übersicht</button>`;
}

function cardsView() {
  const c = state.cards;
  if (!c) {
    const due = state.prompts.filter((p) => store.due(p.key) <= Date.now()).length;
    return `
    <header class="hero">
      <h1>Karten</h1>
      <p class="sub">${state.prompts.length} Formen · ${due} fällig</p>
    </header>
    <div style="height:4px"></div>
    <button class="primary" id="startCards">Alle Karten</button>
    <button class="secondary" id="dueCards" ${due ? '' : 'disabled'}>Nur fällige${due ? ` (${due})` : ''}</button>`;
  }

  if (c.done) {
    return `
    <section class="summary">
      <p class="eyebrow">Durch</p>
      <h2>${c.queue.length}</h2>
      <p class="muted">Karten wiederholt</p>
    </section>
    <button class="primary" id="startCards">Nochmal</button>
    <button class="secondary" id="quitCards">Zurück</button>`;
  }

  const p = c.queue[c.index];
  return `
  <header class="topbar">
    <button class="ghost" id="quitCards">Zurück</button>
    <span class="counter">${c.index + 1} / ${c.queue.length}</span>
  </header>
  <div class="bar thin"><i style="width:${(c.index / c.queue.length) * 100}%"></i></div>
  <button class="card ${c.revealed ? 'flipped' : ''}" id="card">
    <p class="ask">${esc(p.ask)}</p>
    <h2 class="subject">${esc(p.subject)}</h2>
    ${c.revealed
      ? `<p class="answer-line">${esc(p.answer)}</p><p class="paradigm">${esc(p.paradigm)}</p>${exampleBlock(p.example)}`
      : `<p class="tap">Tippen zum Umdrehen</p>`}
  </button>
  ${c.revealed
    ? `<div class="grade"><button class="no" id="no">Nochmal</button><button class="yes" id="yes">Gewusst</button></div>`
    : ''}`;
}

function listView() {
  const q = state.query.trim().toLowerCase();
  const hit = (fields) => !q || fields.join(' ').toLowerCase().includes(q);
  const verbs = (state.lesson.verben || []).filter((v) => hit([v.infinitiv, v.praesens, v.praeteritum, v.perfekt, v.uebersetzung || '']));
  const nouns = (state.lesson.nomen || []).filter((n) => hit([n.singular, n.plural, n.uebersetzung || '']));
  const others = (state.lesson.andere || []).filter((w) => hit([w.wort, w.uebersetzung || '']));

  const verbRows = verbs.map((v) => `
    <li class="entry">
      <div class="entry-main"><b>${esc(v.infinitiv)}</b><span class="tr">${esc(v.uebersetzung || '')}</span></div>
      <div class="entry-sub">${esc(v.praesens)} · ${esc(v.praeteritum)} · ${esc(v.perfekt)}</div>
      ${exampleBlock(v.beispiel)}
    </li>`).join('');

  const nounRows = nouns.map((n) => `
    <li class="entry">
      <div class="entry-main"><b>${esc(n.singular)}</b><span class="tr">${esc(n.uebersetzung || '')}</span></div>
      ${n.plural !== n.singular ? `<div class="entry-sub">Plural: ${esc(n.plural)}</div>` : ''}
      ${exampleBlock(n.beispiel)}
    </li>`).join('');

  const otherRows = others.map((w) => `
    <li class="entry">
      <div class="entry-main"><b>${esc(w.wort)}</b><span class="tr">${esc(w.uebersetzung || '')}</span></div>
      ${exampleBlock(w.beispiel)}
    </li>`).join('');

  const empty = verbs.length + nouns.length + others.length === 0;

  return `
  <header class="hero">
    <h1>Liste</h1>
    <p class="sub">${state.prompts.length} Formen</p>
  </header>
  <input id="search" class="search" type="search" placeholder="Suchen…" value="${esc(state.query)}" autocomplete="off">
  ${empty ? '<p class="empty">Nichts gefunden.</p>' : ''}
  ${verbs.length ? `<h3 class="section-title">Verben</h3><ul class="entries">${verbRows}</ul>` : ''}
  ${nouns.length ? `<h3 class="section-title">Nomen</h3><ul class="entries">${nounRows}</ul>` : ''}
  ${others.length ? `<h3 class="section-title">Weitere Wörter</h3><ul class="entries">${otherRows}</ul>` : ''}
  <button class="ghost" id="reset" style="margin-top:18px">Fortschritt zurücksetzen</button>`;
}

function tabBar() {
  const tab = (id, label, icon) => `
    <button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">
      ${icon}<span>${label}</span>
    </button>`;
  return `<nav class="tabs">
    ${tab('lernen', 'Lernen', '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/></svg>')}
    ${tab('karten', 'Karten', '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v12"/></svg>')}
    ${tab('liste', 'Liste', '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>')}
  </nav>`;
}

/* ---------- render ---------- */

function render() {
  const app = document.getElementById('app');

  if (state.error) {
    app.innerHTML = `<main class="view"><p class="empty">Vokabeln konnten nicht geladen werden.<br><span class="small">${esc(state.error)}</span></p></main>`;
    return;
  }
  if (!state.lesson) {
    app.innerHTML = `<main class="view"><p class="empty">Lädt…</p></main>`;
    return;
  }

  let body;
  if (state.tab === 'lernen') body = state.quiz ? quizView() : homeView();
  else if (state.tab === 'karten') body = cardsView();
  else body = listView();

  app.innerHTML = `<main class="view">${body}</main>${tabBar()}`;
  wire();
}

function wire() {
  const $ = (id) => document.getElementById(id);

  $('start')?.addEventListener('click', startQuiz);
  $('again')?.addEventListener('click', startQuiz);
  $('cards')?.addEventListener('click', () => { state.tab = 'karten'; state.cards = null; render(); });
  $('quit')?.addEventListener('click', () => { state.quiz = null; render(); });
  $('next')?.addEventListener('click', nextQuestion);
  $('exportAnki')?.addEventListener('click', exportAnki);
  $('toggleExamples')?.addEventListener('click', () => {
    state.showExamples = !state.showExamples;
    try {
      localStorage.setItem(EXAMPLES_KEY, state.showExamples ? '1' : '0');
    } catch {
      /* private mode */
    }
    render();
  });

  $('startCards')?.addEventListener('click', () => startCards(false));
  $('dueCards')?.addEventListener('click', () => startCards(true));
  $('quitCards')?.addEventListener('click', () => { state.cards = null; render(); });
  $('card')?.addEventListener('click', () => { state.cards.revealed = true; render(); });
  $('no')?.addEventListener('click', () => gradeCard(false));
  $('yes')?.addEventListener('click', () => gradeCard(true));

  const form = $('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAnswer($('answer').value);
    });
    $('answer').focus();
  }

  document.querySelectorAll('[data-umlaut]').forEach((btn) =>
    btn.addEventListener('click', () => insertUmlaut(btn.dataset.umlaut)));

  document.querySelectorAll('[data-choice]').forEach((btn) =>
    btn.addEventListener('click', () => submitAnswer(btn.dataset.choice)));

  document.querySelectorAll('[data-tab]').forEach((btn) =>
    btn.addEventListener('click', () => { state.tab = btn.dataset.tab; render(); }));

  const search = $('search');
  if (search) {
    search.addEventListener('input', (e) => {
      state.query = e.target.value;
      const pos = e.target.selectionStart;
      render();
      const el = document.getElementById('search');
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  $('reset')?.addEventListener('click', () => {
    if (confirm('Fortschritt wirklich löschen?')) {
      store.reset();
      render();
    }
  });
}

/* ---------- actions ---------- */

function startQuiz() {
  const queue = pickSession(SESSION_SIZE);
  state.quiz = { queue, index: 0, verdict: null, correct: 0, done: queue.length === 0 };
  state.tab = 'lernen';
  render();
}

function submitAnswer(value) {
  const q = state.quiz;
  if (!q || q.verdict !== null) return;
  const p = q.queue[q.index];
  const ok = matches(p, value);
  store.grade(p.key, ok);
  q.verdict = ok;
  if (ok) q.correct += 1;
  render();
}

function nextQuestion() {
  const q = state.quiz;
  q.index += 1;
  q.verdict = null;
  if (q.index >= q.queue.length) q.done = true;
  render();
}

function startCards(onlyDue) {
  const now = Date.now();
  const queue = state.prompts.filter((p) => !onlyDue || store.due(p.key) <= now);
  queue.sort((a, b) => store.box(a.key) - store.box(b.key) || store.due(a.key) - store.due(b.key));
  state.cards = { queue, index: 0, revealed: false, done: queue.length === 0 };
  render();
}

function gradeCard(ok) {
  const c = state.cards;
  store.grade(c.queue[c.index].key, ok);
  c.index += 1;
  c.revealed = false;
  if (c.index >= c.queue.length) c.done = true;
  render();
}

function insertUmlaut(ch) {
  const input = document.getElementById('answer');
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  input.value = input.value.slice(0, start) + ch + input.value.slice(end);
  input.focus();
  const pos = start + ch.length;
  input.setSelectionRange(pos, pos);
}

/* ---------- export ---------- */

function exportAnki() {
  const block = (b) => (state.showExamples && b
    ? `<br><span style="color:#888">${esc(b.de)}</span><br><i>${esc(b.fr)}</i>`
    : '');
  const rows = [];

  for (const v of state.lesson.verben || []) {
    rows.push([
      esc(v.infinitiv),
      `<b>${esc(v.praesens)}</b><br>${esc(v.praeteritum)}<br>${esc(v.perfekt)}<br><i>${esc(v.uebersetzung || '')}</i>${block(v.beispiel)}`,
      'lektion12 verb',
    ]);
  }
  for (const n of state.lesson.nomen || []) {
    const plural = n.plural && n.plural !== n.singular ? `${esc(n.plural)}<br>` : '';
    rows.push([
      esc(n.singular),
      `${plural}<i>${esc(n.uebersetzung || '')}</i>${block(n.beispiel)}`,
      'lektion12 nomen',
    ]);
  }
  for (const w of state.lesson.andere || []) {
    rows.push([
      esc(w.wort),
      `<i>${esc(w.uebersetzung || '')}</i>${block(w.beispiel)}`,
      'lektion12 andere',
    ]);
  }

  const lines = [
    '#separator:tab',
    '#html:true',
    '#tags column:3',
    '#columns:Front,Back,Tags',
    ...rows.map((row) => row.join('\t')),
  ];
  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/tab-separated-values;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vokabeln-lektion-12.tsv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- boot ---------- */

async function init() {
  store.load();
  try {
    state.showExamples = localStorage.getItem(EXAMPLES_KEY) === '1';
  } catch {
    state.showExamples = false;
  }
  try {
    const res = await fetch('vocab.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`vocab.json (${res.status})`);
    state.lesson = await res.json();
    state.prompts = buildPrompts(state.lesson);
  } catch (err) {
    state.error = err.message;
  }
  render();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const register = () => navigator.serviceWorker.register('sw.js').catch(() => {});
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });
  if (document.readyState === 'complete') register();
  else addEventListener('load', register, { once: true });
}

registerServiceWorker();
init();
