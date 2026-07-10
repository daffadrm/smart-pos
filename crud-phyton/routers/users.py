from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud
import schemas
from deps import get_db, require_roles

router = APIRouter(prefix="/users", tags=["users"], dependencies=[Depends(require_roles("admin"))])


@router.post("", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username atau email sudah digunakan")


@router.get("", response_model=schemas.UserListResponse)
def read_users(
    search: str | None = None,
    page: int = 1,
    page_size: int | None = None,
    db: Session = Depends(get_db),
):
    items, total, total_pages = crud.get_users(db, search=search, page=page, page_size=page_size)
    return schemas.UserListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size if page_size is not None else total,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, data: schemas.UserUpdate, db: Session = Depends(get_db)):
    try:
        db_user = crud.update_user(db, user_id, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username atau email sudah digunakan")
    if db_user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return db_user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.delete_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return {"message": f"User dengan ID {user_id} berhasil dihapus"}
