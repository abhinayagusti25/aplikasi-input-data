import React from 'react';
import { InterviewRecord } from '../types';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Check,
  Clock,
} from 'lucide-react';
import { downloadInterviewExcel } from '../services/excelService';

interface InterviewDetailModalProps {
  record: InterviewRecord | null;
  onClose: () => void;
  onSyncSingle?: (record: InterviewRecord) => void;
  isSyncing?: boolean;
}

export const InterviewDetailModal: React.FC<InterviewDetailModalProps> = ({
  record,
  onClose,
  onSyncSingle,
  isSyncing = false,
}) => {
  if (!record) return null;

  const formattedExpenses =
    record.monthlyExpenses !== ''
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(Number(record.monthlyExpenses))
      : '-';

  const formattedDate = new Date(record.createdAt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100/70 dark:border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold tracking-tight text-neutral-900 dark:text-white">
              {record.fullName}
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="font-mono text-[#583e84] dark:text-purple-300 font-semibold">{record.id}</span> • {formattedDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-purple-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Photo & Summary */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#faf8fd] dark:bg-[#1a1530]/60 border border-purple-100/90 dark:border-white/10">
            {record.photoBase64 ? (
              <img
                src={record.photoBase64}
                alt={record.fullName}
                className="w-24 h-32 object-cover rounded-xl border border-purple-200/80 dark:border-white/10 shadow-sm"
              />
            ) : (
              <div className="w-24 h-32 rounded-xl bg-purple-100/50 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs">
                Tanpa foto
              </div>
            )}

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-100/80 dark:bg-purple-950/60 text-[#583e84] dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40">
                  {record.economicClass || 'Belum Ditentukan'}
                </span>
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                {record.employmentStatus}
              </p>

              <div className="flex items-center justify-center sm:justify-start pt-0.5">
                {record.syncStatus === 'synced' ? (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3 mr-1 stroke-[2.5]" />
                    Tersinkron di Google Drive
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3 mr-1" />
                    Tersimpan Lokal
                  </span>
                )}
              </div>

              {record.driveFolderUrl && (
                <a
                  href={record.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-[#583e84] dark:text-purple-300 hover:underline font-semibold"
                >
                  Buka di Google Drive
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">Pengeluaran Bulanan</span>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{formattedExpenses}</p>
            </div>
            <div className="p-3 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">Tanggung Keluarga</span>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{record.familyDependents} Orang</p>
            </div>
            <div className="p-3 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">Pendidikan Terakhir</span>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{record.educationLevel || '-'}</p>
            </div>
            <div className="p-3 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">Tanggal Survei</span>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{record.dateString}</p>
            </div>
          </div>

          {/* Assets */}
          <div className="p-3.5 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40 text-xs">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1.5">Kepemilikan Aset</span>
            <div className="flex flex-wrap gap-1.5">
              {record.assetOwnership.length > 0 ? (
                record.assetOwnership.map((a) => (
                  <span
                    key={a}
                    className="px-2.5 py-0.5 rounded-full bg-purple-100/70 dark:bg-purple-950/60 text-[#583e84] dark:text-purple-300 text-[11px] font-medium"
                  >
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-neutral-400 text-xs">Tidak ada aset</span>
              )}
            </div>
          </div>

          {/* Income Sources */}
          <div className="p-3.5 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40 text-xs">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1.5">Sumber Penghasilan</span>
            <div className="flex flex-wrap gap-1.5">
              {record.incomeSources.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-0.5 rounded-full bg-purple-100/70 dark:bg-purple-950/60 text-[#583e84] dark:text-purple-300 text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="p-3.5 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40 text-xs">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">Alamat Domisili</span>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{record.domicileAddress}</p>
          </div>

          {/* Notes */}
          {record.additionalNotes && (
            <div className="p-3.5 rounded-2xl border border-purple-100/70 dark:border-white/5 bg-[#faf8fd]/80 dark:bg-[#1a1530]/40 text-xs">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-0.5">Catatan Tambahan</span>
              <p className="text-neutral-600 dark:text-neutral-400 italic leading-relaxed">
                "{record.additionalNotes}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-purple-100/70 dark:border-white/10 flex items-center justify-between gap-3 bg-white/40 dark:bg-[#141028]/40">
          <button
            onClick={() => downloadInterviewExcel(record)}
            className="px-4 py-2.5 bg-[#583e84] hover:bg-[#4a3470] text-white rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-purple-950/15"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Spreadsheet (.xlsx) (Data + Foto)</span>
          </button>

          {record.syncStatus !== 'synced' && onSyncSingle && (
            <button
              onClick={() => onSyncSingle(record)}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#0d121f] hover:bg-[#1a233a] text-white rounded-full text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              {isSyncing ? 'Menyinkronkan...' : 'Sinkron ke Drive'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
