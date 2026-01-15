// script.js — atualizado: respeita categoria em JSON e heurística de fallback mais precisa
document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ---------- CONFIGURAÇÕES ----------
  const SP_FALLBACK_STREAM = '';
  const CANOAS_FALLBACK_STREAM = '';
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
  // Lista de regras ordenada por prioridade: {regex, category}
  const CATEGORY_RULES = [
    { r: /\b(enem|enem 2025|vestibular|prova|cartão de confirmação|instituto nacional|inep)\b/i, c: 'Educação' },
    { r: /\b(Atlético|Galo|Flamengo|Corinthians|Vitória do Brasil|Seleção|amistoso|partida|jogo|rodada|Brasileirão|Libertadores|Série A|placar|gol|gols|lance|VIRADA|plantão esportivo)\b/i, c: 'Esportes' },
    { r: /\b(ibge|desemprego|economia|rendimento|informalidade|pnad|taxa de desocupação|rendimento médio)\b/i, c: 'Economia' },
    { r: /\b(explosão|explosões|explodiu|detonação|bomba|incêndio|incêndios|explodiu|deposito clandestino|fogos de artifício)\b/i, c: 'Segurança Pública' },
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

  // ---------- Resto do script (players, placares) ----------
  // (mantive as funções de players/fallback e placares conforme sua versão;
  // para brevidade aqui eu incluo apenas o trecho de notícias atualizado abaixo)
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
            // Normalize capitalization (title-case simple)
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
    // Preserve order: collect categories in order of first appearance
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

  // Inicializações (mantive chamadas mínimas aqui)
  try { loadNoticias(); } catch (err) { console.error('Erro ao carregar notícias:', err); }

  // Export util (opcional)
  window.__redeCidade = Object.assign(window.__redeCidade || {}, { guessCategory });
});