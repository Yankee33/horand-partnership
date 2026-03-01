"""
Tests for income distribution validation logic.
Covers: share validation, total = 100%, edge cases.
"""


def make_company(client, auth_headers, co_owners=None, income_rules=None):
    """Helper to create a company with co-owners."""
    if co_owners is None:
        co_owners = [
            {"full_name": "Alice", "share": 50.0, "position": 1},
            {"full_name": "Bob",   "share": 50.0, "position": 2},
        ]
    payload = {
        "name": "Test Company",
        "entity_type": "company",
        "co_owners": co_owners,
        "income_rules": income_rules or [],
    }
    return client.post("/api/companies/", json=payload, headers=auth_headers)


class TestShareValidation:
    def test_shares_equal_100(self, client, auth_headers):
        """Company with co-owners summing to 100% is created successfully."""
        res = make_company(client, auth_headers, co_owners=[
            {"full_name": "Alice", "share": 60.0, "position": 1},
            {"full_name": "Bob",   "share": 40.0, "position": 2},
        ])
        assert res.status_code == 201
        data = res.json()
        total = sum(o["share"] for o in data["co_owners"])
        assert total == 100.0

    def test_three_owners_shares(self, client, auth_headers):
        """Three co-owners with shares summing to 100%."""
        res = make_company(client, auth_headers, co_owners=[
            {"full_name": "Alice", "share": 34.0, "position": 1},
            {"full_name": "Bob",   "share": 33.0, "position": 2},
            {"full_name": "Carol", "share": 33.0, "position": 3},
        ])
        assert res.status_code == 201
        total = sum(o["share"] for o in res.json()["co_owners"])
        assert total == 100.0

    def test_income_rules_sum_to_100(self, client, auth_headers):
        """Income rules for each type must sum to 100%."""
        # First create company to get co-owner IDs
        company_res = make_company(client, auth_headers)
        assert company_res.status_code == 201
        company = company_res.json()
        co_ids = [co["id"] for co in company["co_owners"]]

        # Update income rules — valid: 50+50 = 100
        rules = [
            {"co_owner_id": co_ids[0], "income_type": "profit", "share": 50.0},
            {"co_owner_id": co_ids[1], "income_type": "profit", "share": 50.0},
        ]
        res = client.put(
            f"/api/companies/{company['id']}/income-rules",
            json=rules,
            headers=auth_headers,
        )
        assert res.status_code == 200
        result_rules = res.json()["income_rules"]
        profit_rules = [r for r in result_rules if r["income_type"] == "profit"]
        assert sum(r["share"] for r in profit_rules) == 100.0

    def test_multiple_income_types(self, client, auth_headers):
        """Multiple income types can be set independently."""
        company_res = make_company(client, auth_headers)
        company = company_res.json()
        co_ids = [co["id"] for co in company["co_owners"]]

        rules = [
            {"co_owner_id": co_ids[0], "income_type": "project", "share": 70.0},
            {"co_owner_id": co_ids[1], "income_type": "project", "share": 30.0},
            {"co_owner_id": co_ids[0], "income_type": "profit",  "share": 50.0},
            {"co_owner_id": co_ids[1], "income_type": "profit",  "share": 50.0},
        ]
        res = client.put(
            f"/api/companies/{company['id']}/income-rules",
            json=rules,
            headers=auth_headers,
        )
        assert res.status_code == 200
        result_rules = res.json()["income_rules"]

        project_total = sum(r["share"] for r in result_rules if r["income_type"] == "project")
        profit_total  = sum(r["share"] for r in result_rules if r["income_type"] == "profit")
        assert project_total == 100.0
        assert profit_total == 100.0

    def test_share_boundaries(self, client, auth_headers):
        """Share values of 1% and 99% are valid boundaries."""
        res = make_company(client, auth_headers, co_owners=[
            {"full_name": "Majority", "share": 99.0, "position": 1},
            {"full_name": "Minority", "share": 1.0,  "position": 2},
        ])
        assert res.status_code == 201
