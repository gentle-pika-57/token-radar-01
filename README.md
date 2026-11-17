# Token Radar

A pre-token launch radar: 198 protocols whose DefiLlama record carries no token, ranked
by an implied value, each with a concrete farm plan.

## The model (radar-2)

The multiple is not a constant the author picked. It is the market's own pricing, read off
the snapshot: the median market-cap-to-TVL ratio of the live-token protocols in the row's
category (ratios outside 0–10 dropped as outliers, at least 3 comparables), falling back to
the market-wide median (0.191x) where a category has too few. Then:

```
implied = round( tvl_usd x multiple(category)
                 x (1 + clamp(change_7d, -50, +100) / 100 x 0.5)
                 x (0.6 + min(age_days, 1095) / 1095 x 0.4) )
```

Growth is the seven-day TVL change; maturity is the time since DefiLlama first listed the
protocol, the best record of how long it has run with no token (unknown age uses 365 days).
No protocol name is special-cased.

## The board

- The watchlist (40 protocols, TVL ≥ $50M, no token on record) is the floor: all 40 are
  ranked, plus 158 more pre-token protocols below and above it.
- 91 protocols are set aside, with the reason each one was: wrapped, staked or bridged
  representations of an asset that already trades, or an exchange's own product — not a
  token launch of their own. They are shown apart in the dashboard, never hidden.
- 24 live-token protocols are shown apart with their market caps, never mixed into the
  ranking.

## The dashboard

`dashboard/` is a static page (no framework, no network): a sortable, filterable board,
a detail drawer per protocol with the implied-value breakdown, the live comparables behind
its multiple, and its six-step farm plan, plus the model panel with every category's
multiple. The page recomputes each row from the snapshot figures and checks the number
`board.json` carries.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
```

Node 22+, standard library only, no network, deterministic: the same snapshot always
writes the same bytes.
