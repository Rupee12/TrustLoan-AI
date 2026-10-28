from typing import Any, Literal

from pydantic import BaseModel, Field

from schemas.loan import LoanApplication


class NlpExtractRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


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
    income_monthly: float | None = None
    loan_purpose: str | None = None
    confidence: dict[str, float]
    ambiguous_fields: list[str]
    validation_errors: list[str]
    missing_required_fields: list[str]
    requires_confirmation: bool


class WhatIfRequest(BaseModel):
    original: LoanApplication
    modified: LoanApplication


class AdvisorRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    prediction: str
    probability: float = Field(ge=0, le=1)
    risk_score: float = Field(ge=0, le=100)
    applicant: LoanApplication
    shap_values: list[dict[str, Any]] = Field(default_factory=list)
    what_if: dict[str, Any] | None = None


class EmiRequest(BaseModel):
    principal: float = Field(gt=0, le=1_000_000_000)
    annual_interest_rate: float = Field(ge=0, le=60)
    tenure_months: int = Field(ge=1, le=480)


class LenderMatchRequest(BaseModel):
    loan_category: Literal["personal_loan"] = "personal_loan"
    loan_amount: float | None = Field(default=None, gt=0, le=1_000_000_000)
    loan_term: float | None = Field(default=None, gt=0, le=40)
    self_employed: bool | None = None
    employment_type: Literal["salaried", "self_employed", "other"] | None = None
    has_sbi_salary_account: bool | None = None


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    profile: dict[str, Any] | None = Field(default=None, max_length=11)
    prediction: dict[str, Any] | None = Field(default=None, max_length=10)
    conversation: list[ConversationTurn] = Field(default_factory=list, max_length=20)


class KnowledgeSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ReportRequest(BaseModel):
    applicant: LoanApplication
    prediction: str
    probability: float = Field(ge=0, le=1)
    risk_score: float = Field(ge=0, le=100)
    risk_category: str
    shap_values: list[dict[str, Any]] = Field(default_factory=list)
    what_if: dict[str, Any] | None = None
    generated_at: str
