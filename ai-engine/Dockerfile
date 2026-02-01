# Production Dockerfile for eRankUp AI Engine
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for psycopg2 and other ML libs
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Consumer is the main entry point for the analytics pipeline
CMD ["python", "consumer.py"]
