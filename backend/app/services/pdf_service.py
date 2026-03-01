"""
PDF generation service using fpdf2.
Automatically downloads DejaVu fonts for Cyrillic support on first run.
"""
from fpdf import FPDF
from fpdf.enums import XPos, YPos
import os
import urllib.request
from typing import List, Dict, Any

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")

FONTS = {
    "DejaVuSans.ttf": "https://github.com/py-pdf/fpdf2/raw/master/tutorial/fonts/DejaVuSans.ttf",
    "DejaVuSans-Bold.ttf": "https://github.com/py-pdf/fpdf2/raw/master/tutorial/fonts/DejaVuSans-Bold.ttf",
}


def ensure_fonts():
    """Download DejaVu fonts if not present."""
    os.makedirs(FONT_DIR, exist_ok=True)
    for name, url in FONTS.items():
        path = os.path.join(FONT_DIR, name)
        if not os.path.exists(path):
            try:
                print(f"Downloading font {name}...")
                urllib.request.urlretrieve(url, path)
                print(f"  OK: {path}")
            except Exception as e:
                print(f"  Failed to download {name}: {e}")


class ContractPDF(FPDF):
    _font_name: str = "Helvetica"

    def footer(self):
        self.set_y(-15)
        self.set_font(self._font_name, size=8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"HORAND Partnership  |  {self.page_no()}", align="C")
        self.set_text_color(0, 0, 0)

    def setup_fonts(self) -> str:
        regular = os.path.join(FONT_DIR, "DejaVuSans.ttf")
        bold = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
        if os.path.exists(regular) and os.path.exists(bold):
            self.add_font("DejaVu", style="", fname=regular)
            self.add_font("DejaVu", style="B", fname=bold)
            self._font_name = "DejaVu"
        else:
            self._font_name = "Helvetica"
        return self._font_name


def generate_contract_pdf(
    company_name: str,
    entity_type: str,
    co_owners: List[Dict[str, Any]],
    income_rules: List[Dict[str, Any]],
    lang: str = "ua",
) -> bytes:
    ensure_fonts()

    is_ua = lang == "ua"

    def t(ua_text: str, en_text: str) -> str:
        return ua_text if is_ua else en_text

    company_label = t(
        "Компанія" if entity_type == "company" else "Проєкт",
        "Company" if entity_type == "company" else "Project",
    )

    def owner_label(i: int) -> str:
        return t(f"Співвласник {i+1}", f"Co-owner {i+1}")

    pdf = ContractPDF()
    pdf.set_margins(20, 20, 20)
    pdf.set_auto_page_break(auto=True, margin=25)
    font = pdf.setup_fonts()
    pdf.add_page()

    def heading(text: str, size: int = 11):
        pdf.set_font(font, style="B", size=size)
        pdf.multi_cell(0, 7, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font(font, size=10)
        pdf.ln(2)

    def para(text: str, indent: int = 0):
        pdf.multi_cell(0, 6, " " * indent + text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1)

    def sep():
        pdf.ln(4)

    # Title
    pdf.set_font(font, style="B", size=13)
    pdf.multi_cell(
        0, 8,
        t(
            "ДОГОВІР ПРО СПІВВЛАСНІСТЬ ТА РОЗПОДІЛ ДОХОДІВ",
            "CO-OWNERSHIP AND INCOME DISTRIBUTION AGREEMENT",
        ),
        align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT,
    )
    pdf.ln(8)
    pdf.set_font(font, size=10)

    # Preamble
    para(t(
        "Цей Договір про співвласність та розподіл доходів (надалі – «Договір») укладений між:",
        'This Co-ownership and Income Distribution Agreement (the "Agreement") is entered into between:',
    ))
    for i, owner in enumerate(co_owners):
        para(f"{i+1}. {owner['full_name']} («{owner_label(i)}»)", indent=4)
    pdf.ln(2)
    para(t("(разом – «Сторони», а окремо – «Сторона»).", '(together the "Parties" and each a "Party").'))
    para(t("Сторони домовились про таке:", "The Parties agree as follows:"))
    sep()

    # Section 1
    heading(f"1. {company_label.upper()}")
    para(t(
        f"1.1. Сторони є співвласниками {'компанії' if entity_type == 'company' else 'проєкту'} «{company_name}» (надалі – «{company_name}»).",
        f"1.1. The Parties are co-owners of the {entity_type} «{company_name}» (the «{company_name}»).",
    ))
    para(t(
        f"1.2. Частки у власності на {company_label} «{company_name}» розподіляються таким чином:",
        f"1.2. Ownership shares in the {company_label} «{company_name}» are distributed as follows:",
    ))
    for i, owner in enumerate(co_owners):
        para(f"{owner_label(i)}: {owner['share']}%", indent=8)
    sep()

    # Section 2
    heading(f"2. {t('РОЗПОДІЛ ДОХОДІВ', 'INCOME DISTRIBUTION')}")
    para(t(
        f"Сторони домовляються про такий розподіл доходів від діяльності {company_label} «{company_name}»:",
        f"The Parties agree on the following income distribution from the activities of the {company_label} «{company_name}»:",
    ))

    by_type: Dict[str, list] = {}
    for rule in income_rules:
        by_type.setdefault(rule["income_type"], []).append(rule)

    id_to_label = {
        owner.get("id", idx): owner_label(idx)
        for idx, owner in enumerate(co_owners)
    }

    subsections = [
        ("project", t(f"2.1. Дохід від проєкту «{company_name}»", f"2.1. Project income «{company_name}»")),
        ("clients", t("2.2. Дохід від перших клієнтів", "2.2. Income from first clients")),
        ("profit",  t("2.3. Частка з чистого прибутку", "2.3. Net profit share")),
    ]
    for itype, label in subsections:
        if itype in by_type:
            para(label)
            for rule in by_type[itype]:
                lbl = id_to_label.get(rule["co_owner_id"], f"Co-owner {rule['co_owner_id']}")
                para(f"{lbl}: {rule['share']}%", indent=8)
    sep()

    # Section 3
    heading(f"3. {t('ПРАВА ТА ОБОВЯЗКИ', 'RIGHTS AND OBLIGATIONS')}")
    para(f"3.1. " + t(
        f"Кожна Сторона зобовязується діяти сумлінно та в найкращих інтересах «{company_name}».",
        f"Each Party undertakes to act in good faith and in the best interests of «{company_name}».",
    ))
    para(f"3.2. " + t(
        "Сторони мають рівні права щодо прийняття рішень стосовно управління та стратегії.",
        "The Parties have equal rights regarding decisions on management and strategy.",
    ))
    sep()

    # Section 4
    heading(f"4. {t('СТРОК ДІЇ ТА ПРИПИНЕННЯ', 'TERM AND TERMINATION')}")
    para(f"4.1. " + t(
        "Цей Договір діє до моменту його припинення за взаємною письмовою згодою Сторін.",
        "This Agreement shall remain in force until terminated by mutual written agreement.",
    ))
    para(f"4.2. " + t(
        "У разі припинення Договору Сторони розподіляють усі наявні прибутки чи збитки.",
        "Upon termination, the Parties shall distribute all remaining profits or losses.",
    ))
    sep()

    # Section 5
    heading(f"5. {t('ЗАСТОСОВНЕ ПРАВО', 'GOVERNING LAW')}")
    para(f"5.1. " + t(
        "Цей Договір регулюється відповідно до законодавства України.",
        "This Agreement shall be governed by the laws of England and Wales.",
    ))
    sep()

    # Section 6
    heading(f"6. {t('ПОВНОТА ДОГОВОРУ', 'ENTIRE AGREEMENT')}")
    para(t(
        "Цей Договір становить повне розуміння між Сторонами та замінює всі попередні домовленості.",
        "This Agreement constitutes the entire understanding between the Parties and supersedes all prior agreements.",
    ))
    sep()

    # Section 7 — Signatures
    heading(f"7. {t('ПІДПИСИ', 'SIGNATURES')}")
    for i, owner in enumerate(co_owners):
        para(f"{t('Підпис', 'Signature')} {owner_label(i)}:")
        para(f"  {t('Імя', 'Name')}: {owner['full_name']}")
        para(f"  {t('Підпис', 'Signature')}: _______________________________")
        pdf.ln(3)
    para(t("Дата: ___________", "Date: ___________"))

    return bytes(pdf.output())