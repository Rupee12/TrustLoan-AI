import streamlit as st


def number_to_indian_words(number):
    number = int(number)

    if number == 0:
        return "Zero Rupees Only"

    ones = [
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen",
        "Nineteen"
    ]

    tens = [
        "", "", "Twenty", "Thirty", "Forty",
        "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ]

    def two_digit_words(n):
        if n < 20:
            return ones[n]
        return tens[n // 10] + (
            " " + ones[n % 10] if n % 10 else ""
        )

    def convert(n):
        parts = []
        crore = n // 10_000_000
        n %= 10_000_000
        lakh = n // 100_000
        n %= 100_000
        thousand = n // 1_000
        n %= 1_000
        hundred = n // 100
        n %= 100

        if crore:
            parts.append(two_digit_words(crore))
            parts.append("Crore")
        if lakh:
            parts.append(two_digit_words(lakh))
            parts.append("Lakh")
        if thousand:
            parts.append(two_digit_words(thousand))
            parts.append("Thousand")
        if hundred:
            parts.append(ones[hundred])
            parts.append("Hundred")
        if n:
            parts.append(two_digit_words(n))
        return " ".join(parts)

    return f"{convert(number)} Rupees Only"


def currency_preview(amount):
    st.html(
        f"""
        <div class="currency-preview">
            <div class="formatted-amount">
                ₹{amount:,.0f}/-
            </div>
            <div class="amount-words">
                {number_to_indian_words(amount)}
            </div>
        </div>
        """
    )
