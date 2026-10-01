import uuid
from typing import List
from app.domain.repositories.payable_repository import AccountPayableRepository
from app.application.dtos.payable_dto import MakePaymentDTO, AccountPayableResponseDTO
from app.domain.entities.payable_entity import AccountPayableEntity

class PayableUseCase:
    def __init__(self, repository: AccountPayableRepository):
        self.repository = repository

    async def get_payables_by_business(self, business_id: uuid.UUID) -> List[AccountPayableResponseDTO]:
        entities = await self.repository.get_all_by_business(business_id)
        return [
            AccountPayableResponseDTO(
                id=e.id,
                supplier_id=e.supplier_id,
                total_amount=e.total_amount,
                paid_amount=e.paid_amount,
                balance=e.balance,
                due_date=e.due_date,
                status=e.status
            ) for e in entities
        ]

    async def register_payment(self, payable_id: uuid.UUID, business_id: uuid.UUID, dto: MakePaymentDTO):
        # 1. Obtener entidad de dominio pura
        entity = await self.repository.get_by_id(payable_id, business_id)
        if not entity:
            raise ValueError("Cuenta por pagar no encontrada")

        # 2. Ejecutar lógica de negocio del dominio (sin saber nada de la BD)
        payment_entity = entity.apply_payment(dto.amount)
        payment_entity.payment_method = dto.payment_method
        payment_entity.reference = dto.reference

        # 3. Guardar cambios usando el repositorio (infraestructura)
        await self.repository.save(entity)
        await self.repository.save_payment(payment_entity)

        return AccountPayableResponseDTO(
            id=entity.id,
            supplier_id=entity.supplier_id,
            total_amount=entity.total_amount,
            paid_amount=entity.paid_amount,
            balance=entity.balance,
            due_date=entity.due_date,
            status=entity.status
        )
