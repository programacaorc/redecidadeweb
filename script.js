// Troca de abas
document.querySelectorAll('nav li').forEach(li => {
    li.addEventListener('click', function() {
        document.querySelectorAll('nav li').forEach(_li => _li.classList.remove('active'));
        li.classList.add('active');
        const section = li.getAttribute('data-section');
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active-section'));
        const target = document.getElementById(section);
        if (target) target.classList.add('active-section');
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

// Carregar notícias do arquivo noticias.json
fetch('noticias.json')
    .then(res => res.json())
    .then(noticias => {
        const list = document.getElementById('noticias-list');
        if (!noticias || !noticias.length) {
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

// Carregar pronunciamentos do arquivo pronunciamentos.json
fetch('pronunciamentos.json')
    .then(res => res.json())
    .then(items => {
        const list = document.getElementById('pronunciamentos-list');
        if (!items || !items.length) {
            list.innerHTML = '<p>Sem pronunciamentos no momento.</p>';
            return;
        }
        list.innerHTML = '';
        items.forEach(item => {
            const container = document.createElement('div');
            container.className = 'pronunciamento';
            container.innerHTML = `
                <span class="badge">${item.badge || 'AVISO'}</span>
                <h3>${item.titulo}</h3>
                <div class="meta"><strong>DATA:</strong> ${item.data} &nbsp;&nbsp; <strong>HORA:</strong> ${item.hora || ''}</div>
                <a href="#" class="saiba" data-id="${item.id}">saiba mais +</a>
                <div class="divider"></div>
                <div class="details">${item.textoDetalhado || ''}</div>
            `;
            // toggle details ao clicar em saiba mais
            const link = container.querySelector('.saiba');
            link.addEventListener('click', function(e){
                e.preventDefault();
                container.classList.toggle('open');
                // rolar para o pronunciamento quando aberto (opcional)
                if (container.classList.contains('open')) container.scrollIntoView({behavior:'smooth', block:'center'});
            });
            list.appendChild(container);
        });
    })
    .catch(err => {
        console.error(err);
        document.getElementById('pronunciamentos-list').innerHTML = '<p>Erro ao carregar pronunciamentos.</p>';
    });