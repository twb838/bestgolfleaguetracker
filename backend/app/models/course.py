from sqlalchemy import Column, Integer, String, Date, Table, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from app.db.base import Base
from app.models.association_tables import league_courses

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # Relationship to holes
    holes = relationship("Hole", back_populates="course", cascade="all, delete-orphan")
    
    # Relationship to leagues
    leagues = relationship("League", secondary=league_courses, back_populates="courses")
    
    def __repr__(self):
        return f"<Course(id={self.id}, name={self.name})>"

class Hole(Base):
    __tablename__ = "holes"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    par = Column(Integer, nullable=False)
    yards = Column(Integer, nullable=True)
    handicap = Column(Integer, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="holes")
    
    def __repr__(self):
        return f"<Hole(id={self.id}, course_id={self.course_id}, number={self.number})>"