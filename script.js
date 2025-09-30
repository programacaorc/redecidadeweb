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
        campeonato: "Brasileirão Série B",
        status: "ENCERRADO", // "ENCERRADO", "AO VIVO", "A SEGUIR"
        data: "29/09",
        hora: "19:00",
        time_casa: "Ámérica",
        escudo_casa: "https://irp.cdn-website.com/05448cb5/files/uploaded/afc-escudos-site-branco-1.png",
        gols_casa: 2,
        time_fora: "Volta Redonda",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/b/ba/Volta%C3%A7oFC.png",
        gols_fora: 1
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "30/09",
        hora: "21:30",
        time_casa: "Atlético",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Atletico_mineiro_galo.png/250px-Atletico_mineiro_galo.png",
        gols_casa: null,
        time_fora: "Juventude",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/EC_Juventude.svg/140px-EC_Juventude.svg.png",
        gols_fora: null
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "01/10",
        hora: "19:00",
        time_casa: "Palmeiras",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Palmeiras_logo.svg/250px-Palmeiras_logo.svg.png",
        gols_casa: null,
        time_fora: "Vasco",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/8/8b/EscudoDoVascoDaGama.svg/120px-EscudoDoVascoDaGama.svg.png",
        gols_fora: null
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "01/10",
        hora: "19:00",
        time_casa: "Mirassol",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/c/ce/Escudo_de_2022_do_Mirassol_Futebol_Clube.png/250px-Escudo_de_2022_do_Mirassol_Futebol_Clube.png",
        gols_casa: null,
        time_fora: "Bragantino",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/pt/thumb/9/9e/RedBullBragantino.png/250px-RedBullBragantino.png",
        gols_fora: null
    },
    {
        campeonato: "Brasileirão Série A",
        status: "A SEGUIR",
        data: "01/10",
        hora: "19:00",
        time_casa: "Sport",
        escudo_casa: "https://upload.wikimedia.org/wikipedia/pt/thumb/1/17/Sport_Club_do_Recife.png/120px-Sport_Club_do_Recife.png",
        gols_casa: null,
        time_fora: "Fluminense",
        escudo_fora: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/FFC_crest.svg/250px-FFC_crest.svg.png",
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
