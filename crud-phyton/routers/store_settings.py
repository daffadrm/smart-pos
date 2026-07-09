from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas
from deps import get_current_user, get_db, require_roles

router = APIRouter(prefix="/store-settings", tags=["store-settings"])


@router.get("", response_model=schemas.StoreSettingResponse)
def read_store_setting(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_or_create_store_setting(db)


@router.put(
    "",
    response_model=schemas.StoreSettingResponse,
    dependencies=[Depends(require_roles("admin"))],
)
def update_store_setting(data: schemas.StoreSettingUpdate, db: Session = Depends(get_db)):
    return crud.update_store_setting(db, data)
