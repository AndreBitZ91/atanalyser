// js/jogos.js
// Gestão de jogos com filtro por campeonato e ligação dinâmica de equipas

async function renderJogos() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-navy-darker">Jogos</h2>
      <button id="btn-novo-jogo" 
              class="px-4 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium">
        + Novo Jogo
      </button>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Campeonato</label>
      <select id="filtro-campeonato-jogo" class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
        <option value="">Todos os campeonatos</option>
      </select>
    </div>

    <div id="form-jogo" class="hidden bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h3 class="text-lg font-semibold mb-4" id="form-title-jogo">Novo Jogo</h3>
      <form id="form-jogo-submit">
        <input type="hidden" id="edit-id-jogo" value="">

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Campeonato</label>
            <select id="campeonatoId-jogo" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Equipa Casa</label>
            <select id="equipaCasaId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Equipa Fora</label>
            <select id="equipaForaId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
            <input type="datetime-local" id="data" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Local</label>
            <input type="text" id="local" placeholder="ex: Pavilhão Multiusos de Odivelas" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Golos Casa</label>
              <input type="number" id="golosCasa" min="0" step="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Golos Fora</label>
              <input type="number" id="golosFora" min="0" step="1" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
            </div>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button type="submit" class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition">Guardar</button>
          <button type="button" id="btn-cancelar-jogo" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipa Casa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipa Fora</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody id="jogos-tbody" class="bg-white divide-y divide-gray-200"></tbody>
      </table>
    </div>
  `;

  await loadCampeonatosForJogoSelects();
  await loadAndRenderJogosTable();

  // Eventos
  document.getElementById('btn-novo-jogo').addEventListener('click', showNewJogoForm);
  document.getElementById('btn-cancelar-jogo').addEventListener('click', hideJogoForm);
  document.getElementById('form-jogo-submit').addEventListener('submit', handleJogoFormSubmit);

  document.getElementById('filtro-campeonato-jogo').addEventListener('change', loadAndRenderJogosTable);

  // Atualiza as opções de equipas quando o campeonato muda no formulário
  document.getElementById('campeonatoId-jogo').addEventListener('change', async (e) => {
    await updateEquipasSelects(e.target.value);
  });
}

async function loadCampeonatosForJogoSelects() {
  const campeonatos = await window.DB.getAll('campeonatos');
  const selectFiltro = document.getElementById('filtro-campeonato-jogo');
  const selectForm   = document.getElementById('campeonatoId-jogo');

  campeonatos.forEach(c => {
    const opt = new Option(`${c.nome} (${c.epoca || '?'})`, c.id);
    selectFiltro.appendChild(opt.cloneNode(true));
    selectForm.appendChild(opt);
  });
}

async function updateEquipasSelects(campeonatoId) {
  const casaSelect = document.getElementById('equipaCasaId');
  const foraSelect = document.getElementById('equipaForaId');

  casaSelect.innerHTML = '<option value="">Seleccione...</option>';
  foraSelect.innerHTML = '<option value="">Seleccione...</option>';

  if (!campeonatoId) return;

  const equipas = await window.DB.getAll('equipas');
  const equipasFiltradas = equipas.filter(e => e.campeonatoId == campeonatoId);

  equipasFiltradas.forEach(e => {
    const opt = new Option(`${e.nome} (${e.escalao || '?'})`, e.id);
    casaSelect.appendChild(opt.cloneNode(true));
    foraSelect.appendChild(opt);
  });
}

async function loadAndRenderJogosTable() {
  const tbody = document.getElementById('jogos-tbody');
  if (!tbody) return;

  const filtroCampeonato = document.getElementById('filtro-campeonato-jogo')?.value || '';

  let jogos = await window.DB.getAll('jogos');
  if (filtroCampeonato) {
    jogos = jogos.filter(j => j.campeonatoId == filtroCampeonato);
  }

  tbody.innerHTML = '';

  if (jogos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">Nenhum jogo encontrado.</td></tr>`;
    return;
  }

  const equipas = await window.DB.getAll('equipas');
  const mapEquipas = Object.fromEntries(equipas.map(e => [e.id, e.nome]));

  jogos.forEach(j => {
    const dataFormatada = j.data ? new Date(j.data).toLocaleString('pt-PT', {
      dateStyle: 'short',
      timeStyle: 'short'
    }) : '—';

    const resultado = (j.golosCasa !== undefined && j.golosFora !== undefined)
      ? `${j.golosCasa} - ${j.golosFora}`
      : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataFormatada}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${mapEquipas[j.equipaCasaId] || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${mapEquipas[j.equipaForaId] || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">${resultado}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${j.local || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3 btn-edit-jogo" data-id="${j.id}">Editar</button>
        <button class="text-green-600 hover:text-green-900 mr-3 btn-analisar-video" data-id="${j.id}">Analisar Vídeo</button>
        <button class="text-red-600 hover:text-red-900 btn-delete-jogo" data-id="${j.id}">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.classList.contains('btn-edit-jogo')) {
      await editJogo(id);
    } else if (btn.classList.contains('btn-delete-jogo')) {
      if (confirm('Tem a certeza que deseja eliminar este jogo?')) {
        await window.DB.delete('jogos', id);
        await loadAndRenderJogosTable();
      }
    } else if (btn.classList.contains('btn-analisar-video')) {
      window.Router.navigate(`video?jogoId=${id}`);
    }
  });
}

function showNewJogoForm() {
  const form = document.getElementById('form-jogo');
  form.classList.remove('hidden');
  document.getElementById('form-title-jogo').textContent = 'Novo Jogo';
  document.getElementById('edit-id-jogo').value = '';
  document.getElementById('campeonatoId-jogo').value = '';
  document.getElementById('equipaCasaId').innerHTML = '<option value="">Seleccione...</option>';
  document.getElementById('equipaForaId').innerHTML = '<option value="">Seleccione...</option>';
  document.getElementById('data').value = '';
  document.getElementById('local').value = '';
  document.getElementById('golosCasa').value = '';
  document.getElementById('golosFora').value = '';
}

function hideJogoForm() {
  document.getElementById('form-jogo').classList.add('hidden');
}

async function editJogo(id) {
  const jogo = await window.DB.get('jogos', id);
  if (!jogo) return;

  const form = document.getElementById('form-jogo');
  form.classList.remove('hidden');

  document.getElementById('form-title-jogo').textContent = 'Editar Jogo';
  document.getElementById('edit-id-jogo').value = jogo.id;
  document.getElementById('campeonatoId-jogo').value = jogo.campeonatoId || '';

  // Carregar equipas do campeonato selecionado
  await updateEquipasSelects(jogo.campeonatoId);
  document.getElementById('equipaCasaId').value = jogo.equipaCasaId || '';
  document.getElementById('equipaForaId').value = jogo.equipaForaId || '';

  document.getElementById('data').value = jogo.data ? jogo.data.slice(0, 16) : '';
  document.getElementById('local').value = jogo.local || '';
  document.getElementById('golosCasa').value = jogo.golosCasa ?? '';
  document.getElementById('golosFora').value = jogo.golosFora ?? '';
}

async function handleJogoFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id-jogo').value;
  const data = {
    campeonatoId: Number(document.getElementById('campeonatoId-jogo').value),
    equipaCasaId: Number(document.getElementById('equipaCasaId').value),
    equipaForaId: Number(document.getElementById('equipaForaId').value),
    data: document.getElementById('data').value,
    local: document.getElementById('local').value.trim(),
    golosCasa: document.getElementById('golosCasa').value !== '' ? Number(document.getElementById('golosCasa').value) : undefined,
    golosFora: document.getElementById('golosFora').value !== '' ? Number(document.getElementById('golosFora').value) : undefined
  };

  if (!data.campeonatoId || !data.equipaCasaId || !data.equipaForaId || !data.data) {
    alert('Preencha os campos obrigatórios: Campeonato, Equipas e Data.');
    return;
  }

  if (id) {
    data.id = Number(id);
    await window.DB.update('jogos', data);
  } else {
    await window.DB.add('jogos', data);
  }

  hideJogoForm();
  await loadAndRenderJogosTable();
}
