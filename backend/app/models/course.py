from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date

from app.db.base import Base

class Course(Base):
    __tablename__ = "courses"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_created = Column(Date, default=date.today)
    
    # Relationship with holes
    holes = relationship("Hole", back_populates="course", cascade="all, delete-orphan")
    
    # Don't define a relationship to leagues here
    
    def __repr__(self):
        return f"<Course(id={self.id}, name='{self.name}')>"

class Hole(Base):
    __tablename__ = "holes"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    par = Column(Integer, nullable=False)
    yards = Column(Integer, nullable=True)
    handicap = Column(Integer, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="holes")