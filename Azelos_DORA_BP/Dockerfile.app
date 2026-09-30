# API + built UI on port 8000 (production-style single container)
FROM node:20-alpine AS frontend-build
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/pyproject.toml ./
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./
COPY backend/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN pip install --no-cache-dir ".[dev]" && chmod +x ./scripts/docker-entrypoint.sh
COPY --from=frontend-build /fe/dist /app/frontend/dist
ENV PYTHONUNBUFFERED=1
ENV SERVE_FRONTEND=1
EXPOSE 8000
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
