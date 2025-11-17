// script.js (substitua seu script.js por este)
// - Prioriza window.NOTICIAS (noticias.js) para funcionar via file://
// - Se não existir, tenta fetch('noticias.json') e fallback XHR
// - Renderiza: #destaque-card, #noticias-list (se existir) e #latest-news (na home) com filtros (Todas + categorias)
// - Tenta manter as outras funcionalidades: nav ativo, players UI, placares.

(function(){
  'use strict';
  function q(sel, ctx){ return (ctx||document).querySelector(sel); }
  function qAll(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }
  function sanitizeHtml(html){
    if (window.DOMPurify && typeof DOMPurify.sanitize === 'function') return DOMPurify.sanitize(html);
    return html; // assume trusted local data; if data forço externo, adicione DOMPurify
  }

  // --- CATEGORIZAÇÃO: se JSON tiver campo "categoria" usa-o; senão tenta detectar por palavras-chave ---
  function detectCategory(item){
    if (item.categoria) return item.categoria;
    const t = (item.titulo || '').toLowerCase();
    if (/\b(enem|escola|educa|universidade)\b/.test(t)) return 'Educação';
    if (/\b(ibge|economi|inflação|ipca|taxa|desemprego|economia)\b/.test(t)) return 'Economia';
    if (/\b(futebol|gol|brasileir|atl[eé]tico|cruzeiro|flamengo|gr[eê]mio|atl[eé]tico)\b/.test(t)) return 'Esportes';
    if (/\b(morre|luto|música|cultura|artista|concerto)\b/.test(t)) return 'Cultura';
    if (/\b(pol[íi]tica|presidente|governo|ministro|lei|stf|tribunal|prefeitura)\b/.test(t)) return 'Política';
    return 'Geral';
  }

  // --- Renderers ---
  function renderLista(noticias){
    const container = q('#noticias-list');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(noticias) || noticias.length === 0){
      container.innerHTML = '<div class="noticia"><p>Nenhuma notícia publicada ainda.</p></div>';
      return;
    }
    noticias.forEach(n => {
      const art = document.createElement('article');
      art.className = 'noticia';
      art.innerHTML = '<h4>'+escapeHtml(n.titulo||'Sem título')+'</h4>'
                    +'<span class="data">'+escapeHtml(n.data||'')+'</span>'
                    +'<div class="news-info">'+sanitizeHtml(n.texto||'')+'</div>';
      container.appendChild(art);
    });
  }

  function renderDestaque(noticias){
    const destaque = q('#destaque-card');
    if (!destaque) return;
    if (!Array.isArray(noticias) || noticias.length === 0){
      destaque.innerHTML = '<p class="small muted">Nenhuma notícia para destacar.</p>';
      return;
    }
    const n = noticias[0];
    const tmp = document.createElement('div'); tmp.innerHTML = n.texto || '';
    const plain = tmp.textContent || tmp.innerText || '';
    destaque.innerHTML = '<h3>'+escapeHtml(n.titulo || '')+'</h3>'
                       +'<p class="small muted">'+escapeHtml(n.data || '')+'</p>'
                       +'<p>'+escapeHtml(plain.slice(0,380))+(plain.length>380?'...':'')+'</p>'
                       +'<p><a href="noticias.html" class="btn-outline">Leia todas as notícias</a></p>';
  }

  // Render últimas notícias (home) com filtros
  function renderLatestSection(noticias, opts){
    opts = opts || {};
    const limit = opts.limit || 6;
    const container = q('#latest-news');
    const filtersWrap = q('#news-filters');
    if (!container) return;
    // map categories
    const categoriesSet = new Set();
    const items = (Array.isArray(noticias) ? noticias.slice() : []);
    items.forEach(i => categoriesSet.add(detectCategory(i)));
    const categories = Array.from(categoriesSet).sort();
    // build filters UI
    if (filtersWrap) {
      filtersWrap.innerHTML = '';
      const allBtn = document.createElement('button');
      allBtn.className = 'filter-btn active';
      allBtn.textContent = 'Todas';
      allBtn.dataset.cat = 'Todas';
      filtersWrap.appendChild(allBtn);
      allBtn.addEventListener('click', ()=>{ setActiveFilter('Todas'); renderLatest(noticias, 'Todas', limit); });

      categories.forEach(cat => {
        const b = document.createElement('button');
        b.className = 'filter-btn';
        b.textContent = cat;
        b.dataset.cat = cat;
        b.addEventListener('click', ()=>{ setActiveFilter(cat); renderLatest(noticias, cat, limit); });
        filtersWrap.appendChild(b);
      });
    }
    // initial render: Todas
    renderLatest(noticias, 'Todas', limit);
  }

  function setActiveFilter(cat){
    qAll('#news-filters .filter-btn').forEach(b => {
      if (b.dataset.cat === cat) b.classList.add('active'); else b.classList.remove('active');
    });
  }

  function renderLatest(noticias, category, limit){
    const container = q('#latest-news');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(noticias) || noticias.length === 0){
      container.innerHTML = '<div class="latest-item"><p>Nenhuma notícia disponível.</p></div>';
      return;
    }
    // filter by category
    const filtered = noticias.filter(n => {
      const cat = detectCategory(n);
      return (category === 'Todas' || category === undefined) ? true : (cat === category);
    });
    // sort by date (naive: assume format DD/MM/YYYY or ISO)
    filtered.sort((a,b)=>{
      // attempt parse dd/mm/yyyy
      function parseDate(s){
        if (!s) return 0;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)){
          const parts = s.split('/');
          return new Date(parts[2], parts[1]-1, parts[0]).getTime();
        }
        const t = Date.parse(s);
        return isNaN(t) ? 0 : t;
      }
      return (parseDate(b.data) - parseDate(a.data));
    });
    const slice = filtered.slice(0, limit);
    slice.forEach(n => {
      const div = document.createElement('div');
      div.className = 'latest-item';
      const tmp = document.createElement('div'); tmp.innerHTML = n.texto || '';
      const excerpt = (tmp.textContent || tmp.innerText || '').trim().slice(0, 160);
      div.innerHTML = '<h5>' + escapeHtml(n.titulo || 'Sem título') + '</h5>'
                    + '<span class="meta">' + escapeHtml(n.data || '') + ' • ' + escapeHtml(detectCategory(n)) + '</span>'
                    + '<div class="excerpt">' + escapeHtml(excerpt) + (excerpt.length >= 160 ? '...' : '') + '</div>';
      container.appendChild(div);
    });
    if (slice.length === 0){
      container.innerHTML = '<div class="latest-item"><p>Nenhuma notícia encontrada para esta categoria.</p></div>';
    }
  }

  // --- Load JSON: prefer window.NOTICIAS (noticias.js). If not present, try fetch/XHR to noticias.json
  function loadNoticias(callback){
    if (window.NOTICIAS && Array.isArray(window.NOTICIAS)){
      callback(null, window.NOTICIAS);
      return;
    }
    const url = 'noticias.json';
    const cacheBuster = '?t=' + Date.now();
    function tryXHR(cb){
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url+cacheBuster, true);
        xhr.onreadystatechange = function(){
          if (xhr.readyState !== 4) return;
          if (xhr.status === 200 || xhr.status === 0){
            try { cb(null, JSON.parse(xhr.responseText)); }
            catch(e){ cb(new Error('Erro no parse do JSON: '+e.message)); }
          } else cb(new Error('XHR falhou com status '+xhr.status));
        };
        xhr.onerror = () => cb(new Error('XHR network error'));
        xhr.send();
      } catch(e){ cb(e); }
    }
    if (window.fetch){
      fetch(url + cacheBuster, { cache: 'no-store' }).then(res=>{
        if (!res.ok) throw new Error('HTTP '+res.status);
        return res.json();
      }).then(json => callback(null,json))
      .catch(err => { console.warn('fetch falhou, fallback XHR:', err); tryXHR(callback); });
    } else {
      tryXHR(callback);
    }
  }

  // --- Initialization (nav, players, newsletter, placares) ---
  function initUI(){
    // nav active
    (function setActiveNav(){
      try {
        const path = location.pathname.split('/').pop() || 'index.html';
        const mapping = {'index.html':'nav-inicio','': 'nav-inicio','ouca.html':'nav-ouca','noticias.html':'nav-noticias','programacao.html':'nav-programacao','quem-somos.html':'nav-quem'};
        qAll('nav a').forEach(a=>a.classList.remove('active'));
        const active = q('#'+(mapping[path]||'nav-inicio'));
        if (active) active.classList.add('active');
      } catch(e){ console.warn(e); }
    })();

    // players UI (keeps the behavior)
    (function playersUI(){
      const btnBh = q('#btn-bh'), btnPa = q('#btn-pa'), btnSp = q('#btn-sp');
      if (!btnBh && !btnPa && !btnSp) return;
      function clear(){ [btnBh,btnPa,btnSp].forEach(b=>b&&b.classList.remove('active')&&(b.setAttribute('aria-pressed','false'))); }
      function hide(){ qAll('.player-container').forEach(pc=>{ pc.classList.remove('active'); pc.setAttribute('aria-hidden','true'); pc.style.display='none'; }); }
      if (btnBh) btnBh.addEventListener('click', ()=>{ clear(); btnBh.classList.add('active'); btnBh.setAttribute('aria-pressed','true'); hide(); const p=q('#player-bh'); if(p){p.style.display='block'; setTimeout(()=>p.classList.add('active'),20); p.setAttribute('aria-hidden','false'); } });
      if (btnPa) btnPa.addEventListener('click', ()=>{ clear(); btnPa.classList.add('active'); btnPa.setAttribute('aria-pressed','true'); hide(); const p=q('#player-pa'); if(p){p.style.display='block'; setTimeout(()=>p.classList.add('active'),20); p.setAttribute('aria-hidden','false'); } });
      if (btnSp) btnSp.addEventListener('click', ()=>{ clear(); btnSp.classList.add('active'); btnSp.setAttribute('aria-pressed','true'); hide(); const p=q('#player-sp'); if(p){p.style.display='block'; setTimeout(()=>p.classList.add('active'),20); p.setAttribute('aria-hidden','false'); if (window.injectCasterScript) window.injectCasterScript(true); const loadBtn=q('#load-player-sp'); if(loadBtn) loadBtn.style.display='none'; } });
    })();

    // newsletter
    (function newsletter(){
      const form = q('#newsletter-form'); if (!form) return;
      form.addEventListener('submit', (e)=>{ e.preventDefault(); const email = q('#newsletter-email').value.trim(); const msg = q('#newsletter-msg'); if (!email||!email.includes('@')){ if(msg){msg.style.display=''; msg.textContent='Por favor insira um e-mail válido.';} return;} if(msg){msg.style.display=''; msg.textContent='Obrigado! Você será notificado em breve (demo).'} form.reset(); setTimeout(()=>{ if(msg) msg.style.display='none'; },4000); });
    })();

    // placares (se função renderPlacares existir)
    if (typeof renderPlacares === 'function'){ try { renderPlacares(); } catch(e){ console.warn('renderPlacares error', e); } }
  }

  // --- Run: init UI, load noticias and render into destinations ---
  function start(){
    initUI();
    loadNoticias(function(err, noticias){
      if (err){
        console.warn('Erro ao carregar notícias:', err);
        // show helpful messages in page areas
        const listEl = q('#noticias-list'); if (listEl) listEl.innerHTML = '<div class="noticia"><p>Não foi possível carregar as notícias. Verifique se <code>noticias.js</code> (ou noticias.json) está no mesmo diretório.</p></div>';
        const dest = q('#destaque-card'); if (dest) dest.innerHTML = '<p class="small muted">Não foi possível carregar destaque.</p>';
        const latest = q('#latest-news'); if (latest) latest.innerHTML = '<div class="latest-item"><p>Não foi possível carregar últimas notícias.</p></div>';
        return;
      }
      // render various places
      const listEl = q('#noticias-list'); if (listEl) renderLista(noticias);
      const dest = q('#destaque-card'); if (dest) renderDestaque(noticias);
      const latestWrap = q('#latest-news'); if (latestWrap) renderLatestSection(noticias, { limit: 6 });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

})();