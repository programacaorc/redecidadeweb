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

// Troca de player
document.getElementById('btn-bh').addEventListener('click', function() {
    document.getElementById('btn-bh').classList.add('active');
    document.getElementById('btn-pa').classList.remove('active');
    document.getElementById('player-bh').classList.add('active');
    document.getElementById('player-pa').classList.remove('active');
});
document.getElementById('btn-pa').addEventListener('click', function() {
    document.getElementById('btn-pa').classList.add('active');
    document.getElementById('btn-bh').classList.remove('active');
    document.getElementById('player-pa').classList.add('active');
    document.getElementById('player-bh').classList.remove('active');
});

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
        document.getElementById('noticias-list').innerHTML = '<p>Erro ao carregar notícias.</p>';
    });


// ========= PLACARES MANUAIS =========
const placares = [
    {
        campeonato: "Copa Sul-Americana",
        status: "ENCERRADO",
        data: "21/10",
        hora: "21:30",
        time_casa: "Del Vale",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Escudoindependientedelvalle2023.png/250px-Escudoindependientedelvalle2023.png",
        gols_casa: 1,
        time_fora: "Atlético",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_fora: 1
    },
    {
        campeonato: "Copa Libertadores",
        status: "ENCERRADO",
        data: "22/10",
        hora: "21:30",
        time_casa: "FLAMENGO",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Flamengo_braz_logo.svg/250px-Flamengo_braz_logo.svg.png",
        gols_casa: 1,
        time_fora: "RACING",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Escudo_de_Racing_Club_%282014%29.svg/120px-Escudo_de_Racing_Club_%282014%29.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Copa Libertadores",
        status: "AO VIVO",
        data: "23/10",
        hora: "21:30",
        time_casa: "LDU Quito",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Liga_de_Quito_deportiva.png/250px-Liga_de_Quito_deportiva.png",
        gols_casa: 2,
        time_fora: "Palmeiras",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/250px-Palmeiras_logo.svg.png",
        gols_fora: 0
    },
    {
        campeonato: "Brasileirão",
        status: "ENCERRADO",
        data: "22/10",
        hora: "19:00",
        time_casa: "Bahia",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/9/90/ECBahia.png/250px-ECBahia.png",
        gols_casa: 1,
        time_fora: "Internacional",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Escudo_do_Sport_Club_Internacional.svg/960px-Escudo_do_Sport_Club_Internacional.svg.png",
        gols_fora: 0
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
