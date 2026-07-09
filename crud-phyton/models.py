import datetime
import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from database import Base


class RoleEnum(str, enum.Enum):
    admin = "admin"
    kasir = "kasir"


class StockMovementType(str, enum.Enum):
    in_ = "in"
    out = "out"
    adjustment = "adjustment"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    debit = "debit"
    credit = "credit"
    qris = "qris"
    transfer = "transfer"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.kasir, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)

    products = relationship("Product", back_populates="category")


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    abbreviation = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    barcode = Column(String, unique=True, index=True, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    base_unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    min_stock = Column(Integer, nullable=False, default=0)
    stock = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)

    category = relationship("Category", back_populates="products")
    base_unit = relationship("Unit", foreign_keys=[base_unit_id])
    units = relationship(
        "ProductUnit", back_populates="product", cascade="all, delete-orphan"
    )


class ProductUnit(Base):
    """Satuan turunan produk beserta konversi ke satuan dasar dan harga per satuan."""

    __tablename__ = "product_units"
    __table_args__ = (UniqueConstraint("product_id", "unit_id", name="uq_product_unit"),)

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    conversion = Column(Integer, nullable=False)
    buy_price = Column(Float, nullable=False)
    sell_price = Column(Float, nullable=False)

    product = relationship("Product", back_populates="units")
    unit = relationship("Unit")


class StoreSetting(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String, nullable=False, default="Toko Saya")
    logo_url = Column(String)
    address = Column(String)
    phone = Column(String)
    email = Column(String)
    receipt_paper_size = Column(String, nullable=False, default="80mm")
    receipt_footer = Column(
        String, nullable=False, default="Terima kasih telah berbelanja."
    )
    transaction_number_format = Column(String, nullable=False, default="TRX-{YYYYMMDD}-{0001}")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    type = Column(Enum(StockMovementType), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    qty_input = Column(Integer, nullable=False)
    qty_base = Column(Integer, nullable=False)
    note = Column(String)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.now)

    product = relationship("Product")
    unit = relationship("Unit")
    created_by = relationship("User")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subtotal = Column(Float, nullable=False, default=0)
    discount = Column(Float, nullable=False, default=0)
    tax = Column(Float, nullable=False, default=0)
    total = Column(Float, nullable=False, default=0)
    paid_amount = Column(Float, nullable=False, default=0)
    change_amount = Column(Float, nullable=False, default=0)
    payment_method = Column(Enum(PaymentMethod), nullable=False, default=PaymentMethod.cash)
    created_at = Column(DateTime, default=datetime.datetime.now)

    cashier = relationship("User")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    conversion = Column(Integer, nullable=False)
    sell_price = Column(Float, nullable=False)
    buy_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
    unit = relationship("Unit")
