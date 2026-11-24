[![news-image-20261123](https://make.fun/badge/news-image-20261123)](https://make.fun/bounty/news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/rank/nunfixx)](https://make.fun/bounty/news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/reward)](https://make.fun/bounty/news-image-20261123)

# The World in One Day — Monday, 23 November 2026

Entry for the [news-image-20261123 bounty](https://make.fun/bounty/news-image-20261123) on make.fun: sum up 23 November's world news in one image.

A newspaper front page drawn from scratch by `main.ts` (Node 22 stdlib only, no network, deterministic): own PNG encoder and own 5×7 bitmap font.

**Lead:** Ukraine sinks the Russian warship Merkury at Benghazi, Libya — 7 sea drones, 2,400 km from the front.

**Panels:** Dymer toll rises to 11 · NATO sends AWACS to Poland · Wall Street roars back (Nasdaq +6.5% as Jensen Huang returns) · Cikande fire: 24 dead · 31 tankers mass east of Hormuz · Democrats win biggest House majority since 1992 (258 seats).

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes a 1024×1024 PNG to `out/entry.png`.
