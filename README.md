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

La imagen se sirve desde la web: `public/firma/jga-firma.png` (228 × 228, se muestra a 76 × 76, la altura del texto de la firma) y `public/firma/jga-firma-76.png` (76 × 76, para insertarla por URL).
Se regeneran con `node scripts/make-signature.mjs` (requiere Playwright con Chromium).

## Holograma

- `assets/head.glb`: modelo 3D de la cabeza (generado con Higgsfield / Hunyuan3D a partir de dos bustos).
- `npm run bake`: convierte el modelo en `src/assets/head.bin` (cortes láser, meridianos y nube de puntos).
- `src/scripts/holo.js`: motor Three.js que dibuja el holograma, las zonas y la anatomía interna.
- Las zonas seleccionables y su posición sobre la cabeza están en `src/data/zones.ts` (`hit`).
- `assets/atlas.glb`: mallas anatómicas reales de cabeza y cuello (cráneo, columna cervical, senos, fosas nasales, lengua, dientes, faringe, laringe, tráquea, tiroides, ganglios y glándulas salivales) extraídas del atlas abierto Z-Anatomy / BodyParts3D con `scripts/extract-atlas.mjs`. Licencia y créditos en `assets/ATLAS-LICENSE.md`.
- `scripts/bake-anatomy.mjs`: ajusta ese atlas a la cabeza del holograma con una deformación suave guiada por puntos craneofaciales (vértex, nasion, conducto auditivo, punta nasal, incisivos, mentón, hioides, cricoides…) y lo guarda en `src/assets/anatomy.bin`. Lo que el atlas no trae o solo licencia para uso no comercial (oído medio e interno, seno maxilar, cuerdas vocales, adenoides) se modela a mano en el mismo script. `npm run bake` regenera ambos archivos.
- El esqueleto (grupo `bone`) no pertenece a ninguna zona: se ve tenue siempre y gana presencia al elegir una zona.

## Banners para redes

`brand/social/` contiene las portadas en español e inglés, con el mismo estilo que la web:

- `linkedin-banner-*.png` (1584 × 396): portada del perfil de LinkedIn. El texto empieza a la derecha de la foto de perfil.
- `whatsapp-banner-*.png` (1920 × 1080, 16:9): portada del perfil de WhatsApp Business. El centro inferior queda libre para la foto de perfil.

Para la foto de perfil del negocio sirve `brand/monogram-dark.png`.
Se regeneran con `node scripts/make-banners.mjs` (requiere Playwright con Chromium y `npm install` para las fuentes).
