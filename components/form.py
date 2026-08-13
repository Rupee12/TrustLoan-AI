import streamlit as st

from utils.currency import currency_preview


# ============================================================
# SMALL UI HELPERS
# ============================================================

def _step_header(number, eyebrow, title, description):
    st.html(
        f"""
        <div class="tl-step-intro">
            <div class="tl-step-number">{number:02d}</div>
            <div class="tl-step-copy">
                <div class="tl-step-eyebrow">{eyebrow}</div>
                <div class="tl-step-title">{title}</div>
                <div class="tl-step-description">{description}</div>
            </div>
        </div>
        """
    )


def _progress(current_step):
    steps = [
        ("01", "Profile"),
        ("02", "Financial"),
        ("03", "Credit & Assets"),
        ("04", "Review"),
    ]

    html = '<div class="tl-progress">'

    for index, (number, label) in enumerate(steps, start=1):
        if index < current_step:
            state = "completed"
            icon = "✓"
        elif index == current_step:
            state = "active"
            icon = number
        else:
            state = "upcoming"
            icon = number

        html += f"""
        <div class="tl-progress-step {state}">
            <div class="tl-progress-dot">{icon}</div>
            <div class="tl-progress-label">{label}</div>
        </div>
        """

        if index < len(steps):
            line_state = "completed" if index < current_step else ""
            html += f"""
            <div class="tl-progress-line {line_state}"></div>
            """

    html += "</div>"
    st.html(html)


def _currency_field(label, key, step=1000.0, required=False, value=0.0):
    """
    Currency input.

    IMPORTANT:
    The widget key is intentionally separate from the persistent
    application keys (v2_income / v2_loan_amount).

    This avoids Streamlit's session_state error that occurs when a
    widget's own key is modified after the widget has been created.
    """

    if key not in st.session_state:
        st.session_state[key] = float(value)

    current_value = st.number_input(
        label,
        min_value=0.0,
        step=step,
        format="%.0f",
        key=key,
    )

    currency_preview(current_value)

    if required and current_value <= 0:
        st.markdown(
            """
            <div class="required-field-hint">
                ✦ This field is required
            </div>
            """,
            unsafe_allow_html=True,
        )

    return float(current_value)


def _cibil_status(score):
    if score >= 750:
        return "Excellent credit profile", "excellent"
    elif score >= 700:
        return "Strong credit profile", "strong"
    elif score >= 650:
        return "Good credit profile", "good"
    elif score >= 550:
        return "Fair credit profile", "fair"
    else:
        return "High credit risk", "risk"


def _render_cibil(score):
    label, status_class = _cibil_status(score)

    percentage = ((score - 300) / 600) * 100
    percentage = max(0, min(100, percentage))

    st.html(
        f"""
        <div class="tl-cibil-card {status_class}">
            <div class="tl-cibil-top">
                <div>
                    <div class="tl-cibil-score">{score}</div>
                    <div class="tl-cibil-status">{label}</div>
                </div>

                <div class="tl-cibil-range">
                    CIBIL RANGE
                    <strong>300 — 900</strong>
                </div>
            </div>

            <div class="tl-cibil-track">
                <div
                    class="tl-cibil-fill"
                    style="width:{percentage:.1f}%;">
                </div>

                <div
                    class="tl-cibil-marker"
                    style="left:{percentage:.1f}%;">
                </div>
            </div>

            <div class="tl-cibil-scale">
                <span>300</span>
                <span>500</span>
                <span>650</span>
                <span>750</span>
                <span>900</span>
            </div>
        </div>
        """
    )


def _navigation(back=False, next_label="Continue"):
    """
    Returns:
        (back_clicked, next_clicked)
    """

    if back:
        col1, col2 = st.columns([1, 5])

        with col1:
            back_clicked = st.button(
                "← Back",
                key=f"back_{st.session_state.form_step}",
                width="stretch",
            )

        with col2:
            next_clicked = st.button(
                next_label,
                key=f"next_{st.session_state.form_step}",
                width="stretch",
            )

        return back_clicked, next_clicked

    return (
        False,
        st.button(
            next_label,
            key=f"next_{st.session_state.form_step}",
            width="stretch",
        ),
    )


# ============================================================
# MAIN FORM
# ============================================================

def render_application_form():

    # ========================================================
    # INITIAL APPLICATION STATE
    # ========================================================

    defaults = {
        # Persistent application state ONLY.
        # Widget keys are initialized immediately before their widgets
        # are created and are never modified after widget creation.
        "v2_dependents": "0",
        "v2_education": "graduate",
        "v2_self_employed": "no",
        "v2_income": 0.0,
        "v2_loan_amount": 0.0,
        "v2_loan_term": "10 years",
        "v2_cibil": 700,
        "v2_residential_assets": 0.0,
        "v2_commercial_assets": 0.0,
        "v2_luxury_assets": 0.0,
        "v2_bank_assets": 0.0,
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value

    if "form_step" not in st.session_state:
        st.session_state.form_step = 1

    current_step = st.session_state.form_step

    # ========================================================
    # HEADER
    # ========================================================

    st.html(
        """
        <div class="tl-form-header">
            <div class="tl-form-eyebrow">
                AI LOAN ASSESSMENT
            </div>

            <div class="tl-form-title">
                Let's understand your
                <span>financial profile.</span>
            </div>

            <div class="tl-form-subtitle">
                A few details are all we need to estimate
                your loan eligibility.
            </div>

            <div class="tl-form-meta">
                <span>✦ AI-powered assessment</span>
                <span>•</span>
                <span>~60 seconds</span>
            </div>
        </div>
        """
    )

    _progress(current_step)

    # ========================================================
    # STEP 1 — PERSONAL PROFILE
    # ========================================================

    if current_step == 1:

        _step_header(
            1,
            "PERSONAL PROFILE",
            "Tell us about yourself.",
            "These details help the model understand your basic profile.",
        )

        with st.container():
            st.html(
                """
                <div class="tl-form-panel">
                    <div class="tl-panel-label">
                        PERSONAL INFORMATION
                    </div>

                    <div class="tl-panel-hint">
                        Select the option that best describes you.
                    </div>
                </div>
                """
            )

            col1, col2 = st.columns(2, gap="large")

            with col1:
                if "dependents_input" not in st.session_state:
                    st.session_state["dependents_input"] = st.session_state["v2_dependents"]

                dependents_value = st.selectbox(
                    "Number of Dependents",
                    ["0", "1", "2", "3", "4", "5"],
                    key="dependents_input",
                )

            with col2:
                if "education_input" not in st.session_state:
                    st.session_state["education_input"] = st.session_state["v2_education"]

                education_value = st.selectbox(
                    "Education",
                    ["graduate", "not graduate"],
                    format_func=lambda x:
                        "Graduate"
                        if x == "graduate"
                        else "Not Graduate",
                    key="education_input",
                )

            st.html('<div class="tl-field-gap"></div>')

            if "employment_input" not in st.session_state:
                st.session_state["employment_input"] = st.session_state["v2_self_employed"]

            employment_value = st.radio(
                "Employment Status",
                ["no", "yes"],
                format_func=lambda x:
                    "Salaried / Other"
                    if x == "no"
                    else "Self Employed",
                horizontal=True,
                key="employment_input",
            )

        st.html(
            """
            <div class="tl-privacy-note">
                <span>🔒</span>
                Your information is used only for this assessment.
            </div>
            """
        )

        _, next_button = _navigation(
            next_label="Continue to financial profile  →"
        )

        if next_button:
            st.session_state["v2_dependents"] = dependents_value
            st.session_state["v2_education"] = education_value
            st.session_state["v2_self_employed"] = employment_value
            st.session_state.form_step = 2
            st.rerun()

    # ========================================================
    # STEP 2 — FINANCIAL PROFILE
    # ========================================================

    elif current_step == 2:

        _step_header(
            2,
            "FINANCIAL PROFILE",
            "Let's look at the numbers.",
            "Enter your annual income and requested loan details.",
        )

        st.html(
            """
            <div class="tl-form-panel">
                <div class="tl-panel-label">
                    INCOME
                </div>

                <div class="tl-panel-hint">
                    Enter the applicant's total annual income.
                </div>
            </div>
            """
        )

        annual_income = _currency_field(
            "Annual Income (₹) *",
            "income_input",
            step=10000.0,
            required=True,
            value=st.session_state["v2_income"],
        )

        st.html(
            """
            <div class="tl-section-divider"></div>

            <div class="tl-form-panel">
                <div class="tl-panel-label">
                    LOAN REQUIREMENTS
                </div>

                <div class="tl-panel-hint">
                    Tell us how much you need and for how long.
                </div>
            </div>
            """
        )

        loan_amount = _currency_field(
            "Requested Loan Amount (₹) *",
            "loan_amount_input",
            step=10000.0,
            required=True,
            value=st.session_state["v2_loan_amount"],
        )

        loan_term_options = {
            "2 years": 2,
            "3 years": 3,
            "5 years": 5,
            "7 years": 7,
            "10 years": 10,
            "12 years": 12,
            "15 years": 15,
            "20 years": 20,
        }

        if "loan_term_input" not in st.session_state:
            st.session_state["loan_term_input"] = st.session_state["v2_loan_term"]

        loan_term_label = st.selectbox(
            "Loan Term",
            list(loan_term_options.keys()),
            key="loan_term_input",
        )

        loan_term = loan_term_options[loan_term_label]

        st.html(
            f"""
            <div class="tl-loan-summary">
                <span>Repayment duration</span>
                <strong>{loan_term} years</strong>
            </div>
            """
        )

        back_button, next_button = _navigation(
            back=True,
            next_label="Continue to credit profile  →",
        )

        if back_button:
            st.session_state.form_step = 1
            st.rerun()

        if next_button:

            errors = []

            if annual_income <= 0:
                errors.append(
                    "Please enter your annual income."
                )

            if loan_amount <= 0:
                errors.append(
                    "Please enter the requested loan amount."
                )

            if errors:
                st.error(
                    "Please complete the required fields before continuing."
                )

                for error in errors:
                    st.markdown(f"- {error}")

            else:
                # IMPORTANT:
                # Copy widget values into persistent application state.
                #
                # We DO NOT modify income_input or loan_amount_input here.
                # Those keys belong to Streamlit widgets.

                st.session_state["v2_income"] = annual_income
                st.session_state["v2_loan_amount"] = loan_amount

                st.session_state["v2_loan_term"] = loan_term_label

                st.session_state.form_step = 3
                st.rerun()

    # ========================================================
    # STEP 3 — CREDIT + ASSETS
    # ========================================================

    elif current_step == 3:

        _step_header(
            3,
            "CREDIT & ASSETS",
            "Now let's assess your financial strength.",
            "Credit score and assets are important signals used by TrustLoan AI.",
        )

        st.html(
            """
            <div class="tl-form-panel">
                <div class="tl-panel-label">
                    CIBIL CREDIT SCORE
                </div>

                <div class="tl-panel-hint">
                    Enter a CIBIL score between 300 and 900.
                </div>
            </div>
            """
        )

        if "cibil_input" not in st.session_state:
            st.session_state["cibil_input"] = st.session_state["v2_cibil"]

        cibil_score = st.number_input(
            "CIBIL Score",
            min_value=300,
            max_value=900,
            step=1,
            key="cibil_input",
        )

        _render_cibil(cibil_score)

        st.html(
            """
            <div class="tl-section-divider"></div>

            <div class="tl-form-panel">
                <div class="tl-panel-label">
                    ASSET PROFILE
                </div>

                <div class="tl-panel-hint">
                    Approximate current value of your assets.
                </div>
            </div>
            """
        )

        col1, col2 = st.columns(2, gap="large")

        with col1:
            residential_assets = _currency_field(
                "Residential Assets (₹)",
                "residential_assets_input",
                step=10000.0,
                value=st.session_state["v2_residential_assets"],
            )

            luxury_assets = _currency_field(
                "Luxury Assets (₹)",
                "luxury_assets_input",
                step=10000.0,
                value=st.session_state["v2_luxury_assets"],
            )

        with col2:
            commercial_assets = _currency_field(
                "Commercial Assets (₹)",
                "commercial_assets_input",
                step=10000.0,
                value=st.session_state["v2_commercial_assets"],
            )

            bank_assets = _currency_field(
                "Bank Assets (₹)",
                "bank_assets_input",
                step=10000.0,
                value=st.session_state["v2_bank_assets"],
            )

        back_button, next_button = _navigation(
            back=True,
            next_label="Review application  →",
        )

        if back_button:
            st.session_state.form_step = 2
            st.rerun()

        if next_button:
            st.session_state["v2_cibil"] = int(cibil_score)
            st.session_state["v2_residential_assets"] = float(residential_assets)
            st.session_state["v2_commercial_assets"] = float(commercial_assets)
            st.session_state["v2_luxury_assets"] = float(luxury_assets)
            st.session_state["v2_bank_assets"] = float(bank_assets)
            st.session_state.form_step = 4
            st.rerun()

    # ========================================================
    # STEP 4 — REVIEW
    # ========================================================

    elif current_step == 4:

        _step_header(
            4,
            "FINAL REVIEW",
            "Everything looks ready.",
            "Review the information before running the AI assessment.",
        )

        dependents = int(st.session_state["v2_dependents"])
        education = st.session_state["v2_education"]
        self_employed = st.session_state["v2_self_employed"]

        annual_income = float(st.session_state["v2_income"])
        loan_amount = float(st.session_state["v2_loan_amount"])

        loan_term_options = {
            "2 years": 2,
            "3 years": 3,
            "5 years": 5,
            "7 years": 7,
            "10 years": 10,
            "12 years": 12,
            "15 years": 15,
            "20 years": 20,
        }

        loan_term_label = st.session_state["v2_loan_term"]
        loan_term = loan_term_options[loan_term_label]

        cibil_score = int(st.session_state["v2_cibil"])

        residential_assets = float(
            st.session_state["v2_residential_assets"]
        )
        commercial_assets = float(
            st.session_state["v2_commercial_assets"]
        )
        luxury_assets = float(
            st.session_state["v2_luxury_assets"]
        )
        bank_assets = float(
            st.session_state["v2_bank_assets"]
        )

        _render_review_card(
            dependents,
            education,
            self_employed,
            annual_income,
            loan_amount,
            loan_term,
            cibil_score,
            residential_assets,
            commercial_assets,
            luxury_assets,
            bank_assets,
        )

        back_button, analyze_button = _navigation(
            back=True,
            next_label="✦  Analyze my loan eligibility",
        )

        if back_button:
            st.session_state.form_step = 3
            st.rerun()

        if analyze_button:

            errors = []

            if annual_income <= 0:
                errors.append(
                    "Annual income is required."
                )

            if loan_amount <= 0:
                errors.append(
                    "Requested loan amount is required."
                )

            if cibil_score < 300 or cibil_score > 900:
                errors.append(
                    "CIBIL score must be between 300 and 900."
                )

            if errors:

                st.error(
                    "Please fix the following before running the assessment:"
                )

                for error in errors:
                    st.markdown(f"- {error}")

            else:

                # Return data to app.py.
                # app.py performs the model prediction.

                return {
                    "no_of_dependents": dependents,
                    "education": education,
                    "self_employed": self_employed,
                    "income_annum": annual_income,
                    "loan_amount": loan_amount,
                    "loan_term": loan_term,
                    "cibil_score": cibil_score,
                    "residential_assets_value": residential_assets,
                    "commercial_assets_value": commercial_assets,
                    "luxury_assets_value": luxury_assets,
                    "bank_asset_value": bank_assets,
                }

    return None


# ============================================================
# REVIEW CARD
# ============================================================

def _render_review_card(
    dependents,
    education,
    self_employed,
    income,
    loan_amount,
    loan_term,
    cibil,
    residential,
    commercial,
    luxury,
    bank,
):

    education_label = (
        "Graduate"
        if education == "graduate"
        else "Not Graduate"
    )

    employment_label = (
        "Self Employed"
        if self_employed == "yes"
        else "Salaried / Other"
    )

    cibil_label, cibil_class = _cibil_status(cibil)

    st.html(
        f"""
        <div class="tl-review-grid">

            <div class="tl-review-card">
                <div class="tl-review-icon">♙</div>
                <div class="tl-review-label">PERSONAL</div>

                <div class="tl-review-row">
                    <span>Dependents</span>
                    <strong>{dependents}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Education</span>
                    <strong>{education_label}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Employment</span>
                    <strong>{employment_label}</strong>
                </div>
            </div>


            <div class="tl-review-card">
                <div class="tl-review-icon">₹</div>
                <div class="tl-review-label">FINANCIAL</div>

                <div class="tl-review-row">
                    <span>Annual Income</span>
                    <strong>₹{income:,.0f}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Loan Amount</span>
                    <strong>₹{loan_amount:,.0f}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Loan Term</span>
                    <strong>{loan_term} years</strong>
                </div>
            </div>


            <div class="tl-review-card tl-review-credit">
                <div class="tl-review-icon">◇</div>
                <div class="tl-review-label">CREDIT</div>

                <div class="tl-review-cibil {cibil_class}">
                    {cibil}
                </div>

                <div class="tl-review-cibil-label">
                    {cibil_label}
                </div>
            </div>


            <div class="tl-review-card">
                <div class="tl-review-icon">▣</div>
                <div class="tl-review-label">ASSETS</div>

                <div class="tl-review-row">
                    <span>Residential</span>
                    <strong>₹{residential:,.0f}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Commercial</span>
                    <strong>₹{commercial:,.0f}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Luxury</span>
                    <strong>₹{luxury:,.0f}</strong>
                </div>

                <div class="tl-review-row">
                    <span>Bank</span>
                    <strong>₹{bank:,.0f}</strong>
                </div>
            </div>

        </div>

        <div class="tl-ready-banner">
            <div class="tl-ready-orb">✦</div>

            <div>
                <div class="tl-ready-title">
                    Ready for AI analysis
                </div>

                <div class="tl-ready-text">
                    TrustLoan AI will evaluate your profile
                    using the trained machine-learning model.
                </div>
            </div>
        </div>
        """
    )