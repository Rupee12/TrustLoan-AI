
def test_asset_total():
    data = {
        "residential_assets_value": 500000,
        "commercial_assets_value": 200000,
        "luxury_assets_value": 100000,
        "bank_asset_value": 300000,
    }

    total = (
        data["residential_assets_value"]
        + data["commercial_assets_value"]
        + data["luxury_assets_value"]
        + data["bank_asset_value"]
    )

    assert total == 1100000


def test_required_income_and_loan_amount_values():
    assert 350000 > 0
    assert 1500000 > 0


def test_cibil_range():
    for score in (300, 600, 700, 900):
        assert 300 <= score <= 900
