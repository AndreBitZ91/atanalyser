// js/router.js
// Router simples baseado em hash – com debug para análise de vídeo

const routes = {
  '#dashboard':     () => renderDashboard(),
  '#campeonatos':   () => renderCampeonatos(),
  '#equipas':       () => renderEquipas(),
  '#jogos':         () => renderJogos(),
  '#video':         () => {
    console.log('Tentando renderizar Análise de Vídeo');
    renderVideo();
  },
  '#io':            () => renderIO()
};

function renderCurrentRoute() {
  const hash = window.location.hash || '#dashboard';
  console.log('Mudança de rota detectada:', hash);

  const renderFn = routes[hash] || routes['#dashboard'];

  if (renderFn) {
    try {
      renderFn();
    } catch (err) {
      console.error('Erro ao renderizar rota', hash, err);
      document.getElementById('main-content').innerHTML = `
        <div class="text-center py-12">
          <h2 class="text-2xl font-bold text-red-600">Erro na página</h2>
          <p class="mt-4 text-gray-600">Ocorreu um erro ao carregar esta secção. Verifica a consola (F12).</p>
        </div>
      `;
    }
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
  console.log('Navegando para:', hash);
  window.location.hash = hash.startsWith('#') ? hash : '#' + hash;
}

window.addEventListener('hashchange', renderCurrentRoute);
window.addEventListener('load', () => {
  console.log('Página carregada – rota inicial:', window.location.hash || '#dashboard');
  if (!window.location.hash) {
    navigate('dashboard');
  }
  renderCurrentRoute();
});

window.Router = { navigate };

console.log("Router carregado com sucesso");
