"""Platform modules and DORA baseline seed (immutable catalogue).

Revision ID: 005_config_reference_data
Revises: 3919f2be7fdd
"""

from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

revision: str = "005_config_reference_data"
down_revision: Union[str, None] = "3919f2be7fdd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    modules = [
        ("THIRD_PARTY_RISK", "Third-party ICT risk", "Supplier register, contracts, concentration"),
        ("ICT_RISK", "ICT risk", "ICT risk assessments and services"),
        ("EVIDENCE_MANAGEMENT", "Evidence management", "Evidence metadata and controls linkage"),
        ("AUDIT", "Audit", "Audit and configuration history"),
        ("BUSINESS_CONTINUITY", "Business continuity", "Placeholder — future BCP entities"),
        ("DISASTER_RECOVERY", "Disaster recovery", "Placeholder — future DR entities"),
        ("INCIDENT_MANAGEMENT", "Incident management", "Placeholder"),
        ("RESILIENCE_TESTING", "Resilience testing", "Placeholder"),
        ("ASSET_MANAGEMENT", "Asset management", "Placeholder — future ICT assets"),
    ]
    for key, name, desc in modules:
        conn.execute(
            sa.text(
                """
                INSERT INTO platform_modules (id, key, name, description, system_defined, created_at, updated_at)
                VALUES (:id, :key, :name, :desc, true, now(), now())
                ON CONFLICT (key) DO NOTHING
                """
            ),
            {"id": str(uuid.uuid4()), "key": key, "name": name, "desc": desc},
        )

    domain_id = str(uuid.uuid4())
    conn.execute(
        sa.text(
            """
            INSERT INTO dora_domains (id, code, name, description)
            VALUES (:id, 'ICT_RISK_MGMT', 'ICT risk management', 'DORA ICT risk management domain')
            ON CONFLICT (code) DO NOTHING
            """
        ),
        {"id": domain_id},
    )
    domain_row = conn.execute(
        sa.text("SELECT id FROM dora_domains WHERE code = 'ICT_RISK_MGMT'")
    ).first()
    if domain_row:
        did = domain_row[0]
        reqs = [
            ("ICT-TP-001", "ICT third-party register", "Maintain register of ICT third-party providers"),
            ("ICT-TP-002", "Contractual provisions", "Assess contractual DORA control compliance"),
        ]
        for code, title, desc in reqs:
            conn.execute(
                sa.text(
                    """
                    INSERT INTO dora_requirements (id, domain_id, code, title, description, system_immutable)
                    VALUES (:id, :did, :code, :title, :desc, true)
                    ON CONFLICT (code) DO NOTHING
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "did": str(did),
                    "code": code,
                    "title": title,
                    "desc": desc,
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM dora_requirements"))
    conn.execute(sa.text("DELETE FROM dora_domains"))
    conn.execute(sa.text("DELETE FROM platform_modules"))
