from pathlib import Path

import pandas as pd
import streamlit as st

from components.hero import render_hero, render_steps
from components.form import render_application_form
from components.results import (
    render_prediction_result,
    render_probability,
    render_snapshot,
)
from components.xai import render_xai
from components.footer import render_footer
from model_loading.loader import load_artifacts


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent


# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="TrustLoan AI",
    page_icon="◈",
    layout="wide",
    initial_sidebar_state="collapsed",
)


# ============================================================
# LOAD EXTERNAL CSS
# ============================================================

css_path = BASE_DIR / "styles" / "main.css"

with css_path.open("r", encoding="utf-8") as f:
    st.html(f"<style>{f.read()}</style>")


# ============================================================
# LOAD V2 MODEL ARTIFACTS
# ============================================================

model, config, xai, explainer = load_artifacts()

feature_names = xai["feature_names"]


# ============================================================
# HERO
# ============================================================

render_hero()
render_steps()


# ============================================================
# APPLICATION FORM
#
# The Analyze button is handled INSIDE form.py.
# When the user clicks it, render_application_form()
# returns the completed application data.
# ============================================================

data = render_application_form()


# ============================================================
# RUN AI ANALYSIS
# ============================================================

if data is not None:

    # --------------------------------------------------------
    # BUILD MODEL INPUT
    # --------------------------------------------------------

    input_data = pd.DataFrame({
        "no_of_dependents": [
            data["no_of_dependents"]
        ],

        "education": [
            data["education"]
        ],

        "self_employed": [
            data["self_employed"]
        ],

        "income_annum": [
            data["income_annum"]
        ],

        "loan_amount": [
            data["loan_amount"]
        ],

        "loan_term": [
            data["loan_term"]
        ],

        "cibil_score": [
            data["cibil_score"]
        ],

        "residential_assets_value": [
            data["residential_assets_value"]
        ],

        "commercial_assets_value": [
            data["commercial_assets_value"]
        ],

        "luxury_assets_value": [
            data["luxury_assets_value"]
        ],

        "bank_asset_value": [
            data["bank_asset_value"]
        ],
    })


    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    prediction = model.predict(input_data)[0]
    st.session_state["prediction"] = str(prediction)


    # --------------------------------------------------------
    # APPROVAL PROBABILITY
    # --------------------------------------------------------

    classes = model.named_steps["model"].classes_

    probabilities = model.predict_proba(input_data)[0]

    approved_index = None

    for index, class_name in enumerate(classes):

        if str(class_name).strip().lower() == "approved":

            approved_index = index
            break


    if approved_index is None:

        raise ValueError(
            "Approved class was not found in model classes."
        )


    probability = probabilities[approved_index]
    st.session_state["approval_probability"] = float(probability)

    probability_percentage = probability * 100


    # --------------------------------------------------------
    # NORMALIZE PREDICTION
    # --------------------------------------------------------

    prediction_binary = (
        1
        if str(prediction).strip().lower() == "approved"
        else 0
    )


    # ========================================================
    # RESULTS
    # ========================================================

    render_prediction_result(
        prediction_binary,
        probability_percentage,
    )


    # ========================================================
    # APPROVAL PROBABILITY
    # ========================================================

    render_probability(
        probability_percentage,
    )


    # ========================================================
    # APPLICANT SNAPSHOT
    # ========================================================

    render_snapshot(
        data,
    )


    # ========================================================
    # EXPLAINABLE AI
    # ========================================================

    render_xai(
        model,
        explainer,
        input_data,
        feature_names,
    )


# ============================================================
# FOOTER
# ============================================================

render_footer()