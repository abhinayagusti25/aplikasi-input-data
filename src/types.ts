export type EconomicClass = 'Kelas A' | 'Kelas B' | 'Kelas C';

export type EmploymentStatus =
  | 'Wiraswasta/Bisnis Pribadi'
  | 'Karyawan Swasta'
  | 'Pegawai Negeri'
  | 'Pekerja Lepas/Freelance'
  | 'Tidak Bekerja'
  | 'Pelajar/Mahasiswa';

export type AssetOwnership =
  | 'Rumah Pribadi'
  | 'Kendaraan (Mobil/Motor)'
  | 'Tabungan/Investasi'
  | 'Elektronik Bernilai Tinggi';

export type IncomeSource =
  | 'Gaji Tetap'
  | 'Hasil Bisnis'
  | 'Investasi'
  | 'Bantuan Pemerintah'
  | 'Lainnya';

export type EducationLevel =
  | 'SD/Sederajat'
  | 'SMP/Sederajat'
  | 'SMA/Sederajat'
  | 'D3/Diploma'
  | 'S1/Sarjana'
  | 'S2/S3';

export interface InterviewFormData {
  fullName: string;
  economicClass: EconomicClass | '';
  employmentStatus: EmploymentStatus | '';
  monthlyExpenses: number | '';
  familyDependents: number | '';
  assetOwnership: AssetOwnership[];
  incomeSources: IncomeSource[];
  educationLevel: EducationLevel | '';
  domicileAddress: string;
  additionalNotes: string;
}

export interface InterviewRecord extends InterviewFormData {
  id: string; // e.g. INT-20260904-8F3A
  createdAt: string; // ISO 8601 string
  dateString: string; // YYYY-MM-DD
  photoBase64: string; // data:image/jpeg;base64,...
  driveFolderId?: string;
  driveFolderUrl?: string;
  driveFileId?: string;
  drivePhotoId?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  syncError?: string;
  syncedAt?: string;
}

export interface FilterOptions {
  searchQuery: string;
  economicClass: string;
  dateRange: 'all' | 'today' | 'last7days' | 'thisMonth';
}
