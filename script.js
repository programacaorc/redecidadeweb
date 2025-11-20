/* script.js — substituição recomendada
   - Renderiza placares + ticker
   - Carrega notícias (window.NOTICIAS || noticias.json) e preenche: noticias-list, latest-news, destaque-card, news-filters
   - Controla seleção de players (BH / PA / SP) sem sobrescrever o embed caster.fm
   - Fornece fallback opcional para SP usando stream direto caso o widget não inicialize
*/

document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ---------- CONFIGURAÇÕES ----------
  // Se quiser fallback automático para o stream direto (quando o widget não inicializar),
  // defina a URL abaixo. Se preferir NÃO usar fallback, deixe como "".
  const SP_FALLBACK_STREAM = 'http://morcast.caster.fm:11301/COezt'; // <-- fallback opcional; vazio para desativar

  // Tempo (ms) para aguardar inicialização do widget e então acionar fallback
  const SP_WIDGET_INIT_TIMEOUT = 3500;

  // ---------- PLAYERS ----------
  const btnBh = $('#btn-bh');
  const btnPa = $('#btn-pa');
  const btnSp = $('#btn-sp');
  const loadBtnSp = $('#load-player-sp');
  const pBh = $('#player-bh');
  const pPa = $('#player-pa');
  const pSp = $('#player-sp');

  const activateBtn = el => { if (el) { el.classList.add('active'); el.setAttribute('aria-pressed','true'); } };
  const deactivateBtn = el => { if (el) { el.classList.remove('active'); el.setAttribute('aria-pressed','false'); } };

  function show(el) { if (!el) return; el.style.display = ''; el.classList.add('active'); el.removeAttribute('aria-hidden'); }
  function hide(el) { if (!el) return; el.style.display = 'none'; el.classList.remove('active'); el.setAttribute('aria-hidden','true'); }

  if (btnBh) {
    btnBh.addEventListener('click', () => {
      activateBtn(btnBh); deactivateBtn(btnPa); if (btnSp) deactivateBtn(btnSp);
      show(pBh); hide(pPa); hide(pSp);
      // stop any SP audio fallback if present
      teardownSpFallback();
    });
  }
  if (btnPa) {
    btnPa.addEventListener('click', () => {
      activateBtn(btnPa); deactivateBtn(btnBh); if (btnSp) deactivateBtn(btnSp);
      show(pPa); hide(pBh); hide(pSp);
      teardownSpFallback();
    });
  }

  // Quando o usuário seleciona SP: apenas mostra o container onde o embed vive.
  // NÃO altera o conteúdo interno de .cstrEmbed — o widget deve se inicializar por si só.
  if (btnSp) {
    btnSp.addEventListener('click', () => {
      activateBtn(btnSp); deactivateBtn(btnBh); deactivateBtn(btnPa);
      show(pSp); hide(pBh); hide(pPa);
      if (loadBtnSp) loadBtnSp.style.display = 'none';

      // Após mostrar, aguarda um pouco: se o widget não inicializar e houver fallback configurado,
      // cria um elemento <audio> com a stream direta.
      attemptSpFallbackWithDelay();
    });
  }

  if (loadBtnSp) {
    loadBtnSp.addEventListener('click', () => {
      // o embed normalmente já está no HTML; esse botão só força a exibição e esconde o botão.
      show(pSp);
      loadBtnSp.style.display = 'none';
      if (btnSp) activateBtn(btnSp);
      if (btnBh) deactivateBtn(btnBh);
      if (btnPa) deactivateBtn(btnPa);

      attemptSpFallbackWithDelay();
    });
  }

  // Fallback helpers: cria um <audio id="sp-audio-fallback"> apenas se necessário
  let spFallbackAudioEl = null;
  let spFallbackTimeoutId = null;

  function teardownSpFallback() {
    if (spFallbackTimeoutId) {
      clearTimeout(spFallbackTimeoutId);
      spFallbackTimeoutId = null;
    }
    if (spFallbackAudioEl) {
      try { spFallbackAudioEl.pause(); } catch (e) {}
      spFallbackAudioEl.remove();
      spFallbackAudioEl = null;
    }
  }

  function attemptSpFallbackWithDelay() {
    // se não há fallback configurado, nada a fazer
    if (!SP_FALLBACK_STREAM) return;

    // se já existe .cstrEmbed e o widget já substituiu (procura por elementos visuais do widget),
    // não aplicamos fallback.
    const embedNode = document.querySelector('#sp-embed-placeholder .cstrEmbed') || document.querySelector('.cstrEmbed');
    if (!embedNode) {
      // se não há embed node no DOM, aplicamos fallback imediato
      applySpFallback();
      return;
    }

    // se o embedNode tem conteúdo diferente do fallback anchors (ou já contém players),
    // assumimos que o widget inicializou e não aplicamos fallback.
    const initialFallbackTextPresent = (() => {
      // o markup de fallback padrão contém links para caster.fm; se o widget inicializou geralmente
      // ele substitui esse conteúdo com elementos <iframe>/<div> propriamente estilizados.
      // usamos heurística simples: se o embedNode contém only anchors (e sem children com role="button" / play),
      // então provavelmente NÃO inicializou ainda.
      const anchors = embedNode.querySelectorAll('a');
      const nonAnchorChildren = Array.from(embedNode.children).filter(c => c.tagName.toLowerCase() !== 'a');
      // se somente anchors (>=1) e nenhum elemento significativo, então ainda está no fallback textual.
      return anchors.length > 0 && nonAnchorChildren.length === 0;
    })();

    // só aguarda se parece que o embed ainda está no fallback textual
    if (!initialFallbackTextPresent) return;

    // aguarda um curto período para o widget inicializar; se depois disso ainda parecer texto, usamos fallback
    if (spFallbackTimeoutId) clearTimeout(spFallbackTimeoutId);
    spFallbackTimeoutId = setTimeout(() => {
      // reavalia
      const embedNow = document.querySelector('#sp-embed-placeholder .cstrEmbed') || document.querySelector('.cstrEmbed');
      const stillOnlyAnchors = embedNow && (() => {
        const anchors = embedNow.querySelectorAll('a');
        const nonAnchorChildren = Array.from(embedNow.children).filter(c => c.tagName.toLowerCase() !== 'a');
        return anchors.length > 0 && nonAnchorChildren.length === 0;
      })();

      if (stillOnlyAnchors) {
        // aplica fallback
        applySpFallback();
      }
      spFallbackTimeoutId = null;
    }, SP_WIDGET_INIT_TIMEOUT);
  }

  function applySpFallback() {
    // evita criar várias vezes
    if (!SP_FALLBACK_STREAM || spFallbackAudioEl) return;

    // cria um áudio simples dentro do placeholder (logo abaixo do embed)
    const placeholder = $('#sp-embed-placeholder') || $('#player-sp');
    if (!placeholder) return;

    spFallbackAudioEl = document.createElement('audio');
    spFallbackAudioEl.id = 'sp-audio-fallback';
    spFallbackAudioEl.controls = true;
    spFallbackAudioEl.preload = 'none';
    spFallbackAudioEl.style.width = '100%';
    spFallbackAudioEl.style.maxWidth = '480px';
    spFallbackAudioEl.src = SP_FALLBACK_STREAM;

    const note = document.createElement('p');
    note.className = 'small muted';
    note.textContent = 'Player alternativo carregado (fallback). Se preferir o widget oficial, atualize sua conexão ou verifique bloqueios de scripts.';

    // remove old fallback anchor-only content to avoid confusion
    const embedNode = placeholder.querySelector('.cstrEmbed');
    if (embedNode) {
      try { embedNode.style.display = 'none'; } catch (e) {}
    }

    placeholder.appendChild(spFallbackAudioEl);
    placeholder.appendChild(note);

    // tentar autoplay por gesto do usuário (se a seleção SP foi resultado de clique, pode tocar)
    spFallbackAudioEl.play().catch(() => {/* autoplay bloqueado; usuário pode clicar */});
  }

  // ---------- PLACARES (dados manuais) ----------
  const placares = [
    {
        campeonato: "Amistosos da Seleção",
        status: "ENCERRADO",
        data: "15/11",
        hora: "13:00",
        time_casa: "Brasil",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Brazilian_Football_Confederation_logo.svg/150px-Brazilian_Football_Confederation_logo.svg.png",
        gols_casa: 2,
        time_fora: "Senegal",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/7/7c/FSenegalaiseF.png/250px-FSenegalaiseF.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "15/11",
        hora: "18:30",
        time_casa: "Sport",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/1/17/Sport_Club_do_Recife.png/120px-Sport_Club_do_Recife.png",
        gols_casa: 1,
        time_fora: "Flamengo",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_braz_logo.svg/250px-Flamengo_braz_logo.svg.png",
        gols_fora: 5
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "15/11",
        hora: "21:00",
        time_casa: "Santos",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_Logo.png/250px-Santos_Logo.png",
        gols_casa: 1,
        time_fora: "Palmeiras",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/250px-Palmeiras_logo.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "16/11",
        hora: "19:00",
        time_casa: "Red Bull",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/9/9e/RedBullBragantino.png/250px-RedBullBragantino.png",
        gols_casa: 2,
        time_fora: "Atlético",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_fora: 0
    },
    {
        campeonato: "Amistosos da Seleção",
        status: "ENCERRADO",
        data: "18/11",
        hora: "16:30",
        time_casa: "Brasil",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Brazilian_Football_Confederation_logo.svg/150px-Brazilian_Football_Confederation_logo.svg.png",
        gols_casa: 1,
        time_fora: "Tunísia",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/88/F%C3%A9d%C3%A9ration_Tunisienne_de_Football.png/250px-F%C3%A9d%C3%A9ration_Tunisienne_de_Football.png",
        gols_fora: 1
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "19/11",
        hora: "21:30",
        time_casa: "Grêmio",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/250px-Gremio_logo.svg.png",
        gols_casa: 2,
        time_fora: "Vasco",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/8b/EscudoDoVascoDaGama.svg/120px-EscudoDoVascoDaGama.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Copa Sul-Americana",
        status: "A SEGUIR",
        data: "22/11",
        hora: "17:00",
        time_casa: "Atlético",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_casa: null,
        time_fora: "Lanús",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Escudo_del_Club_Lan%C3%BAs.png/120px-Escudo_del_Club_Lan%C3%BAs.png",
        gols_fora: null
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
          ${ j.escudo_casa ? `<img class="placar-escudo2" src="${escapeAttr(j.escudo_casa)}" alt="${escapeHtml(j.time_casa)}">` : '' }
          <span class="placar-nome2">${escapeHtml(j.time_casa)}</span>
        </div>
        <div class="placar-resultado">
          <span class="placar-gols2">${golsCasa}</span>
          <span class="placar-x2">x</span>
          <span class="placar-gols2">${golsFora}</span>
        </div>
        <div class="placar-time align-right">
          <span class="placar-nome2">${escapeHtml(j.time_fora)}</span>
          ${ j.escudo_fora ? `<img class="placar-escudo2" src="${escapeAttr(j.escudo_fora)}" alt="${escapeHtml(j.time_fora)}">` : '' }
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
      div.innerHTML = `<h4>${escapeHtml(n.titulo || '')}</h4>
        <span class="data">${escapeHtml(n.data || '')}</span>
        <p>${escapeHtml(n.texto || n.excerpt || '')}</p>`;
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
      const excerpt = n.excerpt || (n.texto ? (n.texto.length > 140 ? n.texto.slice(0,140) + '…' : n.texto) : '');
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
    container.innerHTML = `
      <div class="destaque-inner">
        <h3>${escapeHtml(destaque.titulo || '')}</h3>
        <span class="meta">${escapeHtml(destaque.data || '')}</span>
        <p>${escapeHtml(destaque.texto || destaque.excerpt || '')}</p>
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
  try {
    renderPlacares();
  } catch (err) {
    console.error('Erro ao renderizar placares:', err);
  }

  try {
    loadNoticias();
  } catch (err) {
    console.error('Erro ao carregar notícias:', err);
  }

  // Se a pessoa abrir a aba SP por URL hash (ex: ouca.html#sp) tentamos mostrar automaticamente
  (function checkHash() {
    if (location.hash && location.hash.toLowerCase().includes('sp')) {
      if (btnSp) btnSp.click();
      else if (pSp) show(pSp);
    }
  })();

  // export para depuração manual (opcional)
  window.__redeCidade = {
    renderPlacares,
    loadNoticias,
    applySpFallback, // função pública caso queira forçar fallback
    teardownSpFallback
  };
});
