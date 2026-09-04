import React from 'react';
import { InterviewRecord } from '../types';
import {
  Check,
  FileSpreadsheet,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { downloadInterviewExcel } from '../services/excelService';

interface SuccessModalProps {
  record: InterviewRecord | null;
  onClose: () => void;
  onNewInterview: () => void;
  onViewHistory: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  record,
  onClose,
  onNewInterview,
  onViewHistory,
}) => {
  if (!record) return null;

  const sanitizedName =
    record.fullName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'Responden';
  const spreadsheetFileName = `Interview_${sanitizedName}_${record.dateString}.xlsx`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-white/80 dark:border-white/10 animate-in fade-in zoom-in duration-200">
        {/* Violet Check Badge */}
        <div className="w-12 h-12 rounded-full bg-[#583e84] text-white mx-auto flex items-center justify-center mb-4 shadow-md shadow-purple-950/20">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h3 className="font-display text-base font-bold tracking-tight text-neutral-900 dark:text-white">
          Data Wawancara Disimpan
        </h3>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 mb-4">
          Responden <strong className="text-neutral-900 dark:text-white">{record.fullName}</strong>
          <br />
          <span className="text-[11px] font-mono text-[#583e84] dark:text-purple-300">{record.id}</span>
        </p>

        {/* Ethereal Drive / Storage Status */}
        <div className="p-3.5 rounded-2xl bg-[#faf8fd] dark:bg-[#1a1530]/60 border border-purple-100/90 dark:border-white/10 text-left text-xs mb-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Format Berkas</span>
            <span className="text-[10px] font-bold text-[#583e84] dark:text-purple-300">
              Spreadsheet Tunggal (.xlsx)
            </span>
          </div>
          <p className="text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
            Foto responden & semua isian kuesioner disatukan dalam satu file Excel:
          </p>
          <p className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300 bg-white/80 dark:bg-white/5 border border-purple-100/60 dark:border-white/5 px-2.5 py-1 rounded-xl truncate">
            {spreadsheetFileName}
          </p>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">Penyimpanan</span>
            {record.syncStatus === 'synced' ? (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Google Drive OK
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                Tersimpan Lokal
              </span>
            )}
          </div>

          {record.driveFolderUrl && (
            <a
              href={record.driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[11px] text-[#583e84] dark:text-purple-300 hover:underline font-semibold pt-0.5"
            >
              Buka File di Google Drive
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => downloadInterviewExcel(record)}
            className="w-full py-2.5 px-4 bg-[#583e84] hover:bg-[#4a3470] text-white rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md shadow-purple-950/15 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Spreadsheet (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNewInterview();
            }}
            className="w-full py-2.5 px-4 bg-[#0d121f] hover:bg-[#1a233a] text-white rounded-full text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Wawancara Baru</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onViewHistory();
            }}
            className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-[#583e84] dark:hover:text-purple-300 transition-colors cursor-pointer"
          >
            Buka Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};
