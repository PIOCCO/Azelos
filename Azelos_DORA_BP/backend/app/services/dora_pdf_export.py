"""Generate DORA oversight PDF from persisted database state."""

import io
from uuid import UUID

from sqlalchemy.orm import Session

from app.services.dora_overview import build_dora_overview
from app.services.requirement_service import RequirementService


def build_dora_assessment_pdf(db: Session, organization_id: UUID) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import cm
    from reportlab.pdfgen import canvas

    overview = build_dora_overview(db, organization_id)
    requirements = RequirementService(db, organization_id).list_organization_status()

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 2 * cm
    line = 14

    def writeln(text: str, indent: float = 0) -> None:
        nonlocal y
        if y < 2 * cm:
            c.showPage()
            y = height - 2 * cm
        c.drawString(2 * cm + indent, y, text[:120])
        y -= line

    c.setFont("Helvetica-Bold", 16)
    writeln("Azelos DORA Blueprint — Assessment Export")
    c.setFont("Helvetica", 10)
    writeln(f"Organization ID: {organization_id}")
    y -= line
    c.setFont("Helvetica-Bold", 12)
    writeln("Overview KPIs")
    c.setFont("Helvetica", 10)
    writeln(f"ICT providers: {overview.ict_providers_total}")
    writeln(f"ICT services (critical): {overview.ict_services_critical}")
    writeln(f"Business functions: {overview.business_functions_total}")
    writeln(f"Risk assessments: {overview.risk_assessments_total}")
    writeln(f"Evidence items: {overview.evidence_items_total}")
    y -= line
    c.setFont("Helvetica-Bold", 12)
    writeln("Organization requirements")
    c.setFont("Helvetica", 9)
    for req in requirements:
        writeln(f"{req.code} — {req.title}")
        writeln(f"  Status: {req.implementation_status} | Applicable: {req.applicable}", indent=0.5 * cm)
        if req.evidence_files:
            for ev in req.evidence_files:
                writeln(f"  Evidence: {ev.file_name}", indent=0.5 * cm)
        else:
            writeln("  Evidence: none", indent=0.5 * cm)
        y -= 4

    c.save()
    return buf.getvalue()
