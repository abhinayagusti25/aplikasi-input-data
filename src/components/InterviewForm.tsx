import React from 'react';
import {
  InterviewFormData,
  EconomicClass,
  EmploymentStatus,
  AssetOwnership,
  IncomeSource,
  EducationLevel,
} from '../types';
import {
  ArrowRight,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';

interface InterviewFormProps {
  formData: InterviewFormData;
  onChange: (data: InterviewFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  isSubmitting: boolean;
  hasPhoto: boolean;
  validationErrors: Record<string, string>;
}

const ECONOMIC_CLASSES: { value: EconomicClass; label: string; desc: string }[] = [
  {
    value: 'Kelas A',
    label: 'Kelas A (Upper Class)',
    desc: 'Penghasilan tinggi, aset mandiri & investasi substansial',
  },
  {
    value: 'Kelas B',
    label: 'Kelas B (Middle Class)',
    desc: 'Penghasilan menengah, kebutuhan primer & sekunder terpenuhi',
  },
  {
    value: 'Kelas C',
    label: 'Kelas C (Lower Class)',
    desc: 'Penghasilan dasar, fokus kebutuhan pangan dan papan pokok',
  },
];

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'Wiraswasta/Bisnis Pribadi',
  'Karyawan Swasta',
  'Pegawai Negeri',
  'Pekerja Lepas/Freelance',
  'Tidak Bekerja',
  'Pelajar/Mahasiswa',
];

const ASSET_OPTIONS: AssetOwnership[] = [
  'Rumah Pribadi',
  'Kendaraan (Mobil/Motor)',
  'Tabungan/Investasi',
  'Elektronik Bernilai Tinggi',
];

const INCOME_OPTIONS: IncomeSource[] = [
  'Gaji Tetap',
  'Hasil Bisnis',
  'Investasi',
  'Bantuan Pemerintah',
  'Lainnya',
];

const EDUCATION_LEVELS: EducationLevel[] = [
  'SD/Sederajat',
  'SMP/Sederajat',
  'SMA/Sederajat',
  'D3/Diploma',
  'S1/Sarjana',
  'S2/S3',
];

function formatRupiah(amount: number | ''): string {
  if (amount === '' || isNaN(Number(amount))) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export const InterviewForm: React.FC<InterviewFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onReset,
  isSubmitting,
  hasPhoto,
  validationErrors,
}) => {
  const handleChange = (field: keyof InterviewFormData, value: any) => {
    onChange({
      ...formData,
      [field]: value,
    });
  };

  const handleAssetToggle = (asset: AssetOwnership) => {
    const current = formData.assetOwnership;
    const exists = current.includes(asset);
    const updated = exists ? current.filter((a) => a !== asset) : [...current, asset];
    handleChange('assetOwnership', updated);
  };

  const handleIncomeToggle = (source: IncomeSource) => {
    const current = formData.incomeSources;
    const exists = current.includes(source);
    const updated = exists ? current.filter((s) => s !== source) : [...current, source];
    handleChange('incomeSources', updated);
  };

  return (
    <form
      id="interview-data-form"
      onSubmit={onSubmit}
      className="glass-panel rounded-3xl overflow-hidden flex flex-col transition-all"
    >
      {/* Modern Ethereal Header */}
      <div className="px-6 py-4.5 border-b border-purple-100/70 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/2">
        <div>
          <h2 className="font-display text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white">
            Kuesioner Wawancara
          </h2>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Klasifikasi Sosio-Ekonomi Standar Jepang
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={isSubmitting}
          className="text-xs text-neutral-500 hover:text-[#583e84] dark:hover:text-purple-300 flex items-center space-x-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-full hover:bg-purple-50 dark:hover:bg-white/5 border border-transparent hover:border-purple-200/60 dark:hover:border-purple-800/40"
          title="Reset Formulir"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Form Fields Body */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[calc(100vh-270px)]">
        {/* 1. NAMA LENGKAP */}
        <div id="field-nama-lengkap">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
            Nama Lengkap Responden <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-full-name"
            type="text"
            placeholder="Ketik nama lengkap responden"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 border focus:bg-white dark:focus:bg-[#1c1735] ${
              validationErrors.fullName
                ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                : 'border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15'
            }`}
          />
          {validationErrors.fullName && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationErrors.fullName}
            </p>
          )}
        </div>

        {/* 2. KELAS EKONOMI */}
        <div id="field-kelas-ekonomi">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
            Kelas Ekonomi (Japan System) <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {ECONOMIC_CLASSES.map((item) => {
              const selected = formData.economicClass === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleChange('economicClass', item.value)}
                  disabled={isSubmitting}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    selected
                      ? 'border-[#583e84] bg-[#583e84] text-white shadow-md shadow-purple-950/20'
                      : 'border-purple-100/90 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-800 dark:text-neutral-200 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold font-display">{item.value}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-purple-200 stroke-[2.5]" />}
                  </div>
                  <p
                    className={`text-[10px] leading-relaxed line-clamp-2 ${
                      selected ? 'text-purple-100' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.desc}
                  </p>
                </button>
              );
            })}
          </div>
          {validationErrors.economicClass && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationErrors.economicClass}
            </p>
          )}
        </div>

        {/* 3. STATUS PEKERJAAN */}
        <div id="field-status-pekerjaan">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
            Status Pekerjaan <span className="text-rose-500">*</span>
          </label>
          <select
            id="select-employment-status"
            value={formData.employmentStatus}
            onChange={(e) => handleChange('employmentStatus', e.target.value as EmploymentStatus)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 border focus:bg-white dark:focus:bg-[#1c1735] cursor-pointer ${
              validationErrors.employmentStatus
                ? 'border-rose-400'
                : 'border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15'
            }`}
          >
            <option value="">Pilih status pekerjaan</option>
            {EMPLOYMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {validationErrors.employmentStatus && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationErrors.employmentStatus}
            </p>
          )}
        </div>

        {/* 4 & 5: DUA KOLOM (Pengeluaran Bulanan & Tanggung Keluarga) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 4. PENGELUARAN BULANAN */}
          <div id="field-pengeluaran-bulanan">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
              Pengeluaran Bulanan (IDR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs text-neutral-400 font-medium">Rp</span>
              <input
                id="input-monthly-expenses"
                type="number"
                min="0"
                step="50000"
                placeholder="5000000"
                value={formData.monthlyExpenses}
                onChange={(e) =>
                  handleChange(
                    'monthlyExpenses',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={isSubmitting}
                className={`w-full pl-9 pr-3.5 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 border focus:bg-white dark:focus:bg-[#1c1735] ${
                  validationErrors.monthlyExpenses
                    ? 'border-rose-400'
                    : 'border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15'
                }`}
              />
            </div>
            {formData.monthlyExpenses !== '' && (
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                Estimasi: <span className="font-bold text-[#583e84] dark:text-purple-300">{formatRupiah(formData.monthlyExpenses)}</span> / bulan
              </p>
            )}
            {validationErrors.monthlyExpenses && (
              <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.monthlyExpenses}
              </p>
            )}
          </div>

          {/* 5. TANGGUNG KELUARGA */}
          <div id="field-tanggung-keluarga">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
              Tanggung Keluarga <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-family-dependents"
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={formData.familyDependents}
                onChange={(e) =>
                  handleChange(
                    'familyDependents',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                disabled={isSubmitting}
                className={`w-full px-4 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 border focus:bg-white dark:focus:bg-[#1c1735] ${
                  validationErrors.familyDependents
                    ? 'border-rose-400'
                    : 'border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15'
                }`}
              />
              <span className="absolute right-3.5 top-3 text-xs text-neutral-400 font-medium">
                Orang
              </span>
            </div>
            {validationErrors.familyDependents && (
              <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationErrors.familyDependents}
              </p>
            )}
          </div>
        </div>

        {/* 6. KEPEMILIKAN ASET (Card lists matching chat items in reference image) */}
        <div id="field-kepemilikan-aset">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
              Kepemilikan Aset
            </label>
            <span className="text-[10px] text-neutral-400 font-medium">Bisa lebih dari 1</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ASSET_OPTIONS.map((asset) => {
              const selected = formData.assetOwnership.includes(asset);
              return (
                <button
                  key={asset}
                  type="button"
                  onClick={() => handleAssetToggle(asset)}
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-2xl text-xs font-medium text-left border transition-all flex items-center justify-between cursor-pointer ${
                    selected
                      ? 'border-[#583e84] bg-purple-50/70 dark:bg-purple-950/40 text-[#583e84] dark:text-purple-200 shadow-xs'
                      : 'border-purple-100/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:border-purple-300 hover:bg-white dark:hover:bg-white/10'
                  }`}
                >
                  <span>{asset}</span>
                  <div
                    className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-colors ${
                      selected
                        ? 'bg-[#583e84] border-[#583e84] text-white'
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. SUMBER PENGHASILAN (Pills styled like bottom tags in reference image) */}
        <div id="field-sumber-penghasilan">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
              Sumber Penghasilan <span className="text-rose-500">*</span>
            </label>
            <span className="text-[10px] text-neutral-400 font-medium">Minimal 1 pilihan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INCOME_OPTIONS.map((source) => {
              const selected = formData.incomeSources.includes(source);
              return (
                <button
                  key={source}
                  type="button"
                  onClick={() => handleIncomeToggle(source)}
                  disabled={isSubmitting}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center space-x-1.5 cursor-pointer ${
                    selected
                      ? 'bg-[#583e84] text-white border-[#583e84] shadow-xs'
                      : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-neutral-300/80 dark:border-white/10 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  <span>{source}</span>
                  {selected && <Check className="w-3 h-3 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
          {validationErrors.incomeSources && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationErrors.incomeSources}
            </p>
          )}
        </div>

        {/* 8. TINGKAT PENDIDIKAN */}
        <div id="field-tingkat-pendidikan">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
            Tingkat Pendidikan Terakhir <span className="text-rose-500">*</span>
          </label>
          <select
            id="select-education-level"
            value={formData.educationLevel}
            onChange={(e) => handleChange('educationLevel', e.target.value as EducationLevel)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 border focus:bg-white dark:focus:bg-[#1c1735] cursor-pointer ${
              validationErrors.educationLevel
                ? 'border-rose-400'
                : 'border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15'
            }`}
          >
            <option value="">Pilih tingkat pendidikan</option>
            {EDUCATION_LEVELS.map((edu) => (
              <option key={edu} value={edu}>
                {edu}
              </option>
            ))}
          </select>
          {validationErrors.educationLevel && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationErrors.educationLevel}
            </p>
          )}
        </div>

        {/* 9. ALAMAT DOMISILI */}
        <div id="field-alamat-domisili">
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 tracking-tight">
            Alamat Domisili <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="textarea-domicile-address"
            rows={2}
            placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
            value={formData.domicileAddress}
            onChange={(e) => handleChange('domicileAddress', e.target.value)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 border focus:bg-white dark:focus:bg-[#1c1735] ${
              validationErrors.domicileAddress
                ? 'border-rose-400'
                : 'border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:ring-2 focus:ring-[#583e84]/15'
            }`}
          />
          {validationErrors.domicileAddress && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {validationErrors.domicileAddress}
            </p>
          )}
        </div>

        {/* 10. KETERANGAN TAMBAHAN */}
        <div id="field-keterangan-tambahan">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
              Keterangan Tambahan
            </label>
            <span className="text-[10px] text-neutral-400 font-medium">Opsional</span>
          </div>
          <textarea
            id="textarea-additional-notes"
            rows={2}
            placeholder="Observasi lingkungan responden, catatan penghasilan musiman, dll..."
            value={formData.additionalNotes}
            onChange={(e) => handleChange('additionalNotes', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl text-xs transition-all outline-none bg-[#fbf9fe] dark:bg-[#1a1530]/60 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 border border-purple-100 dark:border-white/10 focus:border-[#583e84] dark:focus:border-purple-400 focus:bg-white dark:focus:bg-[#1c1735] focus:ring-2 focus:ring-[#583e84]/15"
          />
        </div>
      </div>

      {/* Modern Ethereal Bottom Bar with Obsidian Button */}
      <div className="p-4 px-6 border-t border-purple-100/70 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/40 dark:bg-white/2 backdrop-blur-md">
        <div className="text-[11px]">
          {!hasPhoto ? (
            <span className="text-amber-600 dark:text-amber-400 flex items-center font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
              Ambil foto responden terlebih dahulu di kamera
            </span>
          ) : (
            <span className="text-[#583e84] dark:text-purple-300 flex items-center font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
              Data & foto responden lengkap
            </span>
          )}
        </div>

        <button
          id="btn-save-interview"
          type="submit"
          disabled={isSubmitting}
          className={`px-7 py-3 rounded-full text-xs font-semibold text-white transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer shadow-md shadow-purple-950/15 ${
            isSubmitting
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-[#0d121f] hover:bg-[#1a233a]'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <span>Simpan Wawancara</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
