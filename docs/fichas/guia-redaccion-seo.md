# Guía de redacción y SEO de las fichas

Esta guía vale para todas las fichas de **info.jgarciaarteaga.pro**: patologías, pruebas, cirugías y cuidados. Cada tipo tiene además su propia plantilla con los apartados (`plantilla-*.md`).

---

## 1. Para quién escribimos

- **Pacientes y familiares**, no médicos. Personas que acaban de salir de la consulta o que buscan en Google lo que les pasa.
- Nivel de lectura: **el de un periódico** (alumno de 12-14 años). Si una frase necesita releerse, se reescribe.
- El paciente busca tres cosas: **qué tengo, qué me van a hacer y qué tengo que hacer yo**. Todo lo demás es secundario.

## 2. Voz y estilo

| Aspecto | Norma |
|---|---|
| Tratamiento | **Tú** en español; **you** en inglés. |
| Quién habla | El Dr. García Arteaga. En consulta, **primera persona del plural** («te exploramos», «te tumbamos»). Para opiniones o aclaraciones personales, **primera del singular** («es un vídeo que no he elaborado yo»). |
| Frases | Cortas: **una idea por frase**, 15-20 palabras de media. Párrafos de 2-4 frases. |
| Términos técnicos | Se dicen **una vez en negrita y se explican** al momento: «unos cristales microscópicos de calcio llamados **otoconias**». Después, se usa la palabra sencilla. |
| Tono | Tranquilizador y honesto. Ni alarmista ni triunfalista. Si algo es raro, se dice que es raro; si es grave, se dice con claridad. |
| Cifras | Concretas y redondeadas: «en unos 10 o 15 minutos», «la mayoría de las personas», «más de cuatro semanas». Evitar porcentajes sueltos si no aportan. |
| Negrita | Solo para lo que el paciente debe retener (síntomas clave, plazos, prohibiciones). Como máximo 2-3 por párrafo o elemento de lista. |
| Listas | Para síntomas, causas, pasos y recomendaciones. Cada elemento empieza en minúscula si continúa una frase («Es más frecuente: - a partir de los 50 años;»), o en mayúscula con la idea clave en negrita si es independiente. |
| Tablas | Solo para pautas o comparaciones (dosis, horarios, «qué es normal / qué no»). |
| Prohibido | Precios, nombres comerciales de fármacos (salvo que no haya alternativa), promesas de resultados («garantizado», «sin riesgos»), comparaciones con otros profesionales, testimonios. |

**Inglés:** inglés británico (*manoeuvre, tumour, oesophagus, anaesthetic, paediatric, ENT clinic*). **No es una traducción literal**: se adapta al modo en que un paciente anglosajón lo buscaría (p. ej. «grommets / ear tubes», «glue ear»). El número de urgencias se escribe así: *Call 112 (in Spain) or your local emergency number*.

## 3. SEO: qué hay que decidir antes de escribir

Las páginas médicas son para Google contenido «YMYL» (afecta a la salud): premia la **experiencia, autoría identificable, fuentes fiables y fecha de revisión**. La web ya pone autor, revisor, fecha, migas de pan y datos estructurados (`MedicalWebPage`). Lo que depende de la redacción es esto:

### 3.1 Palabra clave principal y secundarias

Antes de redactar, define y entrega en la **ficha SEO** (ver §6):

- **Palabra clave principal:** cómo lo escribiría un paciente en Google. Suele ser el nombre común + el técnico: «vértigo posicional», «tapón de cera en el oído», «operación de amígdalas».
- **3-6 palabras clave secundarias:** sinónimos, términos coloquiales, siglas y búsquedas de intención («vértigo al girarse en la cama», «VPPB», «maniobra de Epley», «cristales del oído»).
- **Preguntas reales de los pacientes:** las que aparecen en «Otras preguntas de los usuarios» de Google o las que se oyen en consulta. Alimentan los títulos de apartado y las preguntas frecuentes.

### 3.2 Dónde colocarlas (sin forzarlas)

| Lugar | Norma |
|---|---|
| `title` | Palabra clave principal **al principio**. Ideal **≤ 45 caracteres** (la web añade « · Juan García Arteaga, ORL»; Google corta hacia los 60). Si hay sigla o nombre coloquial, entre paréntesis: «Vértigo posicional paroxístico benigno (VPPB)». |
| `slug` | La palabra clave en minúsculas, sin tildes ni eñes, separada por guiones, **3-6 palabras**, sin artículos ni preposiciones sobrantes: `vertigo-posicional-paroxistico-benigno`, `operacion-amigdalas`. **No se cambia nunca una vez publicado.** |
| `summary` | Es la **meta descripción** de Google y la entradilla de la página. **140-160 caracteres** (máx. 200), con la palabra clave principal en los primeros 60 caracteres. Debe decir qué es y qué gana el lector al leer: «La causa más frecuente de vértigo. … Se trata en consulta con maniobras sencillas.» |
| Primer párrafo | La palabra clave principal aparece **en la primera o segunda frase**, y la definición cabe en **40-60 palabras** (Google la usa para fragmentos destacados). |
| Títulos `##` | Formulados **como preguntas que el paciente busca** («¿Cómo se trata?», «¿Duele la audiometría?»). Al menos 2-3 contienen la palabra clave o un sinónimo de forma natural. |
| Cuerpo | Las secundarias se reparten donde encajen. **Nunca** repetir la principal por repetir: Google penaliza el relleno y el lector lo nota. |
| Preguntas frecuentes | 4-8 preguntas **literales** de paciente, con respuesta que empiece por la conclusión («No.», «Sí, pero…», «Unos 20 minutos.»). |

### 3.3 Enlaces

- **Internos (2-5 por ficha):** a otras fichas relacionadas de la web (la patología ↔ su prueba ↔ su cirugía ↔ sus cuidados). Usa el nombre del tema como texto del enlace, nunca «aquí» o «este enlace». Formato:
  - Español: `[texto](/es/zonas/<zona>/<slug>/)`
  - Inglés: `[text](/en/areas/<area>/<slug>/)`
  - Si la ficha enlazada aún no existe, márcalo como `[[ENLACE: nombre del tema]]` y lo resuelvo al publicar.
- **Externos:** solo a fuentes de calidad (guías clínicas, sociedades científicas, artículos con DOI, organismos públicos). Van en `references`, no sembrados por el texto. Excepción: un recurso útil para el paciente (un vídeo, una asociación), indicando que es externo.

### 3.4 Imágenes y componentes

No hace falta crear la imagen en el chat. Basta con **describirla**:

- **Imagen de cabecera (opcional):** idea en una frase + texto alternativo (`coverAlt`) que describa la escena para alguien que no la ve, en 1-2 frases, sin «imagen de…».
- **Ilustraciones o animaciones dentro del texto:** marca el lugar con `[[ILUSTRACIÓN: qué debe mostrar y qué tiene que entender el paciente]]`. Yo la convierto en imagen o componente.

### 3.5 Longitud orientativa

| Tipo | Palabras (sin referencias) |
|---|---|
| Patología | 900-1.500 |
| Prueba diagnóstica | 600-1.000 |
| Cirugía o procedimiento | 1.000-1.600 |
| Cuidados y recomendaciones | 500-1.000 |

Mejor corto y completo que largo y repetido. La longitud no posiciona; resolver la duda del paciente, sí.

## 4. Rigor médico y referencias

- Basado en **guías de práctica clínica actuales** (SEORL-CCC, AAO-HNS, NICE, EAACI, EPOS, Bárány Society…) y revisiones recientes. Prioriza las de los **últimos 5-10 años**.
- **3-6 referencias** por ficha, en formato Vancouver abreviado, con DOI cuando lo tenga:
  ```yaml
  - label: "Apellido A, et al. Título del artículo. Revista abreviada. Año;Vol(Núm):págs."
    url: https://doi.org/10.xxxx/xxxxx
  ```
- **Toda referencia debe existir y estar comprobada.** Si el chat no puede verificar un DOI, que lo deje sin `url` y lo marque con `# VERIFICAR`. Yo las compruebo en PubMed antes de publicar.
- Lo que sea práctica personal del Dr. (y no consenso) se dice como tal: «En mi consulta suelo…». Si el chat no la conoce, la marca con `[[CONFIRMAR: …]]` y la pregunta; nunca la inventa.
- La versión inglesa usa las mismas referencias; si una guía española tiene título oficial en inglés, se usa ese.

## 5. Formato técnico (para que se pueda publicar sin retoques)

- Markdown. **Sin `#` (H1)** en el cuerpo: el título lo pone la web desde `title`.
- Apartados con `##` y subapartados con `###`. No bajar a `####`.
- Las preguntas frecuentes van como: `**¿Pregunta?**` en una línea y la respuesta en la línea siguiente.
- No usar emojis, HTML, notas a pie ni colores.
- La fecha `updated` es la de la última revisión médica (formato `AAAA-MM-DD`).
- Comillas: «angulares» o "rectas", pero las mismas en toda la ficha. En inglés, comillas rectas o ‘curvas’.
- Los valores del bloque YAML que contengan dos puntos (`:`) van entre comillas.

## 6. Qué entregar desde el chat

Para cada ficha, un único mensaje con **tres bloques**, en este orden:

1. **Ficha SEO** (no se publica; me sirve para revisar):
   ```
   Tipo: patología | prueba | cirugía | cuidados
   zone / topic: oido / vppb
   Palabra clave principal (es): …
   Palabras clave secundarias (es): …, …, …
   Primary keyword (en): …
   Secondary keywords (en): …, …, …
   Enlaces internos sugeridos: …
   Imagen de cabecera: idea + coverAlt (es / en)
   Notas para el Dr.: dudas, datos a confirmar, práctica personal a validar
   ```
2. **Ficha en español** completa: bloque YAML + cuerpo, en un bloque de código ```` ```markdown ````.
3. **Ficha en inglés** completa, mismo formato.

## 7. Lista de comprobación final

- [ ] `title` ≤ 45 caracteres aprox., palabra clave al principio.
- [ ] `slug` en minúsculas, sin tildes, 3-6 palabras.
- [ ] `summary` entre 140 y 160 caracteres, con la palabra clave al inicio.
- [ ] Primer párrafo: define el tema en 40-60 palabras e incluye la palabra clave.
- [ ] Títulos `##` en forma de pregunta del paciente; ninguno vacío.
- [ ] Términos técnicos explicados la primera vez.
- [ ] Apartado de **señales de alarma / cuándo consultar** presente (salvo que no aplique, y entonces se justifica en las notas).
- [ ] 4-8 preguntas frecuentes con respuesta que empieza por la conclusión.
- [ ] 2-5 enlaces internos; ninguno con el texto «aquí».
- [ ] 3-6 referencias reales, recientes, con DOI cuando exista.
- [ ] Sin precios, marcas, promesas ni testimonios.
- [ ] Versión inglesa adaptada (no calcada), en inglés británico, con sus propias palabras clave y slug.
