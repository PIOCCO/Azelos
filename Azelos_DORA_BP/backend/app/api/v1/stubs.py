"""Module-gated placeholders for entities not yet in dora_core."""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["Future modules"])


def _not_implemented(name: str):
    raise HTTPException(
        status_code=501,
        detail=f"{name} entity is not yet modelled in dora_core; enable module when available.",
    )


@router.get("/ict-assets")
def list_ict_assets():
    _not_implemented("ICT assets")


@router.get("/incidents")
def list_incidents():
    _not_implemented("Incidents")


@router.get("/business-continuity")
def list_bcp():
    _not_implemented("Business continuity")


@router.get("/disaster-recovery")
def list_dr():
    _not_implemented("Disaster recovery")


@router.get("/resilience-tests")
def list_resilience_tests():
    _not_implemented("Resilience tests")
