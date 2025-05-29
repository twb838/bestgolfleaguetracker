from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.api.deps import get_db, get_current_active_user, get_current_active_superuser
from app.schemas.user import User, UserUpdate
from app.crud import user as user_crud

router = APIRouter()

@router.get("/me", response_model=User)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get current user information"""
    return current_user

@router.put("/me", response_model=User)
def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Any:
    """Update current user"""
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User ID is missing",
        )
    current_user_data = user_crud.get(db, current_user.id)
    if not current_user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user = user_crud.update(db, db_obj=current_user_data, obj_in=user_in)
    return user