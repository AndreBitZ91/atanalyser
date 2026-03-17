// js/db.js
// Wrapper simples e leve para IndexedDB - Handball Analytics

let db = null;

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("HandballDB", 1);

    request.onerror = () => {
      console.error("Erro ao abrir IndexedDB", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log("HandballDB inicializada com sucesso ✓");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Object Stores
      if (!db.objectStoreNames.contains("campeonatos")) {
        db.createObjectStore("campeonatos", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("equipas")) {
        const store = db.createObjectStore("equipas", { keyPath: "id", autoIncrement: true });
        store.createIndex("campeonatoId", "campeonatoId", { unique: false });
      }
      if (!db.objectStoreNames.contains("atletas")) {
        const store = db.createObjectStore("atletas", { keyPath: "id", autoIncrement: true });
        store.createIndex("equipaId", "equipaId", { unique: false });
      }
      if (!db.objectStoreNames.contains("jogos")) {
        const store = db.createObjectStore("jogos", { keyPath: "id", autoIncrement: true });
        store.createIndex("campeonatoId", "campeonatoId", { unique: false });
      }
      if (!db.objectStoreNames.contains("eventos_video")) {
        const store = db.createObjectStore("eventos_video", { keyPath: "id", autoIncrement: true });
        store.createIndex("jogoId", "jogoId", { unique: false });
      }

      console.log("Estrutura da base de dados criada/atualizada");
    };
  });
}

// ──────────────────────────────────────────────
// Funções genéricas (todas retornam Promise)
// ──────────────────────────────────────────────

async function dbAdd(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.add(data);

    req.onsuccess = () => resolve(req.result); // retorna o id gerado
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbUpdate(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(data);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

// Inicialização automática + exposição global
initDB()
  .then(() => {
    window.DB = {
      add: dbAdd,
      getAll: dbGetAll,
      get: dbGet,
      update: dbUpdate,
      delete: dbDelete
    };
    console.log("DB API disponível em window.DB");
  })
  .catch(err => {
    console.error("Falha crítica na inicialização da base de dados", err);
  });
