// js/router.js
// Router simples baseado em hash para Handball Analytics

const routes = {
  '#dashboard':     () => { /* placeholder */ document.getElementById('main-content').innerHTML = '<h2 class="text-2xl font-bold">Dashboard (em desenvolvimento)</h2>'; },
  '#campeonatos':   () => renderCampeonatos(),
  '#equipas':       () => { /* placeholder */ document.getElementById('main-content').innerHTML = '<h2 class="text-2xl font-bold">Equipas (em desenvolvimento)</h2>'; },
  '#atletas':       () => { /* placeholder */ document.getElementById('main-content').innerHTML = '<h2 class="text-2xl font-bold">Atletas (em desenvolvimento)</h2>'; },
  '#jogos':         () => { /* placeholder */ document.getElementById('main-content').innerHTML = '<h2 class="text-2xl font-bold">Jogos (em desenvolvimento)</h2>'; },
  '#video':         () => { /* placeholder */ document.getElementById('main-content').innerHTML = '<h2 class="text-2xl font-bold">Análise de Vídeo (em desenvolvimento)</h2>'; },
  '#io':            () => { /* placeholder */ document.getElementById('main-content').innerHTML = '<h2 class="text-2xl font-bold">Exportar/Importar (em desenvolvimento)</h2>'; }
};

function renderCurrentRoute() {
  const hash = window.location.hash || '#campeonatos';
  const renderFn = routes[hash] || routes['#campeonatos'];
  renderFn();
}

function navigate(hash) {
  if (hash.startsWith('#')) {
    window.location.hash = hash;
  } else {
    window.location.hash = '#' + hash;
  }
}

// Inicialização
window.addEventListener('hashchange', renderCurrentRoute);
window.addEventListener('load', () => {
  // Se não houver hash, força o default
  if (!window.location.hash) {
    navigate('campeonatos');
  } else {
    renderCurrentRoute();
  }
});

// Exposição global
window.Router = {
  navigate
};

console.log("Router inicializado ✓");
