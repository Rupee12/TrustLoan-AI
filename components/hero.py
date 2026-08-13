import streamlit as st


def render_hero():
    hero_html = """
    <div class="hero-wrapper">
        <div class="hero-badge">
            ◈ TRUSTLOAN AI · EXPLAINABLE FINTECH
        </div>

        <h1 class="hero-title">
            Intelligent <span>Loan Eligibility</span>
        </h1>

        <div class="hero-description">
            Evaluate loan approval likelihood using machine learning
            and understand the factors behind every prediction through
            Explainable AI.
        </div>

        <div class="hero-status">
            <div class="status-dot"></div>
            AI MODEL ONLINE
        </div>
    </div>
    """
    st.html(hero_html)


def render_steps():
    steps_html = """
    <div class="steps">
        <div class="step active">
            <div class="step-number">1</div>
            Applicant
        </div>
        <div class="step-line"></div>
        <div class="step active">
            <div class="step-number">2</div>
            AI Analysis
        </div>
        <div class="step-line"></div>
        <div class="step">
            <div class="step-number">3</div>
            Explanation
        </div>
    </div>
    """
    st.html(steps_html)
