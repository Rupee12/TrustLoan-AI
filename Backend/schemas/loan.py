from pydantic import BaseModel, Field


class LoanApplication(BaseModel):
    no_of_dependents: int = Field(ge=0)
    education: str = Field(min_length=1)
    self_employed: str = Field(min_length=1)
    income_annum: float = Field(ge=0)
    loan_amount: float = Field(gt=0)
    loan_term: float = Field(gt=0)
    cibil_score: int = Field(ge=300, le=900)
    residential_assets_value: float = Field(ge=0)
    commercial_assets_value: float = Field(ge=0)
    luxury_assets_value: float = Field(ge=0)
    bank_asset_value: float = Field(ge=0)
