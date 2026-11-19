'use strict';

const STORAGE_KEY = 'vokabeln.progress.v1';
const EXAMPLES_KEY = 'vokabeln.examples.v1';
const LANG_KEY = 'vokabeln.lang.v1';
const TYPES_KEY = 'vokabeln.types.v1';
const SIZE_KEY = 'vokabeln.size.v1';
const WRITE_KEY = 'vokabeln.write.v1';
const STATS_KEY = 'vokabeln.stats.v1';
const SIZES = [10, 20, 50, 0];
const TYPES = ['p3', 'praet', 'perf', 'plural', 'artikel', 'german', 'wordplural'];
const TYPE_LABEL = { p3: 'typeP3', praet: 'typePraet', perf: 'typePerf', plural: 'typePlural', artikel: 'typeArtikel', german: 'typeGerman', wordplural: 'wordplural' };
const INTERVALS = [0, 10 * 60_000, 24 * 3_600_000, 3 * 86_400_000, 7 * 86_400_000, 21 * 86_400_000];
const MAX_BOX = INTERVALS.length - 1;
const KNOWN_BOX = 3;

/* ---------- i18n ---------- */

const T = {
  de: {
    lesson: 'Lektion',
    title: 'Vokabeln',
    counts: (v, n, o) => `${v} Verben · ${n} Nomen · ${o} weitere`,
    forms: (n) => `${n} Formen`,
    due: (n) => `${n} fällig`,
    known: 'Sicher ab 3 richtigen Antworten in Folge.',
    startQuiz: 'Quiz starten',
    questions: (n) => `${n} Fragen`,
    cards: 'Karten durchgehen',
    examples: 'Beispielsätze',
    exportAnki: 'Nach Anki exportieren',
    back: 'Zurück',
    check: 'Prüfen',
    correct: 'Richtig',
    wrong: 'Falsch',
    next: 'Weiter',
    result: 'Ergebnis',
    percent: (n) => `${n}% richtig`,
    again: 'Nochmal',
    toOverview: 'Zur Übersicht',
    allCards: 'Alle Karten',
    dueCards: 'Nur fällige',
    done: 'Durch',
    reviewed: 'Karten wiederholt',
    list: 'Liste',
    search: 'Suchen…',
    nothing: 'Nichts gefunden.',
    plural: 'Plural',
    reset: 'Fortschritt zurücksetzen',
    resetAsk: 'Fortschritt wirklich löschen?',
    loading: 'Lädt…',
    loadError: 'Vokabeln konnten nicht geladen werden.',
    install: 'Zum Installieren: <b>Teilen</b> → <b>Zum Home-Bildschirm</b>.',
    flip: 'Tippen zum Umdrehen',
    otherWords: 'Weitere Wörter',
    p3: '3. Person Singular Präsens',
    praet: 'Präteritum',
    perf: 'Perfekt',
    artikel: 'Artikel',
    french: 'Französisch',
    german: 'Deutsch',
    tabLearn: 'Lernen',
    tabCards: 'Karten',
    tabList: 'Liste',
    tabRapid: 'Schnell',
    verbs: 'Verben',
    nouns: 'Nomen',
    types: 'Fragetypen',
    typeP3: 'Präsens',
    typePraet: 'Präteritum',
    typePerf: 'Perfekt',
    typePlural: 'Plural',
    typeArtikel: 'Artikel',
    typeGerman: 'Übersetzung',
    wordplural: 'Wort + Plural',
    singular: 'Singular',
    amount: 'Anzahl Fragen',
    all: 'Alle',
    write: 'Antworten schreiben',
    rapid: 'Schnellmodus',
    rapidDesc: 'Alle Wörter: erst das Wort, dann eine Form. Fehler kommen zurück.',
    rapidStart: 'Los geht’s',
    repeat: 'Wiederholung',
    tabFehler: 'Fehler',
    fehlEmpty: 'Noch keine Antworten. Starte ein Quiz!',
    fehlPerfect: 'Keine Fehler – weiter so!',
    fehlPractise: 'Fehler üben',
    fehlErrors: (n) => `${n}× falsch`,
    fehlAttempts: (n) => `${n} Versuche`,
    fehlClean: (n) => `${n} ${n === 1 ? 'Wort' : 'Wörter'} ohne Fehler`,
    fehlBox: 'Box',
  },
  fr: {
    lesson: 'Leçon',
    title: 'Vocabulaire',
    counts: (v, n, o) => `${v} verbes · ${n} noms · ${o} autres`,
    forms: (n) => `${n} formes`,
    due: (n) => `${n} à réviser`,
    known: 'Acquis après 3 bonnes réponses d’affilée.',
    startQuiz: 'Lancer le quiz',
    questions: (n) => `${n} questions`,
    cards: 'Réviser les cartes',
    examples: 'Phrases d’exemple',
    exportAnki: 'Exporter vers Anki',
    back: 'Retour',
    check: 'Vérifier',
    correct: 'Juste',
    wrong: 'Faux',
    next: 'Suivant',
    result: 'Résultat',
    percent: (n) => `${n}% de réussite`,
    again: 'Recommencer',
    toOverview: 'Retour à l’accueil',
    allCards: 'Toutes les cartes',
    dueCards: 'À réviser seulement',
    done: 'Terminé',
    reviewed: 'cartes révisées',
    list: 'Liste',
    search: 'Rechercher…',
    nothing: 'Aucun résultat.',
    plural: 'Pluriel',
    reset: 'Réinitialiser la progression',
    resetAsk: 'Supprimer vraiment la progression ?',
    loading: 'Chargement…',
    loadError: 'Impossible de charger le vocabulaire.',
    install: 'Pour installer : <b>Partager</b> → <b>Sur l’écran d’accueil</b>.',
    flip: 'Toucher pour retourner',
    otherWords: 'Autres mots',
    p3: '3e personne du singulier, présent',
    praet: 'Prétérit',
    perf: 'Parfait',
    artikel: 'Article',
    french: 'Français',
    german: 'Allemand',
    tabLearn: 'Apprendre',
    tabCards: 'Cartes',
    tabList: 'Liste',
    tabRapid: 'Rapide',
    verbs: 'Verbes',
    nouns: 'Noms',
    types: 'Types de questions',
    typeP3: 'Présent',
    typePraet: 'Prétérit',
    typePerf: 'Parfait',
    typePlural: 'Pluriel',
    typeArtikel: 'Article',
    typeGerman: 'Traduction',
    wordplural: 'Mot + pluriel',
    singular: 'Singulier',
    amount: 'Nombre de questions',
    all: 'Tout',
    write: 'Écrire les réponses',
    rapid: 'Mode rapide',
    rapidDesc: 'Tous les mots : d’abord le mot, puis une forme. Les erreurs reviennent.',
    rapidStart: 'Commencer',
    repeat: 'Répétition',
    tabFehler: 'Erreurs',
    fehlEmpty: 'Pas encore de réponses. Lance un quiz !',
    fehlPerfect: 'Aucune erreur, continue comme ça !',
    fehlPractise: 'Rejouer les erreurs',
    fehlErrors: (n) => `${n}× raté`,
    fehlAttempts: (n) => `${n} tentatives`,
    fehlClean: (n) => `${n} ${n === 1 ? 'mot' : 'mots'} sans faute`,
    fehlBox: 'Boîte',
  },
};

const t = (key) => T[state.lang][key];

/* ---------- store ---------- */

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
    stats.grade(key, ok);
    const box = ok ? Math.min(this.box(key) + 1, MAX_BOX) : 0;
    this.data[key] = [box, Date.now() + INTERVALS[box]];
    this.save();
  },
  reset() {
    this.data = {};
    this.save();
  },
};

const stats = {
  data: {},
  load() {
    try {
      this.data = JSON.parse(localStorage.getItem(STATS_KEY) || '{}') || {};
    } catch {
      this.data = {};
    }
  },
  save() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.data));
    } catch {
      /* private mode / quota */
    }
  },
  grade(key, ok) {
    const entry = this.data[key] || [0, 0];
    entry[ok ? 0 : 1] += 1;
    this.data[key] = entry;
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
  lang: 'de',
  types: { p3: true, praet: true, perf: true, plural: true, artikel: true, german: true, wordplural: true },
  size: 10,
  write: true,
};

/* ---------- data ---------- */

function buildPrompts(lesson) {
  const out = [];

  for (const v of lesson.verben || []) {
    const paradigm = `${v.infinitiv} · ${v.praesens} · ${v.praeteritum} · ${v.perfekt}`;
    const example = v.beispiel || null;
    const subject = v.uebersetzung || v.infinitiv;
    out.push({ key: `v|${v.infinitiv}|p3`, subject, ask: 'p3', answer: v.praesens, paradigm, example });
    out.push({ key: `v|${v.infinitiv}|praet`, subject, ask: 'praet', answer: v.praeteritum, paradigm, example });
    out.push({ key: `v|${v.infinitiv}|perf`, subject, ask: 'perf', answer: v.perfekt, paradigm, example });
    out.push({ key: `v|${v.infinitiv}|de`, subject, ask: 'german', answer: v.infinitiv, paradigm, example });
  }

  for (const n of lesson.nomen || []) {
    const paradigm = n.singular === n.plural ? n.singular : `${n.singular} · ${n.plural}`;
    const example = n.beispiel || null;
    const subject = n.uebersetzung || n.singular;
    if (n.plural && n.plural !== n.singular) {
      out.push({ key: `n|${n.singular}|pl`, subject, ask: 'plural', answer: n.plural, paradigm, example });
    }
    out.push({ key: `n|${n.singular}|de`, subject, ask: 'german', answer: n.singular, paradigm, example });
    if (n.plural && n.plural !== n.singular) {
      out.push({
        key: `n|${n.singular}|both`,
        subject,
        ask: 'wordplural',
        answer: `${n.singular} · ${n.plural}`,
        fields: [n.singular, n.plural],
        paradigm,
        example,
      });
    }
    const [artikel, ...rest] = n.singular.split(' ');
    if (rest.length) {
      out.push({
        key: `n|${n.singular}|art`,
        subject,
        ask: 'artikel',
        answer: artikel,
        paradigm,
        example,
        options: ['der', 'die', 'das'],
      });
    }
  }

  const andere = lesson.andere || [];
  const pool = andere.map((w) => w.wort);
  for (const w of andere) {
    const distractors = shuffle(pool.filter((x) => x !== w.wort)).slice(0, 3);
    out.push({
      key: `a|${w.wort}`,
      subject: w.uebersetzung,
      ask: 'german',
      answer: w.wort,
      paradigm: `${w.uebersetzung} · ${w.wort}`,
      example: w.beispiel || null,
      options: shuffle([w.wort, ...distractors]),
    });
  }

  return out;
}

function normalize(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!]+$/, '');
}

function acceptedAnswers(answer) {
  const base = normalize(answer);
  const out = new Set([base]);
  out.add(base.replace(/[()]/g, ''));
  out.add(base.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim());
  return out;
}

function matches(prompt, input) {
  if (prompt.options && !state.write) return input.trim() === prompt.answer;
  return acceptedAnswers(prompt.answer).has(normalize(input));
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function activePrompts() {
  return state.prompts.filter((p) => state.types[p.ask]);
}

function pickSession(size) {
  const now = Date.now();
  const due = [];
  const later = [];
  for (const p of activePrompts()) (store.due(p.key) <= now ? due : later).push(p);
  shuffle(due);
  later.sort((a, b) => store.box(a.key) - store.box(b.key) || store.due(a.key) - store.due(b.key));
  return [...due, ...later].slice(0, size);
}

/* ---------- views ---------- */

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function exampleBlock(beispiel) {
  if (!state.showExamples || !beispiel) return '';
  return `<p class="example">${esc(beispiel.de)}<span>${esc(beispiel.fr)}</span></p>`;
}

function langSwitch() {
  return `<div class="seg">
    <button class="seg-btn ${state.lang === 'de' ? 'active' : ''}" data-lang="de">DE</button>
    <button class="seg-btn ${state.lang === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
  </div>`;
}

function homeView() {
  const now = Date.now();
  const pool = activePrompts();
  const total = pool.length;
  const known = pool.filter((p) => store.box(p.key) >= KNOWN_BOX).length;
  const due = pool.filter((p) => store.due(p.key) <= now).length;
  const pct = total ? Math.round((known / total) * 100) : 0;
  const verbs = state.lesson.verben?.length ?? 0;
  const nouns = state.lesson.nomen?.length ?? 0;
  const others = state.lesson.andere?.length ?? 0;

  return `
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">${t('lesson')} ${esc(state.lesson.lektion ?? '')}</p>
      ${langSwitch()}
    </div>
    <h1>${t('title')}</h1>
    <p class="sub">${t('counts')(verbs, nouns, others)}</p>
  </header>
  <section class="panel">
    <div class="row">
      <div><span class="big">${known}</span><span class="unit"> / ${total}</span></div>
      <span class="pill ${due ? 'warn' : ''}">${t('due')(due)}</span>
    </div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <p class="muted small">${t('known')}</p>
  </section>
  <div class="types">
    <p class="section-title">${t('types')}</p>
    <div class="chips">
      ${TYPES.map((k) => `<button class="chip ${state.types[k] ? 'active' : ''}" data-type="${k}">${t(TYPE_LABEL[k])}</button>`).join('')}
    </div>
  </div>
  <div class="types">
    <p class="section-title">${t('amount')}</p>
    <div class="chips">
      ${SIZES.map((n) => `<button class="chip ${state.size === n ? 'active' : ''}" data-size="${n}">${n || t('all')}</button>`).join('')}
    </div>
  </div>
  <div style="height:4px"></div>
  <button class="primary" id="start">${t('startQuiz')}<small>${t('questions')(Math.min(state.size || total, total))}</small></button>
  <button class="secondary" id="cards">${t('cards')}</button>
  <button class="toggle" id="toggleWrite" aria-pressed="${state.write}">
    <span>${t('write')}</span>
    <span class="track"><i></i></span>
  </button>
  <button class="toggle" id="toggleExamples" aria-pressed="${state.showExamples}">
    <span>${t('examples')}</span>
    <span class="track"><i></i></span>
  </button>
  <button class="secondary" id="exportAnki">${t('exportAnki')}</button>
  ${installHint()}`;
}

function installHint() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!ios) return '';
  return `<p class="hint">${t('install')}</p>`;
}

function quizView() {
  const q = state.quiz;
  if (q.done) return summaryView();

  const p = q.queue[q.index];
  const total = q.queue.length;
  const answered = q.verdict !== null;

  return `
  <header class="topbar">
    <button class="ghost" id="quit">${t('back')}</button>
    <span class="counter">${q.index + 1} / ${total}</span>
  </header>
  <div class="bar thin"><i style="width:${(q.index / total) * 100}%"></i></div>
  <section class="prompt">
    <p class="ask">${esc(t(p.ask))}${p.repeat ? ` <span class="repeat">${t('repeat')}</span>` : ''}</p>
    <h2 class="subject">${esc(p.subject)}</h2>
  </section>
  ${answered ? feedbackView(p, q.verdict) : answerView(p)}`;
}

function answerView(p) {
  if (p.options && !state.write) {
    return `<div class="choices">${shuffle([...p.options])
      .map((o) => `<button class="choice" data-choice="${esc(o)}">${esc(o)}</button>`)
      .join('')}</div>`;
  }
  const fields = p.fields || [null];
  const inputs = fields.map((f, i) => (fields.length > 1
    ? `<label class="field">
         <span class="field-label">${esc(t(i === 0 ? 'singular' : 'plural'))}</span>
         <input ${i === 0 ? 'id="answer"' : ''} data-field="${i}" class="input" type="text" autocapitalize="none"
                autocorrect="off" spellcheck="false" placeholder="…">
       </label>`
    : `<input id="answer" class="input" type="text" enterkeyhint="done" autocapitalize="none"
              autocorrect="off" spellcheck="false" placeholder="…">`)).join('');

  return `
  <form class="answer" id="form" autocomplete="off">
    ${inputs}
    <div class="umlauts">
      ${['ä', 'ö', 'ü', 'ß'].map((c) => `<button type="button" class="key" data-umlaut="${c}">${c}</button>`).join('')}
    </div>
    <button class="primary" type="submit">${t('check')}</button>
  </form>`;
}

function feedbackView(p, ok) {
  const last = state.quiz.index + 1 >= state.quiz.queue.length;
  return `
  <section class="feedback ${ok ? 'ok' : 'bad'}">
    <p class="verdict">${ok ? t('correct') : t('wrong')}</p>
    <p class="solution">${esc(p.answer)}</p>
    <p class="paradigm">${esc(p.paradigm)}</p>
    ${exampleBlock(p.example)}
  </section>
  <button class="primary" id="next">${last ? t('result') : t('next')}</button>`;
}

function summaryView() {
  const q = state.quiz;
  const pct = q.queue.length ? Math.round((q.correct / q.queue.length) * 100) : 0;
  return `
  <section class="summary">
    <p class="eyebrow">${t('result')}</p>
    <h2>${q.correct} / ${q.queue.length}</h2>
    <p class="muted">${t('percent')(pct)}</p>
  </section>
  <button class="primary" id="again">${t('again')}</button>
  <button class="secondary" id="quit">${t('toOverview')}</button>`;
}

function buildRapidQueue() {
  const groups = new Map();
  for (const p of state.prompts) {
    const word = p.key.split('|')[1] || p.key;
    if (!groups.has(word)) groups.set(word, []);
    groups.get(word).push(p);
  }
  const entries = [...groups.values()].map((list) => ({
    trans: list.find((p) => p.ask === 'german'),
    forms: list.filter((p) => p.ask !== 'german'),
    box: Math.min(...list.map((p) => store.box(p.key))),
  }));
  entries.sort((a, b) => a.box - b.box);

  const queue = [];
  for (const e of entries) {
    if (e.trans) queue.push(e.trans);
    if (e.forms.length) queue.push(e.forms[Math.floor(Math.random() * e.forms.length)]);
  }
  return queue;
}

function rapidView() {
  const count = buildRapidQueue().length;
  return `
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">${t('rapid')}</p>
      ${langSwitch()}
    </div>
    <h1>${t('rapid')}</h1>
    <p class="sub">${t('rapidDesc')}</p>
  </header>
  <div style="height:4px"></div>
  <button class="primary" id="startRapid">${t('rapidStart')}<small>${t('questions')(count)}</small></button>`;
}

function cardsView() {
  const c = state.cards;
  if (!c) {
    const due = activePrompts().filter((p) => store.due(p.key) <= Date.now()).length;
    return `
    <header class="hero">
      <div class="hero-top">
        <p class="eyebrow">${t('tabCards')}</p>
        ${langSwitch()}
      </div>
      <h1>${t('tabCards')}</h1>
      <p class="sub">${t('forms')(activePrompts().length)} · ${t('due')(due)}</p>
    </header>
    <div style="height:4px"></div>
    <button class="primary" id="startCards">${t('allCards')}</button>
    <button class="secondary" id="dueCards" ${due ? '' : 'disabled'}>${due ? `${t('dueCards')} (${due})` : t('dueCards')}</button>`;
  }

  if (c.done) {
    return `
    <section class="summary">
      <p class="eyebrow">${t('done')}</p>
      <h2>${c.queue.length}</h2>
      <p class="muted">${t('reviewed')}</p>
    </section>
    <button class="primary" id="startCards">${t('again')}</button>
    <button class="secondary" id="quitCards">${t('back')}</button>`;
  }

  const p = c.queue[c.index];
  return `
  <header class="topbar">
    <button class="ghost" id="quitCards">${t('back')}</button>
    <span class="counter">${c.index + 1} / ${c.queue.length}</span>
  </header>
  <div class="bar thin"><i style="width:${(c.index / c.queue.length) * 100}%"></i></div>
  <button class="card ${c.revealed ? 'flipped' : ''}" id="card">
    <p class="ask">${esc(t(p.ask))}</p>
    <h2 class="subject">${esc(p.subject)}</h2>
    ${c.revealed
      ? `<p class="answer-line">${esc(p.answer)}</p><p class="paradigm">${esc(p.paradigm)}</p>${exampleBlock(p.example)}`
      : `<p class="tap">${t('flip')}</p>`}
  </button>
  ${c.revealed
    ? `<div class="grade"><button class="no" id="no">${t('again')}</button><button class="yes" id="yes">${t('correct')}</button></div>`
    : ''}`;
}

function listView() {
  const q = state.query.trim().toLowerCase();
  const hit = (fields) => !q || fields.join(' ').toLowerCase().includes(q);
  const ex = (b) => (b ? [b.de, b.fr] : []);
  const verbs = (state.lesson.verben || []).filter((v) => hit([v.infinitiv, v.praesens, v.praeteritum, v.perfekt, v.uebersetzung || '', ...ex(v.beispiel)]));
  const nouns = (state.lesson.nomen || []).filter((n) => hit([n.singular, n.plural, n.uebersetzung || '', ...ex(n.beispiel)]));
  const others = (state.lesson.andere || []).filter((w) => hit([w.wort, w.uebersetzung || '', ...ex(w.beispiel)]));

  const verbRows = verbs.map((v) => `
    <li class="entry">
      <div class="entry-main"><b>${esc(v.infinitiv)}</b><span class="tr">${esc(v.uebersetzung || '')}</span></div>
      <div class="entry-sub">${esc(v.praesens)} · ${esc(v.praeteritum)} · ${esc(v.perfekt)}</div>
      ${exampleBlock(v.beispiel)}
    </li>`).join('');

  const nounRows = nouns.map((n) => `
    <li class="entry">
      <div class="entry-main"><b>${esc(n.singular)}</b><span class="tr">${esc(n.uebersetzung || '')}</span></div>
      ${n.plural !== n.singular ? `<div class="entry-sub">${t('plural')}: ${esc(n.plural)}</div>` : ''}
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
    <div class="hero-top">
      <p class="eyebrow">${t('tabList')}</p>
      ${langSwitch()}
    </div>
    <h1>${t('tabList')}</h1>
    <p class="sub">${t('forms')(state.prompts.length)}</p>
  </header>
  <input id="search" class="search" type="search" placeholder="${t('search')}" value="${esc(state.query)}" autocomplete="off">
  ${empty ? `<p class="empty">${t('nothing')}</p>` : ''}
  ${verbs.length ? `<h3 class="section-title">${t('verbs')}</h3><ul class="entries">${verbRows}</ul>` : ''}
  ${nouns.length ? `<h3 class="section-title">${t('nouns')}</h3><ul class="entries">${nounRows}</ul>` : ''}
  ${others.length ? `<h3 class="section-title">${t('otherWords')}</h3><ul class="entries">${otherRows}</ul>` : ''}
  <button class="ghost" id="reset" style="margin-top:18px">${t('reset')}</button>`;
}

function fehlView() {
  const info = new Map();
  for (const v of state.lesson.verben || []) info.set(v.infinitiv, { de: v.infinitiv, fr: v.uebersetzung || '' });
  for (const n of state.lesson.nomen || []) info.set(n.singular, { de: n.singular, fr: n.uebersetzung || '' });
  for (const w of state.lesson.andere || []) info.set(w.wort, { de: w.wort, fr: w.uebersetzung || '' });

  const groups = new Map();
  for (const p of activePrompts()) {
    const s = stats.data[p.key];
    if (!s) continue;
    const [ok, no] = s;
    if (!ok && !no) continue;
    const word = p.key.split('|')[1] || p.key;
    let g = groups.get(word);
    if (!g) {
      const meta = info.get(word) || { de: word, fr: '' };
      g = { de: meta.de, fr: meta.fr, wrong: 0, total: 0, box: -1, forms: [] };
      groups.set(word, g);
    }
    g.wrong += no;
    g.total += ok + no;
    g.box = Math.max(g.box, store.box(p.key));
    if (no > 0) g.forms.push({ label: t(TYPE_LABEL[p.ask] || 'german'), wrong: no, total: ok + no });
  }

  const words = [...groups.values()];
  const missed = words
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong || a.wrong / a.total - b.wrong / b.total || a.de.localeCompare(b.de));
  const clean = words.length - missed.length;
  const attempted = words.reduce((sum, w) => sum + w.total, 0);

  const head = `
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">${t('lesson')} ${esc(state.lesson.lektion ?? '')}</p>
      ${langSwitch()}
    </div>
    <h1>${t('tabFehler')}</h1>
    <p class="sub">${attempted ? t('fehlAttempts')(attempted) : t('forms')(activePrompts().length)}</p>
  </header>`;

  if (!attempted) return `${head}<p class="empty">${t('fehlEmpty')}</p>`;
  if (!missed.length) return `${head}<p class="empty">${t('fehlPerfect')}</p><p class="sub" style="text-align:center">${t('fehlClean')(clean)}</p>`;

  return `
  ${head}
  <button class="primary" id="practiseFehler">${t('fehlPractise')}<small>${missed.length}</small></button>
  <ul class="entries">
    ${missed.map((w, i) => `
    <li class="entry">
      <div class="entry-main">
        <b><span class="rank">${i + 1}.</span> ${esc(w.de)}</b>
        <span class="tr">${esc(w.fr)}</span>
      </div>
      <div class="entry-sub"><span class="miss">${t('fehlErrors')(w.wrong)}</span> · ${t('fehlAttempts')(w.total)} · ${t('fehlBox')} ${Math.max(w.box, 0)}</div>
      ${w.forms.length ? `<div class="formline">${w.forms.map((f) => `${esc(f.label)} ${f.wrong}/${f.total}`).join(' · ')}</div>` : ''}
    </li>`).join('')}
  </ul>
  <p class="sub" style="text-align:center">${t('fehlClean')(clean)}</p>`;
}

function startErrorQuiz() {
  const queue = shuffle(activePrompts().filter((p) => (stats.data[p.key] || [0, 0])[1] > 0));
  state.quiz = { queue, index: 0, verdict: null, correct: 0, done: queue.length === 0, tab: 'lernen' };
  state.tab = 'lernen';
  render();
}

function tabBar() {
  const tab = (id, label, icon) => `
    <button class="tab ${state.tab === id ? 'active' : ''}" data-tab="${id}">
      ${icon}<span>${label}</span>
    </button>`;
  return `<nav class="tabs">
    ${tab('lernen', t('tabLearn'), '<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/></svg>')}
    ${tab('rapide', t('tabRapid'), '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>')}
    ${tab('karten', t('tabCards'), '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v12"/></svg>')}
    ${tab('liste', t('tabList'), '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>')}
    ${tab('fehler', t('tabFehler'), '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.4v.1"/></svg>')}
  </nav>`;
}

/* ---------- render ---------- */

function render() {
  const app = document.getElementById('app');

  if (state.error) {
    app.innerHTML = `<main class="view"><p class="empty">${t('loadError')}<br><span class="small">${esc(state.error)}</span></p></main>`;
    return;
  }
  if (!state.lesson) {
    app.innerHTML = `<main class="view"><p class="empty">${t('loading')}</p></main>`;
    return;
  }

  let body;
  if (state.tab === 'lernen') body = state.quiz?.tab === 'lernen' ? quizView() : homeView();
  else if (state.tab === 'rapide') body = state.quiz?.tab === 'rapide' ? quizView() : rapidView();
  else if (state.tab === 'karten') body = cardsView();
  else if (state.tab === 'fehler') body = fehlView();
  else body = listView();

  app.innerHTML = `<main class="view">${body}</main>${tabBar()}`;
  wire();
}

function wire() {
  const $ = (id) => document.getElementById(id);

  $('start')?.addEventListener('click', startQuiz);
  $('practiseFehler')?.addEventListener('click', startErrorQuiz);
  $('again')?.addEventListener('click', startQuiz);
  $('cards')?.addEventListener('click', () => { state.tab = 'karten'; state.cards = null; render(); });
  $('quit')?.addEventListener('click', () => { state.quiz = null; render(); });
  $('next')?.addEventListener('click', nextQuestion);
  $('exportAnki')?.addEventListener('click', exportAnki);
  $('startRapid')?.addEventListener('click', startRapid);

  $('toggleWrite')?.addEventListener('click', () => {
    state.write = !state.write;
    try {
      localStorage.setItem(WRITE_KEY, state.write ? '1' : '0');
    } catch {
      /* private mode */
    }
    state.quiz = null;
    render();
  });

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
      const inputs = [...form.querySelectorAll('input.input')];
      submitAnswer(inputs.length > 1 ? inputs.map((i) => i.value) : inputs[0].value);
    });
    $('answer').focus();
  }

  document.querySelectorAll('[data-umlaut]').forEach((btn) =>
    btn.addEventListener('click', () => insertUmlaut(btn.dataset.umlaut)));

  document.querySelectorAll('[data-choice]').forEach((btn) =>
    btn.addEventListener('click', () => submitAnswer(btn.dataset.choice)));

  document.querySelectorAll('[data-tab]').forEach((btn) =>
    btn.addEventListener('click', () => { state.tab = btn.dataset.tab; render(); }));

  document.querySelectorAll('[data-type]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const key = btn.dataset.type;
      if (state.types[key] && TYPES.filter((k) => state.types[k]).length === 1) return;
      state.types[key] = !state.types[key];
      try {
        localStorage.setItem(TYPES_KEY, JSON.stringify(TYPES.filter((k) => state.types[k])));
      } catch {
        /* private mode */
      }
      state.quiz = null;
      state.cards = null;
      render();
    }));

  document.querySelectorAll('[data-size]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.size = Number(btn.dataset.size);
      try {
        localStorage.setItem(SIZE_KEY, String(state.size));
      } catch {
        /* private mode */
      }
      state.quiz = null;
      render();
    }));

  document.querySelectorAll('[data-lang]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      try {
        localStorage.setItem(LANG_KEY, state.lang);
      } catch {
        /* private mode */
      }
      render();
    }));

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
    if (confirm(t('resetAsk'))) {
      store.reset();
      stats.reset();
      render();
    }
  });
}

/* ---------- actions ---------- */

function startQuiz() {
  const queue = pickSession(state.size || activePrompts().length);
  state.quiz = { queue, index: 0, verdict: null, correct: 0, done: queue.length === 0, tab: 'lernen' };
  state.tab = 'lernen';
  render();
}

function startRapid() {
  const queue = buildRapidQueue();
  state.quiz = { queue, index: 0, verdict: null, correct: 0, done: queue.length === 0, tab: 'rapide', repeated: new Set() };
  state.tab = 'rapide';
  render();
}

function submitAnswer(value) {
  const q = state.quiz;
  if (!q || q.verdict !== null) return;
  const p = q.queue[q.index];
  const ok = Array.isArray(value)
    ? p.fields.every((f, i) => acceptedAnswers(f).has(normalize(value[i] || '')))
    : matches(p, value);
  store.grade(p.key, ok);
  q.verdict = ok;
  if (ok) q.correct += 1;
  if (!ok && q.repeated && !q.repeated.has(p.key)) {
    q.repeated.add(p.key);
    q.queue.push({ ...p, repeat: true });
  }
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
  const queue = activePrompts().filter((p) => !onlyDue || store.due(p.key) <= now);
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

let lastFocusedInput = null;

document.addEventListener('focusin', (event) => {
  if (event.target?.classList?.contains('input')) lastFocusedInput = event.target;
});

function insertUmlaut(ch) {
  const active = document.activeElement;
  const input = active?.classList?.contains('input')
    ? active
    : lastFocusedInput?.isConnected
      ? lastFocusedInput
      : document.getElementById('answer');
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
      esc(v.uebersetzung || v.infinitiv),
      `<b>${esc(v.infinitiv)}</b><br>${esc(v.praesens)}<br>${esc(v.praeteritum)}<br>${esc(v.perfekt)}${block(v.beispiel)}`,
      'lektion12 verb',
    ]);
  }
  for (const n of state.lesson.nomen || []) {
    const plural = n.plural && n.plural !== n.singular ? `<br>${esc(n.plural)}` : '';
    rows.push([
      esc(n.uebersetzung || n.singular),
      `<b>${esc(n.singular)}</b>${plural}${block(n.beispiel)}`,
      'lektion12 nomen',
    ]);
  }
  for (const w of state.lesson.andere || []) {
    rows.push([
      esc(w.uebersetzung || ''),
      `<b>${esc(w.wort)}</b>${block(w.beispiel)}`,
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

function loadTypes() {
  const all = {};
  for (const k of TYPES) all[k] = true;
  try {
    const raw = localStorage.getItem(TYPES_KEY);
    if (!raw) return all;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return all;
    for (const k of TYPES) all[k] = list.includes(k);
  } catch {
    /* ignore */
  }
  return all;
}

async function init() {
  store.load();
  stats.load();
  try {
    state.showExamples = localStorage.getItem(EXAMPLES_KEY) === '1';
    state.lang = localStorage.getItem(LANG_KEY) === 'fr' ? 'fr' : 'de';
    state.types = loadTypes();
    state.write = localStorage.getItem(WRITE_KEY) !== '0';
    const size = Number(localStorage.getItem(SIZE_KEY));
    state.size = SIZES.includes(size) ? size : 10;
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
