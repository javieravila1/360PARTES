from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str | None = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class EmailChange(BaseModel):
    current_password: str
    new_email: str

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    email: str
    pin: str
    new_password: str

