import re
from typing import Any


DOCUMENTS = [
    {
        "id": "hdfc-personal-loan",
        "title": "HDFC Bank Personal Loan",
        "category": "personal_loan",
        "text": (
            "The HDFC Bank personal loan page lists loan amounts from ₹25,000 to ₹1 crore "
            "and a calculator tenure from 1 to 7 years. The page lists a fixed interest "
            "rate range of 9.99% to 24.00% p.a., says terms and conditions apply, and "
            "states disbursal is at the bank's sole discretion."
        ),
        "url": "https://www.hdfc.bank.in/personal-loan",
        "verified_at": "2026-10-27",
    },
    {
        "id": "sbi-personal-loan",
        "title": "SBI Personal Loan",
        "category": "personal_loan",
        "text": (
            "The SBI personal loan page describes loans to salaried employees having "
            "a salary account with SBI. The page shows a last-updated date of 6 May 2026."
        ),
        "url": "https://sbi.bank.in/web/personal-banking/loans/personal-loans/sbi-personal-loan",
        "verified_at": "2026-10-27",
    },
    {
        "id": "trustloan-model-limitations",
        "title": "TrustLoan model limitations",
        "category": "application",
        "text": (
            "TrustLoan uses a saved Random Forest trained on a public dataset. Its "
            "prediction is educational and is not a bank decision or guarantee. SHAP "
            "values describe model contribution and are not causal evidence."
        ),
        "url": None,
        "verified_at": "2026-10-27",
    },
]


def search_knowledge(query: str, limit: int = 3) -> dict[str, Any]:
    terms = set(re.findall(r"[a-z0-9]+", query.lower()))
    ranked = []
    for document in DOCUMENTS:
        words = set(re.findall(r"[a-z0-9]+", f"{document['title']} {document['text']}".lower()))
        overlap = terms & words
        if overlap:
            ranked.append((len(overlap) / max(len(terms), 1), document))
    ranked.sort(key=lambda item: (-item[0], item[1]["title"]))
    matches = [
        {
            "title": document["title"],
            "category": document["category"],
            "excerpt": document["text"],
            "source_url": document["url"],
            "verified_at": document["verified_at"],
            "relevance": round(score, 3),
        }
        for score, document in ranked[:limit]
    ]
    return {
        "query": query,
        "answer": (
            "Retrieved evidence is provided below. It may not cover all applicable terms."
            if matches
            else "The verified local sources do not contain enough information to answer this question."
        ),
        "results": matches,
    }
