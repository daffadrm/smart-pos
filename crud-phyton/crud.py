import datetime
import re

from sqlalchemy import func
from sqlalchemy.orm import Session

import exceptions
import models
import schemas
from security import hash_password


# ----- User -----

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    data = user.model_dump(exclude={"password"})
    db_user = models.User(**data, hashed_password=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_users(db: Session):
    return db.query(models.User).all()


def get_user(db: Session, user_id: int):
    return db.get(models.User, user_id)


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def update_user(db: Session, user_id: int, data: schemas.UserUpdate):
    user = db.get(models.User, user_id)
    if user:
        for key, value in data.model_dump(exclude={"password"}).items():
            setattr(user, key, value)
        if data.password:
            user.hashed_password = hash_password(data.password)
        db.commit()
        db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = db.get(models.User, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user


# ----- Category -----

def _category_name_taken(db: Session, name: str, exclude_id: int | None = None) -> bool:
    query = db.query(models.Category).filter(func.lower(models.Category.name) == name.strip().lower())
    if exclude_id is not None:
        query = query.filter(models.Category.id != exclude_id)
    return query.first() is not None


def create_category(db: Session, category: schemas.CategoryCreate):
    if _category_name_taken(db, category.name):
        raise exceptions.ValidationError(f"Kategori '{category.name}' sudah digunakan")
    db_category = models.Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_categories(db: Session):
    return db.query(models.Category).all()


def get_category(db: Session, category_id: int):
    return db.get(models.Category, category_id)


def update_category(db: Session, category_id: int, data: schemas.CategoryCreate):
    category = db.get(models.Category, category_id)
    if category is None:
        return None
    if _category_name_taken(db, data.name, exclude_id=category_id):
        raise exceptions.ValidationError(f"Kategori '{data.name}' sudah digunakan")
    for key, value in data.model_dump().items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def bulk_create_categories(db: Session, items: list[schemas.CategoryCreate]) -> schemas.CategoryBulkResult:
    errors: list[schemas.CategoryBulkRowError] = []
    seen_names: set[str] = set()
    created = 0

    for idx, item in enumerate(items, start=1):
        name = item.name.strip()
        if not name:
            errors.append(schemas.CategoryBulkRowError(row=idx, name=None, message="Nama kosong"))
            continue
        key = name.lower()
        if key in seen_names:
            errors.append(
                schemas.CategoryBulkRowError(row=idx, name=name, message=f"'{name}' duplikat di daftar yang di-paste")
            )
            continue
        if _category_name_taken(db, name):
            errors.append(schemas.CategoryBulkRowError(row=idx, name=name, message=f"Kategori '{name}' sudah ada"))
            continue
        seen_names.add(key)
        db.add(models.Category(name=name, description=item.description))
        db.commit()
        created += 1

    return schemas.CategoryBulkResult(total_rows=len(items), created=created, errors=errors)


def category_has_products(db: Session, category_id: int) -> bool:
    return db.query(models.Product).filter(models.Product.category_id == category_id).first() is not None


def delete_category(db: Session, category_id: int):
    category = db.get(models.Category, category_id)
    if category:
        db.delete(category)
        db.commit()
    return category


# ----- Unit -----

def create_unit(db: Session, unit: schemas.UnitCreate):
    db_unit = models.Unit(**unit.model_dump())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


def get_units(db: Session):
    return db.query(models.Unit).all()


def get_unit(db: Session, unit_id: int):
    return db.get(models.Unit, unit_id)


def update_unit(db: Session, unit_id: int, data: schemas.UnitCreate):
    unit = db.get(models.Unit, unit_id)
    if unit:
        for key, value in data.model_dump().items():
            setattr(unit, key, value)
        db.commit()
        db.refresh(unit)
    return unit


def unit_in_use(db: Session, unit_id: int) -> bool:
    return (
        db.query(models.Product).filter(models.Product.base_unit_id == unit_id).first() is not None
        or db.query(models.ProductUnit).filter(models.ProductUnit.unit_id == unit_id).first() is not None
    )


def delete_unit(db: Session, unit_id: int):
    unit = db.get(models.Unit, unit_id)
    if unit:
        db.delete(unit)
        db.commit()
    return unit


# ----- Product -----

def _validate_units(data: schemas.ProductCreate) -> None:
    unit_ids = [u.unit_id for u in data.units]
    if len(unit_ids) != len(set(unit_ids)):
        raise exceptions.ValidationError("Satuan produk tidak boleh duplikat")
    base = next((u for u in data.units if u.unit_id == data.base_unit_id), None)
    if base is None:
        raise exceptions.ValidationError("Satuan dasar harus ada di daftar konversi satuan")
    if base.conversion != 1:
        raise exceptions.ValidationError("Konversi satuan dasar harus 1")


def _generate_sku(db: Session) -> str:
    last_id = db.query(func.max(models.Product.id)).scalar() or 0
    seq = last_id + 1
    sku = f"PRD-{seq:06d}"
    while db.query(models.Product).filter(models.Product.sku == sku).first() is not None:
        seq += 1
        sku = f"PRD-{seq:06d}"
    return sku


def _product_name_taken(db: Session, name: str, exclude_id: int | None = None) -> bool:
    query = db.query(models.Product).filter(func.lower(models.Product.name) == name.strip().lower())
    if exclude_id is not None:
        query = query.filter(models.Product.id != exclude_id)
    return query.first() is not None


def create_product(db: Session, data: schemas.ProductCreate) -> models.Product:
    _validate_units(data)
    if _product_name_taken(db, data.name):
        raise exceptions.ValidationError(f"Nama produk '{data.name}' sudah digunakan")
    product = models.Product(
        name=data.name,
        sku=data.sku or _generate_sku(db),
        barcode=data.barcode,
        category_id=data.category_id,
        base_unit_id=data.base_unit_id,
        min_stock=data.min_stock,
        is_active=data.is_active,
        stock=0,
    )
    db.add(product)
    db.flush()
    for u in data.units:
        db.add(models.ProductUnit(product_id=product.id, **u.model_dump()))
    db.commit()
    db.refresh(product)
    return product


def get_products(db: Session):
    return db.query(models.Product).all()


def get_product(db: Session, product_id: int):
    return db.get(models.Product, product_id)


def get_product_unit(db: Session, product_id: int, unit_id: int):
    return (
        db.query(models.ProductUnit)
        .filter(models.ProductUnit.product_id == product_id, models.ProductUnit.unit_id == unit_id)
        .first()
    )


def update_product(db: Session, product_id: int, data: schemas.ProductCreate):
    product = db.get(models.Product, product_id)
    if product is None:
        return None
    _validate_units(data)
    if _product_name_taken(db, data.name, exclude_id=product_id):
        raise exceptions.ValidationError(f"Nama produk '{data.name}' sudah digunakan")
    product.name = data.name
    if data.sku:
        product.sku = data.sku
    product.barcode = data.barcode
    product.category_id = data.category_id
    product.base_unit_id = data.base_unit_id
    product.min_stock = data.min_stock
    product.is_active = data.is_active
    db.query(models.ProductUnit).filter(models.ProductUnit.product_id == product_id).delete()
    for u in data.units:
        db.add(models.ProductUnit(product_id=product_id, **u.model_dump()))
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int):
    product = db.get(models.Product, product_id)
    if product:
        db.delete(product)
        db.commit()
    return product


# ----- Store setting (singleton) -----

def get_or_create_store_setting(db: Session) -> models.StoreSetting:
    setting = db.query(models.StoreSetting).first()
    if setting is None:
        setting = models.StoreSetting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def update_store_setting(db: Session, data: schemas.StoreSettingUpdate) -> models.StoreSetting:
    setting = get_or_create_store_setting(db)
    for key, value in data.model_dump().items():
        setattr(setting, key, value)
    db.commit()
    db.refresh(setting)
    return setting


# ----- Stock movement -----

def get_stock_movements(db: Session, product_id: int | None = None):
    query = db.query(models.StockMovement)
    if product_id is not None:
        query = query.filter(models.StockMovement.product_id == product_id)
    return query.order_by(models.StockMovement.created_at.desc()).all()


def create_stock_movement(
    db: Session, data: schemas.StockMovementCreate, user: models.User
) -> models.StockMovement:
    product = db.get(models.Product, data.product_id)
    if product is None:
        raise exceptions.NotFoundError("Produk tidak ditemukan")
    product_unit = get_product_unit(db, data.product_id, data.unit_id)
    if product_unit is None:
        raise exceptions.NotFoundError("Satuan tidak tersedia untuk produk ini")

    qty_base = data.qty_input * product_unit.conversion

    if data.type == models.StockMovementType.in_:
        applied_qty_base = qty_base
    elif data.type == models.StockMovementType.out:
        if product.stock < qty_base:
            raise exceptions.InsufficientStockError(product.name, product.stock, qty_base)
        applied_qty_base = -qty_base
    else:
        # Stock Adjustment: qty_input adalah jumlah stok baru (absolut) dalam satuan
        # yang dipilih, bukan delta — hasil konversi menggantikan product.stock.
        applied_qty_base = qty_base - product.stock

    product.stock += applied_qty_base

    movement = models.StockMovement(
        product_id=data.product_id,
        type=data.type,
        unit_id=data.unit_id,
        qty_input=data.qty_input,
        qty_base=applied_qty_base,
        note=data.note,
        created_by_id=user.id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


# ----- Sale -----

def _format_invoice_number(fmt: str, seq: int, when: datetime.date) -> str:
    result = (
        fmt.replace("{YYYYMMDD}", when.strftime("%Y%m%d"))
        .replace("{YYYY}", when.strftime("%Y"))
        .replace("{MM}", when.strftime("%m"))
        .replace("{DD}", when.strftime("%d"))
    )
    match = re.search(r"\{(0+\d*)\}", result)
    if match:
        width = len(match.group(1))
        result = result[: match.start()] + str(seq).zfill(width) + result[match.end() :]
    return result


def create_sale(db: Session, sale_in: schemas.SaleCreate, cashier: models.User) -> models.Sale:
    if not sale_in.items:
        raise exceptions.ValidationError("Transaksi harus memiliki minimal 1 item")

    line_items = []
    subtotal = 0.0
    for item in sale_in.items:
        product = db.get(models.Product, item.product_id)
        if product is None:
            raise exceptions.NotFoundError(f"Produk id {item.product_id} tidak ditemukan")
        product_unit = get_product_unit(db, item.product_id, item.unit_id)
        if product_unit is None:
            raise exceptions.NotFoundError(f"Satuan tidak tersedia untuk produk {product.name}")
        qty_base = item.qty * product_unit.conversion
        if product.stock < qty_base:
            raise exceptions.InsufficientStockError(product.name, product.stock, qty_base)
        line_subtotal = item.qty * product_unit.sell_price
        subtotal += line_subtotal
        line_items.append((product, product_unit, item.qty, qty_base, line_subtotal))

    total = subtotal - sale_in.discount + sale_in.tax
    change_amount = sale_in.paid_amount - total
    if change_amount < 0:
        raise exceptions.InsufficientPaymentError(total, sale_in.paid_amount)

    setting = get_or_create_store_setting(db)
    today = datetime.date.today()
    count_today = (
        db.query(models.Sale).filter(func.date(models.Sale.created_at) == today).count()
    )
    invoice_number = _format_invoice_number(setting.transaction_number_format, count_today + 1, today)

    sale = models.Sale(
        invoice_number=invoice_number,
        cashier_id=cashier.id,
        subtotal=subtotal,
        discount=sale_in.discount,
        tax=sale_in.tax,
        total=total,
        paid_amount=sale_in.paid_amount,
        change_amount=change_amount,
        payment_method=sale_in.payment_method,
    )
    db.add(sale)
    db.flush()

    for product, product_unit, qty, qty_base, line_subtotal in line_items:
        db.add(
            models.SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                unit_id=product_unit.unit_id,
                qty=qty,
                conversion=product_unit.conversion,
                sell_price=product_unit.sell_price,
                buy_price=product_unit.buy_price,
                subtotal=line_subtotal,
            )
        )
        product.stock -= qty_base

    db.commit()
    db.refresh(sale)
    return sale


def get_sales(db: Session):
    return db.query(models.Sale).order_by(models.Sale.created_at.desc()).all()


def get_sale(db: Session, sale_id: int):
    return db.get(models.Sale, sale_id)


# ----- Reports -----

def sales_report(db: Session, start: datetime.date, end: datetime.date):
    return (
        db.query(
            func.date(models.Sale.created_at).label("date"),
            func.sum(models.Sale.total).label("total_sales"),
            func.count(models.Sale.id).label("total_transactions"),
        )
        .filter(func.date(models.Sale.created_at) >= start, func.date(models.Sale.created_at) <= end)
        .group_by(func.date(models.Sale.created_at))
        .order_by(func.date(models.Sale.created_at))
        .all()
    )


def top_products_report(db: Session, start: datetime.date, end: datetime.date, limit: int = 10):
    return (
        db.query(
            models.Product.id.label("product_id"),
            models.Product.name.label("product_name"),
            func.sum(models.SaleItem.qty * models.SaleItem.conversion).label("qty_sold_base"),
            func.sum(models.SaleItem.subtotal).label("total_sales"),
        )
        .join(models.SaleItem, models.SaleItem.product_id == models.Product.id)
        .join(models.Sale, models.Sale.id == models.SaleItem.sale_id)
        .filter(func.date(models.Sale.created_at) >= start, func.date(models.Sale.created_at) <= end)
        .group_by(models.Product.id)
        .order_by(func.sum(models.SaleItem.subtotal).desc())
        .limit(limit)
        .all()
    )


def profit_report(db: Session, start: datetime.date, end: datetime.date):
    return (
        db.query(
            func.date(models.Sale.created_at).label("date"),
            func.sum((models.SaleItem.sell_price - models.SaleItem.buy_price) * models.SaleItem.qty).label(
                "total_profit"
            ),
        )
        .join(models.Sale, models.Sale.id == models.SaleItem.sale_id)
        .filter(func.date(models.Sale.created_at) >= start, func.date(models.Sale.created_at) <= end)
        .group_by(func.date(models.Sale.created_at))
        .order_by(func.date(models.Sale.created_at))
        .all()
    )


def low_stock_report(db: Session):
    products = (
        db.query(models.Product)
        .filter(models.Product.stock <= models.Product.min_stock, models.Product.is_active.is_(True))
        .all()
    )
    return [
        {"product_id": p.id, "name": p.name, "stock": p.stock, "min_stock": p.min_stock}
        for p in products
    ]


def stock_value_report(db: Session):
    products = db.query(models.Product).filter(models.Product.is_active.is_(True)).all()
    rows = []
    for p in products:
        base_pu = next((pu for pu in p.units if pu.unit_id == p.base_unit_id), None)
        buy_price_base = base_pu.buy_price if base_pu else 0.0
        rows.append(
            {
                "product_id": p.id,
                "name": p.name,
                "stock": p.stock,
                "buy_price_base": buy_price_base,
                "value": p.stock * buy_price_base,
            }
        )
    return rows


# ----- Dashboard -----

def dashboard_summary(db: Session) -> dict:
    today = datetime.date.today()
    sales_today = (
        db.query(func.coalesce(func.sum(models.Sale.total), 0))
        .filter(func.date(models.Sale.created_at) == today)
        .scalar()
    )
    profit_today = (
        db.query(
            func.coalesce(
                func.sum((models.SaleItem.sell_price - models.SaleItem.buy_price) * models.SaleItem.qty), 0
            )
        )
        .join(models.Sale, models.Sale.id == models.SaleItem.sale_id)
        .filter(func.date(models.Sale.created_at) == today)
        .scalar()
    )
    transactions_today = (
        db.query(models.Sale).filter(func.date(models.Sale.created_at) == today).count()
    )
    product_count = db.query(models.Product).filter(models.Product.is_active.is_(True)).count()
    total_stock = db.query(func.coalesce(func.sum(models.Product.stock), 0)).scalar()
    low_stock_count = (
        db.query(models.Product)
        .filter(models.Product.stock <= models.Product.min_stock, models.Product.is_active.is_(True))
        .count()
    )
    return {
        "sales_today": sales_today,
        "profit_today": profit_today,
        "product_count": product_count,
        "total_stock": total_stock,
        "low_stock_count": low_stock_count,
        "transactions_today": transactions_today,
    }
