# assets/atlas.glb and src/assets/anatomy.bin

`atlas.glb` is a subset (head and neck) of the Z-Anatomy atlas, taken from the
glTF export published at https://github.com/nqwrc/3d-anatomy and written by
`scripts/extract-atlas.mjs`. `src/assets/anatomy.bin` is baked from it by
`scripts/bake-anatomy.mjs`, which warps the meshes to fit the hologram head.

Required attribution:

- "Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0"
- "BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"

Both files are adaptations of that material and are shared under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The licence
covers these two data files, not the rest of the site.

Not included: the parts of Z-Anatomy that come from sources licensed for
non-commercial use (the inner ear, the kidney), and the ossicles, whose origin
is unclear. The ear is modelled by hand in `scripts/bake-anatomy.mjs`.

Changes made: selection of structures, welding of vertices, the trachea and the
oesophagus cut at the base of the neck, a landmark-driven warp to the hologram
head, the thyroid gland lowered by about a centimetre, and conversion to slices
and points.
