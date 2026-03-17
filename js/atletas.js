// js/atletas.js
// Gestão de atletas (com filtro opcional por equipa)

async function renderAtletas() {
  const main = document.getElementById('main-content');
  if (!main) return;

  // Ler parâmetro da hash (ex: #atletas?equipaId=5)
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const equipaIdFiltro = params.get('equipaId') ? Number(params.get('equipaId')) : null;

  let titulo = 'Atletas';
  let breadcrumb = '';
  let equipaNome = '';

  if (equipaIdFiltro) {
    const equipa = await window.DB.get('equipas', equipaIdFiltro);
    if (equipa) {
      equipaNome = equipa.nome || 'Equipa desconhecida';
      titulo = `Atletas de ${equipaNome}`;
      breadcrumb = `<span class="text-gray-500">Atletas</span> <span class="mx-2">></span> ${equipaNome}`;
    }
  }

  main.innerHTML = `
    <div class="mb-6">
      ${breadcrumb ? `<nav class="text-sm text-gray-600">${breadcrumb}</nav>` : ''}
      <div class="flex justify-between items-center mt-2">
        <h2 class="text-2xl font-bold text-navy-darker">${titulo}</h2>
        <button id="btn-novo-atleta" 
                class="px-4 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium">
          + Novo Atleta
        </button>
      </div>
    </div>

    <div id="form-atleta" class="hidden bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h3 class="text-lg font-semibold mb-4" id="form-title-atleta">Novo Atleta</h3>
      <form id="form-atleta-submit">
        <input type="hidden" id="edit-id-atleta" value="">

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input type="text" id="nome-atleta" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input type="number" id="numero" min="1" max="99" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Posição</label>
            <select id="posicao" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
              <option value="Guarda-Redes">Guarda-Redes</option>
              <option value="Ponta">Ponta</option>
              <option value="Pivot">Pivot</option>
              <option value="Central">Central</option>
              <option value="Extremo">Extremo</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
            <input type="date" id="dataNascimento" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Equipa</label>
            <select id="equipaId-atleta" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
              <option value="">Seleccione...</option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button type="submit" class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition">Guardar</button>
          <button type="button" id="btn-cancelar-atleta" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Cancelar</button>
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
        <tbody id="atletas-tbody" class="bg-white divide-y divide-gray-200"></tbody>
      </table>
    </div>
  `;

  await loadEquipasForSelects();
  await loadAndRenderAtletasTable(equipaIdFiltro);

  document.getElementById('btn-novo-atleta').addEventListener('click', showNewAtletaForm);
  document.getElementById('btn-cancelar-atleta').addEventListener('click', hideAtletaForm);
  document.getElementById('form-atleta-submit').addEventListener('submit', handleAtletaFormSubmit);
}

async function loadEquipasForSelects() {
  const equipas = await window.DB.getAll('equipas');
  const select = document.getElementById('equipaId-atleta');
  equipas.forEach(e => {
    const opt = new Option(e.nome + (e.escalao ? ` (${e.escalao})` : ''), e.id);
    select.appendChild(opt);
  });
}

async function loadAndRenderAtletasTable(equipaIdFiltro = null) {
  const tbody = document.getElementById('atletas-tbody');
  if (!tbody) return;

  let atletas = await window.DB.getAll('atletas');

  if (equipaIdFiltro) {
    atletas = atletas.filter(a => a.equipaId == equipaIdFiltro);
  }

  tbody.innerHTML = '';

  if (atletas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-12 text-center text-gray-500">Nenhum atleta encontrado.</td></tr>`;
    return;
  }

  const equipas = await window.DB.getAll('equipas');
  const mapEquipas = Object.fromEntries(equipas.map(e => [e.id, e.nome]));

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
        <button class="text-blue-600 hover:text-blue-900 mr-3 btn-edit-atleta" data-id="${a.id}">Editar</button>
        <button class="text-red-600 hover:text-red-900 btn-delete-atleta" data-id="${a.id}">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.classList.contains('btn-edit-atleta')) {
      await editAtleta(id);
    } else if (btn.classList.contains('btn-delete-atleta')) {
      if (confirm('Tem a certeza que deseja eliminar este atleta?')) {
        await window.DB.delete('atletas', id);
        await loadAndRenderAtletasTable(equipaIdFiltro);
      }
    }
  });
}

function showNewAtletaForm() {
  const form = document.getElementById('form-atleta');
  form.classList.remove('hidden');
  document.getElementById('form-title-atleta').textContent = 'Novo Atleta';
  document.getElementById('edit-id-atleta').value = '';
  document.getElementById('nome-atleta').value = '';
  document.getElementById('numero').value = '';
  document.getElementById('posicao').value = '';
  document.getElementById('dataNascimento').value = '';
  document.getElementById('equipaId-atleta').value = '';
}

function hideAtletaForm() {
  document.getElementById('form-atleta').classList.add('hidden');
}

async function editAtleta(id) {
  const atleta = await window.DB.get('atletas', id);
  if (!atleta) return;

  const form = document.getElementById('form-atleta');
  form.classList.remove('hidden');

  document.getElementById('form-title-atleta').textContent = 'Editar Atleta';
  document.getElementById('edit-id-atleta').value = atleta.id;
  document.getElementById('nome-atleta').value = atleta.nome || '';
  document.getElementById('numero').value = atleta.numero || '';
  document.getElementById('posicao').value = atleta.posicao || '';
  document.getElementById('dataNascimento').value = atleta.dataNascimento ? atleta.dataNascimento.split('T')[0] : '';
  document.getElementById('equipaId-atleta').value = atleta.equipaId || '';
}

async function handleAtletaFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id-atleta').value;
  const data = {
    nome: document.getElementById('nome-atleta').value.trim(),
    numero: Number(document.getElementById('numero').value),
    posicao: document.getElementById('posicao').value,
    dataNascimento: document.getElementById('dataNascimento').value,
    equipaId: Number(document.getElementById('equipaId-atleta').value)
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

  hideAtletaForm();

  // Recarregar mantendo filtro se existir
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const equipaIdFiltro = params.get('equipaId') ? Number(params.get('equipaId')) : null;
  await loadAndRenderAtletasTable(equipaIdFiltro);
}
