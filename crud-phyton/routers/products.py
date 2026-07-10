import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import crud
import exceptions
import imports as product_imports
import schemas
from deps import get_current_user, get_db, require_roles

router = APIRouter(prefix="/products", tags=["products"])


def _validate_references(db: Session, data: schemas.ProductCreate) -> None:
    if crud.get_category(db, data.category_id) is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    for u in data.units:
        if crud.get_unit(db, u.unit_id) is None:
            raise HTTPException(status_code=404, detail=f"Satuan id {u.unit_id} tidak ditemukan")


@router.post(
    "",
    response_model=schemas.ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    _validate_references(db, product)
    try:
        return crud.create_product(db, product)
    except exceptions.ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=product_imports.integrity_error_message(e))


@router.get("", response_model=schemas.ProductListResponse)
def read_products(
    search: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    items, total, total_pages = crud.get_products(
        db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    return schemas.ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size if page_size is not None else total,
        total_pages=total_pages,
    )


@router.get("/import/template", dependencies=[Depends(require_roles("admin"))])
def download_import_template():
    wb = product_imports.build_template_workbook()
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=template_produk.xlsx"},
    )


@router.post(
    "/import",
    response_model=schemas.ProductImportResult,
    dependencies=[Depends(require_roles("admin"))],
)
async def import_products(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="File harus berformat .xlsx")
    content = await file.read()
    try:
        return product_imports.import_products_from_excel(db, content)
    except exceptions.ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db_product = crud.get_product(db, product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return db_product


@router.put(
    "/{product_id}",
    response_model=schemas.ProductResponse,
    dependencies=[Depends(require_roles("admin"))],
)
def update_product(product_id: int, data: schemas.ProductCreate, db: Session = Depends(get_db)):
    _validate_references(db, data)
    try:
        db_product = crud.update_product(db, product_id, data)
    except exceptions.ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=product_imports.integrity_error_message(e))
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return db_product


@router.delete("/{product_id}", dependencies=[Depends(require_roles("admin"))])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if crud.get_product(db, product_id) is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    if crud.product_has_sales(db, product_id):
        raise HTTPException(
            status_code=400,
            detail="Produk sudah pernah terjual (ada di riwayat transaksi penjualan), tidak bisa dihapus. Nonaktifkan produk sebagai gantinya.",
        )
    crud.delete_product(db, product_id)
    return {"message": f"Produk dengan ID {product_id} berhasil dihapus"}
