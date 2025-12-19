from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.schemas.favorite import FavoriteCreate, FavoriteResponse, FavoriteListResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=List[FavoriteResponse])
def list_favorites(
    type: Optional[str] = Query(None, description="Filter by type: spot, hotel, or dining"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all favorites for the current user, optionally filtered by type.
    """
    query = db.query(Favorite).filter(Favorite.user_id == current_user.id)
    
    if type:
        if type not in ["spot", "hotel", "dining"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid type. Must be one of: spot, hotel, dining"
            )
        query = query.filter(Favorite.type == type)
    
    favorites = query.order_by(Favorite.created_at.desc()).all()
    
    return [
        FavoriteResponse(
            id=fav.id,
            user_id=fav.user_id,
            type=fav.type,
            name=fav.name,
            address=fav.address,
            location=fav.location,
            created_at=fav.created_at
        )
        for fav in favorites
    ]


@router.get("/grouped", response_model=FavoriteListResponse)
def list_favorites_grouped(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all favorites grouped by type.
    """
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).order_by(Favorite.created_at.desc()).all()
    
    grouped = {
        "spot": [],
        "hotel": [],
        "dining": []
    }
    
    for fav in favorites:
        grouped[fav.type].append(
            FavoriteResponse(
                id=fav.id,
                user_id=fav.user_id,
                type=fav.type,
                name=fav.name,
                address=fav.address,
                location=fav.location,
                created_at=fav.created_at
            )
        )
    
    return FavoriteListResponse(**grouped)


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def create_favorite(
    favorite_data: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new favorite for the current user.
    """
    # Check for duplicates (same name and location for the same user)
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.name == favorite_data.name,
        Favorite.type == favorite_data.type
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This item is already in your favorites"
        )
    
    new_favorite = Favorite(
        user_id=current_user.id,
        type=favorite_data.type,
        name=favorite_data.name,
        address=favorite_data.address,
        location=favorite_data.location.model_dump()
    )
    
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    
    return FavoriteResponse(
        id=new_favorite.id,
        user_id=new_favorite.user_id,
        type=new_favorite.type,
        name=new_favorite.name,
        address=new_favorite.address,
        location=new_favorite.location,
        created_at=new_favorite.created_at
    )


@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    favorite_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a favorite.
    Only accessible by the owner.
    """
    favorite = db.query(Favorite).filter(
        Favorite.id == favorite_id,
        Favorite.user_id == current_user.id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return None
