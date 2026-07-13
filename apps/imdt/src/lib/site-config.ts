// ── Central site config — IM Dynamic Torque ─────────────────────────
// One place for business data + Malay copy. Edit here, not in components.
// TODO: replace the PLACEHOLDER contact + location values with the real ones.

export const SITE_URL = 'https://imdynamictorque.com';

export const BIZ = {
  name: 'IM Dynamic Torque',
  legalName: 'IM Dynamic Torque — Pakar Transmisi & Servis Kereta',
  tagline: 'Pakar Transmisi Auto & CVT',
  since: 2020,
  // Positioning line — shown as the hero eyebrow.
  trustline: 'Pakar Transmisi Auto & CVT · Diagnostik Telus',
  feeRM: 10,

  // ── Real imagery (the biggest trust + premium lever) ──
  // Drop real photos into /public and reference them here.
  heroImage: '/hero.jpg',
  gallery: [] as { src: string; caption: string }[],

  // Where a customer can buy an OBD2 adapter if they don't have one.
  purchase: {
    online: '#', // TODO: pautan produk sebenar (Shopee / Lazada / kedai sendiri)
  },

  // ── Contact / location — PLACEHOLDERS, replace with the real details ──
  whatsapp: '60123456789', // TODO: nombor WhatsApp sebenar, format antarabangsa tanpa '+'
  phoneDisplay: '012-345 6789', // TODO
  addressLine: 'Alamat bengkel anda di sini', // TODO
  city: 'Kuala Lumpur', // TODO
  state: 'Wilayah Persekutuan', // TODO
  country: 'MY',
  geo: { lat: 3.139, lng: 101.6869 }, // TODO: pin sebenar bengkel

  hours: 'Isnin–Sabtu, 9:00 pagi – 6:00 petang',

  // Service slots offered for the RM10 inspection booking.
  slots: [
    '9:00 pagi – 11:00 pagi',
    '11:00 pagi – 1:00 tengah hari',
    '2:00 petang – 4:00 petang',
    '4:00 petang – 6:00 petang',
  ],
};

export function waLink(text: string): string {
  return `https://wa.me/${BIZ.whatsapp}?text=${encodeURIComponent(text)}`;
}

// ── Malay copy ──────────────────────────────────────────────────────
export const COPY = {
  nav: {
    book: 'Tempah Slot',
    whatsapp: 'WhatsApp',
  },
  hero: {
    eyebrow: BIZ.trustline,
    title: 'Kenapa lampu enjin anda menyala?',
    sub: 'Cucuk adapter OBD2 dan imbas kod kerosakan kereta anda secara percuma. Lihat masalahnya, kemudian tempah slot pembaikan — deposit RM10 ditolak sepenuhnya dari kos servis.',
    cta: 'Imbas Kod Kerosakan',
    ctaSub: 'Percuma · tanpa app · tanpa akaun',
  },
  scanner: {
    step1: 'Sambung adapter anda',
    step2: 'Imbas kod kerosakan',
    step3: 'Tempah slot untuk baiki — RM{fee}',
    connect: 'Sambung Adapter OBD2',
    connecting: 'Menyambung…',
    connectHint: 'Pelayar anda akan buka pemilih Bluetooth — pilih adapter ELM327 / Vgate anda. Cucuk ke port OBD2 kereta dengan kunci dihidupkan.',
    connected: 'Adapter disambung',
    disconnect: 'Putus',
    detect: 'Imbas Kod Kerosakan',
    detecting: 'Mengimbas…',
    rescan: 'Imbas Semula',
    foundPre: 'Kami jumpa',
    foundPost: 'kod kerosakan:',
    clean: 'Tiada kod kerosakan — kereta anda bersih.',
    cleanSub: 'Mahu pemeriksaan penuh? Tempah slot di bawah.',
    unsupportedTitle: 'Pengimbasan perlukan Chrome di Android atau desktop',
    unsupportedBody: 'Pengimbasan kod secara langsung menggunakan Web Bluetooth, yang tidak disokong iPhone/Safari. Anda masih boleh tempah slot di bawah dan kami akan imbaskan untuk anda.',
    detectHint: 'Pastikan kunci kereta dihidupkan, kemudian tekan butang di atas untuk mula mengimbas.',
  },
  prep: {
    title: 'Sebelum Mula',
    intro: 'Anda perlukan adapter OBD2 Bluetooth (jenis BLE), dan telefon Android (pelayar Chrome) atau laptop. Ikut 3 langkah mudah ini:',
    steps: [
      'Cucuk adapter OBD2 ke port di bawah stereng (kebiasaannya sebelah kanan pemandu).',
      'Hidupkan kunci kereta — lebih baik hidupkan enjin supaya semua kod dapat dibaca.',
      'Tekan "Sambung Adapter" di bawah, pilih adapter anda, kemudian tekan "Imbas".',
    ],
    noAdapter: 'Tiada adapter OBD2?',
    noAdapterSub: 'Dapatkan satu — murah dan boleh guna berulang kali.',
    buyWorkshop: 'Beli di Bengkel',
    buyOnline: 'Beli Online',
    orBook: 'Atau tempah slot terus — kami akan imbaskan untuk anda di bengkel.',
  },
  specialties: {
    title: 'Kepakaran Kami',
    items: [
      { name: 'Pakar Gearbox', desc: 'Baik pulih & overhaul transmisi auto dan CVT.', img: '/service-gearbox.jpg' },
      { name: 'Towing (Tunda)', desc: 'Khidmat tunda kereta — kami datang kepada anda.', img: '/service-towing.jpg' },
      { name: 'Servis Harian', desc: 'Servis penyelenggaraan berkala & pemeriksaan menyeluruh.', img: '/service-daily.jpg' },
    ],
  },
  feature: {
    kicker: 'Bukan Bengkel Biasa',
    body: 'Gearbox dan transmisi adalah kerja yang rumit — silap diagnosa, mahal. Kami fokus pada baik pulih gearbox auto & CVT dengan jujur: tunjuk masalah sebenar dahulu, kemudian baiki dengan betul.',
    points: [
      'Diagnosis telus sebelum sebarang kerja',
      'Tumpuan khusus gearbox auto & CVT',
      'Towing jika kereta tak boleh bergerak',
    ],
  },
  location: {
    title: 'Lokasi Kami',
  },
  booking: {
    heading: 'Tempah Slot Pemeriksaan',
  },
} as const;
