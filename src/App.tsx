import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  InterviewFormData,
  InterviewRecord,
} from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebase';
import {
  getAllRecords,
  saveRecord,
  deleteRecord,
  generateInterviewId,
} from './services/storageService';
import { uploadInterviewToDrive } from './services/driveService';
import { Navbar } from './components/Navbar';
import { InterviewForm } from './components/InterviewForm';
import { CameraCapture } from './components/CameraCapture';
import { InterviewHistory } from './components/InterviewHistory';
import { SuccessModal } from './components/SuccessModal';
import { AlertCircle, Check, Info, X } from 'lucide-react';

const INITIAL_FORM_DATA: InterviewFormData = {
  fullName: '',
  economicClass: '',
  employmentStatus: '',
  monthlyExpenses: '',
  familyDependents: '',
  assetOwnership: [],
  incomeSources: [],
  educationLevel: '',
  domicileAddress: '',
  additionalNotes: '',
};

export default function App() {
  // Navigation & View
  const [activeTab, setActiveTab] = useState<'interview' | 'history'>('interview');

  // Form State
  const [formData, setFormData] = useState<InterviewFormData>(INITIAL_FORM_DATA);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History & Records
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth & Connection
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Modals & Feedback
  const [successModalRecord, setSuccessModalRecord] = useState<InterviewRecord | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('interview_app_theme') === 'dark' ||
      (!('interview_app_theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Apply dark class to document
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('interview_app_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('interview_app_theme', 'light');
    }
  }, [darkMode]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Koneksi internet kembali online.', 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Perangkat dalam mode offline. Data tetap aman di penyimpanan lokal.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  // Load Saved Records
  const refreshRecords = useCallback(async () => {
    const stored = await getAllRecords();
    setRecords(stored);
  }, []);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Google Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast(
          `Terhubung dengan Google Drive (${res.user.email || res.user.displayName}).`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast(err.message || 'Gagal menghubungkan Google Drive.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Google Logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      showToast('Sambungan Google Drive diputuskan.', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Nama lengkap responden wajib diisi.';
    }
    if (!formData.economicClass) {
      errors.economicClass = 'Kategori kelas ekonomi wajib dipilih.';
    }
    if (!formData.employmentStatus) {
      errors.employmentStatus = 'Status pekerjaan responden wajib dipilih.';
    }
    if (formData.monthlyExpenses === '' || Number(formData.monthlyExpenses) < 0) {
      errors.monthlyExpenses = 'Pengeluaran bulanan yang valid wajib diisi.';
    }
    if (formData.familyDependents === '' || Number(formData.familyDependents) < 0) {
      errors.familyDependents = 'Jumlah tanggung keluarga wajib diisi.';
    }
    if (formData.incomeSources.length === 0) {
      errors.incomeSources = 'Pilih minimal satu sumber penghasilan.';
    }
    if (!formData.educationLevel) {
      errors.educationLevel = 'Tingkat pendidikan terakhir wajib dipilih.';
    }
    if (!formData.domicileAddress.trim()) {
      errors.domicileAddress = 'Alamat domisili responden wajib diisi.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast('Harap lengkapi seluruh isian wajib pada formulir.', 'error');
      return false;
    }

    if (!capturedPhoto) {
      showToast('Harap ambil foto responden menggunakan kamera di sisi kanan.', 'error');
      return false;
    }

    return true;
  };

  // Form Submission
  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const now = new Date();
      const dateString = now.toISOString().slice(0, 10);
      const uniqueId = generateInterviewId();

      const newRecord: InterviewRecord = {
        ...formData,
        id: uniqueId,
        createdAt: now.toISOString(),
        dateString,
        photoBase64: capturedPhoto || '',
        syncStatus: 'pending',
      };

      // Check if we can upload to Google Drive right now
      let token = accessToken;
      if (!token) {
        token = await getAccessToken();
      }

      if (token && isOnline) {
        showToast('Membuat & mengunggah spreadsheet wawancara (data + foto) ke Google Drive...', 'info');
        const driveResult = await uploadInterviewToDrive(token, newRecord);

        if (driveResult.success) {
          newRecord.syncStatus = 'synced';
          newRecord.driveFolderId = driveResult.folderId;
          newRecord.driveFolderUrl = driveResult.folderUrl;
          newRecord.driveFileId = driveResult.dataFileId;
          newRecord.drivePhotoId = driveResult.photoFileId;
          newRecord.syncedAt = new Date().toISOString();
        } else {
          newRecord.syncStatus = 'failed';
          newRecord.syncError = driveResult.error;
          showToast(
            'Gagal unggah ke Drive, namun data tetap tersimpan aman di perangkat lokal.',
            'error'
          );
        }
      } else {
        newRecord.syncStatus = 'pending';
      }

      // Save locally
      await saveRecord(newRecord);
      await refreshRecords();

      // Show success modal
      setSuccessModalRecord(newRecord);

      // Clean up form
      setFormData(INITIAL_FORM_DATA);
      setCapturedPhoto(null);
      setValidationErrors({});

      if (newRecord.syncStatus === 'synced') {
        showToast('Berkas spreadsheet wawancara & foto berhasil diunggah ke Google Drive!', 'success');
      } else {
        showToast('Data wawancara tersimpan aman secara lokal di perangkat.', 'success');
      }
    } catch (err: any) {
      console.error('Error saving interview:', err);
      showToast(err?.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    if (
      formData.fullName ||
      formData.economicClass ||
      capturedPhoto
    ) {
      const confirmed = window.confirm('Kosongkan formulir dan foto yang telah diambil?');
      if (!confirmed) return;
    }
    setFormData(INITIAL_FORM_DATA);
    setCapturedPhoto(null);
    setValidationErrors({});
    showToast('Formulir telah direset.', 'info');
  };

  // Delete single record
  const handleDeleteRecord = async (id: string) => {
    try {
      await deleteRecord(id);
      await refreshRecords();
      showToast('Data wawancara berhasil dihapus.', 'info');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Gagal menghapus data.', 'error');
    }
  };

  // Sync single record to Google Drive
  const handleSyncSingle = async (record: InterviewRecord) => {
    let token = accessToken;
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setUser(res.user);
          setAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch (err) {
        showToast('Otentikasi Google Drive diperlukan untuk sinkronisasi.', 'error');
        return;
      }
    }

    setIsSyncing(true);
    showToast(`Membuat & mengunggah spreadsheet ${record.fullName} ke Drive...`, 'info');

    try {
      const driveResult = await uploadInterviewToDrive(token, record);
      if (driveResult.success) {
        const updated: InterviewRecord = {
          ...record,
          syncStatus: 'synced',
          driveFolderId: driveResult.folderId,
          driveFolderUrl: driveResult.folderUrl,
          driveFileId: driveResult.dataFileId,
          drivePhotoId: driveResult.photoFileId,
          syncedAt: new Date().toISOString(),
          syncError: undefined,
        };
        await saveRecord(updated);
        await refreshRecords();
        showToast(`Spreadsheet ${record.fullName} (data & foto) berhasil diunggah ke Google Drive!`, 'success');
      } else {
        showToast(driveResult.error || 'Gagal sinkronisasi ke Google Drive.', 'error');
      }
    } catch (err: any) {
      console.error('Sync single error:', err);
      showToast(err.message || 'Terjadi kesalahan sinkronisasi.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync all pending records
  const handleSyncAllPending = async () => {
    const pendingList = records.filter((r) => r.syncStatus !== 'synced');
    if (pendingList.length === 0) {
      showToast('Semua wawancara sudah tersinkron ke Google Drive.', 'info');
      return;
    }

    let token = accessToken;
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          token = res.accessToken;
          setUser(res.user);
          setAccessToken(res.accessToken);
        } else {
          return;
        }
      } catch (err) {
        showToast('Otentikasi Google Drive diperlukan untuk sinkronisasi massal.', 'error');
        return;
      }
    }

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const record of pendingList) {
      try {
        const driveResult = await uploadInterviewToDrive(token, record);
        if (driveResult.success) {
          const updated: InterviewRecord = {
            ...record,
            syncStatus: 'synced',
            driveFolderId: driveResult.folderId,
            driveFolderUrl: driveResult.folderUrl,
            driveFileId: driveResult.dataFileId,
            drivePhotoId: driveResult.photoFileId,
            syncedAt: new Date().toISOString(),
            syncError: undefined,
          };
          await saveRecord(updated);
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }

    await refreshRecords();
    setIsSyncing(false);

    if (failCount === 0) {
      showToast(`Berhasil menyinkronkan seluruh ${successCount} wawancara ke Google Drive!`, 'success');
    } else {
      showToast(
        `Sinkronisasi selesai: ${successCount} berhasil, ${failCount} tertunda.`,
        'info'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#faf7ff] via-[#f3ecfc] to-[#e8dcf7] dark:from-[#0b0818] dark:via-[#110d24] dark:to-[#17112f] text-neutral-900 dark:text-neutral-100 transition-colors relative overflow-x-hidden">
      {/* Ambient ethereal glow orbs echoing the glossy iridescent spheres in the reference image */}
      <div className="fixed top-12 -left-24 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-24 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-24 left-1/3 w-96 h-96 bg-pink-300/15 dark:bg-purple-800/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        historyCount={records.length}
        isOnline={isOnline}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'interview' ? (
          /* MAIN INTERVIEW SCREEN: SPLIT SCREEN LAYOUT */
          <div className="space-y-6">
            {/* Elegant Header Banner matching ChatSavvy Typography & Glass Aesthetic */}
            <div className="glass-panel rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-purple-200/80 dark:border-purple-800/60 bg-white/70 dark:bg-white/5 text-[#583e84] dark:text-purple-300">
                    Sistem Wawancara Sosio-Ekonomi
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                  Wawancara Responden
                </h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
                  Lengkapi data klasifikasi ekonomi responden di sisi kiri dan ambil foto wajah responden dengan kamera di sisi kanan. Semua data & foto otomatis disatukan dalam satu file spreadsheet.
                </p>
              </div>

              {!user && (
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="px-5 py-2.5 bg-[#0d121f] hover:bg-[#1a233a] active:scale-95 text-white text-xs font-semibold rounded-full shadow-md shadow-purple-950/15 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2"
                >
                  <span>Hubungkan Drive</span>
                </button>
              )}
            </div>

            {/* SPLIT SCREEN GRID:
                - LEFT SIDE: Interview Form
                - RIGHT SIDE: Live Camera Capture
            */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT SIDE (Form area) */}
              <div className="lg:col-span-7 order-2 lg:order-1">
                <InterviewForm
                  formData={formData}
                  onChange={setFormData}
                  onSubmit={handleSaveInterview}
                  onReset={handleResetForm}
                  isSubmitting={isSubmitting}
                  hasPhoto={Boolean(capturedPhoto)}
                  validationErrors={validationErrors}
                />
              </div>

              {/* RIGHT SIDE (Camera Capture Preview area) */}
              <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-24">
                <CameraCapture
                  capturedPhoto={capturedPhoto}
                  onPhotoCaptured={setCapturedPhoto}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        ) : (
          /* HISTORY SCREEN */
          <InterviewHistory
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onSyncSingle={handleSyncSingle}
            onSyncAllPending={handleSyncAllPending}
            isSyncing={isSyncing}
            onNewInterview={() => setActiveTab('interview')}
            isGoogleConnected={Boolean(user)}
            onConnectGoogle={handleLogin}
          />
        )}
      </main>

      {/* Success Confirmation Modal */}
      <SuccessModal
        record={successModalRecord}
        onClose={() => setSuccessModalRecord(null)}
        onNewInterview={() => {
          setSuccessModalRecord(null);
          setActiveTab('interview');
        }}
        onViewHistory={() => {
          setSuccessModalRecord(null);
          setActiveTab('history');
        }}
      />

      {/* Floating Toast Notification with Ethereal Glass Aesthetic */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-3.5 rounded-2xl shadow-xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-[#16122c]/95 text-neutral-900 dark:text-white backdrop-blur-xl flex items-center space-x-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#583e84] dark:text-purple-300" />}
            </div>
            <div className="flex-1 text-xs leading-relaxed font-medium">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
