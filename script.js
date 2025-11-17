// Script global melhorado: navegação por páginas, ativa o link correto, melhora acessibilidade,
// carrega notícias, renderiza placares e mantém lazy-load do widget caster.fm.

// --- Utilitários ---
function q(selector, ctx=document){ return ctx.querySelector(selector); }
function qAll(selector, ctx=document){ return Array.from((ctx||document).querySelectorAll(selector)); }

// Ativa o link do menu baseado no pathname
(function setActiveNav(){
    try {
        const path = location.pathname.split('/').pop() || 'index.html';
        const mapping = {
            'index.html': 'nav-inicio',
            '': 'nav-inicio',
            'ouca.html': 'nav-ouca',
            'noticias.html': 'nav-noticias',
            'programacao.html': 'nav-programacao',
            'quem-somos.html': 'nav-quem'
        };
        const id = mapping[path] || 'nav-inicio';
        qAll('nav a').forEach(a => a.classList.remove('active'));
        const active = document.getElementById(id);
        if (active) active.classList.add('active');
    } catch (e) { console.error(e); }
})();

// --- Notícias (fetch noticias.json quando existir) ---
(function loadNoticias(){
    const noticiasList = q('#noticias-list');
    const destaque = q('#destaque-card');
    if (!noticiasList && !destaque) return;

    fetch('noticias.json')
    .then(r => r.json())
    .then(noticias => {
        if (noticiasList) {
            noticiasList.innerHTML = '';
            if (!noticias.length) {
                noticiasList.innerHTML = '<div class="noticia"><p>Nenhuma notícia publicada ainda.</p></div>';
            } else {
                noticias.forEach(n => {
                    const div = document.createElement('div');
                    div.className = 'noticia';
                    div.innerHTML = `
                        <h4>${n.titulo}</h4>
                        <span class="data">${n.data}</span>
                        <p>${n.texto}</p>
                    `;
                    noticiasList.appendChild(div);
                });
            }
        }
        if (destaque) {
            if (noticias && noticias.length) {
                const n = noticias[0];
                destaque.innerHTML = `
                    <h3>${n.titulo}</h3>
                    <p class="small muted">${n.data}</p>
                    <p>${n.texto.slice(0,320)}${n.texto.length>320?'...':''}</p>
                    <p><a href="noticias.html" class="btn-outline">Leia todas as notícias</a></p>
                `;
            } else {
                destaque.innerHTML = '<p class="small muted">Nenhuma notícia para destacar.</p>';
            }
        }
    })
    .catch(() => {
        if (noticiasList) noticiasList.innerHTML = '<div class="noticia"><p>Ops! Houve um erro ao carregar as notícias.</p></div>';
        if (destaque) destaque.innerHTML = '<p class="small muted">Erro ao carregar destaque.</p>';
    });
})();

// ========= PLACARES MANUAIS =========
const placares = [
    { campeonato:"Amistosos da Seleção", status:"ENCERRADO", data:"15/11", hora:"13:00", time_casa:"Brasil", escudo_casa:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Brazilian_Football_Confederation_logo.svg/150px-Brazilian_Football_Confederation_logo.svg.png", gols_casa:2, time_fora:"Senegal", escudo_fora:"https://upload.wikimedia.org/wikipedia/pt/thumb/7/7c/FSenegalaiseF.png/250px-FSenegalaiseF.png", gols_fora:0 },
    { campeonato:"Brasileirão Série A", status:"A SEGUIR", data:"15/11", hora:"18:30", time_casa:"Sport", escudo_casa:"https://upload.wikimedia.org/wikipedia/pt/thumb/1/17/Sport_Club_do_Recife.png/120px-Sport_Club_do_Recife.png", gols_casa:null, time_fora:"Flamengo", escudo_fora:"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_braz_logo.svg/250px-Flamengo_braz_logo.svg.png", gols_fora:null },
    { campeonato:"Brasileirão Série A", status:"A SEGUIR", data:"15/11", hora:"21:00", time_casa:"Santos", escudo_casa:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_Logo.png/250px-Santos_Logo.png", gols_casa:null, time_fora:"Palmeiras", escudo_fora:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/250px-Palmeiras_logo.svg.png", gols_fora:null },
    { campeonato:"Brasileirão Série A", status:"A SEGUIR", data:"16/11", hora:"19:00", time_casa:"Red Bull", escudo_casa:"https://upload.wikimedia.org/wikipedia/pt/thumb/9/9e/RedBullBragantino.png/250px-RedBullBragantino.png", gols_casa:null, time_fora:"Atlético", escudo_fora:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png", gols_fora:null },
    { campeonato:"Amistosos da Seleção", status:"A SEGUIR", data:"18/11", hora:"16:30", time_casa:"Brasil", escudo_casa:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Brazilian_Football_Confederation_logo.svg/150px-Brazilian_Football_Confederation_logo.svg.png", gols_casa:null, time_fora:"Tunísia", escudo_fora:"https://upload.wikimedia.org/wikipedia/pt/thumb/8/88/F%C3%A9d%C3%A9ration_Tunisienne_de_Football.png/250px-F%C3%A9d%C3%A9ration_Tunisienne_de_Football.png", gols_fora:null },
    { campeonato:"Copa Sul-Americana", status:"A SEGUIR", data:"22/11", hora:"17:00", time_casa:"Atlético", escudo_casa:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png", gols_casa:null, time_fora:"Lanús", escudo_fora:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Escudo_del_Club_Lan%C3%BAs.png/120px-Escudo_del_Club_Lan%C3%BAs.png", gols_fora:null }
];

// Renderiza placares se element for encontrado
function renderPlacares(){
    const placaresList = q('#placares-list');
    if (!placaresList) return;
    if (!placares.length) {
        placaresList.innerHTML = '<div class="loading-placar">Nenhum jogo cadastrado.</div>';
        return;
    }
    placaresList.innerHTML = '';
    placares.forEach(jogo => placaresList.appendChild(placarCard(jogo)));
    renderTicker();
}

function placarCard(jogo){
    let statusClass = "", statusLabel = "";
    if (jogo.status === "AO VIVO") { statusClass = "status-ao-vivo"; statusLabel = "AO VIVO"; }
    else if (jogo.status === "ENCERRADO") { statusClass = "status-encerrado"; statusLabel = "ENCERRADO"; }
    else { statusClass = "status-a-seguir"; statusLabel = "A SEGUIR"; }

    const golsCasa = (jogo.gols_casa !== null && jogo.gols_casa !== undefined) ? jogo.gols_casa : "-";
    const golsFora = (jogo.gols_fora !== null && jogo.gols_fora !== undefined) ? jogo.gols_fora : "-";

    const card = document.createElement('div');
    card.className = 'placar-card2';
    card.innerHTML = `
        <div class="placar-header">
            <span class="placar-campeonato">${jogo.campeonato}</span>
            <span class="placar-status2 ${statusClass}">${statusLabel}</span>
        </div>
        <div class="placar-times">
            <div class="placar-time align-left">
                <img class="placar-escudo2" src="${jogo.escudo_casa}" alt="${jogo.time_casa}">
                <span class="placar-nome2">${jogo.time_casa}</span>
            </div>
            <div class="placar-resultado">
                <span class="placar-gols2">${golsCasa}</span>
                <span class="placar-x2">x</span>
                <span class="placar-gols2">${golsFora}</span>
            </div>
            <div class="placar-time align-right">
                <span class="placar-nome2">${jogo.time_fora}</span>
                <img class="placar-escudo2" src="${jogo.escudo_fora}" alt="${jogo.time_fora}">
            </div>
        </div>
        <div class="placar-hora2">${jogo.data} - ${jogo.hora}</div>
    `;
    return card;
}

// ticker simples
function renderTicker(){
    const ticker = q('#placar-ticker');
    if (!ticker) return;
    ticker.innerHTML = '';
    placares.forEach(j => {
        const item = document.createElement('span');
        item.className = 'ticker-item';
        const golsCasa = (j.gols_casa !== null && j.gols_casa !== undefined) ? j.gols_casa : '-';
        const golsFora = (j.gols_fora !== null && j.gols_fora !== undefined) ? j.gols_fora : '-';
        item.textContent = `${j.time_casa} ${golsCasa} x ${golsFora} ${j.time_fora} • ${j.hora}`;
        ticker.appendChild(item);
    });
}

// inicializa placares
renderPlacares();

// ===== NOVO: Lazy-load / injeção do widget caster.fm (novoStreamPlayer) =====
(function(){
    const SCRIPT_SRC = 'https://cdn.cloud.caster.fm/widgets/embed.js';
    let scriptInjected = false;
    window.injectCasterScript = function(){
        if (scriptInjected) return;
        if (document.querySelector('script[src="'+SCRIPT_SRC+'"]')) { scriptInjected = true; return; }
        scriptInjected = true;
        const s = document.createElement('script');
        s.src = SCRIPT_SRC; s.async = true;
        s.onload = () => { /* widget carregado */ };
        s.onerror = () => console.error('Falha ao carregar o widget do caster.fm');
        document.head.appendChild(s);
    };

    const loadBtnSp = q('#load-player-sp');
    if (loadBtnSp){
        loadBtnSp.addEventListener('click', () => {
            injectCasterScript();
            loadBtnSp.style.display = 'none';
        });
    }

    // Obs: detecta automaticamente a presença do embed placeholder e carrega quando entra na viewport
    const playerEmbed = q('.cstrEmbed');
    if (playerEmbed && 'IntersectionObserver' in window){
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting){
                    injectCasterScript();
                    observer.disconnect();
                    if (loadBtnSp) loadBtnSp.style.display = 'none';
                }
            });
        }, { rootMargin: '200px' });
        obs.observe(playerEmbed);
    }
})();

// --- Players UI on Ouça-nos page ---
(function playersUI(){
    const btnBh = q('#btn-bh');
    const btnPa = q('#btn-pa');
    const btnSp = q('#btn-sp');
    if (!btnBh && !btnPa && !btnSp) return;

    function clearActiveBtns(){
        [btnBh, btnPa, btnSp].forEach(b => { if (b) b.classList.remove('active'); });
    }
    function hideAllPlayers(){
        qAll('.player-container').forEach(pc => {
            pc.classList.remove('active');
            if (pc.style) pc.style.display = 'none';
        });
    }

    if (btnBh) btnBh.addEventListener('click', () => {
        clearActiveBtns(); btnBh.classList.add('active');
        hideAllPlayers();
        const p = q('#player-bh'); if (p){ p.classList.add('active'); p.style.display='block'; }
    });
    if (btnPa) btnPa.addEventListener('click', () => {
        clearActiveBtns(); btnPa.classList.add('active');
        hideAllPlayers();
        const p = q('#player-pa'); if (p){ p.classList.add('active'); p.style.display='block'; }
    });
    if (btnSp) btnSp.addEventListener('click', () => {
        clearActiveBtns(); btnSp.classList.add('active');
        hideAllPlayers();
        const p = q('#player-sp'); if (p){ p.classList.add('active'); p.style.display='block'; }
        injectCasterScript();
    });
})();

// --- Newsletter placeholder handler ---
(function newsletter(){
    const form = q('#newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = q('#newsletter-email').value.trim();
        const msg = q('#newsletter-msg');
        if (!email || !email.includes('@')) {
            msg.style.display = ''; msg.textContent = 'Por favor insira um e-mail válido.';
            return;
        }
        // Placeholder: simula sucesso (substitua por integração real)
        msg.style.display = ''; msg.textContent = 'Obrigado! Você será notificado em breve (demo).';
        form.reset();
        setTimeout(()=>{ if (msg) msg.style.display='none'; }, 4000);
    });
})();