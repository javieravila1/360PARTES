# 360PARTES

Sistema multinegocio para la gestión de inventario, ventas, compras y repuestos, especialmente diseñado para el sector de motocicletas y vehículos.

## Arquitectura

El sistema está compuesto por las siguientes partes:

- **Backend**: Monolito desarrollado en Python con FastAPI.
- **Frontend Web**: Aplicación SPA desarrollada con React, TypeScript y Tailwind CSS.
- **Frontend Mobile**: Aplicación móvil desarrollada en Flutter.
- **Base de datos**: PostgreSQL para persistencia relacional.
- **Almacenamiento de archivos**: MinIO (compatible con Amazon S3) para guardar imágenes y comprobantes.

Toda la infraestructura está containerizada con Docker y orquestada con Docker Compose.

## Requisitos Previos

- Docker
- Docker Compose
- Flutter (opcional, necesario si se va a compilar/desarrollar la app móvil)

## Instalación

1. Clona el repositorio.
2. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Levanta los contenedores en modo desarrollo:
   ```bash
   docker-compose up -d --build
   ```

Esto iniciará los siguientes servicios:
- Base de datos PostgreSQL: Puerto 5432
- MinIO: Puertos 9000 (API) y 9001 (Consola)
- Backend (FastAPI): Puerto 8000
- Web (React Vite): Puerto 5173

## Tecnologías Principales

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, Asyncpg.
- **Frontend Web**: React, TypeScript, Vite, Tailwind CSS, React Router.
- **Frontend Mobile**: Flutter, Dart.
- **Infraestructura**: Docker, Docker Compose, MinIO.

## Siguientes Pasos

Consultar las carpetas `backend/`, `web/` y `mobile/` para instrucciones específicas de desarrollo de cada componente.
