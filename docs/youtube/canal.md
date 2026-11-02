# Canal de YouTube · @jgarciaarteaga

Todo lo necesario para personalizar el canal [youtube.com/@jgarciaarteaga](https://www.youtube.com/@jgarciaarteaga) con la misma imagen y el mismo tono que la web.
Los textos siguen la [guía de redacción](../fichas/guia-redaccion-seo.md): tuteo, frases cortas, tono tranquilizador y sin promesas.

Todo se cambia en **YouTube Studio → Personalización** (en el móvil: app YouTube Studio → Perfil → editar).

---

## 1. Imágenes (pestaña «Imagen de marca»)

| Archivo | Dónde va | Notas |
|---|---|---|
| `brand/social/youtube-avatar.png` (800 × 800) | Imagen | YouTube la recorta en círculo. Solo el isotipo JGA, para que se lea incluso a 24 px en los comentarios. |
| `brand/social/youtube-banner-es.png` (2560 × 1440) | Imagen del banner | Todo lo importante está en la franja central de 1546 × 423, que es lo único que se ve en el móvil. La tele muestra la imagen entera. |
| `brand/social/youtube-watermark.png` (150 × 150, fondo transparente) | Marca de agua de los vídeos | Tiempo de visualización: **Todo el vídeo**. Al pulsarla, quien no está suscrito se suscribe. |

Se regeneran con `node scripts/make-banners.mjs`, igual que los de LinkedIn y WhatsApp.

---

## 2. Información básica (pestaña «Información básica»)

### Nombre

```
Dr. Juan García Arteaga · Otorrino
```

«Otorrino» es como lo busca la gente y cabe en los 50 caracteres. El identificador se queda en **@jgarciaarteaga**, que coincide con la web.

### Descripción (≈ 950 de 1000 caracteres)

```
Soy el Dr. Juan García Arteaga, otorrinolaringólogo en Huelva. En este canal te explico con palabras sencillas los problemas más frecuentes del oído, la nariz, la garganta, la laringe, el cuello y las glándulas salivales.

Encontrarás vídeos sobre:
▸ Enfermedades: qué son, por qué aparecen y cómo se tratan.
▸ Pruebas diagnósticas: en qué consisten, si molestan y cómo prepararte.
▸ Cirugías: qué se hace, cómo es la recuperación y qué cuidados necesitas.
▸ Prevención y cuidados: ejercicios y consejos para el día a día.

Cada tema tiene su ficha escrita en la web, con más detalle y referencias:
https://jgarciaarteaga.pro

Si acabas de salir de la consulta con dudas sobre qué tienes, qué te van a hacer o qué tienes que hacer tú, este canal es para ti.

⚠️ La información de este canal es divulgativa y no sustituye a la consulta con tu médico. No puedo responder consultas personales en los comentarios. Si tienes una urgencia, llama al 112.
```

### Palabras clave (≈ 430 de 500 caracteres)

YouTube Studio → Configuración → Canal → Información básica → Palabras clave. Las frases de varias palabras van entre comillas:

```
otorrino otorrinolaringólogo otorrinolaringología ORL Huelva "Juan García Arteaga" oído nariz garganta laringe "glándulas salivales" vértigo "vértigo posicional" otitis acúfenos "pérdida de audición" "tapón de cera" sinusitis "desviación de tabique" ronquidos "apnea del sueño" amígdalas vegetaciones disfonía "reflujo faringolaríngeo" audiometría "cirugía otorrino" "salud auditiva" "información para pacientes" "divulgación médica"
```

### Enlaces

| Título | URL |
|---|---|
| Atlas ORL · Fichas para pacientes | `https://jgarciaarteaga.pro/es/` |
| LinkedIn | *(la URL de tu perfil)* |
| WhatsApp Business | *(tu enlace `wa.me/…`, solo si lo usas para citas)* |

Enlaces en el banner: **mostrar el primero** (la web).

### Información de contacto

Un correo para colaboraciones. Conviene que no sea el de la consulta, para que no lleguen por ahí consultas de pacientes.

---

## 3. Página de inicio (pestaña «Diseño»)

**Vídeo destacado**

- **Tráiler del canal para quien no está suscrito:** el vídeo del guion del apartado 5.
- **Vídeo destacado para suscriptores:** el último vídeo o el más visto. YouTube lo puede rellenar solo.

**Secciones**, en este orden:

1. **Vídeos** (los más recientes)
2. **Shorts** (en cuanto haya)
3. Lista **Enfermedades de oído, nariz y garganta**
4. Lista **Pruebas diagnósticas: en qué consisten**
5. Lista **Cirugías: qué se hace y cómo es la recuperación**
6. Lista **Prevención, cuidados y ejercicios**

Estas cuatro listas son los mismos tipos de ficha que tiene la web. Cuando una zona tenga 3 o más vídeos, crea también su lista por zona (Oído · Nariz y senos paranasales · Boca · Garganta · Laringe · Cuello · Glándulas salivales) y añádela debajo. Un vídeo puede estar en varias listas a la vez.

### Descripciones de las listas

| Lista | Descripción |
|---|---|
| Enfermedades de oído, nariz y garganta | Qué son las enfermedades más frecuentes en otorrinolaringología, por qué aparecen, cómo se diagnostican y qué tratamientos hay. |
| Pruebas diagnósticas: en qué consisten | Qué se hace en cada prueba, si molesta, cuánto dura y cómo prepararte: audiometría, timpanometría, nasofibrolaringoscopia, vHIT y más. |
| Cirugías: qué se hace y cómo es la recuperación | Cómo es cada operación, qué anestesia lleva, cuánto dura la recuperación y qué cuidados necesitas después. |
| Prevención, cuidados y ejercicios | Ejercicios, hábitos y consejos para cuidar tus oídos, tu nariz y tu voz, y para evitar que los problemas vuelvan. |

---

## 4. Valores predeterminados de subida

YouTube Studio → Configuración → Valores predeterminados de subida. Así, cada vídeo nuevo ya trae esto relleno.

- **Categoría:** Formación
- **Idioma del vídeo y del título y la descripción:** Español (España)
- **Audiencia:** No es contenido creado para niños
- **Comentarios:** retener los posiblemente inapropiados para revisarlos
- **Descripción** (plantilla; cambia lo que va entre corchetes):

```
[Una o dos frases: qué es y qué vas a aprender en este vídeo, con la palabra clave al principio.]

📄 Ficha completa, con más detalle y referencias:
https://jgarciaarteaga.pro/es/zonas/[zona]/[tema]/

⏱️ Capítulos
00:00 [Introducción]
00:00 [¿Qué es…?]
00:00 [¿Cómo se trata?]

🔔 Suscríbete para ver los próximos vídeos sobre oído, nariz y garganta.

⚠️ Este vídeo es divulgativo y no sustituye a la consulta con tu médico. No respondo consultas personales en los comentarios. Si tienes una urgencia, llama al 112.

Dr. Juan García Arteaga · Otorrinolaringólogo · Huelva
https://jgarciaarteaga.pro
```

**Títulos de los vídeos:** igual que el `title` de la ficha, con la palabra clave al principio y la duda que resuelve: «Vértigo posicional (VPPB): qué es y cómo se cura», «Audiometría: en qué consiste y cómo prepararte».

### Fuente de información sanitaria

YouTube puede marcar como **fuente sanitaria acreditada** los canales de profesionales sanitarios colegiados, y entonces muestra un panel informativo debajo de sus vídeos. No está disponible en todos los países y pide unos mínimos de suscriptores y horas de visualización. Cuando el canal crezca, busca «fuente de información sanitaria» en la ayuda de YouTube para ver si ya puedes solicitarlo (te pedirán el número de colegiado).

---

## 5. Guion del tráiler del canal (≈ 50 segundos)

Pensado para grabarlo a cámara, con imágenes de la web (el holograma de la cabeza y las zonas) intercaladas. Unas 130 palabras: a ritmo tranquilo salen 50-55 segundos.

| Tiempo | Imagen | Texto |
|---|---|---|
| 0:00-0:07 | Tú a cámara, plano medio. | ¿Has salido de la consulta del otorrino con más dudas que respuestas? Es normal: en pocos minutos se dicen muchas cosas. |
| 0:07-0:15 | Rótulo con nombre y especialidad. | Soy el doctor Juan García Arteaga, otorrinolaringólogo en Huelva, y en este canal te lo explico todo con calma. |
| 0:15-0:30 | Holograma girando; se iluminan oído, nariz, garganta y cuello. | Hablamos de los problemas más frecuentes del oído, la nariz, la garganta, la voz y el cuello. Qué son, por qué aparecen y cómo se tratan. |
| 0:30-0:40 | Recursos rápidos: audiómetro, endoscopio, una consulta. | También te cuento en qué consisten las pruebas, cómo son las operaciones y qué puedes hacer tú en casa para cuidarte. |
| 0:40-0:47 | Pantalla de la web en el móvil. | Cada vídeo tiene su ficha escrita en jgarciaarteaga.pro, para que la leas tranquilamente. |
| 0:47-0:52 | Tú a cámara; aparece el botón de suscripción. | Suscríbete y nos vemos en el próximo vídeo. |
| Rótulo final | Logo JGA sobre fondo oscuro. | *Información divulgativa. No sustituye a la consulta médica.* |

**Título del tráiler:** Otorrinolaringología explicada para pacientes · Dr. Juan García Arteaga
**Descripción:** la misma que la del canal.
