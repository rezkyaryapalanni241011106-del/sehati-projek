// Terjemahan Bahasa Indonesia untuk subset kode ICD-10 yang umum dipakai
// di layanan primer (Puskesmas/klinik). Diterapkan oleh import-icd10.ts
// SETELAH impor data Inggris dari XML — jadi deskripsi Inggris untuk kode-kode
// ini ditimpa dengan versi Indonesia. Sisa kode tetap berbahasa Inggris (WHO).
//
// Format: [kode, deskripsi (ID), kategori (ID)]
// Istilah medis tanpa padanan baku tetap memakai istilah aslinya.

export const ICD10_ID_OVERRIDES: Array<[string, string, string]> = [
  // ── Penyakit Infeksi ─────────────────────────────────────────────
  ['A00',   'Kolera', 'Penyakit Infeksi'],
  ['A01',   'Demam tifoid dan paratifoid', 'Penyakit Infeksi'],
  ['A01.0', 'Demam tifoid', 'Penyakit Infeksi'],
  ['A02',   'Infeksi Salmonella lainnya', 'Penyakit Infeksi'],
  ['A03',   'Shigellosis (disentri basiler)', 'Penyakit Infeksi'],
  ['A04',   'Infeksi usus akibat bakteri lainnya', 'Penyakit Infeksi'],
  ['A06',   'Amebiasis', 'Penyakit Infeksi'],
  ['A09',   'Diare dan gastroenteritis akibat penyebab menular dan tidak jelas', 'Penyakit Infeksi'],
  ['A15',   'Tuberkulosis paru', 'Penyakit Infeksi'],
  ['A16',   'Tuberkulosis paru tanpa konfirmasi bakteriologis atau histologis', 'Penyakit Infeksi'],
  ['A36',   'Difteri', 'Penyakit Infeksi'],
  ['A37',   'Batuk rejan (pertusis)', 'Penyakit Infeksi'],
  ['A39',   'Infeksi meningokokus', 'Penyakit Infeksi'],
  ['A90',   'Demam dengue', 'Penyakit Infeksi'],
  ['A91',   'Demam berdarah dengue (DBD)', 'Penyakit Infeksi'],
  ['B01',   'Cacar air (varisela)', 'Penyakit Infeksi'],
  ['B02',   'Herpes zoster', 'Penyakit Infeksi'],
  ['B05',   'Campak', 'Penyakit Infeksi'],
  ['B06',   'Rubela (campak Jerman)', 'Penyakit Infeksi'],
  ['B07',   'Kutil akibat virus', 'Penyakit Infeksi'],
  ['B15',   'Hepatitis A akut', 'Penyakit Infeksi'],
  ['B16',   'Hepatitis B akut', 'Penyakit Infeksi'],
  ['B18',   'Hepatitis virus kronis', 'Penyakit Infeksi'],
  ['B19',   'Hepatitis virus tanpa spesifikasi', 'Penyakit Infeksi'],
  ['B26',   'Gondongan (parotitis epidemika)', 'Penyakit Infeksi'],
  ['B34',   'Infeksi virus dengan lokasi tidak spesifik', 'Penyakit Infeksi'],
  ['B34.9', 'Infeksi virus tanpa spesifikasi', 'Penyakit Infeksi'],
  ['B35',   'Dermatofitosis (infeksi jamur kulit/kurap)', 'Penyakit Infeksi'],
  ['B37',   'Kandidiasis', 'Penyakit Infeksi'],
  ['B54',   'Malaria tanpa spesifikasi', 'Penyakit Infeksi'],
  ['B50',   'Malaria akibat Plasmodium falciparum', 'Penyakit Infeksi'],
  ['B81',   'Kecacingan usus lainnya', 'Penyakit Infeksi'],
  ['B82',   'Parasit usus tanpa spesifikasi', 'Penyakit Infeksi'],
  ['B86',   'Skabies (kudis)', 'Penyakit Infeksi'],
  ['B99',   'Penyakit menular lainnya dan tidak terspesifikasi', 'Penyakit Infeksi'],

  // ── Neoplasma & Darah ────────────────────────────────────────────
  ['D50',   'Anemia defisiensi besi', 'Penyakit Darah'],
  ['D64',   'Anemia lainnya', 'Penyakit Darah'],

  // ── Penyakit Metabolik & Endokrin ────────────────────────────────
  ['E03',   'Hipotiroidisme lainnya', 'Penyakit Endokrin'],
  ['E04',   'Gondok (struma) non-toksik lainnya', 'Penyakit Endokrin'],
  ['E05',   'Hipertiroidisme (tirotoksikosis)', 'Penyakit Endokrin'],
  ['E10',   'Diabetes melitus tipe 1', 'Penyakit Metabolik'],
  ['E11',   'Diabetes melitus tipe 2', 'Penyakit Metabolik'],
  ['E14',   'Diabetes melitus tanpa spesifikasi', 'Penyakit Metabolik'],
  ['E66',   'Obesitas', 'Penyakit Metabolik'],
  ['E78',   'Gangguan metabolisme lipoprotein dan lipidemia lain', 'Penyakit Metabolik'],
  ['E86',   'Penurunan volume cairan (dehidrasi)', 'Penyakit Metabolik'],
  ['E87',   'Gangguan keseimbangan cairan dan elektrolit lainnya', 'Penyakit Metabolik'],

  // ── Gangguan Mental ──────────────────────────────────────────────
  ['F20',   'Skizofrenia', 'Gangguan Mental'],
  ['F31',   'Gangguan afektif bipolar', 'Gangguan Mental'],
  ['F32',   'Episode depresif', 'Gangguan Mental'],
  ['F41',   'Gangguan ansietas (cemas) lainnya', 'Gangguan Mental'],
  ['F43',   'Reaksi terhadap stres berat dan gangguan penyesuaian', 'Gangguan Mental'],
  ['F45',   'Gangguan somatoform', 'Gangguan Mental'],
  ['F51',   'Gangguan tidur non-organik (insomnia)', 'Gangguan Mental'],

  // ── Penyakit Saraf ───────────────────────────────────────────────
  ['G40',   'Epilepsi', 'Penyakit Saraf'],
  ['G43',   'Migrain', 'Penyakit Saraf'],
  ['G44',   'Sindrom sakit kepala lainnya', 'Penyakit Saraf'],
  ['G47',   'Gangguan tidur', 'Penyakit Saraf'],

  // ── Penyakit Mata ────────────────────────────────────────────────
  ['H00',   'Hordeolum (bintitan) dan kalazion', 'Penyakit Mata'],
  ['H10',   'Konjungtivitis', 'Penyakit Mata'],
  ['H25',   'Katarak senilis', 'Penyakit Mata'],
  ['H40',   'Glaukoma', 'Penyakit Mata'],
  ['H52',   'Gangguan refraksi dan akomodasi', 'Penyakit Mata'],

  // ── Penyakit Telinga ─────────────────────────────────────────────
  ['H60',   'Otitis eksterna', 'Penyakit Telinga'],
  ['H66',   'Otitis media supuratif dan tanpa spesifikasi', 'Penyakit Telinga'],
  ['H81',   'Gangguan fungsi vestibular (vertigo)', 'Penyakit Telinga'],

  // ── Penyakit Kardiovaskular ──────────────────────────────────────
  ['I10',   'Hipertensi esensial (primer)', 'Penyakit Kardiovaskular'],
  ['I11',   'Penyakit jantung hipertensif', 'Penyakit Kardiovaskular'],
  ['I20',   'Angina pektoris', 'Penyakit Kardiovaskular'],
  ['I21',   'Infark miokard akut', 'Penyakit Kardiovaskular'],
  ['I25',   'Penyakit jantung iskemik kronis', 'Penyakit Kardiovaskular'],
  ['I25.9', 'Penyakit jantung iskemik kronis tanpa spesifikasi', 'Penyakit Kardiovaskular'],
  ['I48',   'Fibrilasi dan flutter atrium', 'Penyakit Kardiovaskular'],
  ['I50',   'Gagal jantung', 'Penyakit Kardiovaskular'],
  ['I63',   'Infark serebral (stroke iskemik)', 'Penyakit Kardiovaskular'],
  ['I64',   'Stroke tanpa spesifikasi perdarahan atau infark', 'Penyakit Kardiovaskular'],

  // ── Penyakit Saluran Napas ───────────────────────────────────────
  ['J00',   'Nasofaringitis akut (common cold)', 'Penyakit Saluran Napas'],
  ['J01',   'Sinusitis akut', 'Penyakit Saluran Napas'],
  ['J02',   'Faringitis akut', 'Penyakit Saluran Napas'],
  ['J03',   'Tonsilitis akut', 'Penyakit Saluran Napas'],
  ['J04',   'Laringitis dan trakeitis akut', 'Penyakit Saluran Napas'],
  ['J06',   'Infeksi saluran napas atas akut tidak spesifik', 'Penyakit Saluran Napas'],
  ['J11',   'Influenza akibat virus tidak teridentifikasi', 'Penyakit Saluran Napas'],
  ['J18',   'Pneumonia tanpa spesifikasi organisme', 'Penyakit Saluran Napas'],
  ['J20',   'Bronkitis akut', 'Penyakit Saluran Napas'],
  ['J30',   'Rinitis alergi dan vasomotor', 'Penyakit Saluran Napas'],
  ['J32',   'Sinusitis kronis', 'Penyakit Saluran Napas'],
  ['J35',   'Penyakit kronis tonsil dan adenoid', 'Penyakit Saluran Napas'],
  ['J40',   'Bronkitis tidak spesifik akut atau kronis', 'Penyakit Saluran Napas'],
  ['J44',   'Penyakit paru obstruktif kronis (PPOK) lainnya', 'Penyakit Saluran Napas'],
  ['J45',   'Asma', 'Penyakit Saluran Napas'],

  // ── Penyakit Pencernaan & Gigi ───────────────────────────────────
  ['K04',   'Penyakit pulpa dan periapikal', 'Penyakit Gigi'],
  ['K05',   'Gingivitis dan penyakit periodontal', 'Penyakit Gigi'],
  ['K21',   'Penyakit refluks gastroesofageal (GERD)', 'Penyakit Pencernaan'],
  ['K25',   'Ulkus (tukak) lambung', 'Penyakit Pencernaan'],
  ['K29',   'Gastritis dan duodenitis', 'Penyakit Pencernaan'],
  ['K30',   'Dispepsia fungsional', 'Penyakit Pencernaan'],
  ['K35',   'Apendisitis akut (radang usus buntu)', 'Penyakit Pencernaan'],
  ['K40',   'Hernia inguinalis', 'Penyakit Pencernaan'],
  ['K52',   'Gastroenteritis dan kolitis non-infeksi lainnya', 'Penyakit Pencernaan'],
  ['K58',   'Sindrom iritasi usus (irritable bowel syndrome)', 'Penyakit Pencernaan'],
  ['K59',   'Gangguan fungsional usus lainnya (konstipasi)', 'Penyakit Pencernaan'],
  ['K64',   'Wasir (hemoroid) dan trombosis vena perianal', 'Penyakit Pencernaan'],
  ['K80',   'Batu empedu (kolelitiasis)', 'Penyakit Pencernaan'],

  // ── Penyakit Kulit ───────────────────────────────────────────────
  ['L02',   'Abses kulit, furunkel, dan karbunkel', 'Penyakit Kulit'],
  ['L03',   'Selulitis', 'Penyakit Kulit'],
  ['L20',   'Dermatitis atopik', 'Penyakit Kulit'],
  ['L23',   'Dermatitis kontak alergi', 'Penyakit Kulit'],
  ['L29',   'Pruritus (gatal)', 'Penyakit Kulit'],
  ['L30',   'Dermatitis lainnya', 'Penyakit Kulit'],
  ['L50',   'Urtikaria (biduran)', 'Penyakit Kulit'],
  ['L70',   'Akne (jerawat)', 'Penyakit Kulit'],

  // ── Penyakit Muskuloskeletal ─────────────────────────────────────
  ['M06',   'Artritis reumatoid lainnya', 'Penyakit Muskuloskeletal'],
  ['M10',   'Gout (asam urat)', 'Penyakit Muskuloskeletal'],
  ['M15',   'Osteoartritis (poliartrosis)', 'Penyakit Muskuloskeletal'],
  ['M17',   'Osteoartritis lutut (gonartrosis)', 'Penyakit Muskuloskeletal'],
  ['M25',   'Gangguan sendi lainnya', 'Penyakit Muskuloskeletal'],
  ['M51',   'Gangguan diskus intervertebralis lainnya', 'Penyakit Muskuloskeletal'],
  ['M54',   'Nyeri punggung', 'Penyakit Muskuloskeletal'],
  ['M62',   'Gangguan otot lainnya', 'Penyakit Muskuloskeletal'],
  ['M79',   'Gangguan jaringan lunak lainnya', 'Penyakit Muskuloskeletal'],

  // ── Penyakit Urologi & Kelamin ───────────────────────────────────
  ['N18',   'Penyakit ginjal kronis', 'Penyakit Urologi'],
  ['N20',   'Batu ginjal dan ureter', 'Penyakit Urologi'],
  ['N30',   'Sistitis (radang kandung kemih)', 'Penyakit Urologi'],
  ['N39',   'Gangguan saluran kemih lainnya', 'Penyakit Urologi'],
  ['N40',   'Hiperplasia prostat (pembesaran prostat)', 'Penyakit Urologi'],
  ['N76',   'Peradangan vagina dan vulva lainnya', 'Penyakit Urologi'],
  ['N95',   'Gangguan menopause dan perimenopause', 'Penyakit Urologi'],

  // ── Kehamilan & Persalinan ───────────────────────────────────────
  ['O00',   'Kehamilan ektopik', 'Kehamilan & Persalinan'],
  ['O03',   'Abortus spontan (keguguran)', 'Kehamilan & Persalinan'],
  ['O20',   'Perdarahan pada awal kehamilan', 'Kehamilan & Persalinan'],

  // ── Gejala & Tanda Umum ──────────────────────────────────────────
  ['R05',   'Batuk', 'Gejala Umum'],
  ['R06',   'Gangguan pernapasan (sesak napas)', 'Gejala Umum'],
  ['R07',   'Nyeri tenggorokan dan dada', 'Gejala Umum'],
  ['R10',   'Nyeri perut dan panggul', 'Gejala Umum'],
  ['R11',   'Mual dan muntah', 'Gejala Umum'],
  ['R21',   'Ruam dan erupsi kulit lainnya', 'Gejala Umum'],
  ['R42',   'Pusing dan rasa berputar (dizziness)', 'Gejala Umum'],
  ['R50',   'Demam tanpa penyebab yang diketahui', 'Gejala Umum'],
  ['R51',   'Sakit kepala', 'Gejala Umum'],
  ['R53',   'Malaise (rasa tidak enak badan) dan kelelahan', 'Gejala Umum'],
  ['R55',   'Pingsan (sinkop) dan kolaps', 'Gejala Umum'],
  ['R60',   'Edema (bengkak) yang tidak terklasifikasi', 'Gejala Umum'],

  // ── Cedera & Keracunan ───────────────────────────────────────────
  ['S93',   'Dislokasi, keseleo, dan terkilir pada pergelangan kaki dan kaki', 'Cedera'],
  ['T14',   'Cedera pada bagian tubuh yang tidak terspesifikasi', 'Cedera'],
  ['T78',   'Efek samping (reaksi alergi) yang tidak terklasifikasi', 'Cedera'],

  // ── Kunjungan Preventif & Faktor Status Kesehatan ────────────────
  ['Z00',   'Pemeriksaan umum dan pengkajian pada orang sehat', 'Kunjungan Preventif'],
  ['Z23',   'Imunisasi terhadap penyakit bakteri tunggal', 'Kunjungan Preventif'],
  ['Z34',   'Pengawasan kehamilan normal', 'Kunjungan Preventif'],
];
