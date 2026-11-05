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

## Firma de correo

`brand/email/` contiene la firma de Gmail en español e inglés, con el mismo estilo que la web:

- `firma-es.html`, `firma-en.html`: la firma como texto HTML (tabla con estilos en línea), que cada programa de correo adapta al modo claro u oscuro. Nombre y enlaces en un azul petróleo (`#128c9f`) que se lee sobre blanco y sobre el gris oscuro de Gmail; raya ámbar `#a87414`.
- `firma-movil.txt`: la versión de solo texto para la firma de la app de Gmail en el móvil.
- `jga-firma.svg`: el isotipo sobre un cuadro oscuro con esquinas cortadas y fondo transparente.

La imagen se sirve desde la web: `public/firma/jga-firma.png` (192 × 192, se muestra a 64 × 64) y `public/firma/jga-firma-64.png` (64 × 64, para insertarla por URL).
Se regeneran con `node scripts/make-signature.mjs` (requiere Playwright con Chromium).

## Holograma

- `assets/head.glb`: modelo 3D de la cabeza (generado con Higgsfield / Hunyuan3D a partir de dos bustos).
- `npm run bake`: convierte el modelo en `src/assets/head.bin` (cortes láser, meridianos y nube de puntos).
- `src/scripts/holo.js`: motor Three.js que dibuja el holograma, las zonas y la anatomía interna.
- Las zonas seleccionables y su posición sobre la cabeza están en `src/data/zones.ts` (`hit`).
- `scripts/bake-anatomy.mjs`: modela la anatomía interna (oído interno y medio, senos paranasales, cornetes, boca y dientes, faringe, laringe, tiroides, ganglios, vasos y glándulas salivales) y la guarda en `src/assets/anatomy.bin`. `npm run bake` regenera ambos archivos.

## Banners para redes

`brand/social/` contiene las portadas en español e inglés, con el mismo estilo que la web:

- `linkedin-banner-*.png` (1584 × 396): portada del perfil de LinkedIn. El texto empieza a la derecha de la foto de perfil.
- `whatsapp-banner-*.png` (1920 × 1080, 16:9): portada del perfil de WhatsApp Business. El centro inferior queda libre para la foto de perfil.

Para la foto de perfil del negocio sirve `brand/monogram-dark.png`.
Se regeneran con `node scripts/make-banners.mjs` (requiere Playwright con Chromium y `npm install` para las fuentes).
