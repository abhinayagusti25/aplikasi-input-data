import { InterviewRecord } from '../types';

const DB_NAME = 'InterviewAppDB';
const STORE_NAME = 'interviews';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'interview_app_records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveRecord(record: InterviewRecord): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB failed, saving to localStorage fallback', err);
    const records = getLocalStorageRecords();
    const index = records.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  }
}

function getInitialSeedRecords(): InterviewRecord[] {
  const samplePhoto1 =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%232563EB"/><circle cx="150" cy="140" r="60" fill="%23FFFFFF"/><ellipse cx="150" cy="300" rx="90" ry="70" fill="%23FFFFFF"/><text x="150" y="380" font-family="sans-serif" font-size="14" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">Foto Responden Budi</text></svg>';

  const samplePhoto2 =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%237C3AED"/><circle cx="150" cy="140" r="60" fill="%23FFFFFF"/><ellipse cx="150" cy="300" rx="90" ry="70" fill="%23FFFFFF"/><text x="150" y="380" font-family="sans-serif" font-size="14" fill="%23FFFFFF" text-anchor="middle" font-weight="bold">Foto Responden Siti</text></svg>';

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  return [
    {
      id: 'INT-20260904-B89F',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      dateString: dateStr,
      fullName: 'Budi Santoso',
      economicClass: 'Kelas B',
      employmentStatus: 'Karyawan Swasta',
      monthlyExpenses: 6500000,
      familyDependents: 3,
      assetOwnership: ['Rumah Pribadi', 'Kendaraan (Mobil/Motor)', 'Tabungan/Investasi'],
      incomeSources: ['Gaji Tetap'],
      educationLevel: 'S1/Sarjana',
      domicileAddress: 'Jl. Merdeka Barat No. 42, RT 03/RW 05, Gambir, Jakarta Pusat',
      additionalNotes: 'Memiliki usaha sampingan toko kelontong keluarga di akhir pekan.',
      photoBase64: samplePhoto1,
      syncStatus: 'pending',
    },
    {
      id: 'INT-20260904-A12X',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      dateString: dateStr,
      fullName: 'Siti Rahmawati',
      economicClass: 'Kelas A',
      employmentStatus: 'Wiraswasta/Bisnis Pribadi',
      monthlyExpenses: 28000000,
      familyDependents: 2,
      assetOwnership: [
        'Rumah Pribadi',
        'Kendaraan (Mobil/Motor)',
        'Tabungan/Investasi',
        'Elektronik Bernilai Tinggi',
      ],
      incomeSources: ['Hasil Bisnis', 'Investasi'],
      educationLevel: 'S2/S3',
      domicileAddress: 'Komp. Menteng Asri Blok C No. 12, Kebayoran Baru, Jakarta Selatan',
      additionalNotes: 'Direktur perusahaan konsultan manajemen dan properti komersial.',
      photoBase64: samplePhoto2,
      syncStatus: 'pending',
    },
  ];
}

export async function getAllRecords(): Promise<InterviewRecord[]> {
  try {
    const db = await openDB();
    const stored = await new Promise<InterviewRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: InterviewRecord[] = req.result || [];
        results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });

    if (stored.length === 0 && !localStorage.getItem('interview_seed_initialized')) {
      const seeds = getInitialSeedRecords();
      for (const s of seeds) {
        await saveRecord(s);
      }
      localStorage.setItem('interview_seed_initialized', 'true');
      return seeds;
    }
    return stored;
  } catch (err) {
    console.warn('IndexedDB read failed, reading from localStorage', err);
    const local = getLocalStorageRecords();
    if (local.length === 0 && !localStorage.getItem('interview_seed_initialized')) {
      const seeds = getInitialSeedRecords();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeds));
      localStorage.setItem('interview_seed_initialized', 'true');
      return seeds;
    }
    return local;
  }
}

export async function deleteRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    const records = getLocalStorageRecords().filter((r) => r.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  }
}

function getLocalStorageRecords(): InterviewRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed)
      ? parsed.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : [];
  } catch {
    return [];
  }
}

/**
 * Generate a unique Indonesian Interview ID
 * Format: INT-YYYYMMDD-XXXX
 */
export function generateInterviewId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INT-${year}${month}${day}-${rand}`;
}
