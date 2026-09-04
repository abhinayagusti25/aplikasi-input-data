import ExcelJS from 'exceljs';
import { InterviewRecord } from '../types';

/**
 * Creates a single Excel (.xlsx) file containing both the full interview data
 * and the respondent's embedded photo.
 */
export async function createSingleInterviewExcel(record: InterviewRecord): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Interview App Japan Class';
  workbook.created = new Date(record.createdAt || Date.now());

  const worksheet = workbook.addWorksheet('Hasil Wawancara', {
    views: [{ showGridLines: true }],
  });

  // Set column widths
  worksheet.columns = [
    { width: 4 },  // A - spacing
    { width: 28 }, // B - Field Label
    { width: 36 }, // C - Value
    { width: 4 },  // D - spacing
    { width: 32 }, // E - Photo & Notes
    { width: 4 },  // F - spacing
  ];

  // Header Title
  worksheet.mergeCells('B2:E2');
  const titleCell = worksheet.getCell('B2');
  titleCell.value = 'LEMBAR HASIL WAWANCARA RESPONDEN';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF171717' }, // Neutral-900
  };
  worksheet.getRow(2).height = 36;

  // Subtitle
  worksheet.mergeCells('B3:E3');
  const subtitleCell = worksheet.getCell('B3');
  subtitleCell.value = `ID: ${record.id}  •  Tanggal: ${record.dateString}  •  Status: ${
    record.syncStatus === 'synced' ? 'Tersinkron di Google Drive' : 'Penyimpanan Lokal'
  }`;
  subtitleCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF525252' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F5F5' },
  };
  worksheet.getRow(3).height = 20;

  // Data rows definitions
  const formattedExpenses =
    record.monthlyExpenses !== ''
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          maximumFractionDigits: 0,
        }).format(Number(record.monthlyExpenses))
      : '-';

  const fields: { label: string; value: string; isHighlight?: boolean }[] = [
    { label: 'Nama Lengkap Responden', value: record.fullName, isHighlight: true },
    { label: 'Klasifikasi Kelas Ekonomi', value: record.economicClass || '-', isHighlight: true },
    { label: 'Status Pekerjaan', value: record.employmentStatus || '-' },
    { label: 'Estimasi Pengeluaran Bulanan', value: formattedExpenses },
    { label: 'Jumlah Tanggung Keluarga', value: `${record.familyDependents || 0} Orang` },
    { label: 'Sumber Penghasilan', value: record.incomeSources.join(', ') || '-' },
    { label: 'Kepemilikan Aset', value: record.assetOwnership.join(', ') || 'Tidak ada aset yang dipilih' },
    { label: 'Tingkat Pendidikan Terakhir', value: record.educationLevel || '-' },
    { label: 'Alamat Domisili', value: record.domicileAddress || '-' },
    { label: 'Catatan Tambahan', value: record.additionalNotes || '-' },
    { label: 'Waktu Perekaman Data', value: record.createdAt || '-' },
  ];

  let startRow = 5;

  // Photo header in Column E
  const photoHeaderCell = worksheet.getCell(`E${startRow}`);
  photoHeaderCell.value = 'FOTO RESPOONDEN';
  photoHeaderCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF171717' } };
  photoHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
  photoHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E5E5' },
  };
  photoHeaderCell.border = {
    top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    right: { style: 'thin', color: { argb: 'FFD4D4D4' } },
  };

  // Embed Photo into worksheet if available
  if (record.photoBase64) {
    try {
      const isPng = record.photoBase64.startsWith('data:image/png');
      const cleanBase64 = record.photoBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageId = workbook.addImage({
        base64: cleanBase64,
        extension: isPng ? 'png' : 'jpeg',
      });

      // Place image under photo header (around rows 6 to 14 in column E)
      worksheet.addImage(imageId, {
        tl: { col: 4.1, row: 5.2 },
        ext: { width: 220, height: 260 },
        editAs: 'oneCell',
      });
    } catch (imgErr) {
      console.warn('Failed to embed image in Excel:', imgErr);
      const noPhotoCell = worksheet.getCell(`E${startRow + 1}`);
      noPhotoCell.value = '(Foto tidak dapat dimuat)';
    }
  } else {
    const noPhotoCell = worksheet.getCell(`E${startRow + 1}`);
    noPhotoCell.value = '(Tidak ada foto responden)';
    noPhotoCell.font = { italic: true, color: { argb: 'FFA3A3A3' } };
    noPhotoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // Populate data fields
  fields.forEach((item, index) => {
    const rowNum = startRow + index;
    const row = worksheet.getRow(rowNum);
    row.height = 24;

    const labelCell = worksheet.getCell(`B${rowNum}`);
    labelCell.value = item.label;
    labelCell.font = {
      name: 'Segoe UI',
      size: 9.5,
      bold: item.isHighlight,
      color: { argb: item.isHighlight ? 'FF171717' : 'FF404040' },
    };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: item.isHighlight ? 'FFF0F0F0' : 'FFF9F9F9' },
    };
    labelCell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      right: { style: 'thin', color: { argb: 'FFE5E5E5' } },
    };
    labelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    const valCell = worksheet.getCell(`C${rowNum}`);
    valCell.value = item.value;
    valCell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: item.isHighlight,
      color: { argb: 'FF171717' },
    };
    valCell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      right: { style: 'thin', color: { argb: 'FFE5E5E5' } },
    };
    valCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
  });

  // Second Sheet: Tabular Raw Data (useful for formulas / data analysis / Google Sheets imports)
  const rawSheet = workbook.addWorksheet('Tabel Responden');
  rawSheet.columns = [
    { header: 'ID Wawancara', key: 'id', width: 22 },
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Nama Lengkap', key: 'fullName', width: 26 },
    { header: 'Kelas Ekonomi', key: 'economicClass', width: 18 },
    { header: 'Pekerjaan', key: 'employmentStatus', width: 22 },
    { header: 'Pengeluaran Bulanan', key: 'monthlyExpenses', width: 22 },
    { header: 'Tanggung Keluarga', key: 'familyDependents', width: 18 },
    { header: 'Kepemilikan Aset', key: 'assetOwnership', width: 28 },
    { header: 'Sumber Penghasilan', key: 'incomeSources', width: 24 },
    { header: 'Pendidikan Terakhir', key: 'educationLevel', width: 20 },
    { header: 'Alamat Domisili', key: 'domicileAddress', width: 36 },
    { header: 'Catatan', key: 'additionalNotes', width: 30 },
  ];

  // Header styling for rawSheet
  const rawHeaderRow = rawSheet.getRow(1);
  rawHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  rawHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF262626' },
  };
  rawHeaderRow.height = 24;

  rawSheet.addRow({
    id: record.id,
    date: record.dateString,
    fullName: record.fullName,
    economicClass: record.economicClass,
    employmentStatus: record.employmentStatus,
    monthlyExpenses: record.monthlyExpenses,
    familyDependents: record.familyDependents,
    assetOwnership: record.assetOwnership.join('; '),
    incomeSources: record.incomeSources.join('; '),
    educationLevel: record.educationLevel,
    domicileAddress: record.domicileAddress,
    additionalNotes: record.additionalNotes,
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Creates a combined master spreadsheet (.xlsx) with all respondents
 * and each respondent's photo embedded right next to their row!
 */
export async function createAllInterviewsMasterExcel(records: InterviewRecord[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Interview App Japan Class';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Rekap Semua Responden', {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { width: 14 }, // A: Foto
    { width: 20 }, // B: ID
    { width: 14 }, // C: Tanggal
    { width: 24 }, // D: Nama Lengkap
    { width: 16 }, // E: Kelas Ekonomi
    { width: 20 }, // F: Pekerjaan
    { width: 18 }, // G: Pengeluaran Bulanan
    { width: 16 }, // H: Tanggung Keluarga
    { width: 24 }, // I: Sumber Penghasilan
    { width: 26 }, // J: Kepemilikan Aset
    { width: 18 }, // K: Pendidikan
    { width: 36 }, // L: Alamat Domisili
    { width: 28 }, // M: Catatan
  ];

  // Header row
  const headers = [
    'Foto',
    'ID Wawancara',
    'Tanggal',
    'Nama Lengkap',
    'Kelas Ekonomi',
    'Pekerjaan',
    'Pengeluaran (IDR)',
    'Tanggung (Org)',
    'Sumber Penghasilan',
    'Kepemilikan Aset',
    'Pendidikan',
    'Alamat Domisili',
    'Catatan',
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.values = headers;
  headerRow.height = 28;
  headerRow.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF171717' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2;
    const row = worksheet.getRow(rowNum);
    row.height = 80; // Enough height to display thumbnail photo neatly

    row.getCell(2).value = record.id;
    row.getCell(3).value = record.dateString;
    row.getCell(4).value = record.fullName;
    row.getCell(5).value = record.economicClass;
    row.getCell(6).value = record.employmentStatus;
    row.getCell(7).value = Number(record.monthlyExpenses) || 0;
    row.getCell(7).numFmt = '#,##0';
    row.getCell(8).value = Number(record.familyDependents) || 0;
    row.getCell(9).value = record.incomeSources.join(', ');
    row.getCell(10).value = record.assetOwnership.join(', ');
    row.getCell(11).value = record.educationLevel;
    row.getCell(12).value = record.domicileAddress;
    row.getCell(13).value = record.additionalNotes || '-';

    for (let col = 2; col <= 13; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.alignment = { vertical: 'middle', horizontal: col === 7 || col === 8 ? 'right' : 'left', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
        left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
        right: { style: 'thin', color: { argb: 'FFE5E5E5' } },
      };
    }

    // Embed Photo in Column A (col index 0 in 0-based ExcelJS image placement)
    if (record.photoBase64) {
      try {
        const isPng = record.photoBase64.startsWith('data:image/png');
        const cleanBase64 = record.photoBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageId = workbook.addImage({
          base64: cleanBase64,
          extension: isPng ? 'png' : 'jpeg',
        });

        worksheet.addImage(imageId, {
          tl: { col: 0.1, row: rowNum - 1 + 0.1 },
          ext: { width: 75, height: 95 },
          editAs: 'oneCell',
        });
      } catch (err) {
        row.getCell(1).value = '(Foto)';
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      }
    } else {
      row.getCell(1).value = '-';
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Triggers download of the single Excel spreadsheet file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a single interview as a complete Excel spreadsheet (.xlsx)
 * with the respondent's data and embedded photograph in one file.
 */
export async function downloadInterviewExcel(record: InterviewRecord): Promise<void> {
  const blob = await createSingleInterviewExcel(record);
  const sanitizedName =
    record.fullName.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'Responden';
  const filename = `Interview_${sanitizedName}_${record.dateString}.xlsx`;
  downloadFile(blob, filename);
}

/**
 * Downloads all interview records in a master Excel spreadsheet (.xlsx)
 * with respondent photo thumbnails embedded in rows.
 */
export async function downloadAllInterviewsExcel(records: InterviewRecord[]): Promise<void> {
  if (records.length === 0) return;
  const blob = await createAllInterviewsMasterExcel(records);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Rekap_Semua_Wawancara_${dateStr}.xlsx`;
  downloadFile(blob, filename);
}

