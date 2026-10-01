import asyncio
from app.core.database import AsyncSessionLocal
from app.infrastructure.database.models.user import User
from app.core.security import get_password_hash

async def seed():
    async with AsyncSessionLocal() as db:
        admin_email = "admin@360partes.com"
        admin_pass = "AdminPassword123!"
        
        # Check if exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == admin_email))
        user = result.scalar()
        
        if not user:
            new_user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_pass),
                first_name="Admin",
                last_name="User"
            )
            db.add(new_user)
            await db.commit()
            print(f"User {admin_email} created successfully!")
        else:
            print(f"User {admin_email} already exists!")

if __name__ == "__main__":
    asyncio.run(seed())
