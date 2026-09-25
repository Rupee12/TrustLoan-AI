from fastapi import APIRouter, HTTPException

from schemas.loan import LoanApplication
from services.model_service import get_model_service
from services.shap_service import explain

router = APIRouter()


@router.post("/predict")
def predict(application: LoanApplication) -> dict:
    try:
        result = get_model_service().predict(application)
        try:
            result["shap_values"] = explain(application)
        except Exception:
            result["shap_values"] = []
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail="Prediction service is unavailable.") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to generate prediction.") from exc
