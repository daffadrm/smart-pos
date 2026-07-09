from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud
import exceptions
import schemas
from deps import get_current_user, get_db

router = APIRouter(prefix="/sales", tags=["sales"])


@router.post("", response_model=schemas.SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale: schemas.SaleCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    try:
        return crud.create_sale(db, sale, current_user)
    except exceptions.NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except (exceptions.InsufficientStockError, exceptions.InsufficientPaymentError, exceptions.ValidationError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nomor invoice bentrok, silakan coba lagi")


@router.get("", response_model=List[schemas.SaleResponse])
def read_sales(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_sales(db)


@router.get("/{sale_id}", response_model=schemas.SaleResponse)
def read_sale(sale_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db_sale = crud.get_sale(db, sale_id)
    if db_sale is None:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    return db_sale
