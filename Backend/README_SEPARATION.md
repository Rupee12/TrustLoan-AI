# TrustLoan AI — Separated Architecture

This version separates the original Streamlit monolith without changing the model inputs or UI sections.

## Structure

```text
TrustLoan_AI_Separated/
├── app.py
├── components/
│   ├── __init__.py
│   ├── hero.py
│   ├── form.py
│   ├── results.py
│   ├── xai.py
│   └── footer.py
├── model_loading/
│   ├── __init__.py
│   └── loader.py
├── utils/
│   ├── __init__.py
│   └── currency.py
└── styles/
    └── main.css
```

Copy these files into the corresponding folders of the existing project. Keep your existing `models/`, `assets/`, `data/`, `notebooks/`, `src/`, `README.md`, and `requirements.txt`.
