export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NoteAppDB', 2);

    request.onerror = () => reject('Lỗi khởi tạo IndexedDB');

    request.onsuccess = (e) => resolve(e.target.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'tempId' });
      }
    };
  });
};

export const saveNotesToLocal = async (notes) => {
  try {
    const db = await initDB();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');

    store.clear();

    notes.forEach(note => {
      store.put(note);
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(false);
    });
  } catch (error) {
    console.error('Lỗi khi lưu offline notes:', error);
  }
};

export const getNotesFromLocal = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject([]);
    });
  } catch (error) {
    console.error('Lỗi lấy offline notes:', error);
    return [];
  }
};

export const addToSyncQueue = async (action) => {
  try {
    const db = await initDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    store.put(action);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(false);
    });
  } catch (error) {
    console.error('Lỗi khi thêm vào sync_queue:', error);
  }
};

export const getSyncQueue = async () => {
  try {
    const db = await initDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject([]);
    });
  } catch (error) {
    console.error('Lỗi lấy sync_queue:', error);
    return [];
  }
};

export const removeFromSyncQueue = async (tempId) => {
  try {
    const db = await initDB();
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    store.delete(tempId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(false);
    });
  } catch (error) {
    console.error('Lỗi xóa khỏi sync_queue:', error);
  }
};
