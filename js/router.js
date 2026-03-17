// js/router.js
// Router simples baseado em hash – com dashboard incluído

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

window.addEventListener('hashchange', renderCurrentRoute);
window.addEventListener('load', () => {
  if (!window.location.hash) {
    navigate('dashboard');
  }
  renderCurrentRoute();
});

window.Router = { navigate };

console.log("Router carregado – dashboard com estatísticas incluído");
