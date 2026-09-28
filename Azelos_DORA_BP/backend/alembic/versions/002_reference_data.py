"""Reference catalog data for DORA controls, document types, service taxonomy.

Revision ID: 002_reference_data
Revises: 774dec1bcf90
Create Date: 2026-09-28

"""

from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

revision: str = "002_reference_data"
down_revision: Union[str, None] = "774dec1bcf90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _insert_rows(table: str, rows: list[dict]) -> None:
    if not rows:
        return
    conn = op.get_bind()
    conn.execute(sa.text(f"INSERT INTO {table} ({', '.join(rows[0].keys())}) VALUES ({', '.join(':'+k for k in rows[0].keys())})"), rows)


def upgrade() -> None:
    conn = op.get_bind()

    controls = [
        ("audit_rights", "Audit rights", "governance", "Right to audit the ICT provider and subprocessors"),
        ("access_rights", "Access and inspection rights", "governance", "Access to premises, systems, and personnel"),
        ("incident_notification", "Incident notification", "operational", "Timely notification of ICT-related incidents"),
        ("data_location", "Data location and processing", "data", "Specified locations for storage and processing"),
        ("subcontracting", "Subcontracting and chain transparency", "chain", "Approval and visibility of subcontracting"),
        ("security_requirements", "Information security", "security", "Minimum security standards and assurance"),
        ("business_continuity", "Business continuity", "continuity", "BCP/DR alignment with entity requirements"),
        ("termination", "Termination and step-in", "contractual", "Termination rights and step-in provisions"),
        ("exit_assistance", "Exit and transition assistance", "exit", "Cooperation during exit and migration"),
    ]
    for code, name, category, description in controls:
        conn.execute(
            sa.text(
                """
                INSERT INTO dora_control_definitions (id, code, name, category, description)
                VALUES (:id, :code, :name, :category, :description)
                ON CONFLICT (code) DO NOTHING
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "code": code,
                "name": name,
                "category": category,
                "description": description,
            },
        )

    doc_types = [
        ("soc2_report", "SOC 2 report"),
        ("iso27001_cert", "ISO 27001 certificate"),
        ("contract_pdf", "Signed contract"),
        ("due_diligence", "Due diligence pack"),
        ("exit_test_report", "Exit test report"),
    ]
    for code, label in doc_types:
        conn.execute(
            sa.text(
                """
                INSERT INTO document_types (id, code, label)
                VALUES (:id, :code, :label)
                ON CONFLICT (code) DO NOTHING
                """
            ),
            {"id": str(uuid.uuid4()), "code": code, "label": label},
        )

    classifications = [
        ("cloud_hosting", "Cloud hosting", "IaaS/PaaS hosting services"),
        ("identity_management", "Identity management", "IAM / authentication services"),
        ("payment_processing", "Payment processing", "Payment scheme and processing ICT"),
        ("data_storage", "Data storage", "Managed storage services"),
    ]
    for code, label, description in classifications:
        conn.execute(
            sa.text(
                """
                INSERT INTO service_classifications (id, code, label, description, is_active)
                VALUES (:id, :code, :label, :description, true)
                ON CONFLICT (code) DO NOTHING
                """
            ),
            {
                "id": str(uuid.uuid4()),
                "code": code,
                "label": label,
                "description": description,
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM service_classifications"))
    conn.execute(sa.text("DELETE FROM document_types"))
    conn.execute(sa.text("DELETE FROM dora_control_definitions"))
