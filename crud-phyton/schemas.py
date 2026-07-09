import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from models import PaymentMethod, RoleEnum, StockMovementType


# ----- Auth -----

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ----- User -----

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.kasir


class UserUpdate(BaseModel):
    username: str
    email: EmailStr
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: RoleEnum = RoleEnum.kasir
    is_active: bool = True


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role: RoleEnum
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# ----- Category -----

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryResponse(CategoryCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CategoryBulkCreate(BaseModel):
    items: List[CategoryCreate]


class CategoryBulkRowError(BaseModel):
    row: int
    name: Optional[str] = None
    message: str


class CategoryBulkResult(BaseModel):
    total_rows: int
    created: int
    errors: List[CategoryBulkRowError]


# ----- Unit -----

class UnitCreate(BaseModel):
    name: str
    abbreviation: Optional[str] = None


class UnitResponse(UnitCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ----- Product -----

class ProductUnitCreate(BaseModel):
    unit_id: int
    conversion: int
    buy_price: float
    sell_price: float


class ProductUnitResponse(ProductUnitCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: int
    base_unit_id: int
    min_stock: int = 0
    is_active: bool = True
    units: List[ProductUnitCreate]


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    barcode: Optional[str] = None
    category_id: int
    base_unit_id: int
    min_stock: int
    stock: int
    is_active: bool
    units: List[ProductUnitResponse]

    model_config = ConfigDict(from_attributes=True)


class ProductImportRowError(BaseModel):
    row: int
    product_name: Optional[str] = None
    message: str


class ProductImportResult(BaseModel):
    total_rows: int
    created: int
    errors: List[ProductImportRowError]


# ----- Store setting -----

class StoreSettingUpdate(BaseModel):
    store_name: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    receipt_paper_size: str = "80mm"
    receipt_footer: str = "Terima kasih telah berbelanja."
    transaction_number_format: str = "TRX-{YYYYMMDD}-{0001}"


class StoreSettingResponse(StoreSettingUpdate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ----- Stock movement -----

class StockMovementCreate(BaseModel):
    product_id: int
    unit_id: int
    type: StockMovementType
    qty_input: int
    note: Optional[str] = None


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    unit_id: int
    type: StockMovementType
    qty_input: int
    qty_base: int
    note: Optional[str] = None
    created_by_id: int
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# ----- Sale -----

class SaleItemCreate(BaseModel):
    product_id: int
    unit_id: int
    qty: int


class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    discount: float = 0
    tax: float = 0
    paid_amount: float
    payment_method: PaymentMethod = PaymentMethod.cash


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    unit_id: int
    qty: int
    conversion: int
    sell_price: float
    buy_price: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    cashier_id: int
    cashier: UserResponse
    subtotal: float
    discount: float
    tax: float
    total: float
    paid_amount: float
    change_amount: float
    payment_method: PaymentMethod
    created_at: datetime.datetime
    items: List[SaleItemResponse]

    model_config = ConfigDict(from_attributes=True)


# ----- Reports -----

class SalesReportRow(BaseModel):
    date: datetime.date
    total_sales: float
    total_transactions: int


class TopProductRow(BaseModel):
    product_id: int
    product_name: str
    qty_sold_base: int
    total_sales: float


class ProfitReportRow(BaseModel):
    date: datetime.date
    total_profit: float


class LowStockRow(BaseModel):
    product_id: int
    name: str
    stock: int
    min_stock: int

    model_config = ConfigDict(from_attributes=True)


class StockValueRow(BaseModel):
    product_id: int
    name: str
    stock: int
    buy_price_base: float
    value: float


class DashboardResponse(BaseModel):
    sales_today: float
    profit_today: float
    product_count: int
    total_stock: int
    low_stock_count: int
    transactions_today: int
