from typing import Any

from pydantic import BaseModel, Field

from schemas.loan import LoanApplication


class NlpExtractRequest(BaseModel):
    text: str = Field(min_length=1)


class NlpExtractResponse(BaseModel):
    no_of_dependents: int | None = None
    education: str | None = None
    self_employed: str | None = None
    income_annum: float | None = None
    loan_amount: float | None = None
    loan_term: float | None = None
    cibil_score: int | None = None
    residential_assets_value: float | None = None
    commercial_assets_value: float | None = None
    luxury_assets_value: float | None = None
    bank_asset_value: float | None = None
    missing_required_fields: list[str]


class WhatIfRequest(BaseModel):
    original: LoanApplication
    modified: LoanApplication


class AdvisorRequest(BaseModel):
    question: str = Field(min_length=1)
    prediction: str
    probability: float = Field(ge=0, le=1)
    risk_score: float = Field(ge=0, le=100)
    applicant: LoanApplication
    shap_values: list[dict[str, Any]] = Field(default_factory=list)
    what_if: dict[str, Any] | None = None


class ReportRequest(BaseModel):
    applicant: LoanApplication
    prediction: str
    probability: float = Field(ge=0, le=1)
    risk_score: float = Field(ge=0, le=100)
    risk_category: str
    shap_values: list[dict[str, Any]] = Field(default_factory=list)
    what_if: dict[str, Any] | None = None
    generated_at: str
