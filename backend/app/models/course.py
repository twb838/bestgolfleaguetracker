from sqlalchemy import Column, Integer, String, Date, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from app.db.base import Base
from app.models.association_tables import league_courses

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # Relationship to holes - use string reference to avoid import
    holes = relationship("Hole", back_populates="course", cascade="all, delete-orphan")
    
    # Relationship to matches - add if you have this relationship
    matches = relationship("Match", back_populates="course")
    
    # Relationship to leagues
    leagues = relationship("League", secondary=league_courses, back_populates="courses")
    
    def __repr__(self):
        return f"<Course(id={self.id}, name={self.name})>"

