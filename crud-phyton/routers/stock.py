from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud
import exceptions
import schemas
from deps import get_db, require_roles

router = APIRouter(
    prefix="/stock-movements", tags=["stock"], dependencies=[Depends(require_roles("admin"))]
)


@router.post("", response_model=schemas.StockMovementResponse, status_code=status.HTTP_201_CREATED)
def create_stock_movement(
    data: schemas.StockMovementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("admin")),
):
    try:
        return crud.create_stock_movement(db, data, current_user)
    except exceptions.NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except exceptions.InsufficientStockError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[schemas.StockMovementResponse])
def read_stock_movements(
    product_id: Optional[int] = None, date: Optional[str] = None, db: Session = Depends(get_db)
):
    return crud.get_stock_movements(db, product_id, date)
