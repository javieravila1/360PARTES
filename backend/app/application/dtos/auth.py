from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

