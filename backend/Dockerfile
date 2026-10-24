# Use an official Python runtime as a base image
FROM python:3.11

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FASTEMBED_CACHE_DIR=/app/models/fastembed

# System libraries required by OpenCV
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Heavy ML dependencies first so they stay cached between code changes
COPY api/requirements-ml.txt /app/
RUN pip install -r requirements-ml.txt

# Pre-download embedding model at build time
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5', cache_dir='/app/models/fastembed')" \
      || echo 'WARNING: embedding model pre-download failed'

# Copy the requirements file into the container at /app
COPY api/requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install -r requirements.txt

# Copy the entire project directory into the container at /app
COPY . /app/

ENV PYTHONPATH="/app:/app/api"

# Private, non-served directory for temporary receipt uploads
RUN mkdir -p /app/storage/receipts && chmod 700 /app/storage/receipts && chmod +x /app/start.sh

# Expose the port that Uvicorn listens to
EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/health', timeout=4).status == 200 else 1)"

# Run migrations, then Uvicorn
CMD ["/app/start.sh"]
