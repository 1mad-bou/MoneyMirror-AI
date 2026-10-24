import re
from typing import Optional

from sqlmodel import Session, or_, select

from api.public.categories.defaults import CATEGORY_KEYWORDS, DEFAULT_CATEGORIES
from api.public.categories.models import Category, CategoryRead


def to_read(category: Category) -> CategoryRead:
    return CategoryRead(
        id=category.id,
        name=category.name,
        kind=category.kind,
        icon=category.icon,
        is_default=category.user_id is None,
    )


def visible_categories_query(user_id: int):
    """Categories a user may see/use: shared defaults + their own."""
    return select(Category).where(or_(Category.user_id.is_(None), Category.user_id == user_id))


def list_categories(db: Session, user_id: int, kind: Optional[str] = None) -> list[Category]:
    query = visible_categories_query(user_id)
    if kind:
        query = query.where(Category.kind == kind)
    query = query.order_by(Category.kind, Category.user_id.is_(None).desc(), Category.name)
    return list(db.exec(query).all())


def get_visible_category(db: Session, user_id: int, category_id: int) -> Optional[Category]:
    return db.exec(visible_categories_query(user_id).where(Category.id == category_id)).first()


def get_owned_category(db: Session, user_id: int, category_id: int) -> Optional[Category]:
    return db.exec(
        select(Category).where(Category.id == category_id, Category.user_id == user_id)
    ).first()


def find_category_by_name(
    db: Session, user_id: int, name: str, kind: Optional[str] = None
) -> Optional[Category]:
    for cat in list_categories(db, user_id, kind):
        if cat.name.lower() == name.lower():
            return cat
    return None


def seed_default_categories(db: Session) -> None:
    existing = {
        (c.name, c.kind) for c in db.exec(select(Category).where(Category.user_id.is_(None))).all()
    }
    for name, kind, icon in DEFAULT_CATEGORIES:
        if (name, kind) not in existing:
            db.add(Category(name=name, kind=kind, icon=icon, user_id=None))
    db.commit()


def _keyword_hit(text: str, keyword: str) -> bool:
    return re.search(r"(?<![\w])" + re.escape(keyword) + r"(?![\w])", text) is not None


def suggest_category_name(text: str, kind: Optional[str] = None) -> Optional[str]:
    """Return a default-category name whose keywords appear in ``text``."""
    if not text:
        return None
    lowered = text.lower()
    kinds = {name: k for name, k, _ in DEFAULT_CATEGORIES}
    best: Optional[str] = None
    best_hits = 0
    for name, keywords in CATEGORY_KEYWORDS.items():
        if kind and kinds.get(name) != kind:
            continue
        hits = sum(1 for kw in keywords if _keyword_hit(lowered, kw))
        if hits > best_hits:
            best, best_hits = name, hits
    return best

