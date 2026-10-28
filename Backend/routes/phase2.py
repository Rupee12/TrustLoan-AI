from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from schemas.phase2 import (
    AdvisorRequest,
    AssistantChatRequest,
    EmiRequest,
    KnowledgeSearchRequest,
    LenderMatchRequest,
    NlpExtractRequest,
    NlpExtractResponse,
    ReportRequest,
    WhatIfRequest,
)
from services import advisor_service, finance_service, knowledge_service, lender_service, nlp_service
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


@router.post("/assistant/chat")
def assistant_chat(request: AssistantChatRequest) -> dict:
    return finance_service.respond(
        request.message,
        profile=request.profile,
        prediction=request.prediction,
        conversation=[turn.model_dump() for turn in request.conversation],
    )


@router.get("/lenders")
def lenders() -> dict:
    return {
        "category": "personal_loan",
        "lenders": lender_service.list_lenders(),
        "disclaimer": "Published criteria are partial and do not determine approval.",
    }


@router.post("/lenders/match")
def lender_match(request: LenderMatchRequest) -> dict:
    return {
        "category": request.loan_category,
        "matches": lender_service.match_lenders(request.model_dump()),
        "disclaimer": "Lenders independently determine final eligibility and approval.",
    }


@router.post("/emi/calculate")
def emi_calculate(request: EmiRequest) -> dict:
    return finance_service.calculate_emi(
        request.principal,
        request.annual_interest_rate,
        request.tenure_months,
    )


@router.get("/knowledge/search")
def knowledge_search(query: str = Query(min_length=1, max_length=500)) -> dict:
    return knowledge_service.search_knowledge(query)


@router.post("/knowledge/answer")
def knowledge_answer(request: KnowledgeSearchRequest) -> dict:
    retrieved = knowledge_service.search_knowledge(request.query)
    if not retrieved["results"]:
        return {
            "configured": False,
            "answer": retrieved["answer"],
            "message": None,
            "results": [],
        }
    try:
        answer = advisor_service.answer_knowledge(request.query, retrieved["results"])
    except RuntimeError:
        answer = {
            "configured": False,
            "answer": retrieved["answer"],
            "message": "AI knowledge answer is unavailable; retrieved source passages are shown instead.",
        }
    return {**answer, "results": retrieved["results"]}


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
    except RuntimeError:
        return {
            "configured": False,
            "message": "AI Advisor provider is unavailable; deterministic assistant help remains available.",
        }


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
