import { InterviewRecord } from '../types';
import { createSingleInterviewExcel } from './excelService';

export interface DriveUploadResult {
  success: boolean;
  folderId?: string;
  folderUrl?: string;
  dataFileId?: string;
  photoFileId?: string;
  error?: string;
}

/**
 * Find existing folder by name or create a new one
 */
export async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<{ id: string; webViewLink?: string }> {
  const sanitizedName = folderName.replace(/'/g, "\\'");
  let query = `name = '${sanitizedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,webViewLink)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Gagal mencari folder "${folderName}": ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      webViewLink: searchData.files[0].webViewLink,
    };
  }

  // Create folder
  const createRes = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      }),
    }
  );

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Gagal membuat folder "${folderName}": ${errorText}`);
  }

  const createData = await createRes.json();
  return {
    id: createData.id,
    webViewLink: createData.webViewLink,
  };
}

/**
 * Upload a file into a Google Drive folder using multipart/related
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  mimeType: string,
  contentBlob: Blob,
  folderId: string
): Promise<{ id: string; name: string; webViewLink?: string }> {
  const boundary = 'foo_bar_baz_' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: mimeType,
    parents: [folderId],
  };

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;
  const fileHeader = `${delimiter}Content-Type: ${mimeType}\r\n\r\n`;

  const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
  const fileHeaderBlob = new Blob([fileHeader], { type: 'text/plain' });
  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBlob = new Blob(
    [metadataBlob, fileHeaderBlob, contentBlob, closeBlob],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gagal mengunggah file ${fileName}: ${err}`);
  }

  return await res.json();
}

/**
 * Helper to convert data URL base64 into Blob
 */
export function base64ToBlob(base64DataUrl: string): Blob {
  const parts = base64DataUrl.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Generate CSV string from single interview record
 */
export function generateInterviewCsv(record: InterviewRecord): string {
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
  ];

  const escapeCsv = (val: any) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const values = [
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
  ];

  return [headers.map(escapeCsv).join(','), values.map(escapeCsv).join(',')].join('\n');
}

/**
 * Upload complete interview document as a SINGLE spreadsheet file (.xlsx)
 * containing both all structured data and the respondent's embedded photo
 * into Google Drive under /Interview_App/[Date]/
 */
export async function uploadInterviewToDrive(
  accessToken: string,
  record: InterviewRecord
): Promise<DriveUploadResult> {
  try {
    // 1. Root folder: Interview_App
    const rootFolder = await getOrCreateFolder(accessToken, 'Interview_App');

    // 2. Date folder: YYYY-MM-DD
    const dateFolder = await getOrCreateFolder(
      accessToken,
      record.dateString,
      rootFolder.id
    );

    // 3. Generate Single Excel Spreadsheet (.xlsx) with embedded photo & data
    const excelBlob = await createSingleInterviewExcel(record);

    const sanitizedRespondentName =
      record.fullName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'Responden';
    const excelFileName = `Interview_${sanitizedRespondentName}_${record.dateString}.xlsx`;

    // 4. Upload the single spreadsheet to Google Drive
    const spreadsheetFile = await uploadFileToDrive(
      accessToken,
      excelFileName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      excelBlob,
      dateFolder.id
    );

    const folderUrl =
      spreadsheetFile.webViewLink ||
      `https://drive.google.com/drive/folders/${dateFolder.id}`;

    return {
      success: true,
      folderId: dateFolder.id,
      folderUrl,
      dataFileId: spreadsheetFile.id,
      photoFileId: spreadsheetFile.id, // Photo is already inside this single file
    };
  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    return {
      success: false,
      error: error?.message || 'Terjadi kesalahan saat mengunggah ke Google Drive',
    };
  }
}
