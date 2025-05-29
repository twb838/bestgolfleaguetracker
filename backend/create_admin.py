from sqlalchemy.orm import Session

from app import crud, schemas
from app.schemas.user import UserCreate
from app.db.session import SessionLocal
from app.crud import user as user_crud

def create_first_superuser() -> None:
    db = SessionLocal()
    try:
        user = user_crud.get_by_username(db, username="admin")
        if not user:
            user_in = UserCreate(
                username="admin",
                email="admin@example.com",
                password="admin123",  # Change this!
                first_name="Admin",
                last_name="User",
                is_superuser=True,
            )
            user = user_crud.create(db, obj_in=user_in)
            print(f"Admin user created: {user.username}")
        else:
            print(f"Admin user already exists: {user.username}")
    finally:
        db.close()

if __name__ == "__main__":
    create_first_superuser()