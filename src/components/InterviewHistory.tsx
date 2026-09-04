import React, { useState, useMemo } from 'react';
import { InterviewRecord, FilterOptions } from '../types';
import {
  Search,
  Download,
  Calendar,
  User,
  Briefcase,
  Check,
  Clock,
  Trash2,
  Eye,
  FileSpreadsheet,
  Archive,
  RefreshCw,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  downloadInterviewZip,
  exportAllInterviewsToCsv,
  exportAllInterviewsZip,
} from '../services/zipExportService';
import {
  downloadInterviewExcel,
  downloadAllInterviewsExcel,
} from '../services/excelService';
import { InterviewDetailModal } from './InterviewDetailModal';

interface InterviewHistoryProps {
  records: InterviewRecord[];
  onDeleteRecord: (id: string) => void;
  onSyncSingle: (record: InterviewRecord) => void;
  onSyncAllPending: () => void;
  isSyncing: boolean;
  onNewInterview: () => void;
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
}

export const InterviewHistory: React.FC<InterviewHistoryProps> = ({
  records,
  onDeleteRecord,
  onSyncSingle,
  onSyncAllPending,
  isSyncing,
  onNewInterview,
  isGoogleConnected,
  onConnectGoogle,
}) => {
  const [filter, setFilter] = useState<FilterOptions>({
    searchQuery: '',
    economicClass: 'all',
    dateRange: 'all',
  });

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<InterviewRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<InterviewRecord | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const matchesName = r.fullName.toLowerCase().includes(query);
        const matchesId = r.id.toLowerCase().includes(query);
        const matchesAddress = r.domicileAddress.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesAddress) return false;
      }

      if (filter.economicClass !== 'all') {
        if (r.economicClass !== filter.economicClass) return false;
      }

      if (filter.dateRange !== 'all') {
        const recordDate = new Date(r.createdAt);
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const recordDateStr = recordDate.toISOString().slice(0, 10);

        if (filter.dateRange === 'today') {
          if (recordDateStr !== todayStr) return false;
        } else if (filter.dateRange === 'last7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (recordDate < sevenDaysAgo) return false;
        } else if (filter.dateRange === 'thisMonth') {
          if (
            recordDate.getMonth() !== now.getMonth() ||
            recordDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [records, filter]);

  // Handle single Excel spreadsheet download (combines photo & data in 1 file)
  const handleDownloadExcel = async (record: InterviewRecord) => {
    try {
      setDownloadingId(record.id);
      await downloadInterviewExcel(record);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingCount = useMemo(
    () => records.filter((r) => r.syncStatus !== 'synced').length,
    [records]
  );

  return (
    <div id="interview-history-screen" className="space-y-5">
      {/* Modern Ethereal Filter & Actions Card */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-display text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                Riwayat Wawancara
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-950/60 text-[#583e84] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                {records.length} responden
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Data wawancara & foto tersimpan dalam satu file spreadsheet (.xlsx)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {pendingCount > 0 && (
              <button
                id="btn-sync-all-pending"
                onClick={isGoogleConnected ? onSyncAllPending : onConnectGoogle}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-semibold rounded-full shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Sinkronisasi...' : `Sinkron ${pendingCount} ke Drive`}
                </span>
              </button>
            )}

            {/* Master Excel Spreadsheet with embedded photos */}
            <button
              id="btn-export-master-excel"
              onClick={() => downloadAllInterviewsExcel(records)}
              disabled={records.length === 0}
              className="px-4 py-2 bg-[#583e84] hover:bg-[#4a3470] text-white text-xs font-semibold rounded-full flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-950/15"
              title="Unduh semua responden dan fotonya dalam SATU file Excel Master (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Rekap Excel (.xlsx)</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={() => exportAllInterviewsToCsv(records)}
              disabled={records.length === 0}
              className="px-3.5 py-2 border border-purple-200/80 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-200 text-xs font-medium rounded-full flex items-center space-x-1.5 transition-colors cursor-pointer bg-white/50 dark:bg-transparent"
              title="Unduh seluruh data dalam format CSV teks"
            >
              <span>CSV</span>
            </button>

            <button
              id="btn-history-new-interview"
              onClick={onNewInterview}
              className="px-4 py-2 bg-[#0d121f] hover:bg-[#1a233a] active:scale-95 text-white text-xs font-semibold rounded-full shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Wawancara Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 mt-4 pt-4 border-t border-purple-100/70 dark:border-white/5">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-neutral-400" />
            <input
              id="input-history-search"
              type="text"
              placeholder="Cari nama responden, ID, atau alamat..."
              value={filter.searchQuery}
              onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-2xl border border-purple-100 dark:border-white/10 bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 outline-none focus:bg-white dark:focus:bg-[#1f1938] focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15 transition-all"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              id="filter-economic-class"
              value={filter.economicClass}
              onChange={(e) => setFilter({ ...filter, economicClass: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-purple-100 dark:border-white/10 bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-800 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-[#1f1938] focus:border-[#583e84] cursor-pointer"
            >
              <option value="all">Semua Kelas Ekonomi</option>
              <option value="Kelas A">Kelas A (Upper Class)</option>
              <option value="Kelas B">Kelas B (Middle Class)</option>
              <option value="Kelas C">Kelas C (Lower Class)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              id="filter-date-range"
              value={filter.dateRange}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  dateRange: e.target.value as FilterOptions['dateRange'],
                })
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-purple-100 dark:border-white/10 bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-800 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-[#1f1938] focus:border-[#583e84] cursor-pointer"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="last7days">7 Hari Terakhir</option>
              <option value="thisMonth">Bulan Ini</option>
            </select>
          </div>
        </div>
      </div>

      {/* List of Interviews */}
      {filteredRecords.length === 0 ? (
        <div className="glass-panel rounded-3xl border-dashed p-12 text-center">
          <p className="font-display text-sm font-bold text-neutral-800 dark:text-neutral-200">
            {records.length === 0 ? 'Belum Ada Data Wawancara' : 'Tidak Ada Hasil Yang Sesuai'}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            {records.length === 0
              ? 'Lakukan wawancara pertama untuk menyimpan data dan foto responden.'
              : 'Silakan ubah kata kunci atau setelan filter pencarian.'}
          </p>
          {records.length === 0 && (
            <button
              onClick={onNewInterview}
              className="mt-4 px-5 py-2.5 bg-[#0d121f] hover:bg-[#1a233a] text-white rounded-full text-xs font-semibold inline-flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mulai Wawancara Baru</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRecords.map((record) => {
            const dateFormatted = new Date(record.createdAt).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={record.id}
                id={`history-item-${record.id}`}
                className="glass-card rounded-2xl p-4 hover:border-purple-300 dark:hover:border-purple-700/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              >
                {/* Respondent Info & Thumbnail */}
                <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                  <div
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="relative w-12 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-purple-100 dark:border-white/10 cursor-pointer group"
                    title="Klik untuk melihat foto"
                  >
                    {record.photoBase64 ? (
                      <img
                        src={record.photoBase64}
                        alt={record.fullName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3
                        onClick={() => setSelectedRecordForDetail(record)}
                        className="text-xs sm:text-sm font-bold font-display text-neutral-900 dark:text-white hover:text-[#583e84] dark:hover:text-purple-300 cursor-pointer truncate"
                      >
                        {record.fullName}
                      </h3>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-950/60 text-[#583e84] dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                        {record.economicClass || 'Kelas ?'}
                      </span>

                      {record.syncStatus === 'synced' ? (
                        <span
                          title="Tersinkron di Drive"
                          className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
                        >
                          <Check className="w-2.5 h-2.5 mr-0.5 stroke-[2.5]" />
                          Drive
                        </span>
                      ) : (
                        <span
                          title="Tersimpan lokal"
                          className="inline-flex items-center text-[10px] text-amber-600 dark:text-amber-400 font-semibold"
                        >
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          Lokal
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      <span className="flex items-center">
                        <Briefcase className="w-3 h-3 mr-1 text-[#583e84] dark:text-purple-400" />
                        {record.employmentStatus}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-[#583e84] dark:text-purple-400" />
                        {dateFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-purple-100/60 dark:border-white/5">
                  {record.driveFolderUrl && (
                    <a
                      href={record.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full text-neutral-500 hover:text-[#583e84] dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/5 transition-colors"
                      title="Buka Folder di Google Drive"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {record.syncStatus !== 'synced' && (
                    <button
                      type="button"
                      onClick={() => onSyncSingle(record)}
                      disabled={isSyncing}
                      className="px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sinkron</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedRecordForDetail(record)}
                    className="p-2 rounded-full text-neutral-500 hover:text-[#583e84] dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Lihat Detail"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* DOWNLOAD SPREADSHEET (DATA + FOTO JADI SATU FILE) */}
                  <button
                    id={`btn-download-${record.id}`}
                    type="button"
                    onClick={() => handleDownloadExcel(record)}
                    disabled={downloadingId === record.id}
                    className="px-4 py-2 bg-[#0d121f] hover:bg-[#1a233a] text-white text-xs font-semibold rounded-full flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                    title={`Unduh Spreadsheet Interview_${record.fullName}_${record.dateString}.xlsx (Foto & Data Jadi Satu File)`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-300" />
                    <span>{downloadingId === record.id ? 'Memproses...' : 'Excel (.xlsx)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordToDelete(record)}
                    className="p-2 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <InterviewDetailModal
        record={selectedRecordForDetail}
        onClose={() => setSelectedRecordForDetail(null)}
        onSyncSingle={onSyncSingle}
        isSyncing={isSyncing}
      />

      {/* Delete Confirmation */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="glass-panel rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-3 animate-in fade-in zoom-in duration-150">
            <h4 className="font-display text-sm font-bold text-neutral-900 dark:text-white">
              Hapus Data Wawancara?
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Hapus data responden <strong className="text-neutral-900 dark:text-white">"{recordToDelete.fullName}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-purple-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRecord(recordToDelete.id);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-full cursor-pointer shadow-md transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
