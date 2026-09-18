from io import BytesIO

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def build_branded_pdf(*, title: str, customer: str, period: str, report_id: str, sections: list[tuple[str, list[str]]]) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter
    y = height - 50
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, y, title)
    y -= 24
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Customer: {customer}")
    y -= 14
    c.drawString(50, y, f"Period: {period}")
    y -= 14
    c.drawString(50, y, f"Report ID: {report_id}")
    y -= 30

    for heading, lines in sections:
        if y < 80:
            c.showPage()
            y = height - 50
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, heading)
        y -= 16
        c.setFont("Helvetica", 9)
        for line in lines:
            if y < 60:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica", 9)
            c.drawString(55, y, line[:110])
            y -= 12
        y -= 8

    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()
