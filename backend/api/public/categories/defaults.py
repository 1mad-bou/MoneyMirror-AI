"""Default (shared) categories. Mirrored in the initial Alembic migration."""

DEFAULT_CATEGORIES: list[tuple[str, str, str]] = [
    # (name, kind, lucide icon name)
    ("Food & Dining", "expense", "utensils"),
    ("Groceries", "expense", "shopping-basket"),
    ("Transport", "expense", "car"),
    ("Housing & Rent", "expense", "home"),
    ("Utilities", "expense", "zap"),
    ("Shopping", "expense", "shopping-bag"),
    ("Health", "expense", "heart-pulse"),
    ("Entertainment", "expense", "clapperboard"),
    ("Subscriptions", "expense", "repeat"),
    ("Education", "expense", "graduation-cap"),
    ("Travel", "expense", "plane"),
    ("Other expense", "expense", "circle-dot"),
    ("Salary", "income", "briefcase"),
    ("Freelance", "income", "laptop"),
    ("Business", "income", "building-2"),
    ("Gifts", "income", "gift"),
    ("Refunds", "income", "rotate-ccw"),
    ("Other income", "income", "circle-plus"),
]

# Keyword hints used by the receipt / natural-language parsers to suggest a
# category. Suggestions are always shown to the user for review.
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Groceries": ["marjane", "carrefour", "aswak", "acima", "bim", "label vie", "supermarket",
                  "supermarche", "hypermarche", "grocery", "groceries", "epicerie", "lidl", "aldi"],
    "Food & Dining": ["restaurant", "cafe", "café", "coffee", "pizza", "burger", "mcdonald", "kfc",
                      "lunch", "dinner", "breakfast", "snack", "starbucks", "food", "tacos", "sushi",
                      "brasserie", "boulangerie", "bakery", "patisserie"],
    "Transport": ["fuel", "gas station", "petrol", "essence", "gasoil", "diesel", "afriquia",
                  "shell", "taxi", "uber", "careem", "train", "oncf", "bus", "tram", "parking",
                  "toll", "autoroute", "station service"],
    "Utilities": ["electricity", "water bill", "lydec", "redal", "amendis", "onee", "internet",
                  "maroc telecom", "inwi", "orange", "iam", "phone bill", "utility"],
    "Housing & Rent": ["rent", "loyer", "landlord", "mortgage", "syndic"],
    "Health": ["pharmacy", "pharmacie", "doctor", "clinic", "clinique", "hospital", "dentist",
               "medecin", "médecin", "labo", "laboratoire"],
    "Shopping": ["zara", "h&m", "decathlon", "ikea", "electroplanet", "jumia", "amazon", "store",
                 "boutique", "clothes", "shoes", "mall"],
    "Entertainment": ["cinema", "movie", "concert", "megarama", "game", "theatre", "museum"],
    "Subscriptions": ["netflix", "spotify", "subscription", "abonnement", "youtube premium",
                      "disney", "icloud", "google one", "chatgpt", "gym membership"],
    "Education": ["school", "course", "tuition", "book", "librairie", "udemy", "coursera"],
    "Travel": ["hotel", "airbnb", "flight", "airline", "royal air maroc", "ryanair", "booking.com"],
    "Salary": ["salary", "salaire", "payroll", "paycheck", "wage"],
    "Freelance": ["freelance", "client payment", "invoice paid", "upwork", "fiverr", "contract work"],
    "Gifts": ["gift", "cadeau"],
    "Refunds": ["refund", "remboursement", "cashback"],
}

