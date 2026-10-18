// The seven areas of the head and neck that Atlas covers, in both languages.
// `hit` are the selectable spheres on the hologram [x, y, z, radius] in the
// baked mesh frame (y up, face towards +z, neck base at y = -1.75).

export type Lang = 'es' | 'en';
export type Kind = 'patologia' | 'prueba' | 'cirugia' | 'cuidados';
export type Inner = 'ear' | 'sinus' | 'mouth' | 'pharynx' | 'larynx' | 'neck' | 'gland';

export interface Topic {
  key: string;
  kind: Kind;
  es: string;
  en: string;
}

export interface Zone {
  id: string;
  slug: Record<Lang, string>;
  name: Record<Lang, string>;
  sub: Record<Lang, string>;
  lede: Record<Lang, string>;
  hit: [number, number, number, number][];
  inner: Inner;
  topics: Topic[];
}

export const KINDS: Kind[] = ['patologia', 'prueba', 'cirugia', 'cuidados'];

export const zones: Zone[] = [
  {
    id: 'oido',
    slug: { es: 'oido', en: 'ear' },
    name: { es: 'Oído', en: 'Ear' },
    sub: { es: 'Audición y equilibrio', en: 'Hearing and balance' },
    lede: {
      es: 'El oído capta el sonido y, en su parte más interna, mantiene el equilibrio. Muchos mareos y vértigos nacen aquí.',
      en: 'The ear picks up sound and, in its innermost part, keeps you balanced. Many cases of dizziness and vertigo start here.',
    },
    hit: [[0.84, 0.05, -0.27, 0.22], [-0.84, 0.05, -0.27, 0.22]],
    inner: 'ear',
    topics: [
      { key: 'otitis-media', kind: 'patologia', es: 'Otitis media', en: 'Middle ear infection' },
      { key: 'otitis-externa', kind: 'patologia', es: 'Otitis externa', en: 'Outer ear infection' },
      { key: 'tapon-cerumen', kind: 'patologia', es: 'Tapón de cerumen', en: 'Earwax blockage' },
      { key: 'hipoacusia', kind: 'patologia', es: 'Hipoacusia', en: 'Hearing loss' },
      { key: 'acufenos', kind: 'patologia', es: 'Acúfenos', en: 'Tinnitus' },
      { key: 'vppb', kind: 'patologia', es: 'Vértigo posicional paroxístico benigno', en: 'Benign paroxysmal positional vertigo' },
      { key: 'meniere', kind: 'patologia', es: 'Enfermedad de Ménière', en: 'Ménière’s disease' },
      { key: 'otoscopia', kind: 'prueba', es: 'Otoscopia', en: 'Otoscopy' },
      { key: 'audiometria', kind: 'prueba', es: 'Audiometría tonal', en: 'Pure-tone audiometry' },
      { key: 'timpanometria', kind: 'prueba', es: 'Timpanometría', en: 'Tympanometry' },
      { key: 'videonistagmografia', kind: 'prueba', es: 'Videonistagmografía y vHIT', en: 'Videonystagmography and vHIT' },
      { key: 'drenajes', kind: 'cirugia', es: 'Drenajes transtimpánicos', en: 'Ear tubes (grommets)' },
      { key: 'miringoplastia', kind: 'cirugia', es: 'Miringoplastia', en: 'Myringoplasty' },
      { key: 'timpanoplastia', kind: 'cirugia', es: 'Timpanoplastia', en: 'Tympanoplasty' },
      { key: 'implante-coclear', kind: 'cirugia', es: 'Implante coclear', en: 'Cochlear implant' },
      { key: 'higiene-oido', kind: 'cuidados', es: 'Higiene del oído y bastoncillos', en: 'Ear hygiene and cotton buds' },
      { key: 'proteccion-ruido', kind: 'cuidados', es: 'Protección frente al ruido', en: 'Protecting your hearing from noise' },
    ],
  },
  {
    id: 'nariz',
    slug: { es: 'nariz', en: 'nose' },
    name: { es: 'Nariz y senos', en: 'Nose and sinuses' },
    sub: { es: 'Respiración y olfato', en: 'Breathing and smell' },
    lede: {
      es: 'La nariz filtra, calienta y humedece el aire. Los senos paranasales son cavidades conectadas a ella que pueden inflamarse.',
      en: 'The nose filters, warms and moistens the air you breathe. The sinuses are air spaces connected to it that can become inflamed.',
    },
    hit: [[0, -0.16, 1.0, 0.18]],
    inner: 'sinus',
    topics: [
      { key: 'rinitis-alergica', kind: 'patologia', es: 'Rinitis alérgica', en: 'Allergic rhinitis' },
      { key: 'desviacion-tabique', kind: 'patologia', es: 'Desviación del tabique', en: 'Deviated septum' },
      { key: 'sinusitis-cronica', kind: 'patologia', es: 'Sinusitis crónica', en: 'Chronic sinusitis' },
      { key: 'poliposis-nasal', kind: 'patologia', es: 'Pólipos nasales', en: 'Nasal polyps' },
      { key: 'epistaxis', kind: 'patologia', es: 'Sangrado nasal (epistaxis)', en: 'Nosebleeds (epistaxis)' },
      { key: 'anosmia', kind: 'patologia', es: 'Pérdida del olfato', en: 'Loss of smell' },
      { key: 'endoscopia-nasal', kind: 'prueba', es: 'Endoscopia nasal', en: 'Nasal endoscopy' },
      { key: 'tc-senos', kind: 'prueba', es: 'TC de senos paranasales', en: 'Sinus CT scan' },
      { key: 'olfatometria', kind: 'prueba', es: 'Pruebas de olfato', en: 'Smell tests' },
      { key: 'septoplastia', kind: 'cirugia', es: 'Septoplastia', en: 'Septoplasty' },
      { key: 'cens', kind: 'cirugia', es: 'Cirugía endoscópica de senos', en: 'Endoscopic sinus surgery' },
      { key: 'turbinoplastia', kind: 'cirugia', es: 'Reducción de cornetes', en: 'Turbinate reduction' },
      { key: 'lavados-nasales', kind: 'cuidados', es: 'Lavados nasales', en: 'Nasal saline rinses' },
      { key: 'sprays-nasales', kind: 'cuidados', es: 'Uso correcto de los sprays nasales', en: 'Using nasal sprays correctly' },
    ],
  },
  {
    id: 'boca',
    slug: { es: 'boca', en: 'mouth' },
    name: { es: 'Boca', en: 'Mouth' },
    sub: { es: 'Cavidad oral', en: 'Oral cavity' },
    lede: {
      es: 'Labios, lengua, encías y paladar. Una llaga que no se cura en dos o tres semanas siempre merece una revisión.',
      en: 'Lips, tongue, gums and palate. A mouth sore that has not healed after two or three weeks should always be checked.',
    },
    hit: [[0, -0.5, 0.9, 0.16]],
    inner: 'mouth',
    topics: [
      { key: 'aftas', kind: 'patologia', es: 'Aftas', en: 'Mouth ulcers' },
      { key: 'leucoplasia', kind: 'patologia', es: 'Leucoplasia', en: 'Leukoplakia' },
      { key: 'candidiasis-oral', kind: 'patologia', es: 'Candidiasis oral', en: 'Oral thrush' },
      { key: 'frenillo-lingual', kind: 'patologia', es: 'Frenillo lingual corto', en: 'Tongue-tie' },
      { key: 'exploracion-oral', kind: 'prueba', es: 'Exploración de la boca', en: 'Mouth examination' },
      { key: 'biopsia-oral', kind: 'prueba', es: 'Biopsia', en: 'Biopsy' },
      { key: 'frenectomia', kind: 'cirugia', es: 'Frenectomía', en: 'Frenotomy' },
      { key: 'exeresis-lesiones-orales', kind: 'cirugia', es: 'Extirpación de lesiones', en: 'Removal of mouth lesions' },
      { key: 'higiene-oral', kind: 'cuidados', es: 'Higiene y salud de la boca', en: 'Oral hygiene and health' },
    ],
  },
  {
    id: 'garganta',
    slug: { es: 'garganta', en: 'throat' },
    name: { es: 'Garganta', en: 'Throat' },
    sub: { es: 'Faringe y amígdalas', en: 'Pharynx and tonsils' },
    lede: {
      es: 'La faringe es el tubo que une la nariz y la boca con el esófago y la laringe. Aquí están las amígdalas y las vegetaciones.',
      en: 'The pharynx is the passage that connects the nose and mouth to the gullet and voice box. The tonsils and adenoids sit here.',
    },
    hit: [[0, -0.98, 0.44, 0.13]],
    inner: 'pharynx',
    topics: [
      { key: 'amigdalitis', kind: 'patologia', es: 'Amigdalitis de repetición', en: 'Recurrent tonsillitis' },
      { key: 'faringitis', kind: 'patologia', es: 'Faringitis', en: 'Sore throat (pharyngitis)' },
      { key: 'saos', kind: 'patologia', es: 'Ronquido y apnea del sueño', en: 'Snoring and sleep apnoea' },
      { key: 'reflujo-faringolaringeo', kind: 'patologia', es: 'Reflujo faringolaríngeo', en: 'Laryngopharyngeal reflux' },
      { key: 'nasofibrolaringoscopia', kind: 'prueba', es: 'Nasofibrolaringoscopia', en: 'Flexible nasendoscopy' },
      { key: 'poligrafia', kind: 'prueba', es: 'Poligrafía del sueño', en: 'Home sleep study' },
      { key: 'dise', kind: 'prueba', es: 'Somnoscopia (DISE)', en: 'Drug-induced sleep endoscopy (DISE)' },
      { key: 'amigdalectomia', kind: 'cirugia', es: 'Amigdalectomía', en: 'Tonsillectomy' },
      { key: 'adenoidectomia', kind: 'cirugia', es: 'Adenoidectomía', en: 'Adenoidectomy' },
      { key: 'cirugia-ronquido', kind: 'cirugia', es: 'Cirugía del ronquido', en: 'Snoring surgery' },
      { key: 'postoperatorio-amigdalas', kind: 'cuidados', es: 'Cuidados tras quitar las amígdalas', en: 'Recovery after tonsillectomy' },
    ],
  },
  {
    id: 'laringe',
    slug: { es: 'laringe', en: 'larynx' },
    name: { es: 'Laringe', en: 'Larynx' },
    sub: { es: 'Voz y vía aérea', en: 'Voice and airway' },
    lede: {
      es: 'Contiene las cuerdas vocales. Produce la voz y protege la vía aérea al tragar. Una ronquera de más de tres semanas debe valorarse.',
      en: 'It holds the vocal cords. It makes your voice and protects your airway when you swallow. Hoarseness lasting more than three weeks should be assessed.',
    },
    hit: [[0, -1.18, 0.4, 0.14]],
    inner: 'larynx',
    topics: [
      { key: 'disfonia', kind: 'patologia', es: 'Disfonía (ronquera)', en: 'Hoarseness (dysphonia)' },
      { key: 'nodulos-polipos', kind: 'patologia', es: 'Nódulos y pólipos vocales', en: 'Vocal nodules and polyps' },
      { key: 'laringitis', kind: 'patologia', es: 'Laringitis', en: 'Laryngitis' },
      { key: 'paralisis-cuerda-vocal', kind: 'patologia', es: 'Parálisis de cuerda vocal', en: 'Vocal cord paralysis' },
      { key: 'laringoscopia', kind: 'prueba', es: 'Laringoscopia', en: 'Laryngoscopy' },
      { key: 'videoestroboscopia', kind: 'prueba', es: 'Videoestroboscopia', en: 'Videostroboscopy' },
      { key: 'microcirugia-laringea', kind: 'cirugia', es: 'Microcirugía laríngea', en: 'Laryngeal microsurgery' },
      { key: 'higiene-vocal', kind: 'cuidados', es: 'Higiene vocal', en: 'Looking after your voice' },
    ],
  },
  {
    id: 'cuello',
    slug: { es: 'cuello', en: 'neck' },
    name: { es: 'Cuello', en: 'Neck' },
    sub: { es: 'Ganglios, quistes y tiroides', en: 'Lymph nodes, cysts and thyroid' },
    lede: {
      es: 'Por el cuello pasan ganglios, vasos y nervios, y en él está el tiroides. Un bulto que persiste más de dos o tres semanas se estudia.',
      en: 'Lymph nodes, blood vessels and nerves run through the neck, and the thyroid sits here. A lump that lasts more than two or three weeks should be investigated.',
    },
    hit: [[0.42, -1.38, 0.05, 0.24], [-0.42, -1.38, 0.05, 0.24], [0, -1.35, -0.62, 0.3]],
    inner: 'neck',
    topics: [
      { key: 'bulto-cuello', kind: 'patologia', es: 'Bultos en el cuello', en: 'Neck lumps' },
      { key: 'adenopatias', kind: 'patologia', es: 'Ganglios inflamados', en: 'Swollen lymph nodes' },
      { key: 'quistes-congenitos', kind: 'patologia', es: 'Quistes congénitos', en: 'Congenital neck cysts' },
      { key: 'nodulo-tiroideo', kind: 'patologia', es: 'Nódulos tiroideos', en: 'Thyroid nodules' },
      { key: 'ecografia-cervical', kind: 'prueba', es: 'Ecografía de cuello', en: 'Neck ultrasound' },
      { key: 'paaf', kind: 'prueba', es: 'Punción (PAAF)', en: 'Fine-needle aspiration (FNA)' },
      { key: 'imagen-cuello', kind: 'prueba', es: 'TC o RM de cuello', en: 'Neck CT or MRI' },
      { key: 'biopsia-ganglionar', kind: 'cirugia', es: 'Biopsia ganglionar', en: 'Lymph node biopsy' },
      { key: 'exeresis-quistes', kind: 'cirugia', es: 'Extirpación de quistes', en: 'Neck cyst removal' },
      { key: 'tiroidectomia', kind: 'cirugia', es: 'Tiroidectomía', en: 'Thyroidectomy' },
      { key: 'bulto-cuando-consultar', kind: 'cuidados', es: 'Un bulto en el cuello: cuándo consultar', en: 'A neck lump: when to see a doctor' },
    ],
  },
  {
    id: 'salivales',
    slug: { es: 'glandulas-salivales', en: 'salivary-glands' },
    name: { es: 'Glándulas salivales', en: 'Salivary glands' },
    sub: { es: 'Parótida y submaxilar', en: 'Parotid and submandibular' },
    lede: {
      es: 'Producen la saliva. La parótida está delante de la oreja y la submaxilar bajo la mandíbula. Pueden inflamarse o formar piedras.',
      en: 'They make saliva. The parotid sits in front of the ear and the submandibular gland under the jaw. They can swell or form stones.',
    },
    hit: [[0.7, -0.28, 0.05, 0.16], [-0.7, -0.28, 0.05, 0.16], [0.42, -0.95, 0.36, 0.13], [-0.42, -0.95, 0.36, 0.13]],
    inner: 'gland',
    topics: [
      { key: 'sialolitiasis', kind: 'patologia', es: 'Piedras salivales (sialolitiasis)', en: 'Salivary stones (sialolithiasis)' },
      { key: 'parotiditis', kind: 'patologia', es: 'Parotiditis', en: 'Parotitis' },
      { key: 'tumores-parotida', kind: 'patologia', es: 'Tumores de parótida', en: 'Parotid tumours' },
      { key: 'xerostomia', kind: 'patologia', es: 'Boca seca (xerostomía)', en: 'Dry mouth (xerostomia)' },
      { key: 'ecografia-salival', kind: 'prueba', es: 'Ecografía', en: 'Ultrasound' },
      { key: 'sialendoscopia-diagnostica', kind: 'prueba', es: 'Sialendoscopia diagnóstica', en: 'Diagnostic sialendoscopy' },
      { key: 'rm-salival', kind: 'prueba', es: 'Resonancia magnética', en: 'MRI scan' },
      { key: 'sialendoscopia', kind: 'cirugia', es: 'Sialendoscopia', en: 'Sialendoscopy' },
      { key: 'parotidectomia', kind: 'cirugia', es: 'Parotidectomía', en: 'Parotidectomy' },
      { key: 'submaxilectomia', kind: 'cirugia', es: 'Submaxilectomía', en: 'Submandibular gland removal' },
      { key: 'boca-seca-consejos', kind: 'cuidados', es: 'Consejos para la boca seca', en: 'Tips for dry mouth' },
    ],
  },
];

export const zoneById = (id: string) => zones.find((z) => z.id === id);
export const zoneBySlug = (lang: Lang, slug: string) => zones.find((z) => z.slug[lang] === slug);
