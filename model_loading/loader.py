import joblib
import shap
import streamlit as st


@st.cache_resource
def load_artifacts():

    # ========================================================
    # V2 MODEL ARTIFACTS
    # ========================================================

    model = joblib.load(
        "models/v2/loan_eligibility_model_v2.pkl"
    )

    config = joblib.load(
        "models/v2/model_config_v2.pkl"
    )

    xai = joblib.load(
        "models/v2/xai_artifacts_v2.pkl"
    )

    # ========================================================
    # TREE SHAP EXPLAINER
    # ========================================================

    explainer = shap.TreeExplainer(
        model.named_steps["model"],
        data=xai["background_data"],
    )

    return model, config, xai, explainer