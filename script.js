// script.js — atualizado e corrigido
// Suporte a players: BH, PA, SP e Canoas (Canoas adicionado).
// SP e Canoas usam embeds caster.fm (lazy-load). Mantém fallback por stream direta se configurado.

document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ---------- CONFIGURAÇÕES ----------
  const SP_FALLBACK_STREAM = ''; // exemplo: 'http://morcast.caster.fm:11301/COezt'
  const CANOAS_FALLBACK_STREAM = '';

  const SP_WIDGET_INIT_TIMEOUT = 3500;
  const CANOAS_WIDGET_INIT_TIMEOUT = 3500;

  // ---------- UTILIDADES DE SANITIZAÇÃO ----------
  function sanitizeHTML(input) {
    if (!input) return '';
    // Allowlist simples para conteúdo de notícia
    const ALLOWED_TAGS = ['p','br','strong','b','em','i','ul','ol','li','a','h3','h4','blockquote','img'];
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const walk = (node) => {
      const children = Array.from(node.childNodes);
      children.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toLowerCase();
          if (!ALLOWED_TAGS.includes(tag)) {
            // unwrap: replace the element with its children
            while (child.firstChild) {
              node.insertBefore(child.firstChild, child);
            }
            child.remove();
          } else {
            // clean attributes
            const attrs = Array.from(child.attributes);
            attrs.forEach(attr => {
              const name = attr.name.toLowerCase();
              const val = attr.value;
              if (tag === 'a') {
                if (name !== 'href' && name !== 'title' && name !== 'target' && name !== 'rel') {
                  child.removeAttribute(name);
                } else if (name === 'href') {
                  try {
                    const url = new URL(val, location.href);
                    // allow only http(s) and mailto
                    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
                      child.removeAttribute('href');
                    }
                  } catch (e) {
                    child.removeAttribute('href');
                  }
                }
              } else if (tag === 'img') {
                if (name !== 'src' && name !== 'alt' && name !== 'loading') {
                  child.removeAttribute(name);
                }
                if (name === 'src') {
                  try {
                    const url = new URL(val, location.href);
                    if (!['http:', 'https:', 'data:'].includes(url.protocol)) {
                      child.removeAttribute('src');
                    } else {
                      child.setAttribute('loading', 'lazy');
                    }
                  } catch (e) {
                    child.removeAttribute('src');
                  }
                }
              } else {
                // other tags: remove anything that isn't harmless
                if (['class','id','style','aria-hidden','role'].includes(name)) {
                  child.removeAttribute(name); // strip styling/ids for safety
                } else {
                  // remove unknown attributes
                  child.removeAttribute(name);
                }
              }
            });
            // for <a>, ensure safe target/rel
            if (tag === 'a') {
              if (!child.getAttribute('target')) child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener noreferrer');
            }
            // recurse
            walk(child);
          }
        } else if (child.nodeType === Node.COMMENT_NODE) {
          child.remove();
        }
      });
    };
    walk(doc.body);
    return doc.body.innerHTML;
  }

  function stripTagsToText(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // ---------- CONFIG / SELECTORS ----------
  const btnBh = $('#btn-bh');
  const btnPa = $('#btn-pa');
  const btnSp = $('#btn-sp');
  const btnCanoas = $('#btn-canoas');

  const loadBtnSp = $('#load-player-sp');
  const loadBtnCanoas = $('#load-player-canoas');

  const pBh = $('#player-bh');
  const pPa = $('#player-pa');
  const pSp = $('#player-sp');
  const pCanoas = $('#player-canoas');

  const activateBtn = el => { if (el) { el.classList.add('active'); el.setAttribute('aria-pressed','true'); } };
  const deactivateBtn = el => { if (el) { el.classList.remove('active'); el.setAttribute('aria-pressed','false'); } };

  function show(el) { if (!el) return; el.style.display = ''; el.classList.add('active'); el.removeAttribute('aria-hidden'); }
  function hide(el) { if (!el) return; el.style.display = 'none'; el.classList.remove('active'); el.setAttribute('aria-hidden','true'); }

  function selectBH() {
    activateBtn(btnBh); deactivateBtn(btnPa); if (btnSp) deactivateBtn(btnSp); if (btnCanoas) deactivateBtn(btnCanoas);
    show(pBh); hide(pPa); hide(pSp); hide(pCanoas);
    teardownSpFallback();
    teardownCanoasFallback();
  }
  function selectPA() {
    activateBtn(btnPa); deactivateBtn(btnBh); if (btnSp) deactivateBtn(btnSp); if (btnCanoas) deactivateBtn(btnCanoas);
    show(pPa); hide(pBh); hide(pSp); hide(pCanoas);
    teardownSpFallback();
    teardownCanoasFallback();
  }
  function selectSP() {
    if (btnSp) activateBtn(btnSp);
    if (btnBh) deactivateBtn(btnBh);
    if (btnPa) deactivateBtn(btnPa);
    if (btnCanoas) deactivateBtn(btnCanoas);
    show(pSp); hide(pBh); hide(pPa); hide(pCanoas);
    if (loadBtnSp) loadBtnSp.style.display = 'none';
    attemptSpFallbackWithDelay();
  }
  function selectCanoas() {
    if (btnCanoas) activateBtn(btnCanoas);
    if (btnBh) deactivateBtn(btnBh);
    if (btnPa) deactivateBtn(btnPa);
    if (btnSp) deactivateBtn(btnSp);
    show(pCanoas); hide(pBh); hide(pPa); hide(pSp);
    if (loadBtnCanoas) loadBtnCanoas.style.display = 'none';
    attemptCanoasFallbackWithDelay();
  }

  if (btnBh) btnBh.addEventListener('click', selectBH);
  if (btnPa) btnPa.addEventListener('click', selectPA);
  if (btnSp) btnSp.addEventListener('click', selectSP);
  if (btnCanoas) btnCanoas.addEventListener('click', selectCanoas);

  if (loadBtnSp) {
    loadBtnSp.addEventListener('click', () => {
      show(pSp);
      loadBtnSp.style.display = 'none';
      if (btnSp) activateBtn(btnSp);
      if (btnBh) deactivateBtn(btnBh);
      if (btnPa) deactivateBtn(btnPa);
      attemptSpFallbackWithDelay();
    });
  }
  if (loadBtnCanoas) {
    loadBtnCanoas.addEventListener('click', () => {
      show(pCanoas);
      loadBtnCanoas.style.display = 'none';
      if (btnCanoas) activateBtn(btnCanoas);
      if (btnBh) deactivateBtn(btnBh);
      if (btnPa) deactivateBtn(btnPa);
      attemptCanoasFallbackWithDelay();
    });
  }

  // ---------- SP FALLBACK helpers ----------
  let spFallbackAudioEl = null;
  let spFallbackTimeoutId = null;
  function teardownSpFallback() {
    if (spFallbackTimeoutId) { clearTimeout(spFallbackTimeoutId); spFallbackTimeoutId = null; }
    if (spFallbackAudioEl) {
      try { spFallbackAudioEl.pause(); } catch (e) {}
      spFallbackAudioEl.remove();
      spFallbackAudioEl = null;
    }
  }
  function attemptSpFallbackWithDelay() {
    if (!SP_FALLBACK_STREAM) return;
    const placeholder = $('#sp-embed-placeholder') || $('#player-sp');
    if (!placeholder) return;

    const embedNode = placeholder.querySelector('.cstrEmbed') || document.querySelector('.cstrEmbed');
    if (!embedNode) { applySpFallback(); return; }

    const initialFallbackTextPresent = (() => {
      const anchors = embedNode.querySelectorAll('a');
      const nonAnchorChildren = Array.from(embedNode.children).filter(c => c.tagName.toLowerCase() !== 'a');
      return anchors.length > 0 && nonAnchorChildren.length === 0;
    })();

    if (!initialFallbackTextPresent) return;
    if (spFallbackTimeoutId) clearTimeout(spFallbackTimeoutId);
    spFallbackTimeoutId = setTimeout(() => {
      const embedNow = placeholder.querySelector('.cstrEmbed') || document.querySelector('.cstrEmbed');
      const stillOnlyAnchors = embedNow && (() => {
        const anchors = embedNow.querySelectorAll('a');
        const nonAnchorChildren = Array.from(embedNow.children).filter(c => c.tagName.toLowerCase() !== 'a');
        return anchors.length > 0 && nonAnchorChildren.length === 0;
      })();
      if (stillOnlyAnchors) applySpFallback();
      spFallbackTimeoutId = null;
    }, SP_WIDGET_INIT_TIMEOUT);
  }
  function applySpFallback() {
    if (!SP_FALLBACK_STREAM || spFallbackAudioEl) return;
    const placeholder = $('#sp-embed-placeholder') || $('#player-sp');
    if (!placeholder) return;
    const embedNode = placeholder.querySelector('.cstrEmbed');
    if (embedNode) {
      try { embedNode.style.display = 'none'; } catch (e) {}
    }
    spFallbackAudioEl = document.createElement('audio');
    spFallbackAudioEl.id = 'sp-audio-fallback';
    spFallbackAudioEl.controls = true;
    spFallbackAudioEl.preload = 'none';
    spFallbackAudioEl.style.width = '100%';
    spFallbackAudioEl.style.maxWidth = '480px';
    spFallbackAudioEl.src = SP_FALLBACK_STREAM;
    const note = document.createElement('p');
    note.className = 'small muted';
    note.textContent = 'Player alternativo carregado (fallback). Se preferir o widget oficial, verifique bloqueios de scripts.';
    placeholder.appendChild(spFallbackAudioEl);
    placeholder.appendChild(note);
    spFallbackAudioEl.play().catch(() => {});
  }

  // ---------- CANOAS FALLBACK helpers ----------
  let canoasFallbackAudioEl = null;
  let canoasFallbackTimeoutId = null;
  function teardownCanoasFallback() {
    if (canoasFallbackTimeoutId) { clearTimeout(canoasFallbackTimeoutId); canoasFallbackTimeoutId = null; }
    if (canoasFallbackAudioEl) {
      try { canoasFallbackAudioEl.pause(); } catch (e) {}
      canoasFallbackAudioEl.remove();
      canoasFallbackAudioEl = null;
    }
  }
  function attemptCanoasFallbackWithDelay() {
    if (!CANOAS_FALLBACK_STREAM) return;
    const placeholder = $('#canoas-embed-placeholder') || $('#player-canoas');
    if (!placeholder) return;

    const embedNode = placeholder.querySelector('.cstrEmbed') || document.querySelector('.cstrEmbed');
    if (!embedNode) { applyCanoasFallback(); return; }

    const initialFallbackTextPresent = (() => {
      const anchors = embedNode.querySelectorAll('a');
      const nonAnchorChildren = Array.from(embedNode.children).filter(c => c.tagName.toLowerCase() !== 'a');
      return anchors.length > 0 && nonAnchorChildren.length === 0;
    })();

    if (!initialFallbackTextPresent) return;
    if (canoasFallbackTimeoutId) clearTimeout(canoasFallbackTimeoutId);
    canoasFallbackTimeoutId = setTimeout(() => {
      const embedNow = placeholder.querySelector('.cstrEmbed') || document.querySelector('.cstrEmbed');
      const stillOnlyAnchors = embedNow && (() => {
        const anchors = embedNow.querySelectorAll('a');
        const nonAnchorChildren = Array.from(embedNow.children).filter(c => c.tagName.toLowerCase() !== 'a');
        return anchors.length > 0 && nonAnchorChildren.length === 0;
      })();
      if (stillOnlyAnchors) applyCanoasFallback();
      canoasFallbackTimeoutId = null;
    }, CANOAS_WIDGET_INIT_TIMEOUT);
  }
  function applyCanoasFallback() {
    if (!CANOAS_FALLBACK_STREAM || canoasFallbackAudioEl) return;
    const placeholder = $('#canoas-embed-placeholder') || $('#player-canoas');
    if (!placeholder) return;
    const embedNode = placeholder.querySelector('.cstrEmbed');
    if (embedNode) {
      try { embedNode.style.display = 'none'; } catch (e) {}
    }
    canoasFallbackAudioEl = document.createElement('audio');
    canoasFallbackAudioEl.id = 'canoas-audio-fallback';
    canoasFallbackAudioEl.controls = true;
    canoasFallbackAudioEl.preload = 'none';
    canoasFallbackAudioEl.style.width = '100%';
    canoasFallbackAudioEl.style.maxWidth = '480px';
    canoasFallbackAudioEl.src = CANOAS_FALLBACK_STREAM;
    const note = document.createElement('p');
    note.className = 'small muted';
    note.textContent = 'Player alternativo carregado (fallback). Se preferir o widget oficial, verifique bloqueios de scripts.';
    placeholder.appendChild(canoasFallbackAudioEl);
    placeholder.appendChild(note);
    canoasFallbackAudioEl.play().catch(() => {});
  }

  // ---------- PLACARES (dados manuais) ----------
  const placares = [
    {
        campeonato: "Campeonato Mineiro",
        status: "ENCERRADO",
        data: "14/01",
        hora: "18:30",
        time_casa: "North",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/8d/Logo_do_North_Esporte_Clube.png/120px-Logo_do_North_Esporte_Clube.png",
        gols_casa: 1,
        time_fora: "Atlético",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_fora: 1
    },
    {
        campeonato: "Campeonato Mineiro",
        status: "ENCERRADO",
        data: "07/12",
        hora: "19:00",
        time_casa: "Athletic",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Athletic_Club_%28Minas_Gerais%29.svg/120px-Athletic_Club_%28Minas_Gerais%29.svg.png",
        gols_casa: 0,
        time_fora: "URT",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/d/d2/URTmg.png/120px-URTmg.png",
        gols_fora: 1
    },
    {
        campeonato: "Campeonato Mineiro",
        status: "ENCERRADO",
        data: "14/01",
        hora: "21:30",
        time_casa: "Tomb.",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/85/TombenseFC.png/120px-TombenseFC.png",
        gols_casa: 1,
        time_fora: "Cruzeiro",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg/250px-Cruzeiro_Esporte_Clube_%28logo%29.svg.png",
        gols_fora: 2
    },
    {
        campeonato: "Campeonato Gaúcho",
        status: "ENCERRADO",
        data: "14/01",
        hora: "21:30",
        time_casa: "Grêmio",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/250px-Gremio_logo.svg.png",
        gols_casa: 0,
        time_fora: "São José",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Esporte_Clube_S%C3%A3o_Jos%C3%A9_logo.png/120px-Esporte_Clube_S%C3%A3o_Jos%C3%A9_logo.png",
        gols_fora: 1
    }
  ];

  function renderPlacares() {
    const el = $('#placares-list');
    if (!el) return;
    if (!placares || !placares.length) {
      el.innerHTML = '<div class="loading-placar">Nenhum jogo cadastrado.</div>';
      return;
    }
    el.innerHTML = '';
    placares.forEach(j => el.appendChild(placarCard(j)));

    // ticker
    const ticker = $('#placar-ticker');
    if (ticker) {
      ticker.innerHTML = placares.map(j => {
        const gC = j.gols_casa == null ? '-' : j.gols_casa;
        const gF = j.gols_fora == null ? '-' : j.gols_fora;
        return `<span class="ticker-item">${escapeHtml(j.time_casa)} ${gC}x${gF} ${escapeHtml(j.time_fora)}</span>`;
      }).join(' • ');
    }
  }

  function placarCard(j) {
    const statusClass = j.status === 'AO VIVO' ? 'status-ao-vivo' : (j.status === 'ENCERRADO' ? 'status-encerrado' : 'status-a-seguir');
    const golsCasa = j.gols_casa == null ? '-' : j.gols_casa;
    const golsFora = j.gols_fora == null ? '-' : j.gols_fora;
    const card = document.createElement('div');
    card.className = 'placar-card2';
    card.innerHTML = `
      <div class="placar-header">
        <span class="placar-campeonato">${escapeHtml(j.campeonato)}</span>
        <span class="placar-status2 ${statusClass}">${escapeHtml(j.status)}</span>
      </div>
      <div class="placar-times">
        <div class="placar-time align-left">
          ${ j.escudo_casa ? `<img class="placar-escudo2" src="${escapeAttr(j.escudo_casa)}" alt="${escapeHtml(j.time_casa)}" loading="lazy">` : '' }
          <span class="placar-nome2">${escapeHtml(j.time_casa)}</span>
        </div>
        <div class="placar-resultado">
          <span class="placar-gols2">${golsCasa}</span>
          <span class="placar-x2">x</span>
          <span class="placar-gols2">${golsFora}</span>
        </div>
        <div class="placar-time align-right">
          <span class="placar-nome2">${escapeHtml(j.time_fora)}</span>
          ${ j.escudo_fora ? `<img class="placar-escudo2" src="${escapeAttr(j.escudo_fora)}" alt="${escapeHtml(j.time_fora)}" loading="lazy">` : '' }
        </div>
      </div>
      <div class="placar-hora2">${escapeHtml(j.data)} - ${escapeHtml(j.hora)}</div>
    `;
    return card;
  }

  // ---------- NOTÍCIAS ----------
  function loadNoticias() {
    const source = window.NOTICIAS ? Promise.resolve(window.NOTICIAS) : fetch('noticias.json').then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
    source.then(noticias => {
      try {
        if (!Array.isArray(noticias)) noticias = [];
        // normalize: ensure categoria and excerpt
        noticias = noticias.map(n => {
          const normalized = Object.assign({}, n);
          if (!normalized.categoria) normalized.categoria = guessCategory(normalized.titulo || normalized.texto || '');
          if (!normalized.excerpt) {
            const text = stripTagsToText(normalized.texto || '');
            normalized.excerpt = text.length > 200 ? text.slice(0,200).trim() + '…' : text;
          }
          return normalized;
        });

        const noticiasListEl = $('#noticias-list');
        if (noticiasListEl) renderNoticiasPageList(noticias, noticiasListEl);

        const latestEl = $('#latest-news');
        if (latestEl) renderLatestNews(noticias, latestEl);

        const destaqueEl = $('#destaque-card');
        if (destaqueEl) renderDestaque(noticias, destaqueEl);

        const filtersEl = $('#news-filters');
        if (filtersEl) renderNewsFilters(noticias, filtersEl);
      } catch (err) {
        console.error('Erro ao processar notícias:', err);
      }
    }).catch(err => {
      console.warn('Não foi possível carregar noticias.json (ou NOTICIAS):', err);
      const noticiasListEl = $('#noticias-list');
      if (noticiasListEl) noticiasListEl.innerHTML = '<p>Ops! Não foi possível carregar as notícias no momento.</p>';
      const latestEl = $('#latest-news');
      if (latestEl) latestEl.innerHTML = '<p>Não foi possível carregar as últimas notícias.</p>';
      const destaqueEl = $('#destaque-card');
      if (destaqueEl) destaqueEl.innerHTML = '<p>Não foi possível carregar o destaque.</p>';
    });
  }

  function renderNoticiasPageList(noticias, container) {
    if (!noticias || !noticias.length) {
      container.innerHTML = '<p>Nenhuma notícia publicada ainda.</p>';
      return;
    }
    container.innerHTML = '';
    noticias.forEach(n => {
      const div = document.createElement('div');
      div.className = 'noticia';
      const titulo = escapeHtml(n.titulo || '');
      const data = escapeHtml(n.data || '');
      const safeContent = sanitizeHTML(n.texto || n.excerpt || '');
      div.innerHTML = `<h4>${titulo}</h4>
        <span class="data">${data}</span>
        <div class="content">${safeContent}</div>`;
      container.appendChild(div);
    });
  }

  function renderLatestNews(noticias, container) {
    const items = (noticias && noticias.length) ? noticias.slice(0,6) : [];
    if (!items.length) {
      container.innerHTML = '<p>Nenhuma notícia disponível no momento. <a href="noticias.html">Ver todas as notícias</a></p>';
      return;
    }
    container.innerHTML = '';
    items.forEach(n => {
      const article = document.createElement('article');
      article.className = 'latest-item';
      const excerpt = n.excerpt || (n.texto ? (stripTagsToText(n.texto).slice(0,140) + '…') : '');
      article.innerHTML = `<h5>${escapeHtml(n.titulo || '')}</h5>
        <span class="meta">${escapeHtml(n.data || '')}</span>
        <p class="excerpt">${escapeHtml(excerpt)}</p>`;
      container.appendChild(article);
    });
  }

  function renderDestaque(noticias, container) {
    if (!noticias || !noticias.length) {
      container.innerHTML = '<div class="loading-placar">Nenhuma notícia em destaque.</div>';
      return;
    }
    const destaque = noticias.find(n => n.destaque) || noticias[0];
    const safe = sanitizeHTML(destaque.texto || destaque.excerpt || '');
    container.innerHTML = `
      <div class="destaque-inner">
        <h3>${escapeHtml(destaque.titulo || '')}</h3>
        <span class="meta">${escapeHtml(destaque.data || '')}</span>
        <div>${safe}</div>
        <p><a href="noticias.html">Ver todas as notícias →</a></p>
      </div>
    `;
  }

  function renderNewsFilters(noticias, container) {
    container.innerHTML = '';
    if (!noticias || !noticias.length) {
      const b = document.createElement('button');
      b.className = 'filter-btn active';
      b.textContent = 'Todas';
      container.appendChild(b);
      return;
    }
    const cats = new Set();
    noticias.forEach(n => { if (n.categoria) cats.add(n.categoria); });
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Todas';
    allBtn.addEventListener('click', () => {
      $$('.filter-btn').forEach(x => x.classList.remove('active'));
      allBtn.classList.add('active');
      renderLatestNews(noticias, $('#latest-news'));
    });
    container.appendChild(allBtn);
    Array.from(cats).forEach(cat => {
      const b = document.createElement('button');
      b.className = 'filter-btn';
      b.textContent = cat;
      b.addEventListener('click', () => {
        $$('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const filtered = noticias.filter(n => n.categoria === cat);
        renderLatestNews(filtered, $('#latest-news'));
      });
      container.appendChild(b);
    });
  }

  // ---------- CATEGORIA (heurística simples) ----------
  function guessCategory(text) {
    if (!text) return 'Geral';
    const t = text.toLowerCase();
    if (t.includes('brasil') || t.includes('política') || t.includes('governo')) return 'Política';
    if (t.includes('ibge') || t.includes('desemprego') || t.includes('economia') || t.includes('enemp')) return 'Economia';
    if (t.includes('atlético') || t.includes('galo') || t.includes('brasileirão') || t.includes('plantão esportivo') || t.includes('esportivo') || t.includes('gol') || t.includes('seleção') || t.includes('jogo')) return 'Esportes';
    if (t.includes('música') || t.includes('lô borges') || t.includes('cultura')) return 'Cultura';
    return 'Geral';
  }

  // ---------- UTIL ----------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
  }

  // Inicializações
  try { renderPlacares(); } catch (err) { console.error('Erro ao renderizar placares:', err); }
  try { loadNoticias(); } catch (err) { console.error('Erro ao carregar notícias:', err); }

  // Se hash inclui 'sp' ou 'canoas', abre a respectiva aba
  (function checkHash() {
    const h = (location.hash || '').toLowerCase();
    if (h.includes('sp')) {
      if (btnSp) btnSp.click();
      else if (pSp) show(pSp);
    } else if (h.includes('canoas') || h.includes('canoa')) {
      if (btnCanoas) btnCanoas.click();
      else if (pCanoas) show(pCanoas);
    }
  })();

  // ---------- Newsletter: simple handler (localStorage) ----------
  (function setupNewsletter() {
    const form = document.getElementById('newsletter-form');
    const emailInput = document.getElementById('newsletter-email');
    const msg = document.getElementById('newsletter-msg');
    if (!form || !emailInput || !msg) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = (emailInput.value || '').trim();
      if (!validateEmail(email)) {
        msg.style.display = ''; msg.textContent = 'Por favor, insira um e-mail válido.'; msg.style.color = '#ffd369';
        return;
      }
      try {
        const list = JSON.parse(localStorage.getItem('rcw_news_subs') || '[]');
        if (!list.includes(email)) list.push(email);
        localStorage.setItem('rcw_news_subs', JSON.stringify(list));
        msg.style.display = ''; msg.textContent = 'Obrigado! Você foi inscrito (armazenado localmente).'; msg.style.color = '#bdf7c4';
        emailInput.value = '';
        setTimeout(()=> msg.style.display='none', 6000);
      } catch (err) {
        msg.style.display = ''; msg.textContent = 'Erro ao registrar. Tente novamente.'; msg.style.color = '#ffd369';
      }
    });
  })();

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // export para depuração manual (opcional)
  window.__redeCidade = {
    renderPlacares,
    loadNoticias,
    applySpFallback,
    teardownSpFallback,
    applyCanoasFallback,
    teardownCanoasFallback,
    sanitizeHTML
  };
});