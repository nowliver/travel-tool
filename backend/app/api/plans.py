from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.models.itinerary import ItineraryPlan
from app.schemas.itinerary import (
    ItineraryCreate,
    ItineraryUpdate,
    ItineraryResponse,
    ItineraryListResponse,
    TripContent
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/plans", tags=["Itinerary Plans"])


@router.get("", response_model=List[ItineraryListResponse])
def list_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all itinerary plans for the current user.
    Returns a list with summary info (without full content).
    """
    plans = db.query(ItineraryPlan).filter(
        ItineraryPlan.user_id == current_user.id
    ).order_by(ItineraryPlan.updated_at.desc()).all()
    
    result = []
    for plan in plans:
        content = plan.content_json
        meta = content.get("meta", {})
        days = content.get("days", [])
        
        result.append(ItineraryListResponse(
            id=plan.id,
            title=plan.title,
            description=plan.description,
            city=meta.get("city", ""),
            dates=meta.get("dates", ["", ""]),
            days_count=len(days),
            created_at=plan.created_at,
            updated_at=plan.updated_at
        ))
    
    return result


@router.post("", response_model=ItineraryResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    plan_data: ItineraryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new itinerary plan for the current user.
    """
    new_plan = ItineraryPlan(
        user_id=current_user.id,
        title=plan_data.title,
        description=plan_data.description,
        content_json=plan_data.content.model_dump()
    )
    
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    return ItineraryResponse(
        id=new_plan.id,
        user_id=new_plan.user_id,
        title=new_plan.title,
        description=new_plan.description,
        content=TripContent.model_validate(new_plan.content_json),
        created_at=new_plan.created_at,
        updated_at=new_plan.updated_at
    )


@router.get("/{plan_id}", response_model=ItineraryResponse)
def get_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific itinerary plan by ID.
    Only accessible by the owner.
    """
    plan = db.query(ItineraryPlan).filter(
        ItineraryPlan.id == plan_id,
        ItineraryPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    return ItineraryResponse(
        id=plan.id,
        user_id=plan.user_id,
        title=plan.title,
        description=plan.description,
        content=TripContent.model_validate(plan.content_json),
        created_at=plan.created_at,
        updated_at=plan.updated_at
    )


@router.put("/{plan_id}", response_model=ItineraryResponse)
def update_plan(
    plan_id: str,
    plan_data: ItineraryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update an existing itinerary plan.
    Only accessible by the owner.
    """
    plan = db.query(ItineraryPlan).filter(
        ItineraryPlan.id == plan_id,
        ItineraryPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Update fields if provided
    if plan_data.title is not None:
        plan.title = plan_data.title
    if plan_data.description is not None:
        plan.description = plan_data.description
    if plan_data.content is not None:
        plan.content_json = plan_data.content.model_dump()
    
    db.commit()
    db.refresh(plan)
    
    return ItineraryResponse(
        id=plan.id,
        user_id=plan.user_id,
        title=plan.title,
        description=plan.description,
        content=TripContent.model_validate(plan.content_json),
        created_at=plan.created_at,
        updated_at=plan.updated_at
    )


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete an itinerary plan.
    Only accessible by the owner.
    """
    plan = db.query(ItineraryPlan).filter(
        ItineraryPlan.id == plan_id,
        ItineraryPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    db.delete(plan)
    db.commit()
    
    return None
