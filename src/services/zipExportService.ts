import JSZip from 'jszip';
import { InterviewRecord } from '../types';
import { generateInterviewCsv, base64ToBlob } from './driveService';

/**
 * Downloads a single interview as a ZIP file named Interview_[Name]_[Date].zip
 * Contains JSON, CSV, and the respondent's photo (JPG/PNG).
 */
export async function downloadInterviewZip(record: InterviewRecord): Promise<void> {
  const zip = new JSZip();

  const sanitizedName =
    record.fullName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') ||
    'Responden';
  const folderName = `Interview_${sanitizedName}_${record.dateString}`;
  const folder = zip.folder(folderName) || zip;

  // 1. JSON file
  const jsonData = JSON.stringify(
    {
      ...record,
      photoBase64: undefined,
      hasPhoto: Boolean(record.photoBase64),
    },
    null,
    2
  );
  folder.file(`data_${sanitizedName}_${record.id}.json`, jsonData);

  // 2. CSV file
  const csvData = generateInterviewCsv(record);
  folder.file(`data_${sanitizedName}_${record.id}.csv`, csvData);

  // 3. Photo file
  if (record.photoBase64) {
    const isPng = record.photoBase64.startsWith('data:image/png');
    const photoExtension = isPng ? 'png' : 'jpg';
    const photoBlob = base64ToBlob(record.photoBase64);
    folder.file(`foto_${sanitizedName}_${record.id}.${photoExtension}`, photoBlob);
  }

  // Generate ZIP blob and trigger browser download
  const content = await zip.generateAsync({ type: 'blob' });
  const fileName = `Interview_${sanitizedName}_${record.dateString}.zip`;

  triggerBrowserDownload(content, fileName);
}

/**
 * Exports all interviews as a combined CSV file
 */
export function exportAllInterviewsToCsv(records: InterviewRecord[]): void {
  if (records.length === 0) return;

  const headers = [
    'ID Wawancara',
    'Tanggal & Waktu',
    'Nama Lengkap',
    'Kelas Ekonomi',
    'Status Pekerjaan',
    'Pengeluaran Bulanan (IDR)',
    'Tanggung Keluarga (Orang)',
    'Kepemilikan Aset',
    'Sumber Penghasilan',
    'Tingkat Pendidikan',
    'Alamat Domisili',
    'Keterangan Tambahan',
    'Status Sinkronisasi',
    'Tautan Google Drive',
  ];

  const escapeCsv = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((record) => {
    return [
      record.id,
      record.createdAt,
      record.fullName,
      record.economicClass,
      record.employmentStatus,
      record.monthlyExpenses,
      record.familyDependents,
      record.assetOwnership.join('; '),
      record.incomeSources.join('; '),
      record.educationLevel,
      record.domicileAddress,
      record.additionalNotes,
      record.syncStatus,
      record.driveFolderUrl || '',
    ]
      .map(escapeCsv)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBrowserDownload(blob, `Rekap_Semua_Wawancara_${dateStr}.csv`);
}

/**
 * Bulk export all interviews into a master ZIP archive
 */
export async function exportAllInterviewsZip(records: InterviewRecord[]): Promise<void> {
  const zip = new JSZip();

  // Summary CSV
  const headers = [
    'ID Wawancara',
    'Tanggal & Waktu',
    'Nama Lengkap',
    'Kelas Ekonomi',
    'Status Pekerjaan',
    'Pengeluaran Bulanan (IDR)',
    'Tanggung Keluarga',
    'Alamat',
  ];
  const summaryRows = records.map((r) =>
    [
      `"${r.id}"`,
      `"${r.createdAt}"`,
      `"${r.fullName}"`,
      `"${r.economicClass}"`,
      `"${r.employmentStatus}"`,
      r.monthlyExpenses,
      r.familyDependents,
      `"${r.domicileAddress.replace(/"/g, '""')}"`,
    ].join(',')
  );
  zip.file('00_Semua_Responden.csv', [headers.join(','), ...summaryRows].join('\n'));

  // Subfolders for each respondent
  for (const record of records) {
    const cleanName =
      record.fullName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') ||
      'Responden';
    const subFolder = zip.folder(`${record.dateString}/${cleanName}_${record.id}`) || zip;

    // JSON
    const jsonData = JSON.stringify(record, null, 2);
    subFolder.file(`data_${record.id}.json`, jsonData);

    // Photo
    if (record.photoBase64) {
      const isPng = record.photoBase64.startsWith('data:image/png');
      const photoBlob = base64ToBlob(record.photoBase64);
      subFolder.file(`foto_${record.id}.${isPng ? 'png' : 'jpg'}`, photoBlob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerBrowserDownload(blob, `Arsip_Lengkap_Wawancara_${dateStr}.zip`);
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
