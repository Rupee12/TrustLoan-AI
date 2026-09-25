import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import streamlit as st
import shap


# ============================================================
# READABLE FEATURE NAMES
# ============================================================

def readable_feature_name(feature):

    name = (
        feature
        .replace("num__", "")
        .replace("cat__", "")
    )

    replacements = {

        "no_of_dependents":
            "Number of Dependents",

        "education_graduate":
            "Education — Graduate",

        "education_not_graduate":
            "Education — Not Graduate",

        "self_employed_no":
            "Employment — Salaried / Other",

        "self_employed_yes":
            "Employment — Self Employed",

        "income_annum":
            "Annual Income",

        "loan_amount":
            "Requested Loan Amount",

        "loan_term":
            "Loan Term",

        "cibil_score":
            "CIBIL Score",

        "residential_assets_value":
            "Residential Assets",

        "commercial_assets_value":
            "Commercial Assets",

        "luxury_assets_value":
            "Luxury Assets",

        "bank_asset_value":
            "Bank Assets",
    }

    return replacements.get(
        name,
        name.replace("_", " ").title()
    )


# ============================================================
# FORMAT FEATURE VALUE
# ============================================================

def format_feature_value(
    feature,
    value
):

    feature_clean = (
        feature
        .replace("num__", "")
        .replace("cat__", "")
    )

    # --------------------------------------------------------
    # CURRENCY
    # --------------------------------------------------------

    currency_features = {
        "income_annum",
        "loan_amount",
        "residential_assets_value",
        "commercial_assets_value",
        "luxury_assets_value",
        "bank_asset_value",
    }

    if feature_clean in currency_features:

        try:
            return f"₹{float(value):,.0f}"
        except Exception:
            return str(value)

    # --------------------------------------------------------
    # CIBIL
    # --------------------------------------------------------

    if feature_clean == "cibil_score":

        try:
            return f"{float(value):.0f}"
        except Exception:
            return str(value)

    # --------------------------------------------------------
    # LOAN TERM
    # --------------------------------------------------------

    if feature_clean == "loan_term":

        try:
            return f"{float(value):.0f} years"
        except Exception:
            return str(value)

    return str(value)


# ============================================================
# EXPLAINABLE AI
# ============================================================

def render_xai(
    model,
    explainer,
    input_data,
    feature_names
):

    # ========================================================
    # HEADER
    # ========================================================

    st.html("""
    <div class="xai-header">

        <div class="xai-badge">
            ◇ XAI
        </div>

        <div class="xai-title">
            Explainable AI
        </div>

        <div class="xai-subtitle">
            Understand why the model reached this prediction.
            The explanation is generated using SHAP.
        </div>

    </div>
    """)


    # ========================================================
    # TRANSFORM INPUT
    # ========================================================

    transformed_input = (
        model
        .named_steps["preprocessor"]
        .transform(input_data)
    )


    # ========================================================
    # SHAP CALCULATION
    # ========================================================

    shap_result = explainer(
        transformed_input
    )


    # ========================================================
    # HANDLE SHAP OUTPUT
    # ========================================================

    shap_values = shap_result.values

    base_values = shap_result.base_values


    # RandomForest SHAP can return:
    #
    # (samples, features, classes)
    #
    # or:
    #
    # (samples, features)
    #
    # We want the contribution toward the APPROVED
    # class.

    if shap_values.ndim == 3:

        classes = model.named_steps[
            "model"
        ].classes_

        approved_index = None

        for index, class_name in enumerate(classes):

            if (
                str(class_name)
                .strip()
                .lower()
                == "approved"
            ):

                approved_index = index
                break


        if approved_index is None:

            approved_index = 1


        values = shap_values[
            0,
            :,
            approved_index
        ]


        if np.ndim(base_values) == 2:

            base_value = base_values[
                0,
                approved_index
            ]

        elif np.ndim(base_values) == 1:

            base_value = base_values[
                approved_index
            ]

        else:

            base_value = base_values


    else:

        values = shap_values[0]

        if np.ndim(base_values) > 0:

            base_value = np.asarray(
                base_values
            ).flatten()[0]

        else:

            base_value = base_values


    # ========================================================
    # INPUT VALUES
    # ========================================================

    feature_values = transformed_input[0]


    # ========================================================
    # CREATE EXPLANATION DATAFRAME
    # ========================================================

    shap_df = pd.DataFrame({

        "feature":
            feature_names,

        "shap":
            values,

        "value":
            feature_values

    })


    shap_df["impact"] = (
        shap_df["shap"].abs()
    )


    shap_df = (
        shap_df
        .sort_values(
            "impact",
            ascending=False
        )
        .head(8)
        .sort_values("shap")
    )


    # ========================================================
    # SECTION 01
    # ========================================================

    st.html("""
    <div class="analysis-heading">

        <div class="analysis-number">
            01
        </div>

        <div>

            <div class="analysis-title">
                Individual Prediction Explanation
            </div>

            <div class="analysis-subtitle">
                How each feature contributed to this applicant's
                prediction
            </div>

        </div>

    </div>
    """)


    # ========================================================
    # SHAP BAR CHART
    # ========================================================

    fig, ax = plt.subplots(
        figsize=(12, 6)
    )


    fig.patch.set_facecolor(
        "#080c17"
    )

    ax.set_facecolor(
        "#080c17"
    )


    labels = [
        readable_feature_name(
            feature
        )

        for feature
        in shap_df["feature"]
    ]


    values_plot = (
        shap_df["shap"]
        .values
    )


    y_positions = np.arange(
        len(labels)
    )


    # Positive = approval support
    # Negative = approval reduction

    bar_colors = [

        "#34d399"
        if value >= 0
        else "#60a5fa"

        for value
        in values_plot

    ]


    bars = ax.barh(
        y_positions,
        values_plot,
        height=0.58,
        color=bar_colors,
        alpha=0.95
    )


    ax.axvline(
        0,
        color="#64748b",
        linewidth=1.2,
        alpha=0.7
    )


    ax.set_yticks(
        y_positions
    )


    ax.set_yticklabels(
        labels,
        fontsize=11,
        color="#e2e8f0"
    )


    # ========================================================
    # VALUE LABELS
    # ========================================================

    max_value = (
        max(abs(values_plot))
        if len(values_plot)
        else 1
    )


    for bar, value in zip(
        bars,
        values_plot
    ):

        y = (
            bar.get_y()
            +
            bar.get_height() / 2
        )


        if value >= 0:

            x = (
                value
                +
                max_value * 0.025
            )

            alignment = "left"

        else:

            x = (
                value
                -
                max_value * 0.025
            )

            alignment = "right"


        ax.text(
            x,
            y,
            f"{value:+.3f}",
            va="center",
            ha=alignment,
            fontsize=10,
            fontweight="bold",
            color="#f8fafc"
        )


    # ========================================================
    # CHART TITLE
    # ========================================================

    ax.text(
        0,
        1.08,
        "Feature Contribution to Model Prediction",
        transform=ax.transAxes,
        fontsize=13,
        fontweight="bold",
        color="#f8fafc",
        ha="left"
    )


    ax.text(
        0,
        1.025,
        "Green = supports approval   •   Blue = reduces approval score",
        transform=ax.transAxes,
        fontsize=9,
        color="#94a3b8",
        ha="left"
    )


    # ========================================================
    # CHART CLEANUP
    # ========================================================

    for spine in ax.spines.values():

        spine.set_visible(False)


    ax.tick_params(
        axis="x",
        colors="#64748b",
        labelsize=9
    )


    ax.tick_params(
        axis="y",
        length=0
    )


    ax.grid(
        axis="x",
        linestyle="--",
        linewidth=0.6,
        alpha=0.12,
        color="#94a3b8"
    )


    ax.set_axisbelow(
        True
    )


    ax.margins(
        y=0.08
    )


    plt.tight_layout()


    st.pyplot(
        fig,
        width="stretch"
    )


    plt.close(fig)


    # ========================================================
    # SECTION 02
    # ========================================================

    st.html("""
    <div class="analysis-heading">

        <div class="analysis-number">
            02
        </div>

        <div>

            <div class="analysis-title">
                Top Decision Factors
            </div>

            <div class="analysis-subtitle">
                The strongest factors influencing the prediction
            </div>

        </div>

    </div>
    """)


    # ========================================================
    # TOP FACTORS
    # ========================================================

    explanation_df = pd.DataFrame({

        "Feature":
            feature_names,

        "SHAP Value":
            values

    })


    explanation_df[
        "Absolute Impact"
    ] = (
        explanation_df[
            "SHAP Value"
        ].abs()
    )


    explanation_df = (
        explanation_df
        .sort_values(
            "Absolute Impact",
            ascending=False
        )
        .head(6)
    )


    # ========================================================
    # FACTOR CARDS
    # ========================================================

    factors_html = (
        '<div class="factor-list">'
    )


    for _, row in (
        explanation_df.iterrows()
    ):

        feature = row[
            "Feature"
        ]

        value = row[
            "SHAP Value"
        ]


        readable_name = (
            readable_feature_name(
                feature
            )
        )


        if value > 0:

            icon = "↑"
            text = "Supports approval"
            factor_class = "positive"

        else:

            icon = "↓"
            text = "Reduces approval score"
            factor_class = "negative"


        factors_html += f"""

        <div class="factor-card {factor_class}">

            <div class="factor-left">

                <div class="factor-icon">
                    {icon}
                </div>

                <div>

                    <div class="factor-name">
                        {readable_name}
                    </div>

                    <div class="factor-description">
                        {text}
                    </div>

                </div>

            </div>

            <div class="factor-impact">
                {value:+.3f}
            </div>

        </div>

        """


    factors_html += (
        "</div>"
    )


    st.html(
        factors_html
    )