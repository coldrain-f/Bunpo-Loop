FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    BYEORAKCHIGI_DB=/data/bunpo-loop.sqlite3

WORKDIR /app

RUN adduser --disabled-password --gecos "" --home /app appuser \
    && mkdir -p /data \
    && chown -R appuser:appuser /app /data

COPY --chown=appuser:appuser app.py README.md ./
COPY --chown=appuser:appuser static ./static

USER appuser

EXPOSE 8000

CMD ["python", "app.py"]
