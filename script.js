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
        status: "AO VIVO",
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
        status: "A SEGUIR",
        data: "18/11",
        hora: "16:30",
        time_casa: "Brasil",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Brazilian_Football_Confederation_logo.svg/150px-Brazilian_Football_Confederation_logo.svg.png",
        gols_casa: null,
        time_fora: "Tunísia",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/88/F%C3%A9d%C3%A9ration_Tunisienne_de_Football.png/250px-F%C3%A9d%C3%A9ration_Tunisienne_de_Football.png",
        gols_fora: null
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
