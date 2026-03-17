// js/video.js
// Análise de Vídeo - com criação de clipes (Z = início, X = fim + etiquetar)

async function renderVideo() {
  const main = document.getElementById('main-content');
  if (!main) return;

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
      <!-- ESQUERDA: Player + controles de clipe -->
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

        <!-- Controles de clipe -->
        <div class="p-4 bg-gray-900 text-white flex justify-around text-sm">
          <div class="text-center">
            <kbd class="px-3 py-1 bg-gray-700 rounded">Z</kbd>
            <p>Início do clipe</p>
            <p id="clip-start-display" class="font-mono mt-1">--:--.--</p>
          </div>
          <div class="text-center">
            <kbd class="px-3 py-1 bg-gray-700 rounded">X</kbd>
            <p>Fim do clipe + Etiquetar</p>
            <p id="clip-end-display" class="font-mono mt-1">--:--.--</p>
          </div>
        </div>
      </div>

      <!-- DIREITA: Painel de tagging + form de clipe -->
      <div class="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-navy-darker">Registar Evento / Clipe</h3>
        </div>

        <div class="p-6 space-y-6 flex-1 overflow-y-auto">
          <!-- Form para clipe (aparece quando X é pressionado) -->
          <div id="form-clipe" class="hidden bg-yellow-50 p-5 rounded-lg border border-yellow-200">
            <h4 class="font-medium mb-4">Novo Clipe [ <span id="clipe-tempo"></span> ]</h4>
            <form id="form-clipe-submit">
              <input type="hidden" id="clipe-start" value="">
              <input type="hidden" id="clipe-end" value="">

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                <select id="tipo-clipe" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
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

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Atleta</label>
                <select id="atleta-clipe" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">Seleccione...</option>
                </select>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Nota / Descrição</label>
                <textarea id="nota-clipe" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
              </div>

              <div class="flex gap-3">
                <button type="submit" class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700">Guardar Clipe</button>
                <button type="button" id="btn-cancelar-clipe" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400">Cancelar</button>
              </div>
            </form>
          </div>

          <!-- Timeline de eventos existentes -->
          <div>
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Eventos / Clipes registados</h4>
            <div id="timeline-eventos" class="space-y-2 max-h-64 overflow-y-auto"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const video = document.getElementById('video-player');
  const overlay = document.getElementById('no-video-overlay');
  const clipStartDisplay = document.getElementById('clip-start-display');
  const clipEndDisplay = document.getElementById('clip-end-display');
  const formClipe = document.getElementById('form-clipe');

  let clipStart = null;

  // Carregar vídeo local
  document.getElementById('video-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
    overlay.classList.add('hidden');
  });

  // Teclas Z e X
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'z' && video.src) {
      clipStart = video.currentTime;
      clipStartDisplay.textContent = formatTime(clipStart);
      clipEndDisplay.textContent = '--:--.--';
      e.preventDefault();
    }

    if (e.key.toLowerCase() === 'x' && video.src && clipStart !== null) {
      const clipEnd = video.currentTime;
      if (clipEnd <= clipStart) {
        alert('O fim do clipe deve ser depois do início.');
        return;
      }

      clipEndDisplay.textContent = formatTime(clipEnd);

      // Mostrar e preencher form de clipe
      formClipe.classList.remove('hidden');
      document.getElementById('clipe-tempo').textContent = `${formatTime(clipStart)} → ${formatTime(clipEnd)}`;
      document.getElementById('clipe-start').value = clipStart;
      document.getElementById('clipe-end').value = clipEnd;

      // Reset para próximo clipe
      clipStart = null;
      clipStartDisplay.textContent = '--:--.--';
      clipEndDisplay.textContent = '--:--.--';

      e.preventDefault();
    }
  });

  // Carregar atletas
  await loadAtletasIntoSelect(jogo.equipaCasaId, jogo.equipaForaId);

  // Carregar timeline
  await renderTimeline(jogoId, video);

  // Guardar clipe
  document.getElementById('form-clipe-submit').addEventListener('submit', async (e) => {
    e.preventDefault();

    const start = Number(document.getElementById('clipe-start').value);
    const end = Number(document.getElementById('clipe-end').value);
    const tipo = document.getElementById('tipo-clipe').value;
    const atletaId = Number(document.getElementById('atleta-clipe').value);
    const nota = document.getElementById('nota-clipe').value.trim();

    if (!tipo || !atletaId || isNaN(start) || isNaN(end) || start >= end) {
      alert('Preencha todos os campos e verifique os tempos.');
      return;
    }

    const evento = {
      jogoId,
      startTime: start,
      endTime: end,
      tipo,
      atletaId,
      nota,
      timestamp: start  // para compatibilidade com timeline antiga
    };

    await window.DB.add('eventos_video', evento);
    formClipe.classList.add('hidden');
    await renderTimeline(jogoId, video);

    // Limpar form
    document.getElementById('tipo-clipe').value = '';
    document.getElementById('atleta-clipe').value = '';
    document.getElementById('nota-clipe').value = '';
  });

  // Cancelar form clipe
  document.getElementById('btn-cancelar-clipe').addEventListener('click', () => {
    formClipe.classList.add('hidden');
    clipStart = null;
    clipStartDisplay.textContent = '--:--.--';
    clipEndDisplay.textContent = '--:--.--';
  });
}

// Carregar atletas no select
async function loadAtletasIntoSelect(equipaCasaId, equipaForaId) {
  const select = document.getElementById('atleta-clipe');
  select.innerHTML = '<option value="">Seleccione...</option>';

  const atletas = await window.DB.getAll('atletas');
  const atletasCasa = atletas.filter(a => a.equipaId == equipaCasaId);
  const atletasFora = atletas.filter(a => a.equipaId == equipaForaId);

  if (atletasCasa.length) {
    const group = document.createElement('optgroup');
    group.label = 'Equipa da Casa';
    atletasCasa.forEach(a => group.appendChild(new Option(`${a.numero || ''} - ${a.nome}`, a.id)));
    select.appendChild(group);
  }

  if (atletasFora.length) {
    const group = document.createElement('optgroup');
    group.label = 'Equipa de Fora';
    atletasFora.forEach(a => group.appendChild(new Option(`${a.numero || ''} - ${a.nome}`, a.id)));
    select.appendChild(group);
  }
}

// Renderizar timeline (agora suporta clipes com intervalo)
async function renderTimeline(jogoId, video) {
  const container = document.getElementById('timeline-eventos');
  container.innerHTML = '';

  let eventos = await window.DB.getAll('eventos_video');
  eventos = eventos.filter(ev => ev.jogoId === jogoId)
                   .sort((a, b) => a.timestamp - b.timestamp);

  if (eventos.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Ainda não há eventos ou clipes registados.</p>';
    return;
  }

  const atletas = await window.DB.getAll('atletas');
  const mapAtletas = Object.fromEntries(atletas.map(a => [a.id, a.nome || '—']));

  eventos.forEach(ev => {
    const tempo = ev.endTime !== undefined
      ? `${formatTime(ev.startTime)} → ${formatTime(ev.endTime)}`
      : formatTime(ev.timestamp);

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

    div.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-delete-evento')) {
        video.currentTime = ev.startTime || ev.timestamp;
        video.play().catch(() => {});
      }
    });

    div.querySelector('.btn-delete-evento').addEventListener('click', async () => {
      if (confirm('Eliminar este evento/clipe?')) {
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
