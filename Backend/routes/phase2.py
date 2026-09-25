from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from schemas.phase2 import AdvisorRequest, NlpExtractRequest, NlpExtractResponse, ReportRequest, WhatIfRequest
from services import advisor_service, nlp_service
from services.insights_service import get_insights
from services.model_service import get_model_service
from services.report_service import generate_pdf
from services.shap_service import explain

router = APIRouter()


@router.get("/insights")
def insights() -> dict:
    return get_insights()


@router.post("/nlp/extract", response_model=NlpExtractResponse)
def extract_nlp(request: NlpExtractRequest) -> dict:
    return nlp_service.extract(request.text)


@router.post("/shap")
def shap_explanation(application: dict) -> dict:
    try:
        from schemas.loan import LoanApplication

        return {"shap_values": explain(LoanApplication.model_validate(application))}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="SHAP explanation is unavailable.") from exc


@router.post("/whatif")
def what_if(request: WhatIfRequest) -> dict:
    service = get_model_service()
    original = service.predict(request.original)
    modified = service.predict(request.modified)
    original_values = request.original.model_dump()
    modified_values = request.modified.model_dump()
    changed_features = [
        field for field in original_values if original_values[field] != modified_values[field]
    ]
    return {
        "original": original,
        "modified": modified,
        "changed_features": changed_features,
    }


@router.post("/advisor")
def advisor(request: AdvisorRequest) -> dict:
    try:
        return advisor_service.explain(request.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail="The AI Advisor provider is unavailable.") from exc


@router.post("/report")
def report(request: ReportRequest) -> Response:
    try:
        pdf = generate_pdf(request)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Report generation is unavailable.") from exc
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=trustloan-assessment.pdf"},
    )
