import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import crud
import schemas
from deps import get_db, require_roles

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(require_roles("admin"))])


def _resolve_range(start: Optional[datetime.date], end: Optional[datetime.date]):
    today = datetime.date.today()
    return start or today, end or today


@router.get("/sales", response_model=List[schemas.SalesReportRow])
def sales_report(
    start: Optional[datetime.date] = Query(None),
    end: Optional[datetime.date] = Query(None),
    db: Session = Depends(get_db),
):
    start, end = _resolve_range(start, end)
    return crud.sales_report(db, start, end)


@router.get("/top-products", response_model=List[schemas.TopProductRow])
def top_products_report(
    start: Optional[datetime.date] = Query(None),
    end: Optional[datetime.date] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    start, end = _resolve_range(start, end)
    return crud.top_products_report(db, start, end, limit)


@router.get("/profit", response_model=List[schemas.ProfitReportRow])
def profit_report(
    start: Optional[datetime.date] = Query(None),
    end: Optional[datetime.date] = Query(None),
    db: Session = Depends(get_db),
):
    start, end = _resolve_range(start, end)
    return crud.profit_report(db, start, end)


@router.get("/low-stock", response_model=List[schemas.LowStockRow])
def low_stock_report(db: Session = Depends(get_db)):
    return crud.low_stock_report(db)


@router.get("/stock-value", response_model=List[schemas.StockValueRow])
def stock_value_report(db: Session = Depends(get_db)):
    return crud.stock_value_report(db)
