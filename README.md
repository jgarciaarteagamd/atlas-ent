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
Cuando existe la ficha, la página de la zona enlaza el tema; si no, aparece como «En preparación».

## Desarrollo

```
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

## Holograma

- `assets/head.glb`: modelo 3D de la cabeza (generado con Higgsfield / Hunyuan3D a partir de dos bustos).
- `npm run bake`: convierte el modelo en `public/holo/head.bin` (cortes láser, meridianos y nube de puntos).
- `src/scripts/holo.js`: motor Three.js que dibuja el holograma, las zonas y la anatomía interna.
- Las zonas seleccionables y su posición sobre la cabeza están en `src/data/zones.ts` (`hit`).
