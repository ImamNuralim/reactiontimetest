// ==== DATA PROTOTYPE (dummy, belum terhubung ke backend) ==== //
// Semua data disimpan di localStorage browser. Tombol "Reset data" di dashboard
// akan mengembalikan ke kondisi seed di bawah.

const STORAGE_KEY = 'sigap_results_v1';
const TOTAL_TRIALS = 20;
const PRACTICE_TRIALS = 5;   // 5 percobaan pertama = latihan, tidak dihitung
const MAX_REACTION_MS = 580; // lebih dari ini -> diulang

const WORKERS = [
  { id: 'w1', nama: 'Andi Pratama',   divisi: 'Operasional',      shift: 'Pagi' },
  { id: 'w2', nama: 'Budi Santoso',   divisi: 'Gudang',           shift: 'Malam' },
  { id: 'w3', nama: 'Citra Lestari',  divisi: 'Customer Service', shift: 'Pagi' },
  { id: 'w4', nama: 'Dewi Anggraini', divisi: 'Produksi',         shift: 'Siang' },
  { id: 'w5', nama: 'Eko Wibowo',     divisi: 'Driver',           shift: 'Pagi' },
];

const CATEGORIES = {
  'Normal': {
    cls: 'normal', audioId: 'audio-normal', rentang: '150–240 ms',
    arti: 'Waktu reaksi berada dalam kisaran normal. Tidak ada tanda kelelahan yang berarti.',
    saran: 'Lanjutkan pekerjaan seperti biasa.',
  },
  'Kelelahan Ringan': {
    cls: 'ringan', audioId: 'audio-kelelahan-ringan', rentang: '241–410 ms',
    arti: 'Waktu reaksi mulai melambat. Tanda awal kelelahan mulai muncul.',
    saran: 'Ambil istirahat singkat, minum air, dan pantau kembali di akhir shift.',
  },
  'Kelelahan Sedang': {
    cls: 'sedang', audioId: 'audio-kelelahan-sedang', rentang: '411–580 ms',
    arti: 'Kelelahan sudah cukup terlihat dan dapat memengaruhi fokus.',
    saran: 'Pertimbangkan rotasi tugas atau istirahat lebih panjang. Hindari tugas berisiko tinggi.',
  },
  'Kelelahan Berat': {
    cls: 'berat', audioId: 'audio-kelelahan-berat', rentang: '> 580 ms',
    arti: 'Reaksi jauh menurun. Risiko kecelakaan kerja meningkat.',
    saran: 'Hentikan tugas berisiko dan laporkan ke supervisor untuk tindak lanjut.',
  },
  'Perlu Ulang Tes': {
    cls: 'ulang', audioId: null, rentang: '< 150 ms',
    arti: 'Waktu reaksi terlalu cepat untuk tes ini, kemungkinan klik dilakukan sebelum warna hijau.',
    saran: 'Ulangi tes dan tunggu warna hijau sebelum klik.',
  },
};

function getCategory(avg) {
  if (avg < 150) return 'Perlu Ulang Tes';
  if (avg <= 240) return 'Normal';
  if (avg <= 410) return 'Kelelahan Ringan';
  if (avg <= 580) return 'Kelelahan Sedang';
  return 'Kelelahan Berat';
}

// Membuat 20 percobaan dummy di sekitar rata-rata yang diberikan.
const TRIAL_OFFSETS = [-30, 12, -8, 25, -15, 5, -22, 18, -4, 30, -12, 9, -27, 14, 2, -6, 21, -18, 7, -10];
function makeTrials(avg) {
  return TRIAL_OFFSETS.map((o, i) => Math.round(avg + o + (i < PRACTICE_TRIALS ? 40 : 0)));
}

function seedResults() {
  const rec = (id, workerId, avg, tanggal) => ({
    id, workerId, avg: Math.round(avg), kategori: getCategory(avg),
    trials: makeTrials(avg), tanggal,
  });
  return [
    rec('s1', 'w1', 198, '2026-11-20T01:12:00.000Z'), // riwayat lama
    rec('s2', 'w1', 214, '2026-11-23T01:05:00.000Z'),
    rec('s3', 'w2', 352, '2026-11-23T15:40:00.000Z'),
    rec('s4', 'w3', 468, '2026-11-24T02:15:00.000Z'),
    rec('s5', 'w4', 612, '2026-11-24T06:30:00.000Z'),
    // w5 (Eko) belum pernah tes
  ];
}
