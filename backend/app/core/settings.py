from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: str = "3306"
    DB_NAME: str = "golf_db"
    SECRET_KEY: str = "your_secret_key"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def database_url(self) -> str:
        return f"mysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}/{self.DB_NAME}"

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()