# Professional Stock Signal App

This context defines the product language for a stock-signal decision-support app serving advanced market participants.

## Language

**Investment Professional**:
A user with enough market knowledge to evaluate stock signals independently, including registered advisors, asset managers, internal research analysts, skilled individual investors, and full-time private traders.
_Avoid_: Retail user, end customer

**Research Note**:
An editable internal analysis artifact that explains a signal, its evidence, portfolio relevance, and the professional's own interpretation.
_Avoid_: Client report, automatic recommendation

**Client Report**:
An optional externally shareable report for advisor or asset-manager workflows, generated from approved research notes and portfolio context.
_Avoid_: Research note, direct recommendation

**Trade Timing Plan**:
A structured decision-support output containing an action signal, entry zone, stop level, target zone, and time horizon.
_Avoid_: Single buy price, single sell price, automatic order

**Strategy Profile**:
A configurable signal policy that defines score weights, evidence requirements, risk thresholds, and time horizon for a trading style.
_Avoid_: User preference, model preset

**Market Data Provider**:
An external or sample source that supplies market, event, and reference data through a common app-defined interface.
_Avoid_: Signal engine, database

**Provisional Signal**:
A signal calculated from intraday or not-yet-final data and safe for monitoring or alerts, but not the default source for official records or external reports.
_Avoid_: Confirmed signal, final recommendation

**Confirmed Signal**:
A signal recalculated from end-of-day confirmed market data and eligible for audit records, research notes, and approved reports.
_Avoid_: Provisional signal, live alert

**Strategy Backtest**:
A historical validation run for a fixed strategy profile, reporting outcome metrics without letting users freely edit strategy rules in the MVP.
_Avoid_: Strategy editor, live performance

**Workspace**:
A professional user's operating area that owns watchlists, strategy profiles, portfolios, research notes, and optional client reports.
_Avoid_: Account, tenant

**Portfolio**:
A typed collection of holdings inside a workspace, representing a personal, client, or model portfolio.
_Avoid_: Watchlist, research note

**Alert Event**:
A notable state change worth interrupting a professional, limited in the MVP to signal state changes, entry-zone touches, stop-level breaks, target-zone reaches, AI-context shifts, and portfolio-risk flags.
_Avoid_: Every score change, notification spam

**Action Label**:
A short internal dashboard label such as BUY, HOLD, or SELL, paired with detailed evidence and professional-review context outside compact UI surfaces.
_Avoid_: Unqualified client recommendation

**InstrumentId**:
The canonical identity for a tradable stock, composed of market, exchange, and symbol.
_Avoid_: Raw ticker, provider symbol

**Broker Connection**:
A read-only integration that imports holdings and balances for portfolio analysis without placing, modifying, or cancelling orders.
_Avoid_: Trading connection, order execution

**AI Weight Haircut**:
An automatic reduction of a strategy profile's configured AI contribution when source evidence is weak, stale, contradictory, or insufficient.
_Avoid_: Ignoring evidence quality, zeroing all AI context

**Audit Log**:
A record of decision-relevant events, including data versions, strategy-profile versions, AI weighting, signal outputs, user overrides, research-note approvals, and report exports.
_Avoid_: Full clickstream, debug log
