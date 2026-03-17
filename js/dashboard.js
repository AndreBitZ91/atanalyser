// js/dashboard.js
// Estatísticas simples para o Dashboard

async function renderDashboard() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-navy-darker">Dashboard</h2>
      <p class="text-gray-600 mt-1">Visão geral dos teus dados de andebol</p>
    </div>

    <!-- Cards de estatísticas principais -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 uppercase">Campeonatos</h3>
        <p id="stat-campeonatos" class="text-4xl font-bold text-navy-darker mt-2">0</p>
        <p class="text-sm text-gray-500 mt-1">registados</p>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 uppercase">Equipas</h3>
        <p id="stat-equipas" class="text-4xl font-bold text-navy-darker mt-2">0</p>
        <p class="text-sm text-gray-500 mt-1">no total</p>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 uppercase">Atletas</h3>
        <p id="stat-atletas" class="text-4xl font-bold text-navy-darker mt-2">0</p>
        <p class="text-sm text-gray-500 mt-1">registados</p>
      </div>

      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-sm font-medium text-gray-500 uppercase">Jogos</h3>
        <p id="stat-jogos" class="text-4xl font-bold text-navy-darker mt-2">0</p>
        <p class="text-sm text-gray-500 mt-1">agendados/jogados</p>
      </div>
    </div>

    <!-- Secção extra: Últimos eventos de vídeo (últimos 5) -->
    <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 class="text-lg font-semibold text-navy-darker mb-4">Últimos momentos registados em vídeo</h3>
      <div id="ultimos-eventos" class="space-y-3">
        <p class="text-gray-500 text-center py-8">A carregar últimos eventos...</p>
      </div>
    </div>
  `;

  // Carregar estatísticas
  try {
    const campeonatos = await window.DB.getAll('campeonatos');
    const equipas = await window.DB.getAll('equipas');
    const atletas = await window.DB.getAll('atletas');
    const jogos = await window.DB.getAll('jogos');
    const eventos = await window.DB.getAll('eventos_video');

    document.getElementById('stat-campeonatos').textContent = campeonatos.length;
    document.getElementById('stat-equipas').textContent = equipas.length;
    document.getElementById('stat-atletas').textContent = atletas.length;
    document.getElementById('stat-jogos').textContent = jogos.length;

    // Mostrar últimos 5 eventos de vídeo (ordenados por timestamp descendente)
    const ultimosEventosContainer = document.getElementById('ultimos-eventos');
    if (eventos.length === 0) {
      ultimosEventosContainer.innerHTML = '<p class="text-gray-500 text-center py-8">Ainda não há eventos de vídeo registados.</p>';
      return;
    }

    // Ordenar por timestamp descendente e pegar só os 5 mais recentes
    const sortedEventos = eventos
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    ultimosEventosContainer.innerHTML = '';

    const atletasMap = {};
    const atletasList = await window.DB.getAll('atletas');
    atletasList.forEach(a => { atletasMap[a.id] = a.nome || 'Atleta desconhecido'; });

    sortedEventos.forEach(ev => {
      const tempo = formatTime(ev.timestamp);
      const nomeAtleta = atletasMap[ev.atletaId] || '—';
      const nota = ev.nota ? ` (${ev.nota})` : '';

      const div = document.createElement('div');
      div.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200';
      div.innerHTML = `
        <div>
          <span class="font-mono text-sm text-handball-red font-bold">[${tempo}]</span>
          <span class="ml-2 font-medium">${ev.tipo}</span>
          <span class="ml-2 text-gray-600">— ${nomeAtleta}${nota}</span>
        </div>
        <a href="#video?jogoId=${ev.jogoId}" class="text-handball-red hover:underline text-sm">
          Ver vídeo
        </a>
      `;
      ultimosEventosContainer.appendChild(div);
    });
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err);
    main.innerHTML += '<p class="text-red-600 mt-4">Erro ao carregar as estatísticas. Verifica a consola.</p>';
  }
}

// Função auxiliar para formatar tempo (igual à do video.js)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
