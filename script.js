document.addEventListener('DOMContentLoaded', () => {
  const noticiasList = document.getElementById('noticias-list');

  // Função para carregar as notícias de noticias.json
  function loadNoticias() {
    fetch('noticias.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Erro ao carregar notícias: ${response.status}`);
        }
        return response.json();
      })
      .then(noticias => {
        noticiasList.innerHTML = ''; // Limpa a lista antes de renderizar
        noticias.forEach(noticia => {
          const article = document.createElement('article');
          article.classList.add('noticia');
          article.innerHTML = `
            <h4>${noticia.titulo}</h4>
            <span class="data">${noticia.data} • <small style="color:#ffd369">${noticia.categoria}</small></span>
            <div class="news-info">${noticia.texto}</div>
          `;
          noticiasList.appendChild(article);
        });
      })
      .catch(error => {
        console.error('Erro ao carregar ou processar notícias:', error);
        noticiasList.innerHTML = '<p>Não foi possível carregar as notícias no momento. Tente novamente mais tarde.</p>';
      });
  }

  // Carrega as notícias ao iniciar a página
  loadNoticias();
});