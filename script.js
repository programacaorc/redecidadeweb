// Troca de abas
document.querySelectorAll('nav li').forEach(li => {
    li.addEventListener('click', function() {
        document.querySelectorAll('nav li').forEach(_li => _li.classList.remove('active'));
        li.classList.add('active');
        const section = li.getAttribute('data-section');
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active-section'));
        document.getElementById(section).classList.add('active-section');
    });
});

// Troca de player BH <-> PA
document.getElementById('btn-bh').addEventListener('click', function() {
    document.getElementById('btn-bh').classList.add('active');
    document.getElementById('btn-pa').classList.remove('active');
    // if SP button exists, remove active
    const btnSp = document.getElementById('btn-sp');
    if (btnSp) btnSp.classList.remove('active');

    document.getElementById('player-bh').classList.add('active');
    document.getElementById('player-pa').classList.remove('active');
    // hide SP player if present
    const pSp = document.getElementById('player-sp');
    if (pSp) {
        pSp.classList.remove('active');
        pSp.style.display = 'none';
    }
});
document.getElementById('btn-pa').addEventListener('click', function() {
    document.getElementById('btn-pa').classList.add('active');
    document.getElementById('btn-bh').classList.remove('active');
    const btnSp = document.getElementById('btn-sp');
    if (btnSp) btnSp.classList.remove('active');

    document.getElementById('player-pa').classList.add('active');
    document.getElementById('player-bh').classList.remove('active');

    const pSp = document.getElementById('player-sp');
    if (pSp) {
        pSp.classList.remove('active');
        pSp.style.display = 'none';
    }
});

// NOVO: Troca para Rádio Cidade SP (player embed)
const btnSp = document.getElementById('btn-sp');
if (btnSp) {
    btnSp.addEventListener('click', function() {
        // UI classes
        btnSp.classList.add('active');
        document.getElementById('btn-bh').classList.remove('active');
        document.getElementById('btn-pa').classList.remove('active');

        // show SP player, hide others
        const pSp = document.getElementById('player-sp');
        if (pSp) {
            pSp.classList.add('active');
            pSp.style.display = '';
        }
        document.getElementById('player-bh').classList.remove('active');
        document.getElementById('player-pa').classList.remove('active');

        // Inject caster widget script (lazy load) when user selects SP
        injectCasterScript();
    });
}

// Carregar notícias
fetch('noticias.json')
    .then(res => res.json())
    .then(noticias => {
        const list = document.getElementById('noticias-list');
        if (!noticias.length) {
            list.innerHTML = '<p>Nenhuma notícia publicada ainda.</p>';
            return;
        }
        list.innerHTML = '';
        noticias.forEach(noticia => {
            const div = document.createElement('div');
            div.className = 'noticia';
            div.innerHTML = `<h4>${noticia.titulo}</h4>
                <span class="data">${noticia.data}</span>
                <p>${noticia.texto}</p>`;
            list.appendChild(div);
        });
    })
    .catch(() => {
        document.getElementById('noticias-list').innerHTML = '<p>Ops! Parece que houve algum erro está impedindo o site de carregar as noticias, mas calma, a Rádio Cidade está trabalhando para resolver!</p>';
    });

// ========= PLACARES MANUAIS =========
const placares = [
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "01/11",
        hora: "16:00",
        time_casa: "Cruzeiro",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg/250px-Cruzeiro_Esporte_Clube_%28logo%29.svg.png",
        gols_casa: 3,
        time_fora: "Vitória",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/3/34/Esporte_Clube_Vit%C3%B3ria_logo.png/120px-Esporte_Clube_Vit%C3%B3ria_logo.png",
        gols_fora: 1
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "01/11",
        hora: "16:00",
        time_casa: "Santos",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Santos_Logo.png/250px-Santos_Logo.png",
        gols_casa: 1,
        time_fora: "Fortaleza",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Fortaleza_EC_2018.png/120px-Fortaleza_EC_2018.png",
        gols_fora: 1
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "01/10",
        hora: "18:00",
        time_casa: "Botafogo",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/250px-Botafogo_de_Futebol_e_Regatas_logo.svg.png",
        gols_casa: 0,
        time_fora: "Mirassol",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/c/ce/Escudo_de_2022_do_Mirassol_Futebol_Clube.png/250px-Escudo_de_2022_do_Mirassol_Futebol_Clube.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "01/11",
        hora: "21:00",
        time_casa: "Flamengo",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_braz_logo.svg/250px-Flamengo_braz_logo.svg.png",
        gols_casa: 3,
        time_fora: "Sport",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/1/17/Sport_Club_do_Recife.png/120px-Sport_Club_do_Recife.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "02/11",
        hora: "16:00",
        time_casa: "Corinthians",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/b/b4/Corinthians_simbolo.png/250px-Corinthians_simbolo.png",
        gols_casa: 1,
        time_fora: "Grêmio",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/250px-Gremio_logo.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "AO VIVO",
        data: "02/11",
        hora: "18:30",
        time_casa: "Internacional",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/SC_Internacional_Brazil_Logo.svg/250px-SC_Internacional_Brazil_Logo.svg.png",
        gols_casa: 0,
        time_fora: "Atlético",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "02/11",
        hora: "20:30",
        time_casa: "São Paulo",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Brasao_do_Sao_Paulo_Futebol_Clube.svg/250px-Brasao_do_Sao_Paulo_Futebol_Clube.svg.png",
        gols_casa: null,
        time_fora: "Vasco",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/8b/EscudoDoVascoDaGama.svg/120px-EscudoDoVascoDaGama.svg.png",
        gols_fora: null
    }
];

// Renderiza os placares na tela (2 colunas)
function renderPlacares() {
    const placaresList = document.getElementById('placares-list');
    if (!placares.length) {
        placaresList.innerHTML = '<div class="loading-placar">Nenhum jogo cadastrado.</div>';
        return;
    }
    placaresList.innerHTML = '';
    placares.forEach(jogo => {
        placaresList.appendChild(placarCard(jogo));
    });
}

function placarCard(jogo) {
    let statusClass = "", statusLabel = "";
    if (jogo.status === "AO VIVO") {
        statusClass = "status-ao-vivo";
        statusLabel = "AO VIVO";
    } else if (jogo.status === "ENCERRADO") {
        statusClass = "status-encerrado";
        statusLabel = "ENCERRADO";
    } else {
        statusClass = "status-a-seguir";
        statusLabel = "A SEGUIR";
    }

    const golsCasa = jogo.gols_casa !== null && jogo.gols_casa !== undefined ? jogo.gols_casa : "-";
    const golsFora = jogo.gols_fora !== null && jogo.gols_fora !== undefined ? jogo.gols_fora : "-";

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

renderPlacares();

/* ======= NOVO: Lazy-load / injeção do widget caster.fm (novoStreamPlayer) ======= */
(function() {
    const PLAYER_SELECTOR = '.cstrEmbed';
    const SCRIPT_SRC = 'https://cdn.cloud.caster.fm/widgets/embed.js';
    let scriptInjected = false;

    function injectCasterScript() {
        if (scriptInjected) return;
        // Protege contra injeção duplicada
        if (document.querySelector('script[src="' + SCRIPT_SRC + '"]')) {
            scriptInjected = true;
            return;
        }
        scriptInjected = true;

        const s = document.createElement('script');
        s.src = SCRIPT_SRC;
        s.async = true;
        s.onload = () => {
            // O widget normalmente inicializa sozinho ao carregar o script.
            // Se for necessário re-renderizar manualmente, adicionar chamadas aqui.
            // console.log('Caster widget carregado');
        };
        s.onerror = () => console.error('Falha ao carregar o widget do caster.fm');
        document.head.appendChild(s);
    }

    // Se o usuário clicar no botão "Carregar player" dentro do player-sp
    const loadBtnSp = document.getElementById('load-player-sp');
    if (loadBtnSp) {
        loadBtnSp.addEventListener('click', () => {
            injectCasterScript();
            loadBtnSp.style.display = 'none';
        });
    }

    // Lazy-load automático quando o player entra na viewport (caso o usuário não clique)
    const playerEmbed = document.querySelector(PLAYER_SELECTOR);
    if (playerEmbed && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    injectCasterScript();
                    observer.disconnect();
                    // esconde botão caso exista
                    if (loadBtnSp) loadBtnSp.style.display = 'none';
                }
            });
        }, { rootMargin: '200px' });
        obs.observe(playerEmbed);
    }
    // Observação: a função injectCasterScript() também é chamada quando o usuário clica no botão SP.
})();
