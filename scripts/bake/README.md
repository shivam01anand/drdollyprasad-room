# scripts/bake

The original single room's light bake lived here (bake.py, encode.py), and was
replaced by the house (scripts/house). Two tools remain, used by the house:

- `denoise.py <dir> <name>`: OpenImageDenoise through Blender's compositor, run on
  `<dir>/<name>.npy` (the house denoises `lm-day` and `lm-night`).
- `render_view.py`: renders a site camera in a .blend, for comparing with the site.
