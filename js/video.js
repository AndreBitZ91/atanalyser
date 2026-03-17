// js/video.js
// Análise de vídeo - tagging de eventos por timestamp

async function renderVideo() {
  const main = document.getElementById('main-content');
  if (!main) return;

  // Ler parâmetro da hash: #video?jogoId=5
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const jogoId = params.get('jogoId') ? Number(params.get('jogoId')) : null;

  if (!jogoId) {
    main.innerHTML = `
      <div class="text-center py-12 text-gray-600">
        <h2 class="text-2xl font-bold mb-4">Nenhum jogo seleccionado</h2>
        <p>Volte à lista de jogos e clique em "Analisar Vídeo".</p>
      </div>`;
    return;
  }

  // Carregar dados do jogo
  const jogo = await window.DB.get('jogos', jogoId);
  if (!jogo) {
    main.innerHTML = '<div class="text-center py-12 text-red-600">Jogo não encontrado.</div>';
    return;
  }

  const equipaCasa = await window.DB.get('equipas', jogo.equipaCasaId);
  const equipaFora = await window.DB.get('equipas', jogo.equipaForaId);

  const nomeCasa = equipaCasa?.nome || '—';
  const nomeFora = equipaFora?.nome || '—';
  const dataJogo = jogo.data ? new Date(jogo.data).toLocaleString('pt-PT', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  main.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-navy-darker">Análise de Vídeo</h2>
      <p class="text-gray-600 mt-1">
        ${nomeCasa} vs ${nomeFora} • ${dataJogo}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      <!-- ESQUERDA: Player de vídeo -->
      <div class="flex flex-col bg-black rounded-lg overflow-hidden shadow-lg">
        <div class="relative flex-1">
          <video id="video-player" class="w-full h-full object-contain" controls></video>
          <div id="no-video-overlay" class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
            <p class="text-xl mb-6">Nenhum vídeo carregado</p>
            <label class="px-6 py-3 bg-handball-red text-white rounded-lg cursor-pointer hover:bg-red-700 transition">
              📁 Carregar Vídeo
              <input type="file" id="video-file-input" accept="video/*" class="hidden">
            </label>
          </div>
        </div>
      </div>

      <!-- DIREITA: Painel de tagging -->
      <div class="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-navy-darker">Registar Evento</h3>
        </div>

        <div class="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Evento</label>
            <select id="tipo-evento" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
              <option value="Golo">Golo</option>
              <option value="Falta">Falta</option>
              <option value="Remate">Remate</option>
              <option value="Intercepção">Intercepção</option>
              <option value="2 Minutos">2 Minutos</option>
              <option value="Livre">Livre</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Atleta</label>
            <select id="atleta-select" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nota (opcional)</label>
            <textarea id="nota-evento" rows="2" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red"></textarea>
          </div>

          <button id="btn-registar-momento" 
                  class="w-full px-6 py-3 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled>
            📌 Registar Momento (${formatTime(0)})
          </button>
        </div>

        <!-- Timeline de eventos -->
        <div class="p-6 border-t border-gray-200 bg-gray-50">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Eventos registados</h4>
          <div id="timeline-eventos" class="space-y-2 max-h-64 overflow-y-auto"></div>
        </div>
      </div>
    </div>
  `;

  // ──────────────────────────────────────────────
  // Inicialização
  // ──────────────────────────────────────────────

  const video = document.getElementById('video-player');
  const overlay = document.getElementById('no-video-overlay');
  const btnRegistar = document.getElementById('btn-registar-momento');

  // Carregar vídeo do ficheiro local
  document.getElementById('video-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
    overlay.classList.add('hidden');

    // Activar botão quando vídeo estiver pronto
    video.onloadedmetadata = () => {
      btnRegistar.disabled = false;
    };
  });

  // Actualizar tempo no botão em tempo real
  video.addEventListener('timeupdate', () => {
    btnRegistar.textContent = `📌 Registar Momento (${formatTime(video.currentTime)})`;
  });

  // Carregar atletas das duas equipas
  await loadAtletasIntoSelect(jogo.equipaCasaId, jogo.equipaForaId);

  // Carregar eventos existentes
  await renderTimeline(jogoId, video);

  // Registar novo evento
  btnRegistar.addEventListener('click', async () => {
    const tipo = document.getElementById('tipo-evento').value;
    const atletaId = document.getElementById('atleta-select').value;
    const nota = document.getElementById('nota-evento').value.trim();

    if (!tipo || !atletaId) {
      alert('Seleccione o tipo de evento e o atleta.');
      return;
    }

    const evento = {
      jogoId: jogoId,
      timestamp: video.currentTime,
      tipo,
      atletaId: Number(atletaId),
      nota
    };

    await window.DB.add('eventos_video', evento);
    await renderTimeline(jogoId, video);

    // Limpar formulário (opcional)
    document.getElementById('tipo-evento').value = '';
    document.getElementById('atleta-select').value = '';
    document.getElementById('nota-evento').value = '';
  });
}

// ──────────────────────────────────────────────
// Funções auxiliares
// ──────────────────────────────────────────────

async function loadAtletasIntoSelect(equipaCasaId, equipaForaId) {
  const select = document.getElementById('atleta-select');
  select.innerHTML = '<option value="">Seleccione...</option>';

  const atletas = await window.DB.getAll('atletas');

  const atletasCasa = atletas.filter(a => a.equipaId == equipaCasaId);
  const atletasFora = atletas.filter(a => a.equipaId == equipaForaId);

  if (atletasCasa.length > 0) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = 'Equipa da Casa';
    atletasCasa.forEach(a => {
      const opt = new Option(`${a.numero ? a.numero + ' - ' : ''}${a.nome}`, a.id);
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  }

  if (atletasFora.length > 0) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = 'Equipa de Fora';
    atletasFora.forEach(a => {
      const opt = new Option(`${a.numero ? a.numero + ' - ' : ''}${a.nome}`, a.id);
      optgroup.appendChild(opt);
    });
    select.appendChild(optgroup);
  }
}

async function renderTimeline(jogoId, video) {
  const container = document.getElementById('timeline-eventos');
  if (!container) return;

  let eventos = await window.DB.getAll('eventos_video');
  eventos = eventos
    .filter(ev => ev.jogoId === jogoId)
    .sort((a, b) => a.timestamp - b.timestamp);

  container.innerHTML = '';

  if (eventos.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 py-4">Ainda não há eventos registados.</p>';
    return;
  }

  const atletas = await window.DB.getAll('atletas');
  const mapAtletas = Object.fromEntries(atletas.map(a => [a.id, a.nome || '—']));

  eventos.forEach(ev => {
    const tempo = formatTime(ev.timestamp);
    const nomeAtleta = mapAtletas[ev.atletaId] || '—';
    const notaTexto = ev.nota ? ` — ${ev.nota}` : '';

    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group';
    div.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="font-mono text-sm font-bold text-handball-red">[${tempo}]</span>
        <span class="font-medium">${ev.tipo}</span>
        <span class="text-gray-600">— ${nomeAtleta}${notaTexto}</span>
      </div>
      <button class="text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition btn-delete-evento" data-id="${ev.id}">
        Eliminar
      </button>
    `;

    // Seek ao clicar na linha
    div.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-delete-evento')) {
        video.currentTime = ev.timestamp;
        video.play().catch(() => {});
      }
    });

    // Eliminar evento
    div.querySelector('.btn-delete-evento').addEventListener('click', async () => {
      if (confirm('Eliminar este evento?')) {
        await window.DB.delete('eventos_video', ev.id);
        await renderTimeline(jogoId, video);
      }
    });

    container.appendChild(div);
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
