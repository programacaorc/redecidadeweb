// ===== SPA Routing por URL amigável =====

// Rotas e IDs das seções
const rotas = {
    "/inicio": "inicio",
    "/ouca": "ouca",
    "/noticias": "noticias",
    "/programacao": "programacao",
    "/quem-somos": "quem-somos"
};

// Função para ativar a seção correta
function navegarParaRota(rota) {
    let secaoId = rotas[rota] || "inicio";
    document.querySelectorAll('nav li').forEach(li => {
        li.classList.toggle('active', li.getAttribute('data-section') === secaoId);
    });
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.toggle('active-section', sec.id === secaoId);
    });
}

// Atualiza a URL e navega
function atualizarRota(rota, addToHistory = true) {
    if (addToHistory) {
        history.pushState(null, '', '/redecidadeweb' + rota);
    }
    navegarParaRota(rota);
}

// Clique nos menus
document.querySelectorAll('nav li').forEach(li => {
    li.addEventListener('click', function () {
        const secaoId = li.getAttribute('data-section');
        const rota = Object.keys(rotas).find(r => rotas[r] === secaoId) || "/inicio";
        atualizarRota(rota);
    });
});

// Ao entrar ou voltar pelo navegador
function inicializarSPA() {
    let rotaAtual = window.location.pathname.replace('/redecidadeweb', '');
    if (!rotas[rotaAtual]) rotaAtual = "/inicio";
    navegarParaRota(rotaAtual);
}
window.addEventListener('popstate', inicializarSPA);

// ===== Troca de player =====
document.getElementById('btn-bh').addEventListener('click', function () {
    document.getElementById('btn-bh').classList.add('active');
    document.getElementById('btn-pa').classList.remove('active');
    document.getElementById('player-bh').classList.add('active');
    document.getElementById('player-pa').classList.remove('active');
});
document.getElementById('btn-pa').addEventListener('click', function () {
    document.getElementById('btn-pa').classList.add('active');
    document.getElementById('btn-bh').classList.remove('active');
    document.getElementById('player-pa').classList.add('active');
    document.getElementById('player-bh').classList.remove('active');
});

// ===== Carregar notícias =====
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
        document.getElementById('noticias-list').innerHTML = '<p>Erro ao carregar notícias.</p>';
    });

// ========= PLACARES MANUAIS =========
const placares = [
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "15/10",
        hora: "19:00",
        time_casa: "Palmeiras",
        escudo_casa: "https://pt.wikipedia.org/wiki/Ficheiro:Palmeiras_logo.svg",
        gols_casa: 5,
        time_fora: "Bragantino",
        escudo_fora: "https://pt.wikipedia.org/wiki/Ficheiro:RedBullBragantino.png",
        gols_fora: 1
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "15/10",
        hora: "19:30",
        time_casa: "Botafogo",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/250px-Botafogo_de_Futebol_e_Regatas_logo.svg.png",
        gols_casa: 0,
        time_fora: "Flamengo",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_braz_logo.svg/250px-Flamengo_braz_logo.svg.png",
        gols_fora: 3
    },
    {
        campeonato: "Brasileirão Série A",
        status: "AO VIVO",
        data: "15/10",
        hora: "20:00",
        time_casa: "Mirassol EC",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/c/ce/Escudo_de_2022_do_Mirassol_Futebol_Clube.png/250px-Escudo_de_2022_do_Mirassol_Futebol_Clube.png",
        gols_casa: 2,
        time_fora: "SC Internacional",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/SC_Internacional_Brazil_Logo.svg/250px-SC_Internacional_Brazil_Logo.svg.png",
        gols_fora: 1
    },
    {
        campeonato: "Brasileirão Série A",
        status: "AO VIVO",
        data: "15/10",
        hora: "20:00",
        time_casa: "Sport",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/1/17/Sport_Club_do_Recife.png/120px-Sport_Club_do_Recife.png",
        gols_casa: 0,
        time_fora: "Ceará",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Cear%C3%A1_Sporting_Club_logo.svg/120px-Cear%C3%A1_Sporting_Club_logo.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "15/10",
        hora: "21:30",
        time_casa: "Atlético MG",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_casa: null,
        time_fora: "Cruzeiro",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Cruzeiro_Esporte_Clube_%28logo%29.svg/250px-Cruzeiro_Esporte_Clube_%28logo%29.svg.png",
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

// Inicialização
renderPlacares();
inicializarSPA();
