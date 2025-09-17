from fastapi import FastAPI

app = FastAPI(title="Marketing Hub Scrapers")


@app.get("/health")
def health():
    return {"ok": True}

