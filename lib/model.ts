// Token Radar's model: one snapshot of the protocol universe in, one ranked board out.
//
// The board ranks launch candidates: protocols whose DefiLlama record carries no token. The
// watchlist is the floor — every one of its 40 slugs is ranked — and the early radar adds every
// other pre-token protocol that passes the same launch-candidate rule the watchlist itself uses:
// not a wrapped, staked or bridged representation of an asset that already trades, not a
// versioned pool of another protocol, not an exchange's own product, not a CEX. The protocols
// that rule sets aside are shown apart, with the reason each one was set aside, never hidden.
// Live-token protocols are set aside too, with their market caps, never mixed into the ranking.
//
// Implied value follows only from the snapshot's own figures, and the pricing is fitted, not
// picked. A log-log size curve — log(market cap) = intercept + slope x log(TVL) — is fitted by
// ordinary least squares over the snapshot's live-token protocols (market-cap-to-TVL ratios
// outside (0, 10) dropped as outliers). The curve is validated out of sample before it is
// used: leave-one-out and 5-fold cross-validation, both against the old category-median
// multiple, in log space. Category effects were tested the same way (ridge-shrunk dummies,
// top-5 categories, empirical-Bayes residuals) and did not beat the pooled curve out of
// sample at 121 comparables, so the model carries no category term: the curve is one line,
// and the validation table in the model panel says so. Then:
//
//   implied = round( exp(intercept + slope x ln(tvl_usd)) x growthMult x maturityMult )
//   growthMult   = 1 + 0.5 x clamp(change_7d, -50, +100) / 100
//   maturityMult = 0.6 + 0.4 x min(age_days, 1095) / 1095   (age unknown: 365 days)
//
// Growth is the seven-day TVL change; maturity is the time since DefiLlama first listed the
// protocol, the best record of how long it has run with no token. No protocol name is ever
// special-cased: the same function scores every row.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  min_comparables: number;
  multiple_low: number;
  multiple_high: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 0.5,
  growth_floor: -50,
  growth_cap: 100,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  min_comparables: 3,
  multiple_low: 0,
  multiple_high: 10,
};

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-3';

/** The fitted size curve: log(market cap) = intercept + slope x log(TVL). */
export interface SizeCurveFit {
  intercept: number;
  slope: number;
  comparables: number;
  residual_sd: number;
}

/** Out-of-sample validation of the fitted curve against the v1 median-multiple baseline. */
export interface FitValidation {
  loo_rmse: number;
  loo_rmse_median: number;
  cv_rmse: number;
  cv_rmse_median: number;
  median_abs_pct_err: number;
  median_abs_pct_err_median: number;
}

/** One sample of the fitted curve for the model panel: a TVL and the multiple it implies. */
export interface CurvePoint {
  tvl_usd: number;
  fitted_multiple: number;
}

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** One live comparable behind a category's multiple, as the detail view shows it. */
export interface CategoryComp {
  name: string;
  ratio: number;
}

/** A category's comparables: the live protocols the multiple was read off. */
export interface CategoryComps {
  category: string;
  entries: CategoryComp[];
}

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    fitted_value: number;
    fitted_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  age_days: number | null;
  implied_value_usd: number;
  fitted_value: number;
  growth_multiplier: number;
  maturity_multiplier: number;
}

/** A live-token protocol: it already trades, so the board shows the market's own value. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** A protocol the launch-candidate rule sets aside, with the reason why. */
export interface SetAsideRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  reason: string;
}

/** Everything the dashboard needs: the board, the live set, the set-aside set, the model. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  fit: SizeCurveFit;
  validation: FitValidation;
  curve_points: CurvePoint[];
  comps: CategoryComps[];
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  set_aside_size: number;
  rows: RadarRow[];
  live: LiveRow[];
  set_aside: SetAsideRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The median of a sorted array of numbers. */
function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** One live-token protocol as a training point for the size curve. */
interface TrainPoint {
  logTvl: number;
  logMcap: number;
  category: string;
  ratio: number;
}

/**
 * The size curve's training set: the snapshot's live-token protocols with a positive market
 * cap and TVL and a market-cap-to-TVL ratio inside (0, 10); ratios outside are outliers and
 * dropped, and a market cap of zero or less cannot be logged. The snapshot lists protocols
 * by slug, so the set — and the fit — is deterministic.
 */
function trainingSet(snapshot: Snapshot, model: ModelConstants = MODEL): TrainPoint[] {
  const pts: TrainPoint[] = [];
  for (const p of snapshot.protocols) {
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!(ratio > model.multiple_low && ratio < model.multiple_high)) continue;
    pts.push({ logTvl: Math.log(p.tvl_usd), logMcap: Math.log(p.mcap_usd), category: p.category ?? 'Other', ratio });
  }
  return pts;
}

/** Ordinary least squares on log(market cap) against log(TVL), from the running sums. */
function olsFit(pts: TrainPoint[]): { intercept: number; slope: number } {
  const n = pts.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const p of pts) {
    sx += p.logTvl;
    sy += p.logMcap;
    sxx += p.logTvl * p.logTvl;
    sxy += p.logTvl * p.logMcap;
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { intercept: (sy - slope * sx) / n, slope };
}

/**
 * The fitted size curve: log(market cap) = intercept + slope x log(TVL), fitted over the
 * snapshot's live-token protocols. A slope under 1 is the market's own pricing — the
 * multiple falls as TVL grows — which a single median multiple cannot express.
 */
export function fitSizeCurve(snapshot: Snapshot, model: ModelConstants = MODEL): SizeCurveFit {
  const pts = trainingSet(snapshot, model);
  if (pts.length < 10) throw new SnapshotError('too few live-token comparables to fit the size curve');
  const { intercept, slope } = olsFit(pts);
  let ss = 0;
  for (const p of pts) ss += (p.logMcap - (intercept + slope * p.logTvl)) ** 2;
  return { intercept, slope, comparables: pts.length, residual_sd: Math.sqrt(ss / pts.length) };
}

/** The fitted market cap at a TVL, from the size curve. */
export function fittedValue(tvlUsd: number, fit: SizeCurveFit): number {
  return Math.exp(fit.intercept + fit.slope * Math.log(tvlUsd));
}

/**
 * The v1 median-multiple baseline, as a prediction of log(market cap): the median
 * market-cap-to-TVL ratio of the training set's protocols in the same category (at least
 * `min_comparables` of them), else the market-wide median. The validation compares the
 * fitted curve against this, on the same folds.
 */
function medianPrediction(train: TrainPoint[], category: string, logTvl: number, model: ModelConstants): number {
  const byCat: number[] = [];
  const all: number[] = [];
  for (const t of train) {
    all.push(t.ratio);
    if (t.category === category) byCat.push(t.ratio);
  }
  all.sort((a, b) => a - b);
  byCat.sort((a, b) => a - b);
  const m = byCat.length >= model.min_comparables ? median(byCat) : median(all);
  return logTvl + Math.log(m);
}

/**
 * Out-of-sample validation, in log space: leave-one-out and 5-fold cross-validation (folds
 * by index mod 5 over the slug-sorted training set), for the fitted curve and for the
 * category-median baseline, plus each one's median absolute error in level space. Both
 * refit on every fold, so the numbers are honest about a curve the model has never seen.
 */
export function validateFit(snapshot: Snapshot, model: ModelConstants = MODEL): FitValidation {
  const pts = trainingSet(snapshot, model);
  const n = pts.length;
  let looSq = 0;
  let looSqMed = 0;
  const pctErrs: number[] = [];
  const pctErrsMed: number[] = [];
  for (let i = 0; i < n; i++) {
    const train = pts.filter((_, j) => j !== i);
    const held = pts[i]!;
    const fit = olsFit(train);
    const pred = fit.intercept + fit.slope * held.logTvl;
    const predMed = medianPrediction(train, held.category, held.logTvl, model);
    looSq += (pred - held.logMcap) ** 2;
    looSqMed += (predMed - held.logMcap) ** 2;
    pctErrs.push(Math.abs(Math.exp(pred) - Math.exp(held.logMcap)) / Math.exp(held.logMcap));
    pctErrsMed.push(Math.abs(Math.exp(predMed) - Math.exp(held.logMcap)) / Math.exp(held.logMcap));
  }
  let cvSq = 0;
  let cvSqMed = 0;
  for (let fold = 0; fold < 5; fold++) {
    const test = pts.filter((_, i) => i % 5 === fold);
    const train = pts.filter((_, i) => i % 5 !== fold);
    const fit = olsFit(train);
    for (const t of test) {
      cvSq += (fit.intercept + fit.slope * t.logTvl - t.logMcap) ** 2;
      cvSqMed += (medianPrediction(train, t.category, t.logTvl, model) - t.logMcap) ** 2;
    }
  }
  pctErrs.sort((a, b) => a - b);
  pctErrsMed.sort((a, b) => a - b);
  return {
    loo_rmse: Math.sqrt(looSq / n),
    loo_rmse_median: Math.sqrt(looSqMed / n),
    cv_rmse: Math.sqrt(cvSq / n),
    cv_rmse_median: Math.sqrt(cvSqMed / n),
    median_abs_pct_err: median(pctErrs),
    median_abs_pct_err_median: median(pctErrsMed),
  };
}

/** The fitted value and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  fit: SizeCurveFit,
  model: ModelConstants = MODEL,
): { implied: number; fitted: number; fittedMultiple: number; growthPct: number; growthMult: number; maturityMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const fitted = fittedValue(protocol.tvl_usd, fit);
  const implied = Math.max(1, Math.round(fitted * growthMult * maturityMult));
  return { implied, fitted, fittedMultiple: fitted / protocol.tvl_usd, growthPct, growthMult, maturityMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;
/** A whole word that marks a representation of an asset that already trades. */
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;
/** An exchange whose own product carries its name first. */
const EXCHANGE_NAMES = ['binance', 'coinbase', 'bybit', 'kraken', 'bitget', 'okx', 'bitfinex', 'gemini'];
/** Categories that move or represent an asset instead of issuing a launch of their own. */
const SET_ASIDE_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol is one the board may rank: pre-token, not a CEX, not a versioned pool. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && p.category !== 'CEX' && !VERSIONED.test(p.name);
}

/**
 * Why a rankable protocol is set aside from the ranked board instead: it is a representation of
 * an asset that already trades, or an exchange's own product. Null when it is a launch candidate.
 * The same rule the snapshot's own watchlist uses, applied to the whole board.
 */
export function setAsideReason(p: SnapshotProtocol): string | null {
  if (p.category !== null && SET_ASIDE_CATEGORIES.has(p.category)) {
    return `Category ${p.category}: it moves or represents an asset that already trades, so it is not a token launch of its own.`;
  }
  if (WRAPPED_WORD.test(p.name)) {
    return 'Its name marks it as a wrapped or staked form of an asset that already trades.';
  }
  const first = p.name.toLowerCase().split(/\s+/)[0] ?? '';
  if (EXCHANGE_NAMES.includes(first)) {
    return 'Its name begins with an exchange: it is that exchange\u2019s own product, not a launch.';
  }
  return null;
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; setAside: SetAsideRow[]; fit: SizeCurveFit; validation: FitValidation } {
  const fit = fitSizeCurve(snapshot, model);
  const validation = validateFit(snapshot, model);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  const setAside: SetAsideRow[] = [];
  // The watchlist is the floor: every slug it names is ranked.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other rankable pre-token protocol that passes the launch-candidate
  // rule. The rest are set aside with the reason, shown apart, never hidden.
  for (const p of snapshot.protocols) {
    if (chosen.has(p.slug) || !isRankable(p)) continue;
    const reason = setAsideReason(p);
    if (reason !== null) {
      setAside.push({ slug: p.slug, name: p.name, category: p.category, chains: p.chains, tvl_usd: p.tvl_usd, reason });
    } else {
      chosen.set(p.slug, p);
    }
  }
  setAside.sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, fit, model);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  const board = scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token' as const,
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      // Full precision on purpose: the dashboard recomputes the row from this fitted value,
      // and a rounded one would drift a few dollars from the number board.json carries.
      fitted_value: s.fitted,
      fitted_multiple: s.fittedMultiple,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
  return { board, setAside, fit, validation };
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** What one transaction costs on a chain, in dollars, as a rough guide. */
function gasUsd(chain: string): number {
  const c = chain.toLowerCase();
  if (c.includes('ethereum')) return 8;
  if (c.includes('solana')) return 0.1;
  if (c.includes('binance') || c.includes('bnb')) return 0.3;
  if (c.includes('polygon')) return 0.1;
  if (c.includes('avalanche')) return 0.5;
  if (c.includes('base') || c.includes('arbitrum') || c.includes('optimism') || c.includes('monad') || c.includes('hyperliquid')) return 0.5;
  return 2;
}

/** A dollar amount as the farm plan writes it: $8, or $0.10 where it is under a dollar. */
function fmtGasUsd(n: number): string {
  return n < 1 ? `$${n.toFixed(2)}` : `$${n}`;
}

/** What one transaction costs on a chain, in words, as a rough guide. */
function gasFor(chain: string): string {
  const c = chain.toLowerCase();
  if (c.includes('ethereum')) return 'about $8 of gas';
  if (c.includes('solana')) return 'under $0.10 of gas';
  if (c.includes('binance') || c.includes('bnb')) return 'about $0.30 of gas';
  if (c.includes('polygon')) return 'under $0.10 of gas';
  if (c.includes('avalanche')) return 'about $0.50 of gas';
  if (c.includes('base') || c.includes('arbitrum') || c.includes('optimism') || c.includes('monad') || c.includes('hyperliquid')) return 'about $0.50 of gas';
  return 'about $2 of gas';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's core action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the loan-to-value below 50%.`;
  if (c.includes('dex')) return `Provide $${capital} of liquidity to ${name}'s deepest pool on ${chain} and keep the position in range.`;
  if (c.includes('yield') || c.includes('leveraged farm') || c.includes('farm')) return `Deposit $${capital} into ${name}'s highest-yield vault on ${chain} and leave the yield to compound.`;
  if (c.includes('curator') || c.includes('allocator')) return `Allocate $${capital} to a ${name} curator vault on ${chain} and keep the shares for the whole season.`;
  if (c.includes('rwa')) return `Mint $${capital} of ${name}'s yield-bearing asset on ${chain} and hold it in your own wallet.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} on ${chain} and keep the receipt token.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedged position.`;
  if (c.includes('prediction')) return `Fund $${capital} on ${name} and place one position on a market that settles after the season ends.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('chain')) return `Use $${capital} on ${name}'s chain: send one transaction a week through its own apps.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The weekly qualifying action, by category: the habit that keeps the wallet visible. */
function weeklyFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return 'Repay a small part of the borrow and re-supply it, so the wallet shows fresh activity.';
  if (c.includes('dex')) return 'Swap a small amount through the pool and add a little liquidity, so the wallet shows fresh activity.';
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('farm')) return 'Claim the vault yield and deposit it back, so the wallet shows fresh activity.';
  if (c.includes('rwa')) return 'Check the yield accrual and top the position up by a small amount, so the wallet shows fresh activity.';
  if (c.includes('perpetual') || c.includes('derivative')) return 'Close and reopen a small hedge, so the wallet shows fresh activity.';
  if (c.includes('prediction')) return 'Place one small position on a new market, so the wallet shows fresh activity.';
  if (c.includes('staking') || c.includes('restak')) return 'Restake the staking rewards, so the wallet shows fresh activity.';
  return 'Make one qualifying action, such as a deposit, a borrow, a swap or a vote, so the wallet shows fresh activity.';
}

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time, and the hold
 * step nets the farm toward break-even: the gas of one transaction a week over the hold,
 * against the capital in the position, so the reader sees what yield the position must earn
 * to pay for its own farming. The plan is derived from the protocol's own record (category,
 * chains, TVL, age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const gas = gasFor(chain);
  const gasPerTx = gasUsd(chain);
  const weekly = weeklyFor(p);
  // One transaction to set up, then one a week for the hold: the whole farm's gas bill.
  const totalGas = gasPerTx * (1 + Math.ceil(hold / 7));
  const breakEvenPct = (totalGas / capital) * 100;
  const breakEven = breakEvenPct >= 100 ? `${Math.round(breakEvenPct)}%` : `${breakEvenPct.toFixed(1)}%`;
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'nothing to set up, and the first transaction costs ' + gas,
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and ${gas}`,
      time: '15 minutes to set up',
    },
    {
      text: `Once a week, ${weekly.charAt(0).toLowerCase()}${weekly.slice(1)}`,
      cost: `about ${fmtGasUsd(gasPerTx)} of gas a week`,
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot. The farm costs about ${fmtGasUsd(totalGas)} in gas over those ${hold} days on $${capital} of capital, so it breaks even if the position earns ${breakEven} over the hold.`,
      cost: `the $${capital} stays in the position, and the gas bill is ${fmtGasUsd(totalGas)}`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    fitted_value: row.model.fitted_value,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
  };
}

/** The live comparables behind a category: the five largest by market cap, with their ratios. */
export function categoryComps(snapshot: Snapshot, model: ModelConstants = MODEL): CategoryComps[] {
  const byCat = new Map<string, { name: string; ratio: number; mcap: number }[]>();
  for (const p of snapshot.protocols) {
    if (p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0 || p.category === null) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!(ratio > model.multiple_low && ratio < model.multiple_high)) continue;
    const list = byCat.get(p.category) ?? [];
    list.push({ name: p.name, ratio, mcap: p.mcap_usd });
    byCat.set(p.category, list);
  }
  return [...byCat.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([category, entries]) => ({
      category,
      entries: entries
        .sort((a, b) => b.mcap - a.mcap)
        .slice(0, 5)
        .map((e) => ({ name: e.name, ratio: round4(e.ratio) })),
    }));
}

/** Samples of the fitted curve for the model panel: reference TVLs and the multiple each implies. */
export function curvePoints(fit: SizeCurveFit): CurvePoint[] {
  return [50_000_000, 100_000_000, 500_000_000, 1_000_000_000, 2_750_000_000, 10_000_000_000].map((tvl) => ({
    tvl_usd: tvl,
    fitted_multiple: fittedValue(tvl, fit) / tvl,
  }));
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const { board, setAside, fit, validation } = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    fit,
    validation,
    curve_points: curvePoints(fit),
    comps: categoryComps(snapshot, model),
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    set_aside_size: setAside.length,
    rows: board.map(radarRow),
    live,
    set_aside: setAside,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  if (board.length < 100) return `the board holds ${board.length} rows, under the 100-row floor`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
