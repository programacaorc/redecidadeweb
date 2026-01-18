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
  // Torna os botões funcionais: alterna painéis, pausa outros players e faz lazy-load dos widgets Caster quando solicitado.
  (function initPlayers() {
    const stations = [
      { btn: '#btn-bh', panel: '#player-bh', id: 'bh', fallback: '' },
      { btn: '#btn-pa', panel: '#player-pa', id: 'pa', fallback: '' },
      { btn: '#btn-sp', panel: '#player-sp', id: 'sp', fallback: SP_FALLBACK_STREAM },
      { btn: '#btn-canoas', panel: '#player-canoas', id: 'canoas', fallback: CANOAS_FALLBACK_STREAM }
    ];

    // flags para evitar cargas repetidas
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
          panel.style.display = ''; // allow CSS to control layout
          panel.setAttribute('aria-hidden', 'false');
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          panel.classList.remove('active');
          // Some panels might have inline display:none in markup; set to none to hide
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
      // append script once to render any .cstrEmbed on the page
      const s = document.createElement('script');
      s.src = 'https://cdn.cloud.caster.fm/widgets/embed.js';
      s.async = true;
      s.onload = () => { casterScriptAppended = true; };
      s.onerror = () => { console.warn('Falha ao carregar widget Caster (embed.js)'); };
      document.body.appendChild(s);
      // mark as appended immediately to avoid duplicate append attempts
      casterScriptAppended = true;
    }

    function tryLoadCasterFor(panelId) {
      const panel = $(`#player-${panelId}`);
      if (!panel) return;
      // se houver um bloco .cstrEmbed dentro do painel, garantir que o script seja executado
      const embed = panel.querySelector('.cstrEmbed');
      if (embed) {
        // se o widget já foi renderizado (atributo data-rendered), nada a fazer
        const rendered = embed.getAttribute('data-rendered');
        if (rendered === 'true') return;
        ensureCasterWidgets();
        // é possível que o widget precise de um tempo para inicializar; deixamos o atributo e confiamos no script
        // algumas implementações podem requerer re-dispatch de eventos, mas o embed.js geralmente varre o DOM ao carregar
        return;
      }

      // se não há cstrEmbed e temos um stream de fallback, inserir um <audio>
      const fallback = panelId === 'sp' ? SP_FALLBACK_STREAM : (panelId === 'canoas' ? CANOAS_FALLBACK_STREAM : '');
      if (fallback) {
        // evitar inserir múltiplos players de fallback
        if (!panel.querySelector('audio[data-fallback="true"]')) {
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.setAttribute('data-fallback', 'true');
          audio.src = fallback;
          audio.preload = 'none';
          panel.appendChild(audio);
        }
      } else {
        // sem fallback: mostrar instrução de carregar
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
      // lazy load widgets if needed
      if (station.id === 'sp' && !spLoaded) {
        tryLoadCasterFor('sp');
        spLoaded = true;
      }
      if (station.id === 'canoas' && !canoasLoaded) {
        tryLoadCasterFor('canoas');
        canoasLoaded = true;
      }
    }

    // bind buttons
    stations.forEach(station => {
      const btn = $(station.btn);
      if (!btn) return;
      btn.addEventListener('click', (ev) => onStationClick(ev, station));
      // keyboard: Enter/Space already trigger click on button elements
    });

    // Bind the "Carregar player" buttons inside SP/Canoas panels (if present)
    const loadSpBtn = $('#load-player-sp');
    if (loadSpBtn) {
      loadSpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        tryLoadCasterFor('sp');
        spLoaded = true;
        // also make the sp panel visible so user sees result
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

    // Initialize view: ensure BH panel visible if exists (matches markup default)
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
      campeonato: "Campeonato Mineiro",
      status: "AO VIVO",
      data: "18/01",
      hora: "11:00",
      time_casa: "Iabirito",
      escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/9/94/Logo_Itabirito.png/120px-Logo_Itabirito.png",
      gols_casa: 0,
      time_fora: "América",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Escudo_Am%C3%A9rica_de_Minas.png/250px-Escudo_Am%C3%A9rica_de_Minas.png",
      gols_fora: 0
    },
    {
      campeonato: "Copa Itatiaia",
      status: "A SEGUIR",
      data: "18/12",
      hora: "14:00",
      time_casa: "Verona",
      escudo_casa: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm4kVU9_yNgBWJx_EZA8d2mdAL0fdW58LhAQ&s",
      gols_casa: null,
      time_fora: "Cruzeirinho",
      escudo_fora: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFU_Glj2TS50FqdK4Gt87tc44h_ZiHHuQ0rQ&s",
      gols_fora: null
    },
    {
      campeonato: "Campeonato Mineiro",
      status: "A SEGUIR",
      data: "18/01",
      hora: "18:00",
      time_casa: "Atlético",
      escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
      gols_casa: null,
      time_fora: "Tombense",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/85/TombenseFC.png/120px-TombenseFC.png",
      gols_fora: null
    },
    {
      campeonato: "Campeonato Gaúcho",
      status: "A SEGUIR",
      data: "18/01",
      hora: ":30",
      time_casa: "Ypiranga",
      escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Ypiranga_FC_%28Erechim%29_%28Logo%29.png/120px-Ypiranga_FC_%28Erechim%29_%28Logo%29.png",
      gols_casa: null,
      time_fora: "Internacional",
      escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Esporte_Clube_S%C3%A3o_Jos%C3%A9_logo.png/120px-Esporte_Clube_S%C3%A3o_Jos%C3%A9_logo.png",
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

  // ---------- NOTÍCIAS ----------
  function loadNoticias() {
    const source = window.NOTICIAS ? Promise.resolve(window.NOTICIAS) : fetch('noticias.json').then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
    source.then(noticias => {
      try {
        if (!Array.isArray(noticias)) noticias = [];

        // Normalize: respeitar "categoria" se fornecida; se ausente, aplicar heurística
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
