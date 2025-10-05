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
        campeonato: "Brasileirão Série B",
        status: "ENCERRADO",
        data: "04/10",
        hora: "18:30",
        time_casa: "Internacional",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Escudo_do_Sport_Club_Internacional.svg",
        gols_casa: 2,
        time_fora: "Botafogo",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/250px-Botafogo_de_Futebol_e_Regatas_logo.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "04/10",
        hora: "18:30",
        time_casa: "Fluminense",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/FFC_crest.svg/250px-FFC_crest.svg.png",
        gols_casa: 3,
        time_fora: "Atlético",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "ENCERRADO",
        data: "04/10",
        hora: "18:30",
        time_casa: "Bragantino",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/9/9e/RedBullBragantino.png/250px-RedBullBragantino.png",
        gols_casa: 1,
        time_fora: "Grêmio",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Gremio_logo.svg/250px-Gremio_logo.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "AO VIVO",
        data: "04/10",
        hora: "21:00",
        time_casa: "Corinthians",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/b/b4/Corinthians_simbolo.png/250px-Corinthians_simbolo.png",
        gols_casa: 1,
        time_fora: "Mirassol",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/c/ce/Escudo_de_2022_do_Mirassol_Futebol_Clube.png/250px-Escudo_de_2022_do_Mirassol_Futebol_Clube.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "05/10",
        hora: "16:00",
        time_casa: "Vasco",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/8b/EscudoDoVascoDaGama.svg/120px-EscudoDoVascoDaGama.svg.png",
        gols_casa: null,
        time_fora: "Vitória",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/3/34/Esporte_Clube_Vit%C3%B3ria_logo.png/120px-Esporte_Clube_Vit%C3%B3ria_logo.png",
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
