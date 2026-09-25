from functools import lru_cache
from typing import Any

import joblib
import shap

from schemas.loan import LoanApplication
from services.model_service import MODEL_PATH, get_model_service


XAI_PATH = MODEL_PATH.parent / "xai_artifacts_v2.pkl"


@lru_cache(maxsize=1)
def get_explainer() -> tuple[Any, list[str]]:
    artifacts = joblib.load(XAI_PATH)
    service = get_model_service()
    explainer = shap.TreeExplainer(
        service.pipeline.named_steps["model"],
        data=artifacts["background_data"],
        feature_perturbation="interventional",
    )
    return explainer, list(artifacts["feature_names"])


def _readable_name(feature_name: str) -> str:
    name = feature_name.replace("num__", "").replace("cat__", "")
    replacements = {
        "no_of_dependents": "Number of Dependents",
        "income_annum": "Annual Income",
        "loan_amount": "Requested Loan Amount",
        "loan_term": "Loan Term",
        "cibil_score": "CIBIL Score",
        "residential_assets_value": "Residential Assets",
        "commercial_assets_value": "Commercial Assets",
        "luxury_assets_value": "Luxury Assets",
        "bank_asset_value": "Bank Assets",
        "education_ Graduate": "Education: Graduate",
        "education_ Not Graduate": "Education: Not Graduate",
        "self_employed_ No": "Employment: Not Self Employed",
        "self_employed_ Yes": "Employment: Self Employed",
    }
    return replacements.get(name, name.replace("_", " ").title())


def _raw_value(feature_name: str, application: LoanApplication) -> str | int | float:
    clean_name = feature_name.replace("num__", "").replace("cat__", "")
    values = application.model_dump()
    if clean_name in values:
        return values[clean_name]
    if clean_name.startswith("education_"):
        return application.education
    if clean_name.startswith("self_employed_"):
        return application.self_employed
    return "transformed feature"


def explain(application: LoanApplication) -> list[dict[str, Any]]:
    service = get_model_service()
    input_data = service.pipeline.named_steps["preprocessor"].transform(
        __import__("pandas").DataFrame([application.model_dump()])
    )
    explainer, feature_names = get_explainer()
    explanation = explainer(input_data)
    classes = service.pipeline.named_steps["model"].classes_
    approved_index = next(
        index
        for index, class_name in enumerate(classes)
        if str(class_name).strip().lower() == "approved"
    )
    values = explanation.values[0, :, approved_index]

    result = []
    for feature_name, value in zip(feature_names, values):
        numeric_value = float(value)
        result.append(
            {
                "feature": _readable_name(feature_name),
                "value": numeric_value,
                "raw_value": _raw_value(feature_name, application),
                "direction": "positive" if numeric_value >= 0 else "negative",
            }
        )
    return sorted(result, key=lambda item: abs(item["value"]), reverse=True)
