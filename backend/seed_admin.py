import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.infrastructure.database.models.user import User
from app.infrastructure.database.models.business import Business
from app.infrastructure.database.models.business_user import BusinessUser, BusinessRole
from app.core.security import get_password_hash

async def seed():
    async with AsyncSessionLocal() as db:
        admin_email = "admin@360partes.com"
        admin_pass = "AdminPassword123!"
        
        # Check if exists
        result = await db.execute(select(User).where(User.email == admin_email))
        user = result.scalar()
        
        if not user:
            user = User(
                email=admin_email,
                hashed_password=get_password_hash(admin_pass),
                first_name="Admin",
                last_name="User"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            print(f"User {admin_email} created successfully!")
        else:
            print(f"User {admin_email} already exists!")

        # Asegurar que el admin tenga al menos un negocio (la app exige X-Business-ID)
        result = await db.execute(select(BusinessUser).where(BusinessUser.user_id == user.id))
        if not result.scalars().first():
            business = Business(name="Mi Negocio", currency="COP")
            db.add(business)
            await db.flush()
            db.add(BusinessUser(user_id=user.id, business_id=business.id, role=BusinessRole.OWNER))
            await db.commit()
            print("Default business 'Mi Negocio' created for admin!")

if __name__ == "__main__":
    asyncio.run(seed())
