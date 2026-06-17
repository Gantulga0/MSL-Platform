# Sign clips

Static sign clips served at `/signs/...`. Drop your files here — no code change
needed. Missing files render a clean placeholder, so the grid still lays out.

## Alphabet — `signs/alphabet/`

One file per Mongolian Cyrillic letter, named by the **lowercase** letter:

```
а.mp4 б.mp4 в.mp4 г.mp4 д.mp4 е.mp4 ё.mp4 ж.mp4 з.mp4 и.mp4
й.mp4 к.mp4 л.mp4 м.mp4 н.mp4 о.mp4 ө.mp4 п.mp4 р.mp4 с.mp4
т.mp4 у.mp4 ү.mp4 ф.mp4 х.mp4 ц.mp4 ч.mp4 ш.mp4 щ.mp4 ъ.mp4
ы.mp4 ь.mp4 э.mp4 ю.mp4 я.mp4
```

## Numbers — `signs/numbers/`

One file per value (raw number, no commas):

```
0.mp4 1.mp4 … 10.mp4         # 0–10
11.mp4 … 19.mp4              # 11–19
20.mp4 … 29.mp4              # 20–29
30.mp4 40.mp4 … 90.mp4       # 30–90
100.mp4 200.mp4 … 900.mp4    # 100–900
1000.mp4 … 10000.mp4         # 1,000–10,000
11000.mp4 … 19000.mp4        # 11,000–19,000
20000.mp4 … 90000.mp4        # 20,000–90,000
100000.mp4 … 1000000.mp4     # 100,000–1,000,000
```

## Number expressions — `signs/expressions/`

One file per expression, named by the category key (see
`apps/web/src/lib/signs/numbers.ts`):

```
tsag.mp4 tsagiin-tursh.mp4 ongorson-odruud.mp4 ireh-odruud.mp4 jil.mp4
des-dugaar.mp4 davtamj.mp4 bair-ezleh.mp4 shirheg.mp4 humuus-hamt.mp4
hun-yavah.mp4 hun-ireh.mp4 minut.mp4
```

To add **more than one** clip to a category, append entries to `SIGNS` in
`numbers.ts` with that category's `key`, e.g.
`{ category: 'tsag', label: '1 цаг', src: '/signs/expressions/tsag-1.mp4' }`.

## Format

- Short, looping clips work best (they autoplay muted on hover / when in view).
- `.mp4` (H.264) is the expected container; the mapping lives in
  `apps/web/src/lib/signs/alphabet.ts` and `numbers.ts` if you need to change it.
