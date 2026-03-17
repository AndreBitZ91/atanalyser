// js/io.js
// Exportar e importar dados – com limpeza após exportação (corrigido para Safari)

async function renderIO() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const today = new Date().toISOString().split('T')[0];

  main.innerHTML = `
    <h2 class="text-2xl font-bold text-navy-darker mb-8">Exportar / Importar</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- EXPORTAR -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-xl font-semibold text-navy-darker mb-4">Exportar Base de Dados</h3>
        <p class="text-gray-600 mb-6">
          Cria um ficheiro JSON com todos os dados. Depois podes escolher limpar a aplicação.
        </p>

        <button id="btn-exportar" 
                class="w-full px-6 py-3 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2">
          ⬇ Exportar Base de Dados
        </button>

        <div id="export-status" class="mt-4 text-center text-sm text-gray-500"></div>
      </div>

      <!-- IMPORTAR -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-xl font-semibold text-navy-darker mb-4">Importar Dados</h3>
        
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Atenção:</strong> Importar irá <strong>substituir completamente</strong> todos os dados atuais. Não há desfazer.
        </div>

        <input type="file" id="file-import" accept=".json" class="block w-full text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-lg file:border-0
               file:text-sm file:font-semibold
               file:bg-handball-red file:text-white
               hover:file:bg-red-700
               file:cursor-pointer cursor-pointer mb-4">

        <button id="btn-importar" 
                class="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled>
          ⬆ Importar Ficheiro Seleccionado
        </button>

        <div id="import-progress" class="mt-4 text-center text-sm font-medium text-gray-600 hidden"></div>
        <div id="import-result" class="mt-4 text-center text-sm"></div>
      </div>
    </div>
  `;

  // EXPORTAR + pergunta para limpar
  document.getElementById('btn-exportar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-exportar');
    const status = document.getElementById('export-status');

    btn.disabled = true;
    btn.innerHTML = 'A exportar...';
    status.innerHTML = '';

    try {
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        campeonatos: await window.DB.getAll('campeonatos'),
        equipas:     await window.DB.getAll('equipas'),
        atletas:     await window.DB.getAll('atletas'),
        jogos:       await window.DB.getAll('jogos'),
        eventos_video: await window.DB.getAll('eventos_video')
      };

      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `handball-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);

      status.innerHTML = `
        <span class="text-green-600 block mb-3">Exportação concluída com sucesso!</span>
        <span class="text-gray-700 block mb-3">Queres limpar todos os dados da aplicação agora?</span>
        <div id="limpar-container" class="flex justify-center gap-4">
          <button class="btn-limpar-sim px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800 transition">Sim, limpar tudo</button>
          <button class="btn-limpar-nao px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition">Não, manter dados</button>
        </div>
      `;

      // Delegação de eventos no container (mais seguro no Safari)
      const limparContainer = document.getElementById('limpar-container');
      limparContainer.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('btn-limpar-sim')) {
          await limparTodosOsDados();
          status.innerHTML = '<p class="text-green-600 mt-4">Dados limpos com sucesso! A página vai recarregar em 3 segundos...</p>';
          setTimeout(() => location.reload(), 3000);
        } else if (target.classList.contains('btn-limpar-nao')) {
          status.innerHTML = '<p class="text-gray-600 mt-4">Dados mantidos. Pode continuar a usar a aplicação.</p>';
        }
      });

    } catch (err) {
      console.error(err);
      status.innerHTML = '<p class="text-red-600">Erro ao exportar os dados.</p>';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '⬇ Exportar Base de Dados';
    }
  });

  // Função para limpar todos os dados
  async function limparTodosOsDados() {
    const stores = ['campeonatos', 'equipas', 'atletas', 'jogos', 'eventos_video'];

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = window.DB.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const req = objectStore.clear();
        req.onsuccess = resolve;
        req.onerror = (e) => reject(e.target.error || new Error('Erro ao limpar store'));
      });
    }
  }

  // IMPORTAR (mantido igual, com verificação)
  const fileInput = document.getElementById('file-import');
  const btnImportar = document.getElementById('btn-importar');
  const progressEl = document.getElementById('import-progress');
  const resultEl = document.getElementById('import-result');

  fileInput.addEventListener('change', () => {
    btnImportar.disabled = !fileInput.files.length;
    resultEl.innerHTML = '';
  });

  btnImportar.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    btnImportar.disabled = true;
    progressEl.classList.remove('hidden');
    progressEl.textContent = 'A ler ficheiro...';
    resultEl.innerHTML = '';

    try {
      if (!window.DB || typeof window.DB.add !== 'function') {
        throw new Error('Base de dados não inicializada. Recarrega a página.');
      }

      const text = await file.text();
      const data = JSON.parse(text);

      if (data.version !== 1) {
        throw new Error('Versão do ficheiro não compatível (esperado: 1).');
      }

      const stores = ['campeonatos', 'equipas', 'atletas', 'jogos', 'eventos_video'];
      let totalImported = 0;
      let totalToImport = 0;

      stores.forEach(store => {
        if (Array.isArray(data[store])) totalToImport += data[store].length;
      });

      progressEl.textContent = `A importar... 0/${totalToImport} registos`;

      // Limpar
      for (const storeName of stores) {
        await new Promise((resolve, reject) => {
          const transaction = window.DB.transaction(storeName, 'readwrite');
          const objectStore = transaction.objectStore(storeName);
          const req = objectStore.clear();
          req.onsuccess = resolve;
          req.onerror = (e) => reject(e.target.error || new Error('Erro ao limpar'));
        });
      }

      // Importar
      for (const storeName of stores) {
        const items = data[storeName] || [];
        for (const item of items) {
          await window.DB.add(storeName, item);
          totalImported++;
          progressEl.textContent = `A importar... ${totalImported}/${totalToImport} registos`;
        }
      }

      resultEl.innerHTML = '<span class="text-green-600 font-medium">Importação concluída!</span><br><small>Recarrega a página para ver os novos dados.</small>';
      fileInput.value = '';
      btnImportar.disabled = true;

    } catch (err) {
      console.error('Erro na importação:', err);
      resultEl.innerHTML = `<span class="text-red-600 font-medium">Erro: ${err.message || 'Operação falhou'}</span>`;
    } finally {
      progressEl.classList.add('hidden');
      btnImportar.disabled = false;
    }
  });
}
