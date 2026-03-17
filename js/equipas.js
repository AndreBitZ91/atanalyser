// js/equipas.js
// Gestão de equipas + gestão inline de atletas por equipa

async function renderEquipas() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-navy-darker">Equipas</h2>
      <button id="btn-nova-equipa" 
              class="px-4 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium">
        + Nova Equipa
      </button>
    </div>

    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">Filtrar por Campeonato</label>
      <select id="filtro-campeonato" class="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
        <option value="">Todos os campeonatos</option>
      </select>
    </div>

    <div id="form-equipa" class="hidden bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h3 class="text-lg font-semibold mb-4" id="form-title-equipa">Nova Equipa</h3>
      <form id="form-equipa-submit">
        <input type="hidden" id="edit-id-equipa" value="">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Equipa</label>
            <input type="text" id="nome-equipa" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Escalão</label>
            <input type="text" id="escalao" placeholder="ex: Sub-18, Sénior Feminino" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Campeonato</label>
            <select id="campeonatoId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button type="submit" class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition">Guardar</button>
          <button type="button" id="btn-cancelar-equipa" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Equipa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campeonato</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalão</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atletas</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody id="equipas-tbody" class="bg-white divide-y divide-gray-200"></tbody>
      </table>
    </div>
  `;

  await loadCampeonatosForSelects();
  await loadAndRenderEquipasTable();

  document.getElementById('btn-nova-equipa').addEventListener('click', showNewEquipaForm);
  document.getElementById('btn-cancelar-equipa').addEventListener('click', hideEquipaForm);
  document.getElementById('form-equipa-submit').addEventListener('submit', handleEquipaFormSubmit);
  document.getElementById('filtro-campeonato').addEventListener('change', loadAndRenderEquipasTable);
}

async function loadCampeonatosForSelects() {
  const campeonatos = await window.DB.getAll('campeonatos');
  const selectFiltro = document.getElementById('filtro-campeonato');
  const selectForm   = document.getElementById('campeonatoId');

  campeonatos.forEach(c => {
    const opt1 = new Option(c.nome + ' (' + (c.epoca || '?') + ')', c.id);
    const opt2 = new Option(c.nome + ' (' + (c.epoca || '?') + ')', c.id);
    selectFiltro.appendChild(opt1);
    selectForm.appendChild(opt2);
  });
}

async function loadAndRenderEquipasTable() {
  const tbody = document.getElementById('equipas-tbody');
  if (!tbody) return;

  const filtroCampeonato = document.getElementById('filtro-campeonato')?.value || '';

  let equipas = await window.DB.getAll('equipas');
  if (filtroCampeonato) {
    equipas = equipas.filter(e => e.campeonatoId == filtroCampeonato);
  }

  tbody.innerHTML = '';

  if (equipas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-gray-500">Nenhuma equipa encontrada.</td></tr>`;
    return;
  }

  const campeonatos = await window.DB.getAll('campeonatos');
  const mapCampeonatos = Object.fromEntries(campeonatos.map(c => [c.id, c.nome]));

  const atletas = await window.DB.getAll('atletas');
  const countAtletasPorEquipa = {};
  atletas.forEach(a => {
    if (!countAtletasPorEquipa[a.equipaId]) countAtletasPorEquipa[a.equipaId] = 0;
    countAtletasPorEquipa[a.equipaId]++;
  });

  equipas.forEach(e => {
    const numAtletas = countAtletasPorEquipa[e.id] || 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${e.nome || ''}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${mapCampeonatos[e.campeonatoId] || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${e.escalao || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${numAtletas}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
        <button class="text-blue-600 hover:text-blue-900 btn-edit-equipa" data-id="${e.id}">Editar</button>
        <button class="text-green-600 hover:text-green-900 btn-gerir-atletas" data-id="${e.id}">Gerir Atletas (${numAtletas})</button>
        <button class="text-red-600 hover:text-red-900 btn-delete-equipa" data-id="${e.id}">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.classList.contains('btn-edit-equipa')) {
      await editEquipa(id);
    } else if (btn.classList.contains('btn-delete-equipa')) {
      if (confirm('Tem a certeza que deseja eliminar esta equipa? (os atletas associados também serão eliminados?)')) {
        await window.DB.delete('equipas', id);
        // Opcional: eliminar atletas associados
        const atletas = await window.DB.getAll('atletas');
        for (const a of atletas) {
          if (a.equipaId === id) await window.DB.delete('atletas', a.id);
        }
        await loadAndRenderEquipasTable();
      }
    } else if (btn.classList.contains('btn-gerir-atletas')) {
      await renderAtletasDaEquipa(id);
    }
  });
}

function showNewEquipaForm() {
  const form = document.getElementById('form-equipa');
  form.classList.remove('hidden');
  document.getElementById('form-title-equipa').textContent = 'Nova Equipa';
  document.getElementById('edit-id-equipa').value = '';
  document.getElementById('nome-equipa').value = '';
  document.getElementById('escalao').value = '';
  document.getElementById('campeonatoId').value = '';
}

function hideEquipaForm() {
  document.getElementById('form-equipa').classList.add('hidden');
}

async function editEquipa(id) {
  const equipa = await window.DB.get('equipas', id);
  if (!equipa) return;

  const form = document.getElementById('form-equipa');
  form.classList.remove('hidden');

  document.getElementById('form-title-equipa').textContent = 'Editar Equipa';
  document.getElementById('edit-id-equipa').value = equipa.id;
  document.getElementById('nome-equipa').value = equipa.nome || '';
  document.getElementById('escalao').value = equipa.escalao || '';
  document.getElementById('campeonatoId').value = equipa.campeonatoId || '';
}

async function handleEquipaFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id-equipa').value;
  const data = {
    nome: document.getElementById('nome-equipa').value.trim(),
    escalao: document.getElementById('escalao').value.trim(),
    campeonatoId: Number(document.getElementById('campeonatoId').value)
  };

  if (!data.nome || !data.escalao || !data.campeonatoId) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  if (id) {
    data.id = Number(id);
    await window.DB.update('equipas', data);
  } else {
    await window.DB.add('equipas', data);
  }

  hideEquipaForm();
  await loadAndRenderEquipasTable();
}

// ──────────────────────────────────────────────
// Gestão inline de atletas para uma equipa específica
// ──────────────────────────────────────────────

async function renderAtletasDaEquipa(equipaId) {
  const equipa = await window.DB.get('equipas', equipaId);
  if (!equipa) return;

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="mb-6">
      <button id="btn-voltar-equipas" class="text-handball-red hover:underline mb-2">&larr; Voltar à lista de equipas</button>
      <h2 class="text-2xl font-bold text-navy-darker">Atletas da ${equipa.nome} (${equipa.escalao || ''})</h2>
    </div>

    <button id="btn-novo-atleta-equipa" 
            class="mb-6 px-4 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium">
      + Novo Atleta nesta equipa
    </button>

    <div id="form-atleta-equipa" class="hidden bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h3 class="text-lg font-semibold mb-4" id="form-title-atleta-equipa">Novo Atleta</h3>
      <form id="form-atleta-equipa-submit">
        <input type="hidden" id="edit-id-atleta-equipa" value="">
        <input type="hidden" id="equipaId-atleta-equipa" value="${equipaId}">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" id="nome-atleta-equipa" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input type="number" id="numero-atleta-equipa" min="1" max="99" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Posição</label>
            <select id="posicao-atleta-equipa" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
              <option value="Guarda-Redes">Guarda-Redes</option>
              <option value="Ponta">Ponta</option>
              <option value="Pivot">Pivot</option>
              <option value="Central">Central</option>
              <option value="Extremo">Extremo</option>
            </select>
          </div>
        </div>

        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
          <input type="date" id="dataNascimento-atleta-equipa" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
        </div>

        <div class="mt-6 flex gap-3">
          <button type="submit" class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition">Guardar</button>
          <button type="button" id="btn-cancelar-atleta-equipa" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posição</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nascimento</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody id="atletas-tbody-equipa" class="bg-white divide-y divide-gray-200"></tbody>
      </table>
    </div>
  `;

  await loadAndRenderAtletasDaEquipa(equipaId);

  document.getElementById('btn-voltar-equipas').addEventListener('click', renderEquipas);
  document.getElementById('btn-novo-atleta-equipa').addEventListener('click', showNewAtletaFormEquipa);
  document.getElementById('btn-cancelar-atleta-equipa').addEventListener('click', hideAtletaFormEquipa);
  document.getElementById('form-atleta-equipa-submit').addEventListener('submit', handleAtletaFormSubmitEquipa);
}

async function loadAndRenderAtletasDaEquipa(equipaId) {
  const tbody = document.getElementById('atletas-tbody-equipa');
  if (!tbody) return;

  let atletas = await window.DB.getAll('atletas');
  atletas = atletas.filter(a => a.equipaId == equipaId);

  tbody.innerHTML = '';

  if (atletas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-gray-500">Nenhum atleta nesta equipa.</td></tr>`;
    return;
  }

  atletas.forEach(a => {
    const dataNasc = a.dataNascimento ? new Date(a.dataNascimento).toLocaleDateString('pt-PT') : '—';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${a.nome || ''}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${a.numero || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${a.posicao || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dataNasc}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3 btn-edit-atleta-equipa" data-id="${a.id}">Editar</button>
        <button class="text-red-600 hover:text-red-900 btn-delete-atleta-equipa" data-id="${a.id}">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.classList.contains('btn-edit-atleta-equipa')) {
      await editAtletaEquipa(id);
    } else if (btn.classList.contains('btn-delete-atleta-equipa')) {
      if (confirm('Tem a certeza que deseja eliminar este atleta?')) {
        await window.DB.delete('atletas', id);
        await loadAndRenderAtletasDaEquipa(equipaId);
      }
    }
  });
}

function showNewAtletaFormEquipa() {
  const form = document.getElementById('form-atleta-equipa');
  form.classList.remove('hidden');
  document.getElementById('form-title-atleta-equipa').textContent = 'Novo Atleta';
  document.getElementById('edit-id-atleta-equipa').value = '';
  document.getElementById('nome-atleta-equipa').value = '';
  document.getElementById('numero-atleta-equipa').value = '';
  document.getElementById('posicao-atleta-equipa').value = '';
  document.getElementById('dataNascimento-atleta-equipa').value = '';
}

function hideAtletaFormEquipa() {
  document.getElementById('form-atleta-equipa').classList.add('hidden');
}

async function editAtletaEquipa(id) {
  const atleta = await window.DB.get('atletas', id);
  if (!atleta) return;

  const form = document.getElementById('form-atleta-equipa');
  form.classList.remove('hidden');

  document.getElementById('form-title-atleta-equipa').textContent = 'Editar Atleta';
  document.getElementById('edit-id-atleta-equipa').value = atleta.id;
  document.getElementById('nome-atleta-equipa').value = atleta.nome || '';
  document.getElementById('numero-atleta-equipa').value = atleta.numero || '';
  document.getElementById('posicao-atleta-equipa').value = atleta.posicao || '';
  document.getElementById('dataNascimento-atleta-equipa').value = atleta.dataNascimento ? atleta.dataNascimento.split('T')[0] : '';
}

async function handleAtletaFormSubmitEquipa(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id-atleta-equipa').value;
  const equipaId = Number(document.getElementById('equipaId-atleta-equipa').value);

  const data = {
    nome: document.getElementById('nome-atleta-equipa').value.trim(),
    numero: Number(document.getElementById('numero-atleta-equipa').value),
    posicao: document.getElementById('posicao-atleta-equipa').value,
    dataNascimento: document.getElementById('dataNascimento-atleta-equipa').value,
    equipaId
  };

  if (!data.nome || !data.numero || !data.posicao || !data.dataNascimento || !data.equipaId) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  if (id) {
    data.id = Number(id);
    await window.DB.update('atletas', data);
  } else {
    await window.DB.add('atletas', data);
  }

  hideAtletaFormEquipa();
  await loadAndRenderAtletasDaEquipa(equipaId);
}
