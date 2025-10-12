FROM python:3.10

WORKDIR /app

# Copy requirements dan install dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy semua file backend
COPY backend/ /app

# Railway akan set PORT otomatis via environment variable
ENV PORT=8000

# Run aplikasi
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT}