from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas
from deps import get_db, require_roles

router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_roles("admin"))])


@router.get("", response_model=schemas.DashboardResponse)
def dashboard(db: Session = Depends(get_db)):
    return crud.dashboard_summary(db)
