import streamlit as st


# ============================================================
# PREDICTION RESULT
# ============================================================

def render_prediction_result(
    prediction,
    probability_percentage
):

    result_class = (
        "success"
        if prediction == 1
        else "failure"
    )

    result_icon = (
        "✓"
        if prediction == 1
        else "!"
    )

    result_text = (
        "Likely Eligible"
        if prediction == 1
        else "Likely Not Eligible"
    )

    result_color = (
        "#34d399"
        if prediction == 1
        else "#f87171"
    )

    result_glow = (
        "rgba(52,211,153,0.18)"
        if prediction == 1
        else "rgba(248,113,113,0.18)"
    )


    result_html = f"""
    <div class="result-shell {result_class}">

        <div class="result-orb"
             style="
                background:{result_color};
                box-shadow:
                    0 0 0 8px {result_glow},
                    0 0 35px {result_color};
             ">
        </div>


        <div class="result-kicker">
            AI ASSESSMENT
        </div>


        <div class="result-title"
             style="color:{result_color};">

            {result_icon}
            {result_text}

        </div>


        <div class="result-number">
            {probability_percentage:.1f}%
        </div>


        <div class="result-caption">
            Estimated probability of loan approval
        </div>


        <div class="result-status-pill"
             style="
                border-color:{result_glow};
                background:{result_glow};
                color:{result_color};
             ">

            ● MODEL ANALYSIS COMPLETE

        </div>

    </div>
    """

    st.html(result_html)
    st.text("AI ASSESSMENT")


# ============================================================
# APPROVAL PROBABILITY
# ============================================================

def render_probability(
    probability_percentage
):

    if probability_percentage < 40:

        likelihood_text = "LOW LIKELIHOOD"
        likelihood_class = "low"

    elif probability_percentage < 70:

        likelihood_text = "MODERATE LIKELIHOOD"
        likelihood_class = "moderate"

    else:

        likelihood_text = "HIGH LIKELIHOOD"
        likelihood_class = "high"


    probability_html = f"""
    <div class="probability-panel">

        <div class="probability-header">

            <div>

                <div class="probability-label">
                    APPROVAL PROBABILITY
                </div>

                <div class="probability-description">
                    Estimated likelihood of loan approval
                </div>

            </div>


            <div class="probability-value">
                {probability_percentage:.1f}%
            </div>

        </div>


        <div class="probability-track">

            <div
                class="probability-fill {likelihood_class}"
                style="
                    width:{probability_percentage:.1f}%;
                ">
            </div>

        </div>


        <div class="probability-footer">

            <span>
                Model probability
            </span>

            <span class="likelihood-badge {likelihood_class}">
                ● {likelihood_text}
            </span>

        </div>

    </div>
    """

    st.html(probability_html)
    st.text("APPROVAL PROBABILITY")


# ============================================================
# APPLICANT SNAPSHOT — V2
# ============================================================

def render_snapshot(data):

    st.html("""
    <div class="snapshot-heading">
        <div>
            <div class="snapshot-title">
                Applicant Snapshot
            </div>

            <div class="snapshot-subtitle">
                Key information used by the prediction model
            </div>
        </div>
    </div>
    """)

    # --------------------------------------------------------
    # SAFE VALUES
    # --------------------------------------------------------

    cibil = float(data.get("cibil_score", 0) or 0)
    income = float(data.get("income_annum", 0) or 0)
    loan_amount = float(data.get("loan_amount", 0) or 0)
    loan_term = float(data.get("loan_term", 0) or 0)

    residential = float(
        data.get("residential_assets_value", 0) or 0
    )

    commercial = float(
        data.get("commercial_assets_value", 0) or 0
    )

    luxury = float(
        data.get("luxury_assets_value", 0) or 0
    )

    bank = float(
        data.get("bank_asset_value", 0) or 0
    )

    total_assets = (
        residential
        + commercial
        + luxury
        + bank
    )

    # --------------------------------------------------------
    # METRICS
    # --------------------------------------------------------

    metrics = [
        (
            "◉",
            f"{cibil:.0f}",
            "CIBIL Score",
            "Credit score",
        ),

        (
            "₹",
            f"₹{income:,.0f}",
            "Annual Income",
            "Reported yearly income",
        ),

        (
            "◈",
            f"₹{loan_amount:,.0f}",
            "Requested Loan",
            "Requested amount",
        ),

        (
            "◷",
            f"{loan_term:.0f} years",
            "Loan Term",
            "Repayment duration",
        ),

        (
            "⌂",
            f"₹{total_assets:,.0f}",
            "Total Assets",
            "Declared asset value",
        ),
    ]

    # --------------------------------------------------------
    # BUILD HTML
    # --------------------------------------------------------

    metric_html = '<div class="metrics-grid">'

    for icon, value, label, helper in metrics:

        metric_html += f"""
        <div class="premium-metric">

            <div class="metric-icon">
                {icon}
            </div>

            <div class="metric-value">
                {value}
            </div>

            <div class="metric-label">
                {label}
            </div>

            <div class="metric-helper">
                {helper}
            </div>

        </div>
        """

    metric_html += "</div>"

    st.html(metric_html)