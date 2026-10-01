from abc import ABC, abstractmethod
from typing import List, Optional
import uuid
from app.domain.entities.payable_entity import AccountPayableEntity, PaymentEntity

class AccountPayableRepository(ABC):
    @abstractmethod
    async def get_by_id(self, payable_id: uuid.UUID, business_id: uuid.UUID) -> Optional[AccountPayableEntity]:
        pass

    @abstractmethod
    async def get_all_by_business(self, business_id: uuid.UUID) -> List[AccountPayableEntity]:
        pass

    @abstractmethod
    async def save(self, entity: AccountPayableEntity) -> AccountPayableEntity:
        pass

    @abstractmethod
    async def save_payment(self, payment: PaymentEntity) -> PaymentEntity:
        pass
