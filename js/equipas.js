// js/equipas.js
// Gestão de equipas com filtro por campeonato

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
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody id="equipas-tbody" class="bg-white divide-y divide-gray-200"></tbody>
      </table>
    </div>
  `;

  await loadCampeonatosForSelects();
  await loadAndRenderEquipasTable();

  // Eventos
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
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-gray-500">Nenhuma equipa encontrada.</td></tr>`;
    return;
  }

  const campeonatos = await window.DB.getAll('campeonatos');
  const mapCampeonatos = Object.fromEntries(campeonatos.map(c => [c.id, c.nome]));

  equipas.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${e.nome || ''}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${mapCampeonatos[e.campeonatoId] || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${e.escalao || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3 btn-edit-equipa" data-id="${e.id}">Editar</button>
        <button class="text-green-600 hover:text-green-900 mr-3 btn-ver-atletas" data-id="${e.id}">Ver Atletas</button>
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
      if (confirm('Tem a certeza que deseja eliminar esta equipa?')) {
        await window.DB.delete('equipas', id);
        await loadAndRenderEquipasTable();
      }
    } else if (btn.classList.contains('btn-ver-atletas')) {
      window.Router.navigate(`atletas?equipaId=${id}`);
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
