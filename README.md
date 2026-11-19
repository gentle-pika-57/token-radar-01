[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/gentle-pika-57/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/gentle-pika-57/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

# Token Radar

A pre-token launch radar: 198 protocols whose DefiLlama record carries no token, ranked
by an implied value, each with a concrete farm plan.

## The model (radar-3)

The pricing is fitted, not picked. A log-log size curve — log(market cap) =
5.6138 + 0.5831 x log(TVL) — is fitted by ordinary least squares over the 121
live-token protocols in the snapshot (market-cap-to-TVL ratios outside 0–10 dropped
as outliers). Then:

```
implied = round( exp(5.6138 + 0.5831 x ln(tvl_usd))
                 x (1 + clamp(change_7d, -50, +100) / 100 x 0.5)
                 x (0.6 + min(age_days, 1095) / 1095 x 0.4) )
```

The curve is validated out of sample before it is used: leave-one-out log-RMSE 1.808
against 2.114 for the old category-median multiple, and 5-fold 1.798 against 2.113.
Category effects (ridge-shrunk dummies, top-5 categories, shrunk residuals) were tested
the same way and did not beat the pooled curve, so the model carries no category term.

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
its fitted value, and its six-step farm plan with a break-even cost, plus the model panel
with the fitted curve, its out-of-sample validation, and the curve's multiples. The page
recomputes each row from the snapshot figures and checks the number `board.json` carries.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json|directory>
```

Node 22+, standard library only, no network, deterministic: the same snapshot always
writes the same bytes.

<sub>Entered on [make.fun](https://make.fun/?ref=5sa2ymrv&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
