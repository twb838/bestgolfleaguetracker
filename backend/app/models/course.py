from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from app.db.base import Base

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_created = Column(Date, default=date.today)
    
    # Relationships
    holes = relationship("Hole", back_populates="course", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Course(id={self.id}, name='{self.name}')>"

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