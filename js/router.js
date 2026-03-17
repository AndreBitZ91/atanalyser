// js/router.js
// Router simples baseado em hash – agora com todas as secções ligadas

// Importa as funções de render (elas vêm dos outros ficheiros)
async function renderDashboard() {
  document.getElementById('main-content').innerHTML = `
    <h2 class="text-2xl font-bold text-navy-darker mb-6">Dashboard</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-lg font-semibold mb-2">Bem-vindo ao Handball Analytics</h3>
        <p class="text-gray-600">Começa por criar um campeonato ou adicionar equipas.</p>
      </div>
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-lg font-semibold mb-2">Em desenvolvimento</h3>
        <p class="text-gray-600">Estatísticas, gráficos e resumos virão em breve.</p>
      </div>
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-lg font-semibold mb-2">Dica rápida</h3>
        <p class="text-gray-600">Usa o botão "Exportar/Importar" para fazer backup dos teus dados.</p>
      </div>
    </div>
  `;
}

const routes = {
  '#dashboard':     () => renderDashboard(),
  '#campeonatos':   () => renderCampeonatos(),
  '#equipas':       () => renderEquipas(),
  '#atletas':       () => renderAtletas(),
  '#jogos':         () => renderJogos(),
  '#video':         () => renderVideo(),
  '#io':            () => renderIO()
};

function renderCurrentRoute() {
  const hash = window.location.hash || '#dashboard';
  const renderFn = routes[hash] || routes['#dashboard'];

  if (renderFn) {
    renderFn();
  } else {
    document.getElementById('main-content').innerHTML = `
      <div class="text-center py-12">
        <h2 class="text-2xl font-bold text-red-600">Página não encontrada</h2>
        <p class="mt-4 text-gray-600">A rota <strong>${hash}</strong> não está disponível.</p>
      </div>
    `;
  }
}

function navigate(hash) {
  window.location.hash = hash.startsWith('#') ? hash : '#' + hash;
}

// Eventos
window.addEventListener('hashchange', renderCurrentRoute);
window.addEventListener('load', () => {
  if (!window.location.hash) {
    navigate('dashboard');
  }
  renderCurrentRoute();
});

// Exposição global (para ser usado em botões como "Ver Atletas" ou "Analisar Vídeo")
window.Router = { navigate };

console.log("Router carregado – todas as secções devem funcionar agora");
