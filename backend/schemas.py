from pydantic import BaseModel, Field


class ICP(BaseModel):
    industries: list[str] = Field(default_factory=list)
    min_employees: int = 1
    max_employees: int = 10000
    title_keywords: list[str] = Field(default_factory=list)
    countries: list[str] = Field(default_factory=list)
