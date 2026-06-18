import pytest

from worker.domain import (
    EvidenceSource,
    InstrumentId,
    SignalDecision,
    StrategyProfile,
    TradeTimingPlan,
)


def test_instrument_id_round_trip() -> None:
    instrument_id = InstrumentId(market="US", exchange="XNAS", symbol="AAPL")

    assert str(instrument_id) == "US:XNAS:AAPL"
    assert InstrumentId.parse("US:XNAS:AAPL") == instrument_id


def test_instrument_id_rejects_extra_colon_segments() -> None:
    with pytest.raises(ValueError, match="Invalid InstrumentId"):
        InstrumentId.parse("KR:XKRX:005930:EXTRA")


def test_instrument_id_rejects_symbol_containing_colon() -> None:
    with pytest.raises(ValueError, match="InstrumentId symbol must not contain ':'"):
        InstrumentId(market="KR", exchange="XKRX", symbol="005930:EXTRA")


def test_default_strategy_profile_weights() -> None:
    profile = StrategyProfile.default_swing_momentum()

    assert profile.rules_weight == 0.6
    assert profile.ai_weight == 0.4
    assert profile.min_ai_weight == 0.2
    assert profile.max_ai_weight == 0.6


def test_signal_decision_represents_source_evidence() -> None:
    evidence = EvidenceSource(
        source_id="krx-disclosure-1",
        source_type="disclosure",
        title="Samsung Electronics disclosure",
        url="https://example.com/disclosure",
        observed_at="2026-06-18T00:00:00.000Z",
        finality="confirmed",
    )

    decision = SignalDecision(
        instrument_id=InstrumentId(market="KR", exchange="XKRX", symbol="005930"),
        finality="confirmed",
        confidence=0.72,
        rules_contribution=0.5,
        ai_contribution=0.22,
        ai_weight_haircut=0.0,
        quality_flags=("confirmed_end_of_day_data",),
        source_evidence=(evidence,),
        trade_timing_plan=TradeTimingPlan(
            action_label="BUY",
            entry_low=70000.0,
            entry_high=72000.0,
            stop_level=68000.0,
            target_low=78000.0,
            target_high=80000.0,
            time_horizon="days_to_weeks",
        ),
        rationale=("Confirmed disclosure supports the signal.",),
    )

    assert decision.source_evidence == (evidence,)
    assert decision.source_evidence[0].source_type == "disclosure"
