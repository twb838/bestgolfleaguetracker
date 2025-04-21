from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: str = "3306"  # Default MySQL port
    DB_USER: str = "user"
    DB_PASSWORD: str = "password"
    DB_NAME: str = "database"
    
    class Config:
        env_file = ".env"

settings = Settings()