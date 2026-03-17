// js/io.js
// Exportar e importar dados da aplicação Handball Analytics

async function renderIO() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  main.innerHTML = `
    <h2 class="text-2xl font-bold text-navy-darker mb-8">Exportar / Importar</h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- SECÇÃO EXPORTAR -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-xl font-semibold text-navy-darker mb-4">Exportar Base de Dados</h3>
        <p class="text-gray-600 mb-6">
          Cria um ficheiro JSON com todos os dados da aplicação (campeonatos, equipas, atletas, jogos e eventos de vídeo).
        </p>

        <button id="btn-exportar" 
                class="w-full px-6 py-3 bg-handball-red text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2">
          ⬇ Exportar Base de Dados
        </button>

        <p id="export-status" class="mt-4 text-center text-sm text-gray-500"></p>
      </div>

      <!-- SECÇÃO IMPORTAR -->
      <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 class="text-xl font-semibold text-navy-darker mb-4">Importar Dados</h3>
        
        <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <strong>Atenção:</strong> Importar irá <strong>substituir completamente</strong> todos os dados actuais da aplicação.
          Não é possível desfazer esta acção.
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

  // ──────────────────────────────────────────────
  // EXPORTAR
  // ──────────────────────────────────────────────

  document.getElementById('btn-exportar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-exportar');
    const status = document.getElementById('export-status');

    btn.disabled = true;
    btn.innerHTML = 'A exportar...';
    status.textContent = '';

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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      status.textContent = 'Exportação concluída com sucesso!';
      status.className = 'mt-4 text-center text-sm text-green-600';
    } catch (err) {
      console.error(err);
      status.textContent = 'Erro ao exportar os dados.';
      status.className = 'mt-4 text-center text-sm text-red-600';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '⬇ Exportar Base de Dados';
    }
  });

  // ──────────────────────────────────────────────
  // IMPORTAR
  // ──────────────────────────────────────────────

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
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.version !== 1) {
        throw new Error('Versão do ficheiro não compatível.');
      }

      const stores = ['campeonatos', 'equipas', 'atletas', 'jogos', 'eventos_video'];
      let totalImported = 0;
      let totalToImport = 0;

      // Contar total de registos para mostrar progresso
      stores.forEach(store => {
        if (Array.isArray(data[store])) {
          totalToImport += data[store].length;
        }
      });

      progressEl.textContent = `A importar... 0/${totalToImport} registos`;

      // Limpar todas as stores (usando window.DB.clear não existe, então usamos transaction manual)
      for (const store of stores) {
        await new Promise((resolve, reject) => {
          const tx = window.DB.db.transaction(store, 'readwrite');  // ← aqui era o erro principal
          const req = tx.objectStore(store).clear();
          req.onsuccess = resolve;
          req.onerror = () => reject(req.error);
        });
      }

      // Importar cada store
      for (const store of stores) {
        if (!Array.isArray(data[store]) || data[store].length === 0) continue;

        let count = 0;
        for (const item of data[store]) {
          await window.DB.add(store, item);
          count++;
          totalImported++;
          progressEl.textContent = `A importar... ${totalImported}/${totalToImport} registos`;
        }
      }

      resultEl.innerHTML = '<span class="text-green-600 font-medium">Importação concluída com sucesso!</span><br><small>Actualize a página para ver os novos dados.</small>';
      fileInput.value = ''; // limpar input
      btnImportar.disabled = true;

    } catch (err) {
      console.error(err);
      resultEl.innerHTML = `<span class="text-red-600">Erro ao importar: ${err.message}</span>`;
    } finally {
      progressEl.classList.add('hidden');
      btnImportar.disabled = false;
    }
  });
}
