"""Recovery test outcome from measured RTO/RPO vs targets."""

from app.models.enums_resilience import RecoveryTestOutcome


def compute_recovery_outcome(
    *,
    target_rto_minutes: int | None,
    target_rpo_minutes: int | None,
    actual_recovery_minutes: int | None,
    actual_data_loss_minutes: int | None,
) -> RecoveryTestOutcome:
    if actual_recovery_minutes is None and actual_data_loss_minutes is None:
        return RecoveryTestOutcome.NOT_RUN

    rto_ok = True
    rpo_ok = True
    if target_rto_minutes is not None:
        if actual_recovery_minutes is None:
            rto_ok = False
        else:
            rto_ok = actual_recovery_minutes <= target_rto_minutes
    if target_rpo_minutes is not None:
        if actual_data_loss_minutes is None:
            rpo_ok = False
        else:
            rpo_ok = actual_data_loss_minutes <= target_rpo_minutes

    if rto_ok and rpo_ok:
        return RecoveryTestOutcome.PASS
    if not rto_ok and not rpo_ok:
        return RecoveryTestOutcome.FAIL
    return RecoveryTestOutcome.PARTIAL
