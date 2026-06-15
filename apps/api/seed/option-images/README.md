# Option images (handedness / handshapes / positions / movements)

Drop real artwork here and the seed (`npm run db:seed`) will copy it into storage
and point each option's `imageUrl` at it. Layout:

```
seed/option-images/
  handedness/<code>.png      # one.png, two.png
  handshapes/<code>.png       # flat.png, fist.png, index.png, ...
  positions/<code>.png        # neutral.png, head.png, face.png, ...
  movements/<code>.png        # none.png, straight.png, circular.png, ...
```

`<code>` is the option's `code` from `prisma/seed.ts`. Accepted extensions:
`png, jpg, jpeg, webp, svg` (first match wins). If a file is missing, the seed
generates a labelled SVG placeholder so the pickers still render.

Images are written to `apps/api/storage/options/<kind>/<code>.<ext>` and served
publicly at `/api/v1/options/images/<kind>/<file>`. New options added later via
the admin UI reuse the same storage + serving path.
