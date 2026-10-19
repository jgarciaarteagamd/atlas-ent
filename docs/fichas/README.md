# Fichas: plantillas para redactar fuera de la web

Las fichas se pueden redactar en otro chat y traerlas ya terminadas para publicarlas de una vez.
Esta carpeta contiene todo lo que ese chat necesita para entregarlas en el formato de la web y optimizadas para Google.

| Archivo | Para qué |
|---|---|
| [`instrucciones-proyecto.md`](instrucciones-proyecto.md) | Texto para las instrucciones del Proyecto de Claude donde se redactan las fichas. |
| [`guia-redaccion-seo.md`](guia-redaccion-seo.md) | Normas comunes: público, estilo, SEO, referencias, formato y qué entregar. **Siempre.** |
| [`plantilla-patologia.md`](plantilla-patologia.md) | Enfermedades y problemas (otitis, sinusitis, ronquera…). |
| [`plantilla-prueba.md`](plantilla-prueba.md) | Pruebas diagnósticas (audiometría, endoscopia, PAAF…). |
| [`plantilla-cirugia.md`](plantilla-cirugia.md) | Cirugías y procedimientos (amigdalectomía, septoplastia…). |
| [`plantilla-cuidados.md`](plantilla-cuidados.md) | Cuidados, ejercicios y recomendaciones (lavados nasales, higiene vocal…). |

## Flujo de trabajo

1. **Abre un chat nuevo**, mejor dentro de un Proyecto de Claude configurado con [`instrucciones-proyecto.md`](instrucciones-proyecto.md) y con la guía, las plantillas y este README como conocimiento del proyecto. Así basta con decir el tema y no hay que adjuntar nada.
2. Si no usas el Proyecto, **adjunta o pega** `guia-redaccion-seo.md` y la plantilla del tipo de ficha.
3. **Pega el mensaje inicial** de abajo, cambiando los datos del tema.
4. **Revisa** el borrador como médico: datos, práctica personal, tono. Pide los cambios en ese mismo chat.
5. Cuando tengas varias fichas listas, **tráelas aquí juntas** (ficha SEO + ES + EN de cada una). Yo compruebo referencias y enlaces, preparo ilustraciones, las encajo en la web y publico todo en un solo despliegue.

## Mensaje inicial para el chat

````text
Vas a redactar una ficha informativa para pacientes de mi web de otorrinolaringología
(jgarciaarteaga.pro). Soy el Dr. Juan García Arteaga, ORL.

Sigue al pie de la letra la guía adjunta (guia-redaccion-seo.md) y la plantilla adjunta
(plantilla-<tipo>.md).

Tema: <nombre del tema>
Tipo: <patología | prueba | cirugía | cuidados>
zone: <id de zona>    topic: <clave del tema>
Fichas relacionadas para enlazar: <opcional>
Lo que suelo hacer yo en consulta / mensajes que quiero transmitir: <opcional>

Antes de redactar, propón la ficha SEO (palabras clave en español e inglés, title, slug,
summary y preguntas que buscan los pacientes) y espera a que la apruebe. Después entrega
la ficha en español y en inglés, cada una en un bloque ```markdown, como indica el
apartado 6 de la guía. Usa solo referencias reales y verificables; si no puedes comprobar
una, márcala con # VERIFICAR.
````

## Catálogo de temas

Valores de `zone` y `topic` para el bloque YAML. El `slug` lo elige el chat (ver la guía, §3.2).
Para añadir un tema que no esté en la lista, indícalo en las notas de la ficha SEO y lo creo al publicar.

### Oído · Ear

zone: `oido` · URL: `/es/zonas/oido/<slug>/` y `/en/areas/ear/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `otitis-media` | Patología | Otitis media | Middle ear infection |
| `otitis-externa` | Patología | Otitis externa | Outer ear infection |
| `tapon-cerumen` | Patología | Tapón de cerumen | Earwax blockage |
| `hipoacusia` | Patología | Hipoacusia | Hearing loss |
| `acufenos` | Patología | Acúfenos | Tinnitus |
| `disfuncion-tubarica` | Patología | Disfunción de la trompa de Eustaquio | Eustachian tube dysfunction |
| `vppb` | Patología | Vértigo posicional paroxístico benigno | Benign paroxysmal positional vertigo |
| `meniere` | Patología | Enfermedad de Ménière | Ménière’s disease |
| `migrana-vestibular` | Patología | Migraña vestibular | Vestibular migraine |
| `trastornos-temporomandibulares` | Patología | Trastorno de la ATM (síndrome de Costen) | TMJ disorder |
| `otoscopia` | Prueba | Otoscopia | Otoscopy |
| `audiometria` | Prueba | Audiometría tonal | Pure-tone audiometry |
| `timpanometria` | Prueba | Timpanometría (impedanciometría) | Tympanometry |
| `videonistagmografia` | Prueba | Videonistagmografía y vHIT | Videonystagmography and vHIT |
| `drenajes` | Cirugía | Drenajes transtimpánicos | Ear tubes (grommets) |
| `miringoplastia` | Cirugía | Miringoplastia | Myringoplasty |
| `timpanoplastia` | Cirugía | Timpanoplastia | Tympanoplasty |
| `implante-coclear` | Cirugía | Implante coclear | Cochlear implant |
| `brandt-daroff` | Cuidados | Ejercicios de Brandt-Daroff | Brandt-Daroff exercises |
| `prevencion-migrana` | Cuidados | Prevención de las crisis de migraña vestibular | Preventing vestibular migraine attacks |
| `cuidados-oidos-secos` | Cuidados | Cuidados de oídos secos | Dry ear care |
| `ejercicios-tubaricos` | Cuidados | Ejercicios para destapar los oídos | Exercises to unblock your ears |
| `cuidados-atm` | Cuidados | Cuidados de la ATM | TMJ self-care |
| `desarrollo-lenguaje` | Cuidados | Audición y lenguaje del niño | Child hearing and speech |
| `higiene-oido` | Cuidados | Higiene del oído y bastoncillos | Ear hygiene and cotton buds |
| `proteccion-ruido` | Cuidados | Protección frente al ruido | Protecting your hearing from noise |

### Nariz y senos · Nose and sinuses

zone: `nariz` · URL: `/es/zonas/nariz/<slug>/` y `/en/areas/nose/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `rinitis-alergica` | Patología | Rinitis alérgica | Allergic rhinitis |
| `desviacion-tabique` | Patología | Desviación del tabique | Deviated septum |
| `sinusitis-cronica` | Patología | Sinusitis crónica | Chronic sinusitis |
| `poliposis-nasal` | Patología | Pólipos nasales | Nasal polyps |
| `epistaxis` | Patología | Sangrado nasal (epistaxis) | Nosebleeds (epistaxis) |
| `anosmia` | Patología | Pérdida del olfato | Loss of smell |
| `tc-senos` | Prueba | TC de senos paranasales | Sinus CT scan |
| `olfatometria` | Prueba | Pruebas de olfato | Smell tests |
| `septoplastia` | Cirugía | Septoplastia | Septoplasty |
| `cens` | Cirugía | Cirugía endoscópica de senos | Endoscopic sinus surgery |
| `turbinoplastia` | Cirugía | Reducción de cornetes | Turbinate reduction |
| `lavados-nasales` | Cuidados | Lavados nasales | Nasal saline rinses |
| `sprays-nasales` | Cuidados | Uso correcto de los sprays nasales | Using nasal sprays correctly |

### Boca · Mouth

zone: `boca` · URL: `/es/zonas/boca/<slug>/` y `/en/areas/mouth/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `aftas` | Patología | Aftas | Mouth ulcers |
| `leucoplasia` | Patología | Leucoplasia | Leukoplakia |
| `candidiasis-oral` | Patología | Candidiasis oral | Oral thrush |
| `frenillo-lingual` | Patología | Frenillo lingual corto | Tongue-tie |
| `exploracion-oral` | Prueba | Exploración de la boca | Mouth examination |
| `biopsia-oral` | Prueba | Biopsia | Biopsy |
| `frenectomia` | Cirugía | Frenectomía | Frenotomy |
| `exeresis-lesiones-orales` | Cirugía | Extirpación de lesiones | Removal of mouth lesions |
| `higiene-oral` | Cuidados | Higiene y salud de la boca | Oral hygiene and health |

### Garganta · Throat

zone: `garganta` · URL: `/es/zonas/garganta/<slug>/` y `/en/areas/throat/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `amigdalitis` | Patología | Amigdalitis de repetición | Recurrent tonsillitis |
| `faringitis` | Patología | Faringitis | Sore throat (pharyngitis) |
| `saos` | Patología | Ronquido y apnea del sueño | Snoring and sleep apnoea |
| `reflujo-faringolaringeo` | Patología | Reflujo faringolaríngeo | Laryngopharyngeal reflux |
| `nasofibrolaringoscopia` | Prueba | Fibroscopia (nasofibrolaringoscopia) | Flexible nasendoscopy |
| `poligrafia` | Prueba | Poligrafía del sueño | Home sleep study |
| `dise` | Prueba | Somnoscopia (DISE) | Drug-induced sleep endoscopy (DISE) |
| `amigdalectomia` | Cirugía | Amigdalectomía | Tonsillectomy |
| `adenoidectomia` | Cirugía | Adenoidectomía | Adenoidectomy |
| `cirugia-ronquido` | Cirugía | Cirugía del ronquido | Snoring surgery |
| `cuidados-reflujo` | Cuidados | Dieta y cuidados para el reflujo | Reflux diet and lifestyle |
| `postoperatorio-amigdalas` | Cuidados | Cuidados tras quitar las amígdalas | Recovery after tonsillectomy |

### Laringe · Larynx

zone: `laringe` · URL: `/es/zonas/laringe/<slug>/` y `/en/areas/larynx/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `disfonia` | Patología | Disfonía (ronquera) | Hoarseness (dysphonia) |
| `disfonia-funcional` | Patología | Disfonía funcional | Functional dysphonia |
| `nodulos-polipos` | Patología | Nódulos y pólipos vocales | Vocal nodules and polyps |
| `laringitis` | Patología | Laringitis | Laryngitis |
| `paralisis-cuerda-vocal` | Patología | Parálisis de cuerda vocal | Vocal cord paralysis |
| `videoestroboscopia` | Prueba | Videoestroboscopia | Videostroboscopy |
| `microcirugia-laringea` | Cirugía | Microcirugía laríngea | Laryngeal microsurgery |
| `higiene-vocal` | Cuidados | Higiene vocal | Looking after your voice |

### Cuello · Neck

zone: `cuello` · URL: `/es/zonas/cuello/<slug>/` y `/en/areas/neck/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `bulto-cuello` | Patología | Bultos en el cuello | Neck lumps |
| `adenopatias` | Patología | Ganglios inflamados | Swollen lymph nodes |
| `quistes-congenitos` | Patología | Quistes congénitos | Congenital neck cysts |
| `nodulo-tiroideo` | Patología | Nódulos tiroideos | Thyroid nodules |
| `ecografia-cervical` | Prueba | Ecografía de cuello | Neck ultrasound |
| `paaf` | Prueba | Punción (PAAF) | Fine-needle aspiration (FNA) |
| `imagen-cuello` | Prueba | TC o RM de cuello | Neck CT or MRI |
| `biopsia-ganglionar` | Cirugía | Biopsia ganglionar | Lymph node biopsy |
| `exeresis-quistes` | Cirugía | Extirpación de quistes | Neck cyst removal |
| `tiroidectomia` | Cirugía | Tiroidectomía | Thyroidectomy |
| `bulto-cuando-consultar` | Cuidados | Un bulto en el cuello: cuándo consultar | A neck lump: when to see a doctor |

### Glándulas salivales · Salivary glands

zone: `salivales` · URL: `/es/zonas/glandulas-salivales/<slug>/` y `/en/areas/salivary-glands/<slug>/`

| topic | Tipo | Español | English |
|---|---|---|---|
| `sialolitiasis` | Patología | Piedras salivales (sialolitiasis) | Salivary stones (sialolithiasis) |
| `parotiditis` | Patología | Parotiditis | Parotitis |
| `tumores-parotida` | Patología | Tumores de parótida | Parotid tumours |
| `xerostomia` | Patología | Boca seca (xerostomía) | Dry mouth (xerostomia) |
| `ecografia-salival` | Prueba | Ecografía | Ultrasound |
| `sialendoscopia-diagnostica` | Prueba | Sialendoscopia diagnóstica | Diagnostic sialendoscopy |
| `rm-salival` | Prueba | Resonancia magnética | MRI scan |
| `sialendoscopia` | Cirugía | Sialendoscopia | Sialendoscopy |
| `parotidectomia` | Cirugía | Parotidectomía | Parotidectomy |
| `submaxilectomia` | Cirugía | Submaxilectomía | Submandibular gland removal |
| `cuidados-sialolitiasis` | Cuidados | Cuidados de las piedras salivales | Salivary stones self-care |
| `boca-seca-consejos` | Cuidados | Consejos para la boca seca | Tips for dry mouth |
