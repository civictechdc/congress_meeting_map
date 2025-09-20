/* SimCongress MVP — static app loading local JSON-LD and rendering
   clusters graph + details with timeline, transcript, and whiteboard views. */

// Simple utility helpers
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));
const h = (tag, props = {}, children = []) => {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.substring(2), v);
    else if (v != null) el.setAttribute(k, v);
  });
  if (!Array.isArray(children)) children = [children];
  for (const c of children) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
};

const fmtTime = (t) => {
  if (typeof t !== 'string') return '';
  // Accept formats like M:SS or H:MM:SS
  const parts = t.split(':').map(Number);
  if (parts.length === 2) return `${parts[0]}:${String(parts[1]).padStart(2, '0')}`;
  if (parts.length === 3) return `${parts[0]}:${String(parts[1]).padStart(2, '0')}:${String(parts[2]).padStart(2, '0')}`;
  return t;
};
const timeToSeconds = (t) => {
  if (!t || typeof t !== 'string') return Infinity;
  const parts = t.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Infinity;
};

// Global state
const state = {
  data: null, // data.jsonld
  transcript: null, // transcript.jsonld
  whiteboard: null, // whiteboard.jsonld
  selectedClusterId: null,
  search: '',
  view: 'graph', // graph | timeline | transcript | whiteboard
};

async function loadAll() {
  const [data, transcript, whiteboard] = await Promise.all([
    fetch('data/data.jsonld').then((r) => r.json()),
    fetch('data/transcript.jsonld').then((r) => r.json()),
    fetch('data/whiteboard.jsonld').then((r) => r.json()),
  ]);
  state.data = data;
  state.transcript = transcript;
  state.whiteboard = whiteboard;
}

function buildGraphModel() {
  const clusters = state.data?.hasPart || [];
  const edges = state.data?.['cx:edges'] || [];
  const nodeById = new Map();
  for (const c of clusters) nodeById.set(c['@id'], c);

  // compute weights (comments count)
  const weights = new Map();
  for (const c of clusters) {
    const threads = c['cx:threads'] || [];
    const count = threads.reduce((acc, t) => acc + (t['cx:comments']?.length || 0), 0);
    weights.set(c['@id'], count);
  }

  return { clusters, edges, nodeById, weights };
}

function renderGraph() {
  const svg = $('#graph');
  const { clusters, edges, weights } = buildGraphModel();

  // setup viewport
  const w = svg.clientWidth || svg.parentElement.clientWidth;
  const hgt = svg.clientHeight || svg.parentElement.clientHeight;
  const wReal = Math.max(w, 600);
  const hReal = Math.max(hgt, 400);
  svg.setAttribute('viewBox', `0 0 ${wReal} ${hReal}`);
  svg.innerHTML = '';

  // layers
  const gLinks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gLabels = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.append(gLinks, gLabels, gNodes);

  // circle layout around center
  const cx = wReal / 2, cy = hReal / 2, R = Math.min(wReal, hReal) * 0.36;
  const positions = new Map();
  clusters.forEach((c, i) => {
    const angle = (i / clusters.length) * Math.PI * 2 - Math.PI / 2;
    positions.set(c['@id'], { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R });
  });

  // draw edges
  const linkEls = [];
  edges.forEach((e) => {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('class', 'link');
    line.dataset.key = `${e.from}|${e.to}`;
    gLinks.append(line);
    linkEls.push({ el: line, e, a, b });

    // edge label near midpoint
    const midx = (a.x + b.x) / 2, midy = (a.y + b.y) / 2;
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', midx);
    text.setAttribute('y', midy);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'edge-label');
    text.textContent = e.relation || '';
    gLabels.append(text);
  });

  // draw nodes
  clusters.forEach((c) => {
    const p = positions.get(c['@id']);
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    node.setAttribute('class', 'node');
    node.setAttribute('tabindex', '0');
    node.dataset.id = c['@id'];

    const count = weights.get(c['@id']) || 0;
    const r = 18 + Math.min(32, Math.sqrt(count) * 4);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', `url(#grad-${c['@id']})`);
    circle.setAttribute('stroke', 'rgba(255,255,255,0.08)');
    circle.setAttribute('stroke-width', '1');

    // gradient per node
    ensureNodeGradient(svg, c['@id']);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', p.x);
    label.setAttribute('y', p.y + 4);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = c.name || c['@id'];

    node.append(circle, label);
    gNodes.append(node);

    node.addEventListener('mouseenter', () => highlightLinks(c['@id'], true));
    node.addEventListener('mouseleave', () => highlightLinks(c['@id'], false));
    node.addEventListener('click', () => selectCluster(c['@id']));

    // drag behavior
    let dragging = false; let ox=0, oy=0;
    node.addEventListener('mousedown', (ev) => { dragging = true; ox = ev.clientX; oy = ev.clientY; ev.preventDefault(); });
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('mousemove', (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - ox, dy = ev.clientY - oy;
      ox = ev.clientX; oy = ev.clientY;
      const cx0 = parseFloat(circle.getAttribute('cx')) + dx;
      const cy0 = parseFloat(circle.getAttribute('cy')) + dy;
      circle.setAttribute('cx', cx0); circle.setAttribute('cy', cy0);
      label.setAttribute('x', cx0); label.setAttribute('y', cy0 + 4);
      positions.set(c['@id'], { x: cx0, y: cy0 });
      // update linked edges and labels
      linkEls.forEach(({ el, e, a, b }) => {
        if (e.from === c['@id']) { a.x = cx0; a.y = cy0; }
        if (e.to === c['@id']) { b.x = cx0; b.y = cy0; }
        el.setAttribute('x1', a.x); el.setAttribute('y1', a.y);
        el.setAttribute('x2', b.x); el.setAttribute('y2', b.y);
      });
      // recompute edge labels
      gLabels.innerHTML = '';
      linkEls.forEach(({ e, a, b }) => {
        const midx = (a.x + b.x) / 2, midy = (a.y + b.y) / 2;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midx);
        text.setAttribute('y', midy);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'edge-label');
        text.textContent = e.relation || '';
        gLabels.append(text);
      });
    });
  });

  // legend
  if (!$('.legend', svg.parentElement)) {
    const legend = h('div', { class: 'legend' }, [
      h('div', {}, 'Node size = # comments'),
      h('div', {}, 'Hover node to highlight edges'),
      h('div', {}, 'Drag to reposition'),
    ]);
    svg.parentElement.append(legend);
  }

  function highlightLinks(id, on) {
    $$('.link').forEach((ln) => {
      const [from, to] = (ln.dataset.key || '').split('|');
      const is = from === id || to === id;
      ln.classList.toggle('highlight', on && is);
    });
  }
}

function ensureNodeGradient(svg, id) {
  let defs = svg.querySelector('defs');
  if (!defs) { defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'); svg.prepend(defs); }
  const ex = svg.querySelector(`#grad-${CSS.escape(id)}`);
  if (ex) return;
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  grad.id = `grad-${id}`;
  grad.innerHTML = `
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
    <stop offset="70%" stop-color="#6ae0ff" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#7ef7c6" stop-opacity="1"/>
  `;
  defs.append(grad);
}

function selectCluster(id) {
  state.selectedClusterId = id;
  renderDetail();
  // toggle selected class
  $$('.node').forEach((n) => n.classList.toggle('selected', n.dataset.id === id));
}

function renderDetail() {
  const wrap = $('#detail');
  const empty = $('#detailEmpty');
  if (!state.selectedClusterId) {
    wrap.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  const clusters = state.data?.hasPart || [];
  const cluster = clusters.find((c) => c['@id'] === state.selectedClusterId);
  if (!cluster) return;

  empty.classList.add('hidden');
  wrap.classList.remove('hidden');
  wrap.innerHTML = '';

  const title = h('h2', {}, cluster.name || cluster['@id']);
  const desc = h('div', { class: 'description' }, cluster.description || '');
  const chips = h('div', { class: 'chips' }, [
    h('span', { class: 'chip' }, (cluster['itemListElement']?.length || 0) + ' ideas'),
    h('span', { class: 'chip' }, (cluster['cx:threads']?.length || 0) + ' threads'),
  ]);

  // Ideas section
  const ideasList = h('div', { class: 'ideas' }, (cluster['itemListElement'] || []).map((it) => h('div', { class: 'idea' }, it.text || '')));
  const ideasSec = h('div', { class: 'section' }, [ h('h3', {}, 'Key Ideas'), ideasList ]);

  // Threads section with accordion
  const threadsWrap = h('div', { class: 'threads' });
  const needle = state.search.trim().toLowerCase();
  (cluster['cx:threads'] || []).forEach((t, idx) => {
    const open = idx === 0; // open first by default
    const head = h('div', { class: 'thread-summary' }, [
      h('div', { class: 'title' }, t.name || t['@id']),
      h('div', { class: 'sub' }, t.summary || ''),
    ]);
    const body = h('div', { class: 'thread-body' });

    const commentsWrap = h('div', { class: 'comments' }, (t['cx:comments'] || []).map((c) => renderCommentCard(c, needle)));
    body.append(commentsWrap);
    const thread = h('div', { class: 'thread' + (open ? ' open' : '') }, [head, body]);
    head.addEventListener('click', () => thread.classList.toggle('open'));
    threadsWrap.append(thread);
  });
  const threadsSec = h('div', { class: 'section' }, [ h('h3', {}, 'Threads'), threadsWrap ]);

  wrap.append(title, desc, chips, ideasSec, threadsSec);
}

function renderCommentCard(c, needle) {
  const meta = h('div', { class: 'meta' }, [
    h('span', { class: 'badge' }, fmtTime(c.startTime || '')),
    h('span', {}, c.author || 'Unknown'),
    h('span', { style: 'margin-left:auto;color:var(--muted)' }, c['@id'] || '')
  ]);
  const text = h('div', { class: 'text' });
  const body = c.text || '';
  if (needle) {
    const idx = body.toLowerCase().indexOf(needle);
    if (idx >= 0) {
      const before = body.slice(0, idx);
      const match = body.slice(idx, idx + needle.length);
      const after = body.slice(idx + needle.length);
      text.innerHTML = `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
    } else {
      text.textContent = body;
    }
  } else {
    text.textContent = body;
  }
  return h('div', { class: 'comment' }, [meta, text]);
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
}

// Timeline view — flatten comments from all clusters/threads
function renderTimeline() {
  const host = $('#timeline');
  host.innerHTML = '';
  const list = [];
  (state.data?.hasPart || []).forEach((c) => {
    (c['cx:threads'] || []).forEach((t) => {
      (t['cx:comments'] || []).forEach((cm) => {
        list.push({
          cluster: c, thread: t, comment: cm,
          t: timeToSeconds(cm.startTime),
        });
      });
    });
  });
  list.sort((a, b) => a.t - b.t);
  const needle = state.search.trim().toLowerCase();
  list.forEach(({ cluster, thread, comment }) => {
    const body = comment.text || '';
    if (needle && !body.toLowerCase().includes(needle)) return;
    const item = h('div', { class: 'timeline-item card' }, [
      h('div', { class: 'meta' }, `${fmtTime(comment.startTime)} • ${comment.author || 'Unknown'} • ${cluster.name}`),
      h('div', {}, body),
    ]);
    item.addEventListener('click', () => {
      // switch back to graph detail for this cluster
      selectTab('graph');
      selectCluster(cluster['@id']);
    });
    host.append(item);
  });
}

function renderTranscript() {
  const host = $('#transcript');
  host.innerHTML = '';
  const list = (state.transcript?.messages || []).slice().sort((a,b) => a.position - b.position);
  const needle = state.search.trim().toLowerCase();
  list.forEach((m) => {
    const body = m.text || '';
    if (needle && !body.toLowerCase().includes(needle)) return;
    const card = h('div', { class: 'card' }, [
      h('div', { class: 'meta' }, `#${m.position} • ${m.speaker_id}`),
      h('div', {}, body),
    ]);
    host.append(card);
  });
}

function renderWhiteboard() {
  const host = $('#whiteboard');
  host.innerHTML = '';
  // clusters list
  const clWrap = h('div', { class: 'list' });
  const needle = state.search.trim().toLowerCase();
  (state.whiteboard?.clusters || []).forEach((c) => {
    const ideas = (c.ideas || []).map((i) => i.text).join(' \u2022 ');
    const body = `${c.summary || ''} ${ideas}`.toLowerCase();
    if (needle && !body.includes(needle)) return;
    const card = h('div', { class: 'card' }, [
      h('h4', {}, c.label || c.id),
      h('div', { class: 'meta' }, c.summary || ''),
      h('div', {}, (c.ideas || []).map((i) => `• ${i.text}`).join('\n')),
    ]);
    clWrap.append(card);
  });
  host.append(h('h3', {}, 'Whiteboard Clusters'));
  host.append(clWrap);

  // edges
  host.append(h('h3', { style: 'margin-top:16px' }, 'Whiteboard Connections'));
  const edWrap = h('div', { class: 'list' });
  (state.whiteboard?.edges || []).forEach((e) => {
    const card = h('div', { class: 'card' }, [
      h('div', {}, `${e.from} → ${e.to}`),
      h('div', { class: 'meta' }, e.relation || ''),
    ]);
    edWrap.append(card);
  });
  host.append(edWrap);
}

function bindUI() {
  const search = $('#globalSearch');
  search.addEventListener('input', (e) => {
    state.search = e.target.value || '';
    // re-render active content
    if (state.view === 'graph') renderDetail();
    if (state.view === 'timeline') renderTimeline();
    if (state.view === 'transcript') renderTranscript();
    if (state.view === 'whiteboard') renderWhiteboard();
  });

  $('#tabGraph').addEventListener('click', () => selectTab('graph'));
  $('#tabTimeline').addEventListener('click', () => selectTab('timeline'));
  $('#tabTranscript').addEventListener('click', () => selectTab('transcript'));
  $('#tabWhiteboard').addEventListener('click', () => selectTab('whiteboard'));

  window.addEventListener('resize', () => {
    if (state.view === 'graph') renderGraph();
  });
}

function selectTab(view) {
  state.view = view;
  $$('.view-toggle button').forEach((b) => b.classList.toggle('active', b.id === `tab${capitalize(view)}`));
  const graphPane = $('#graph');
  const timeline = $('#timeline');
  const transcript = $('#transcript');
  const whiteboard = $('#whiteboard');
  const legend = document.querySelector('.legend');
  if (view === 'graph') {
    graphPane.classList.remove('hidden');
    timeline.classList.add('hidden');
    transcript.classList.add('hidden');
    whiteboard.classList.add('hidden');
    if (legend) legend.classList.remove('hidden');
    renderGraph();
  } else if (view === 'timeline') {
    graphPane.classList.add('hidden');
    timeline.classList.remove('hidden');
    transcript.classList.add('hidden');
    whiteboard.classList.add('hidden');
    if (legend) legend.classList.add('hidden');
    renderTimeline();
  } else if (view === 'transcript') {
    graphPane.classList.add('hidden');
    timeline.classList.add('hidden');
    transcript.classList.remove('hidden');
    whiteboard.classList.add('hidden');
    if (legend) legend.classList.add('hidden');
    renderTranscript();
  } else if (view === 'whiteboard') {
    graphPane.classList.add('hidden');
    timeline.classList.add('hidden');
    transcript.classList.add('hidden');
    whiteboard.classList.remove('hidden');
    if (legend) legend.classList.add('hidden');
    renderWhiteboard();
  }
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

async function start() {
  try {
    bindUI();
    await loadAll();
    // initial render
    renderGraph();
  } catch (e) {
    console.error('Failed to start app', e);
    alert('Failed to load local JSON files. If opened as file://, please run a local server (e.g., python3 -m http.server) and open http://localhost:8000/');
  }
}

start();
