import PDFDocument from "pdfkit";

const NAVY = "#1e293b";
const MUTED = "#64748b";
const FOOTER = "APIO — Modèle interne · Page";

/**
 * @param {{ title: string, intro: string, blocks: Array<{type:'h2'|'p'|'field', text?: string, label?: string}>, template?: boolean }} spec
 * @returns {Buffer}
 */
export function buildPdfBuffer(spec) {
  const template = spec.template !== false;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56, bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor(NAVY).fontSize(11).font("Helvetica-Bold").text("APIO", { continued: true });
    doc.font("Helvetica").fillColor(MUTED).fontSize(9).text("  ·  Association des Promoteurs Immobiliers de l'Oriental");

    doc.moveDown(0.75);
    if (template) {
      doc
        .fillColor("#334155")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("MODÈLE À COMPLÉTER", { align: "left" });
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#475569")
        .text(
          "Ce document est un modèle éditable. Il ne constitue pas un acte officiel de l'association tant qu'il n'a pas été revu et adopté par les instances compétentes de l'APIO.",
        );
      doc.moveDown(0.5);
    }

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(16).text(spec.title, { align: "left" });
    doc.moveDown(0.35);
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(spec.intro);
    doc.moveDown(0.75);
    doc.fontSize(8.5).fillColor(MUTED).text("Version : modèle interne  ·  Date : Non renseignée");
    doc.moveDown(1);

    for (const block of spec.blocks) {
      if (block.type === "h2") {
        doc.moveDown(0.5);
        doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(11).text(block.text.toUpperCase());
        doc.moveDown(0.25);
      } else if (block.type === "p") {
        doc.font("Helvetica").fontSize(10).fillColor("#1e293b").text(block.text, { align: "left", lineGap: 3 });
        doc.moveDown(0.35);
      } else if (block.type === "field") {
        if (block.label) {
          doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#334155").text(block.label);
        }
        doc
          .moveTo(56, doc.y + 14)
          .lineTo(539, doc.y + 14)
          .strokeColor("#cbd5e1")
          .lineWidth(0.75)
          .stroke();
        doc.moveDown(1.1);
      }
      if (doc.y > 720) doc.addPage();
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(MUTED).text(`${FOOTER} ${i + 1} / ${range.count}`, 56, 780, {
        align: "center",
        width: 483,
      });
    }

    doc.end();
  });
}

export async function buildPdfBufferSync(spec) {
  return buildPdfBuffer(spec);
}
