from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud
import schemas
from deps import get_current_user, get_db, require_roles

router = APIRouter(prefix="/units", tags=["units"])


@router.post(
    "",
    response_model=schemas.UnitResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_unit(unit: schemas.UnitCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_unit(db, unit)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nama satuan sudah digunakan")


@router.get("", response_model=List[schemas.UnitResponse])
def read_units(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_units(db)


@router.get("/{unit_id}", response_model=schemas.UnitResponse)
def read_unit(unit_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db_unit = crud.get_unit(db, unit_id)
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Satuan tidak ditemukan")
    return db_unit


@router.put(
    "/{unit_id}", response_model=schemas.UnitResponse, dependencies=[Depends(require_roles("admin"))]
)
def update_unit(unit_id: int, data: schemas.UnitCreate, db: Session = Depends(get_db)):
    try:
        db_unit = crud.update_unit(db, unit_id, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nama satuan sudah digunakan")
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Satuan tidak ditemukan")
    return db_unit


@router.delete("/{unit_id}", dependencies=[Depends(require_roles("admin"))])
def delete_unit(unit_id: int, db: Session = Depends(get_db)):
    if crud.get_unit(db, unit_id) is None:
        raise HTTPException(status_code=404, detail="Satuan tidak ditemukan")
    if crud.unit_in_use(db, unit_id):
        raise HTTPException(status_code=400, detail="Satuan masih dipakai oleh produk, tidak bisa dihapus")
    crud.delete_unit(db, unit_id)
    return {"message": f"Satuan dengan ID {unit_id} berhasil dihapus"}
