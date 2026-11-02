# Atlas ORL · Atlas ENT

Sitio de información para pacientes del Dr. Juan García Arteaga, otorrinolaringólogo.
Se publica en **jgarciaarteaga.pro** (Netlify) en español (`/es/`) e inglés (`/en/`).

## Cómo se añade contenido

Cada tema es un archivo Markdown por idioma:

```
src/content/fichas/es/<zona>/<tema>.md
src/content/fichas/en/<zona>/<tema>.md
```

`<zona>` y `<tema>` son los identificadores definidos en `src/data/zones.ts`.
La plantilla con los campos y apartados está en `src/content/fichas/_plantilla.md`.
Para redactar fichas fuera de la web (en otro chat), las plantillas por tipo y la guía de redacción y SEO están en [`docs/fichas/`](docs/fichas/README.md).
Cuando existe la ficha, la página de la zona enlaza el tema; si no, aparece como «En preparación».

## Desarrollo

```
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

## Holograma

- `assets/head.glb`: modelo 3D de la cabeza (generado con Higgsfield / Hunyuan3D a partir de dos bustos).
- `npm run bake`: convierte el modelo en `src/assets/head.bin` (cortes láser, meridianos y nube de puntos).
- `src/scripts/holo.js`: motor Three.js que dibuja el holograma, las zonas y la anatomía interna.
- Las zonas seleccionables y su posición sobre la cabeza están en `src/data/zones.ts` (`hit`).
- `scripts/bake-anatomy.mjs`: modela la anatomía interna (oído interno y medio, senos paranasales, cornetes, boca y dientes, faringe, laringe, tiroides, ganglios, vasos y glándulas salivales) y la guarda en `src/assets/anatomy.bin`. `npm run bake` regenera ambos archivos.

## Banners para redes

`brand/social/` contiene las portadas y fotos de perfil, con el mismo estilo que la web:

- `linkedin-banner-*.png` (1584 × 396): portada del perfil de LinkedIn. El texto empieza a la derecha de la foto de perfil.
- `whatsapp-banner-*.png` (1920 × 1080, 16:9): portada del perfil de WhatsApp Business. El centro inferior queda libre para la foto de perfil.

- `youtube-banner-es.png` (2560 × 1440): banner del canal de YouTube. Lo importante cabe en la franja central de 1546 × 423, la única que se ve en el móvil.
- `youtube-avatar.png` (800 × 800): foto de perfil de YouTube, pensada para el recorte circular.
- `youtube-watermark.png` (150 × 150, fondo transparente): marca de agua de los vídeos.

Los textos del canal de YouTube (descripción, palabras clave, secciones, plantilla de descripción y guion del tráiler) están en [`docs/youtube/canal.md`](docs/youtube/canal.md).

Para la foto de perfil del negocio sirve `brand/monogram-dark.png`.
Se regeneran con `node scripts/make-banners.mjs` (requiere Playwright con Chromium y `npm install` para las fuentes).
