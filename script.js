// script.js — atualizado: respeita categoria em JSON e heurística de fallback mais precisa
// Agora inclui também o bloco de placares (dados e render) integrado aqui.
document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ---------- CONFIGURAÇÕES ----------
  const SP_FALLBACK_STREAM = ''; // se tiver uma URL de fallback para SP coloque aqui (ex: 'https://exemplo/stream.mp3')
  const CANOAS_FALLBACK_STREAM = ''; // mesma coisa para Canoas
  const SP_WIDGET_INIT_TIMEOUT = 3500;
  const CANOAS_WIDGET_INIT_TIMEOUT = 3500;

  // ---------- UTILIDADES DE SANITIZAÇÃO ----------
  function sanitizeHTML(input) {
    if (!input) return '';
    const ALLOWED_TAGS = ['p','br','strong','b','em','i','ul','ol','li','a','h3','h4','blockquote','img'];
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const walk = (node) => {
      const children = Array.from(node.childNodes);
      children.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toLowerCase();
          if (!ALLOWED_TAGS.includes(tag)) {
            while (child.firstChild) node.insertBefore(child.firstChild, child);
            child.remove();
          } else {
            const attrs = Array.from(child.attributes);
            attrs.forEach(attr => {
              const name = attr.name.toLowerCase();
              const val = attr.value;
              if (tag === 'a') {
                if (name !== 'href' && name !== 'title' && name !== 'target' && name !== 'rel') child.removeAttribute(name);
                else if (name === 'href') {
                  try {
                    const url = new URL(val, location.href);
                    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) child.removeAttribute('href');
                  } catch (e) { child.removeAttribute('href'); }
                }
              } else if (tag === 'img') {
                if (name !== 'src' && name !== 'alt' && name !== 'loading') child.removeAttribute(name);
                if (name === 'src') {
                  try {
                    const url = new URL(val, location.href);
                    if (!['http:', 'https:', 'data:'].includes(url.protocol)) child.removeAttribute('src');
                    else child.setAttribute('loading', 'lazy');
                  } catch (e) { child.removeAttribute('src'); }
                }
              } else {
                child.removeAttribute(name);
              }
            });
            if (tag === 'a') {
              if (!child.getAttribute('target')) child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener noreferrer');
            }
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

  // ---------- CATEGORIAS: heurística melhorada ----------
  const CATEGORY_RULES = [
    { r: /\b(enem|enem 2025|vestibular|prova|cartão de confirmação|instituto nacional|inep)\b/i, c: 'Educação' },
    { r: /\b(Atlético|Galo|Flamengo|Corinthians|Vitória do Brasil|Seleção|amistoso|partida|jogo|rodada|Brasileirão|Libertadores|Série A|placar|gol|gols|lance|VIRADA|plantão esportivo)\b/i, c: 'Esportes' },
    { r: /\b(ibge|desemprego|economia|rendimento|informalidade|pnad|taxa de desocupação|rendimento médio)\b/i, c: 'Economia' },
    { r: /\b(explosão|explosões|explodiu|detonação|bomba|incêndio|incêndios|deposito clandestino|fogos de artifício)\b/i, c: 'Segurança Pública' },
    { r: /\b(acidente|tragédia|ônibus|ônibus de turismo|vítimas|feridos|BR-)\b/i, c: 'Trânsito' },
    { r: /\b(morre|morte|luto|falecimento|faleceu|enterro)\b/i, c: 'Cultura' },
    { r: /\b(música|cantor|compositor|MPB|Clube da Esquina|show|álbum)\b/i, c: 'Cultura' },
    { r: /\b(hospital|cirurgia|internada|saúde|pronto-socorro|Samu|Fhemig|hospitalar)\b/i, c: 'Saúde' },
    { r: /\b(polícia|policia|investiga|investigação|delegacia)\b/i, c: 'Segurança Pública' },
    { r: /\b(cidade|bairro|prefeitura|moradores|interditadas|local)\b/i, c: 'Cidades' }
  ];

  function guessCategory(text) {
    if (!text) return 'Geral';
    for (let i = 0; i < CATEGORY_RULES.length; i++) {
      if (CATEGORY_RULES[i].r.test(text)) return CATEGORY_RULES[i].c;
    }
    return 'Geral';
  }

  // ---------- HELPERS ----------
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

  // ---------- PLAYERS FALLBACK helpers (implementação) ----------
  (function initPlayers() {
    const stations = [
      { btn: '#btn-bh', panel: '#player-bh', id: 'bh', fallback: '' },
      { btn: '#btn-pa', panel: '#player-pa', id: 'pa', fallback: '' },
      { btn: '#btn-sp', panel: '#player-sp', id: 'sp', fallback: SP_FALLBACK_STREAM },
      { btn: '#btn-canoas', panel: '#player-canoas', id: 'canoas', fallback: CANOAS_FALLBACK_STREAM }
    ];

    let casterScriptAppended = !!document.querySelector('script[src="https://cdn.cloud.caster.fm/widgets/embed.js"]');
    let spLoaded = false;
    let canoasLoaded = false;

    function pauseAllExcept(panelSelector) {
      const activePanel = panelSelector ? $(panelSelector) : null;
      $$('audio, video').forEach(media => {
        if (!activePanel || !activePanel.contains(media)) {
          try { media.pause(); } catch (e) { /* ignore */ }
        }
      });
    }

    function showPanel(panelSelector) {
      stations.forEach(s => {
        const panel = $(s.panel);
        const btn = $(s.btn);
        if (!panel || !btn) return;
        if (s.panel === panelSelector) {
          panel.classList.add('active');
          panel.style.display = '';
          panel.setAttribute('aria-hidden', 'false');
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          panel.classList.remove('active');
          panel.style.display = 'none';
          panel.setAttribute('aria-hidden', 'true');
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
      pauseAllExcept(panelSelector);
    }

    function ensureCasterWidgets() {
      if (casterScriptAppended) return;
      const s = document.createElement('script');
      s.src = 'https://cdn.cloud.caster.fm/widgets/embed.js';
      s.async = true;
      s.onload = () => { casterScriptAppended = true; };
      s.onerror = () => { console.warn('Falha ao carregar widget Caster (embed.js)'); };
      document.body.appendChild(s);
      casterScriptAppended = true;
    }

    function tryLoadCasterFor(panelId) {
      const panel = $(`#player-${panelId}`);
      if (!panel) return;
      const embed = panel.querySelector('.cstrEmbed');
      if (embed) {
        const rendered = embed.getAttribute('data-rendered');
        if (rendered === 'true') return;
        ensureCasterWidgets();
        return;
      }
      const fallback = panelId === 'sp' ? SP_FALLBACK_STREAM : (panelId === 'canoas' ? CANOAS_FALLBACK_STREAM : '');
      if (fallback) {
        if (!panel.querySelector('audio[data-fallback="true"]')) {
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.setAttribute('data-fallback', 'true');
          audio.src = fallback;
          audio.preload = 'none';
          panel.appendChild(audio);
        }
      } else {
        if (!panel.querySelector('.loader-help')) {
          const p = document.createElement('p');
          p.className = 'loader-help';
          p.style.color = '#ffd369';
          p.style.marginTop = '8px';
          p.textContent = 'Clique em "Carregar player" para iniciar o widget; se nada acontecer, verifique a conexão ou abra em outra aba.';
          panel.appendChild(p);
        }
      }
    }

    function onStationClick(ev, station) {
      ev && ev.preventDefault && ev.preventDefault();
      showPanel(station.panel);
      if (station.id === 'sp' && !spLoaded) {
        tryLoadCasterFor('sp');
        spLoaded = true;
      }
      if (station.id === 'canoas' && !canoasLoaded) {
        tryLoadCasterFor('canoas');
        canoasLoaded = true;
      }
    }

    stations.forEach(station => {
      const btn = $(station.btn);
      if (!btn) return;
      btn.addEventListener('click', (ev) => onStationClick(ev, station));
    });

    const loadSpBtn = $('#load-player-sp');
    if (loadSpBtn) {
      loadSpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        tryLoadCasterFor('sp');
        spLoaded = true;
        onStationClick(null, stations.find(s => s.id === 'sp'));
      });
    }
    const loadCanoasBtn = $('#load-player-canoas');
    if (loadCanoasBtn) {
      loadCanoasBtn.addEventListener('click', (e) => {
        e.preventDefault();
        tryLoadCasterFor('canoas');
        canoasLoaded = true;
        onStationClick(null, stations.find(s => s.id === 'canoas'));
      });
    }

    const defaultBtn = $('#btn-bh') || document.querySelector('.player-btn.active');
    if (defaultBtn) {
      const station = stations.find(s => s.btn === `#${defaultBtn.id}`);
      if (station) {
        showPanel(station.panel);
      }
    }
  })();

  // ---------- PLACARES (dados e render) ----------
  const placares = [
    {
      campeonato: "Copa do Brasil",
      status: "ENCERRADO",
      data: "21/04",
      hora: "19:30",
      time_casa: "Grêmio",
      escudo_casa: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgP3M1sOXUBD8YHreSahpTlXZHdpBcvdZEWQ&s",
      gols_casa: 2,
      time_fora: "Confiança",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/d/dd/AD_Confian%C3%A7a_shield.png",
      gols_fora: 0
    },
    {
      campeonato: "Copa do Brasil",
      status: "ENCERRADO",
      data: "21/04",
      hora: "21:30",
      time_casa: "Barra",
      escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/4/40/Barra_FC_2021_crest.png",
      gols_casa: 0,
      time_fora: "Corinthians",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/b/b4/Corinthians_simbolo.png/250px-Corinthians_simbolo.png",
      gols_fora: 1
    },
    {
      campeonato: "Copa do Brasil",
      status: "AO VIVO",
      data: "22/04",
      hora: "19:00",
      time_casa: "Goias",
      escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Goi%C3%A1s_Esporte_Clube_logo.svg/250px-Goi%C3%A1s_Esporte_Clube_logo.svg.png",
      gols_casa: 1,
      time_fora: "Cruzeiro",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg",
      gols_fora: 2
    },
    {
      campeonato: "Copa do Brasil",
      status: "A SEGUIR",
      data: "23/04",
      hora: "19:00",
      time_casa: "Atlético",
      escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
      gols_casa: null,
      time_fora: "Ceará",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cear%C3%A1_Sporting_Club_logo.svg/1280px-Cear%C3%A1_Sporting_Club_logo.svg.png",
      gols_fora: null
    }
  ];

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

  function renderPlacares() {
    const el = $('#placares-list');
    if (!el) return;
    if (!placares || !placares.length) {
      el.innerHTML = '<div class="loading-placar">Nenhum jogo cadastrado.</div>';
      return;
    }
    el.innerHTML = '';
    placares.forEach(j => el.appendChild(placarCard(j)));

    const ticker = $('#placar-ticker');
    if (ticker) {
      ticker.innerHTML = placares.map(j => {
        const gC = j.gols_casa == null ? '-' : j.gols_casa;
        const gF = j.gols_fora == null ? '-' : j.gols_fora;
        return `<span class="ticker-item">${escapeHtml(j.time_casa)} ${gC}x${gF} ${escapeHtml(j.time_fora)}</span>`;
      }).join(' • ');
    }
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

        noticias = noticias.map(n => {
          const normalized = Object.assign({}, n);
          const combined = (n.titulo || '') + ' ' + (stripTagsToText(n.texto || '') || '');
          if (!normalized.categoria || !String(normalized.categoria).trim()) {
            normalized.categoria = guessCategory(combined);
          } else {
            normalized.categoria = String(normalized.categoria).trim();
          }
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
      const categoria = escapeHtml(n.categoria || 'Geral');
      const safeContent = sanitizeHTML(n.texto || n.excerpt || '');
      div.innerHTML = `<h4>${titulo}</h4>
        <span class="data">${data} • <small style="color:#ffd369">${categoria}</small></span>
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
        <span class="meta">${escapeHtml(n.data || '')} • ${escapeHtml(n.categoria || '')}</span>
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
        <span class="meta">${escapeHtml(destaque.data || '')} • ${escapeHtml(destaque.categoria || '')}</span>
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
    const cats = [];
    noticias.forEach(n => {
      const c = (n.categoria || 'Geral').trim();
      if (!cats.includes(c)) cats.push(c);
    });
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.textContent = 'Todas';
    allBtn.addEventListener('click', () => {
      $$('.filter-btn').forEach(x => x.classList.remove('active'));
      allBtn.classList.add('active');
      renderLatestNews(noticias, $('#latest-news'));
    });
    container.appendChild(allBtn);
    cats.forEach(cat => {
      const b = document.createElement('button');
      b.className = 'filter-btn';
      b.textContent = cat;
      b.addEventListener('click', () => {
        $$('.filter-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const filtered = noticias.filter(n => (n.categoria || '').trim() === cat);
        renderLatestNews(filtered, $('#latest-news'));
      });
      container.appendChild(b);
    });
  }

  // ---------- Inicializações ----------
  try { renderPlacares(); } catch (err) { console.error('Erro ao renderizar placares:', err); }
  try { loadNoticias(); } catch (err) { console.error('Erro ao carregar notícias:', err); }

  // Export util (opcional)
  window.__redeCidade = Object.assign(window.__redeCidade || {}, { guessCategory, renderPlacares });
});

// =============== ULTRA MELHORIAS ==========================
(function(){
  if (document.getElementById('quick-fab')) return; // só 1 vez
  const fab = document.createElement('button');
  fab.id = 'quick-fab'; fab.title = 'Redes & Sobre';
  fab.innerHTML = '<span aria-hidden="true">⚡</span>';
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.id = 'app-modal-overlay';
  overlay.tabIndex = -1;
  overlay.innerHTML = `<div id="app-modal-content" role="dialog" aria-modal="true" aria-label="Sobre a Rede Cidade WEB">
    <button class="modal-close" aria-label="Fechar">&times;</button>
    <h2>Sobre a Rede Cidade WEB</h2>
    <p>Jornalismo moderno, esportes e música 24h — cobertura instantânea e sem enrolação. <br><strong>Presente em BH, PA, SP e Canoas.</strong></p>
    <h3 style="margin-bottom:4px;">Nossas redes:</h3>
    <div class="social-list">
      <a href="https://www.instagram.com/redecidadeweb2024/" target="_blank" aria-label="Instagram" rel="noopener"><svg width="28" height="28" fill="currentColor"><use href="#icon-instagram"/></svg></a>
      <a href="https://www.youtube.com/@RedeCidadeWEB" target="_blank" aria-label="YouTube" rel="noopener"><svg width="28" height="28" fill="currentColor"><use href="#icon-youtube"/></svg></a>
      <a href="mailto:radiocidadeweb.2024@gmail.com" aria-label="E-mail"><svg width="28" height="28" fill="currentColor"><use href="#icon-mail"/></svg></a>
    </div>
    <p style="font-size:.98em;color:#ffd369">Contato comercial: radiocidadeweb.2024@gmail.com</p>
  </div>
  <svg style="display:none">
    <symbol id="icon-instagram" viewBox="0 0 24 24">
      <path d="M12 5.838c-3.403 0-6.163 2.761-6.163 6.163s2.76 6.162 6.163 6.162 6.162-2.76 6.162-6.162-2.759-6.163-6.162-6.163zm0 10.162c-2.208 0-4-1.792-4-4s1.792-4 4-4 4 1.792 4 4-1.792 4-4 4zm6.406-10.845c-.796 0-1.443.646-1.443 1.444s.647 1.444 1.443 1.444c.797 0 1.445-.646 1.445-1.444s-.648-1.444-1.445-1.444zm4.594 1.444c0-2.2-1.79-3.99-3.99-3.99h-12.02c-2.201 0-3.99 1.79-3.99 3.99v12.02c0 2.201 1.79 3.99 3.99 3.99h12.02c2.2 0 3.99-1.789 3.99-3.99v-12.02zm-1.8 12.02c0 1.209-.982 2.191-2.191 2.191h-12.02c-1.209 0-2.19-.982-2.19-2.191v-12.02c0-1.208.981-2.19 2.19-2.19h12.02c1.209 0 2.191.982 2.191 2.19v12.02z"/>
    </symbol>
    <symbol id="icon-youtube" viewBox="0 0 24 24">
      <path d="M23.498 6.186a2.971 2.971 0 0 0-2.09-2.093C19.211 3.521 12 3.5 12 3.5s-7.211.021-9.408.593A2.971 2.971 0 0 0 .502 6.186C0 8.364 0 12 0 12s0 3.637.502 5.814a2.971 2.971 0 0 0 2.09 2.093C4.789 20.48 12 20.5 12 20.5s7.211-.021 9.408-.593a2.97 2.97 0 0 0 2.09-2.093C24 15.637 24 12 24 12s0-3.636-.502-5.814zm-11.498 9.115v-6.603l6.518 3.301-6.518 3.302z"/>
    </symbol>
    <symbol id="icon-mail" viewBox="0 0 24 24">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
    </symbol>
  </svg>`;
  document.body.appendChild(overlay);

  fab.onclick = function(){
    overlay.classList.add('active');
    setTimeout(function(){qS('#app-modal-content .modal-close').focus();},400);
  };
  overlay.addEventListener('click', e=>{
    if(e.target===overlay) overlay.classList.remove('active');
  });
  overlay.querySelector('.modal-close').onclick = function(){
    overlay.classList.remove('active');
    fab.focus();
  };
  function qS(s){ return document.querySelector(s);}
  window.addEventListener('keydown', function(ev){
    if(ev.key==='Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      fab.focus();
    }
  });
})();

document.addEventListener('DOMContentLoaded',function(){
  let form = document.getElementById('newsletter-form');
  let msg = document.getElementById('newsletter-msg');
  if(form && msg) {
    form.onsubmit = async function(ev){
      ev.preventDefault();
      msg.style.display = 'block';
      msg.className = '';
      let email = form.querySelector('input[type="email"]').value.trim();
      if(!email || !/\S+@\S+\.\S+/.test(email)) {
        msg.textContent = 'Por favor, insira um e-mail válido.';
        msg.className = 'error';
        form.querySelector('input[type="email"]').focus();
        return;
      }
      msg.textContent = 'Enviando...';
      await new Promise(r=>setTimeout(r,800));
      msg.textContent = 'Inscrição realizada! Você receberá novidades em breve 🎉';
      msg.className = 'success';
      form.reset();
    };
  }
});

(function(){
  if(document.getElementById('scrollTopBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'scrollTopBtn';
  btn.title = 'Topo';
  btn.setAttribute('aria-label','Topo');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);
  btn.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll', ()=>{
    btn.classList.toggle('show', window.scrollY > 250);
  });
})();
(function(){const t=document.getElementById('theme-toggle'),e=document.querySelector('.theme-icon');if(!t)return;function a(i,o=!0){const r='escuro'===i;r?document.body.classList.remove('light-theme'):document.body.classList.add('light-theme'),localStorage.setItem('redeCidade-tema',i),e&&(o?(e.style.transform='rotate(180deg)',setTimeout(()=>{e.textContent=r?'🌙':'☀️',e.style.transform='rotate(0deg)'},150)):e.textContent=r?'🌙':'☀️')}t.addEventListener('click',()=>{const i=localStorage.getItem('redeCidade-tema')||'escuro';a('escuro'===i?'claro':'escuro',!0)}),a(localStorage.getItem('redeCidade-tema')||'escuro',!1)})();
