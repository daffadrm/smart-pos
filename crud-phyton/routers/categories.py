from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud
import schemas
from deps import get_current_user, get_db, require_roles

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post(
    "",
    response_model=schemas.CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_category(db, category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nama kategori sudah digunakan")


@router.get("", response_model=List[schemas.CategoryResponse])
def read_categories(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_categories(db)


@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def read_category(category_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db_category = crud.get_category(db, category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    return db_category


@router.put(
    "/{category_id}",
    response_model=schemas.CategoryResponse,
    dependencies=[Depends(require_roles("admin"))],
)
def update_category(category_id: int, data: schemas.CategoryCreate, db: Session = Depends(get_db)):
    try:
        db_category = crud.update_category(db, category_id, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nama kategori sudah digunakan")
    if db_category is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    return db_category


@router.delete("/{category_id}", dependencies=[Depends(require_roles("admin"))])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    if crud.get_category(db, category_id) is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    if crud.category_has_products(db, category_id):
        raise HTTPException(status_code=400, detail="Kategori masih dipakai oleh produk, tidak bisa dihapus")
    crud.delete_category(db, category_id)
    return {"message": f"Kategori dengan ID {category_id} berhasil dihapus"}
