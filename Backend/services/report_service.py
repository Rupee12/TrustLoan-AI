from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from schemas.phase2 import ReportRequest


def generate_pdf(report: ReportRequest) -> bytes:
    output = BytesIO()
    document = SimpleDocTemplate(output, pagesize=A4, rightMargin=0.7 * inch, leftMargin=0.7 * inch)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("TrustLoan AI", styles["Title"]),
        Paragraph("Loan Eligibility Assessment Report", styles["Heading2"]),
        Paragraph(f"Generated: {report.generated_at}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph(f"Model Classification: {report.prediction}", styles["Heading3"]),
        Paragraph(f"Model-estimated approval probability: {report.probability:.2%}", styles["Normal"]),
        Paragraph(f"TrustLoan Model Risk Score: {report.risk_score:.0f}", styles["Normal"]),
        Paragraph(f"Risk category: {report.risk_category}", styles["Normal"]),
        Spacer(1, 12),
        Paragraph("Applicant Information", styles["Heading3"]),
    ]
    for key, value in report.applicant.model_dump().items():
        story.append(Paragraph(f"{key}: {value}", styles["Normal"]))
    story.extend([Spacer(1, 12), Paragraph("Top SHAP Factors", styles["Heading3"])])
    for factor in report.shap_values[:6]:
        story.append(Paragraph(f"{factor.get('feature')}: {factor.get('value')} ({factor.get('direction')})", styles["Normal"]))
    if report.what_if:
        story.extend([Spacer(1, 12), Paragraph("What-If Analysis", styles["Heading3"]), Paragraph(str(report.what_if), styles["Normal"])])
    story.extend([
        Spacer(1, 12),
        Paragraph("Responsible AI Disclaimer", styles["Heading3"]),
        Paragraph("This educational model assessment is not financial advice, bank approval, or a guarantee. The model risk score is not CIBIL. SHAP is explanatory, not causal, and real financial decisions require human review.", styles["Normal"]),
    ])
    document.build(story)
    return output.getvalue()
