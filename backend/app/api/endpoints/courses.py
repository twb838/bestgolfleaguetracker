from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Dict
from sqlalchemy import func

from app.db.base import get_db
from app.models.course import Course, Hole
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.hole import HoleCreate, HoleResponse, HoleUpdate

router = APIRouter(prefix="/courses", tags=["courses"])

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    # First create the course
    db_course = Course(name=course.name)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    # Now add holes with the course_id
    if course.holes:
        for hole_data in course.holes:
            db_hole = Hole(
                number=hole_data.number,
                par=hole_data.par,
                yards=hole_data.yards,
                handicap=hole_data.handicap,
                course_id=db_course.id
            )
            db.add(db_hole)
        
        db.commit()
        db.refresh(db_course)
    
    return db_course

@router.get("/", response_model=List[CourseResponse])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    courses = db.query(Course).offset(skip).limit(limit).all()
    return courses

@router.get("/{course_id}", response_model=CourseResponse)
def read_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return db_course

@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course_update: CourseUpdate, db: Session = Depends(get_db)):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Update course name
    db_course.name = course_update.name # type: ignore
    
    # Handle holes if provided
    if course_update.holes is not None:
        for hole_data in course_update.holes:
            if hole_data.id:
                # Update existing hole
                db_hole = db.query(Hole).filter(Hole.id == hole_data.id).first()
                if db_hole and db_hole.course_id == course_id: # type: ignore
                    db_hole.number = hole_data.number # type: ignore
                    db_hole.par = hole_data.par # type: ignore
                    db_hole.yards = hole_data.yards # type: ignore
                    db_hole.handicap = hole_data.handicap # type: ignore
            else:
                # Add new hole
                db_hole = Hole(
                    number=hole_data.number,
                    par=hole_data.par,
                    yards=hole_data.yards,
                    handicap=hole_data.handicap,
                    course_id=course_id
                )
                db.add(db_hole)
    
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Holes will be automatically deleted due to cascade="all, delete-orphan"
    db.delete(db_course)
    db.commit()
    return None

@router.put("/holes/{hole_id}", response_model=HoleResponse)
def update_hole(
    hole_id: int, 
    hole_data: HoleUpdate, 
    db: Session = Depends(get_db)
):
    """
    Update a hole's information
    """
    # Get the hole by id
    db_hole = db.query(Hole).filter(Hole.id == hole_id).first()
    if not db_hole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hole with id {hole_id} not found"
        )
    
    # Update the hole's attributes with the provided data
    hole_data_dict = hole_data.dict(exclude_unset=True)
    for key, value in hole_data_dict.items():
        setattr(db_hole, key, value)
    
    # Save changes to the database
    db.commit()
    db.refresh(db_hole)
    
    return db_hole

@router.delete("/holes/{hole_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hole(
    hole_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a hole by ID
    """
    # Get the hole by id
    db_hole = db.query(Hole).filter(Hole.id == hole_id).first()
    if not db_hole:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hole with id {hole_id} not found"
        )
    
    # Delete the hole
    db.delete(db_hole)
    db.commit()
    
    # Return 204 No Content response
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{course_id}/stats", response_model=Dict)
def get_course_stats(
    course_id: int,
    db: Session = Depends(get_db)
):
    """
    Get statistical information about a golf course
    """
    # Check if course exists
    db_course = db.query(Course).filter(Course.id == course_id).first()
    if not db_course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with id {course_id} not found"
        )
    
    # Get the number of holes
    hole_count = db.query(func.count(Hole.id)).filter(Hole.course_id == course_id).scalar() or 0
    
    # Calculate total par
    total_par = db.query(func.sum(Hole.par)).filter(Hole.course_id == course_id).scalar() or 0
    
    # Calculate total yards
    total_yards = db.query(func.sum(Hole.yards)).filter(Hole.course_id == course_id).scalar() or 0
    
    # Get par distribution
    par_3_count = db.query(func.count(Hole.id)).filter(Hole.course_id == course_id, Hole.par == 3).scalar() or 0
    par_4_count = db.query(func.count(Hole.id)).filter(Hole.course_id == course_id, Hole.par == 4).scalar() or 0
    par_5_count = db.query(func.count(Hole.id)).filter(Hole.course_id == course_id, Hole.par == 5).scalar() or 0
    
    # Calculate course rating if there are 18 holes
    # Note: This is a simplified calculation - real course ratings are more complex
    estimated_rating = None
    if hole_count == 18:
        # Very simple estimation: course rating is roughly par + difficulty factor
        # Real ratings use slope, scratch golfer expected scores, etc.
        difficulty_factor = (total_yards / 6800) * 0.5  # 6800 yards is considered "standard"
        estimated_rating = (total_par + difficulty_factor)
    
    # Return stats as a dictionary
    return {
        "course_id": course_id,
        "course_name": db_course.name,
        "hole_count": hole_count,
        "total_par": total_par,
        "total_yards": total_yards,
        "par_distribution": {
            "par_3": par_3_count,
            "par_4": par_4_count,
            "par_5": par_5_count
        },
        "average_par": round(total_par / hole_count, 1) if hole_count > 0 else 0,
        "average_length": round(total_yards / hole_count) if hole_count > 0 else 0,
        "estimated_rating": round(estimated_rating, 1) if estimated_rating else None
    }