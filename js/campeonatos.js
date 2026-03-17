// js/campeonatos.js
// Gestão de campeonatos + import semi-automático melhorado FPA

async function renderCampeonatos() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-navy-darker">Campeonatos</h2>
      <div class="flex gap-3">
        <button id="btn-importar-fpa" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
          Importar Prova Oficial FPA (semi-auto)
        </button>
        <button id="btn-novo-campeonato" 
                class="px-4 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium">
          + Novo Campeonato Manual
        </button>
      </div>
    </div>

    <!-- Formulário semi-automático FPA -->
    <div id="form-import-fpa" class="hidden bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h3 class="text-lg font-semibold mb-4">Importar prova do portal.fpa.pt (semi-automático)</h3>
      <p class="text-sm text-gray-600 mb-4">
        1. Cole o link da prova (ex: calendário ou resultados).<br>
        2. Clique em "Abrir Link + Sugerir Dados" para ver a página e copiar info.<br>
        3. Confirme / ajuste os campos e crie o campeonato.
      </p>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Link da prova FPA</label>
        <input type="url" id="url-prova-fpa" placeholder="https://portal.fpa.pt/prova/..." 
               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
      </div>

      <button id="btn-abrir-sugerir" 
              class="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Abrir Link + Sugerir Dados
      </button>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Competição *</label>
          <input type="text" id="nome-import" required placeholder="ex: Campeonato Placard Andebol 1" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Época *</label>
          <input type="text" id="epoca-import" required placeholder="ex: 2025/26" value="2025/26"
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Zona / Série / Grupo (opcional)</label>
          <input type="text" id="zona-import" placeholder="ex: Série A Norte" 
                 class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <button id="btn-criar-import" 
                class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition">
          Criar Campeonato Agora
        </button>
        <button id="btn-cancelar-import" 
                class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Formulário normal manual -->
    <div id="form-campeonato" class="hidden bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h3 class="text-lg font-semibold mb-4" id="form-title">Novo Campeonato</h3>
      <form id="form-campeonato-submit">
        <input type="hidden" id="edit-id" value="">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input type="text" id="nome" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Época (ex: 2025/26) *</label>
            <input type="text" id="epoca" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red">
          </div>
        </div>
        
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
          <textarea id="descricao" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-handball-red focus:border-handball-red"></textarea>
        </div>

        <div class="mt-6 flex gap-3">
          <button type="submit" class="px-6 py-2 bg-handball-red text-white rounded-lg hover:bg-red-700 transition">
            Guardar
          </button>
          <button type="button" id="btn-cancelar" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Época</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody id="campeonatos-tbody" class="bg-white divide-y divide-gray-200"></tbody>
      </table>
    </div>
  `;

  await loadAndRenderTable();

  // Eventos
  document.getElementById('btn-novo-campeonato').addEventListener('click', showNewForm);
  document.getElementById('btn-importar-fpa').addEventListener('click', showImportarDeLinkForm);
  document.getElementById('btn-cancelar').addEventListener('click', hideForm);
  document.getElementById('btn-cancelar-import').addEventListener('click', hideImportForm);
  document.getElementById('form-campeonato-submit').addEventListener('submit', handleFormSubmit);
  document.getElementById('btn-criar-import').addEventListener('click', handleImportSubmit);
  document.getElementById('btn-abrir-sugerir').addEventListener('click', abrirLinkESugerir);
}

// ──────────────────────────────────────────────
// Formulário semi-automático FPA
// ──────────────────────────────────────────────

function showImportarDeLinkForm() {
  document.getElementById('form-import-fpa').classList.remove('hidden');
}

function hideImportForm() {
  document.getElementById('form-import-fpa').classList.add('hidden');
}

function abrirLinkESugerir() {
  const url = document.getElementById('url-prova-fpa').value.trim();
  if (!url) {
    alert('Cole o link da prova primeiro.');
    return;
  }

  // Abrir link em nova aba para o utilizador ver e copiar info
  window.open(url, '_blank');

  // Sugestões automáticas baseadas no link (simples parsing da URL)
  let nomeSugerido = 'Competição FPA';
  let epocaSugerida = new Date().getFullYear() + '/' + (new Date().getFullYear() + 1);
  let zonaSugerida = '';

  if (url.includes('masculino')) nomeSugerido = 'Campeonato Nacional Masculino';
  if (url.includes('feminino')) nomeSugerido = 'Campeonato Nacional Feminino';
  if (url.includes('1') || url.includes('placard')) nomeSugerido = 'Campeonato Placard Andebol 1';
  if (url.includes('2')) nomeSugerido = '2ª Divisão';
  if (url.includes('zona') || url.includes('serie')) zonaSugerida = 'Zona/Série detectada no link';

  document.getElementById('nome-import').value = nomeSugerido;
  document.getElementById('epoca-import').value = epocaSugerida;
  document.getElementById('zona-import').value = zonaSugerida;

  alert('Link aberto numa nova aba!\nCopie os dados da página (nome, época, zona, etc.) e ajuste os campos acima.');
}

async function handleImportSubmit() {
  const nome = document.getElementById('nome-import').value.trim();
  const epoca = document.getElementById('epoca-import').value.trim();
  const zona = document.getElementById('zona-import').value.trim();
  const url = document.getElementById('url-prova-fpa').value.trim();

  if (!nome || !epoca) {
    alert('Preencha pelo menos Nome e Época.');
    return;
  }

  const data = {
    nome,
    epoca,
    descricao: zona ? `Zona/Série: ${zona}\nFonte: ${url || 'Manual'}` : `Fonte: ${url || 'Manual'}`
  };

  const novoId = await window.DB.add('campeonatos', data);

  hideImportForm();
  await loadAndRenderTable();

  alert(`Campeonato "${nome}" criado com sucesso (ID: ${novoId})!\nAgora vá à secção "Jogos" e adicione as jornadas manualmente (equipa A, B, data, local, etc.).`);
}

// ──────────────────────────────────────────────
// Restante código (form normal, lista, editar, eliminar) mantido igual
// ──────────────────────────────────────────────

function showNewForm() {
  const form = document.getElementById('form-campeonato');
  form.classList.remove('hidden');
  document.getElementById('form-title').textContent = 'Novo Campeonato';
  document.getElementById('edit-id').value = '';
  document.getElementById('nome').value = '';
  document.getElementById('epoca').value = '';
  document.getElementById('descricao').value = '';
}

function hideForm() {
  document.getElementById('form-campeonato').classList.add('hidden');
}

async function editCampeonato(id) {
  const campeonato = await window.DB.get('campeonatos', id);
  if (!campeonato) return;

  const form = document.getElementById('form-campeonato');
  form.classList.remove('hidden');

  document.getElementById('form-title').textContent = 'Editar Campeonato';
  document.getElementById('edit-id').value = campeonato.id;
  document.getElementById('nome').value = campeonato.nome || '';
  document.getElementById('epoca').value = campeonato.epoca || '';
  document.getElementById('descricao').value = campeonato.descricao || '';
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const data = {
    nome: document.getElementById('nome').value.trim(),
    epoca: document.getElementById('epoca').value.trim(),
    descricao: document.getElementById('descricao').value.trim()
  };

  if (!data.nome || !data.epoca) {
    alert('Preencha nome e época.');
    return;
  }

  if (id) {
    data.id = Number(id);
    await window.DB.update('campeonatos', data);
  } else {
    await window.DB.add('campeonatos', data);
  }

  hideForm();
  await loadAndRenderTable();
}

async function loadAndRenderTable() {
  const tbody = document.getElementById('campeonatos-tbody');
  if (!tbody) return;

  const campeonatos = await window.DB.getAll('campeonatos');
  tbody.innerHTML = '';

  if (campeonatos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="px-6 py-12 text-center text-gray-500">
          Ainda não existem campeonatos registados.
        </td>
      </tr>`;
    return;
  }

  campeonatos.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${c.nome || ''}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-500">${c.epoca || ''}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3 btn-edit" data-id="${c.id}">Editar</button>
        <button class="text-red-600 hover:text-red-900 btn-delete" data-id="${c.id}">Eliminar</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = Number(btn.dataset.id);

    if (btn.classList.contains('btn-edit')) {
      await editCampeonato(id);
    } else if (btn.classList.contains('btn-delete')) {
      if (confirm('Tem a certeza que deseja eliminar este campeonato?')) {
        await window.DB.delete('campeonatos', id);
        await loadAndRenderTable();
      }
    }
  });
}
