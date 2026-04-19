import asyncio
import base64
import io
import json
import os
import sys
from pathlib import Path

# Allow running from any working directory (e.g. project root via preview_start)
_HERE = Path(__file__).parent.resolve()
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageDraw
from pydantic import BaseModel

load_dotenv(_HERE / ".env")

from core.claude_client import analyze_visitor, analyze_threat, generate_emergency_message
from core.alert_engine import ALERT_TIERS, build_alert_payload

app = FastAPI(title="VIGIL Security API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SCENARIOS_DIR = Path(__file__).parent / "static" / "scenarios"
SCENARIOS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

connected_clients: list[WebSocket] = []


# ---------------------------------------------------------------------------
# Startup: generate CCTV-style placeholder images if not present
# ---------------------------------------------------------------------------

def _generate_placeholder(path: Path, label: str, cam_id: str) -> None:
    img = Image.new("RGB", (800, 600), (10, 15, 28))
    draw = ImageDraw.Draw(img)
    for y in range(0, 600, 4):
        draw.line([(0, y), (800, y)], fill=(0, 35, 0), width=1)
    draw.text((400, 280), label, fill=(0, 220, 80), anchor="mm")
    draw.text((400, 320), "Tap ANALYZE SCENE to process", fill=(0, 150, 55), anchor="mm")
    draw.text((12, 12), "REC ●", fill=(220, 40, 40))
    draw.text((700, 12), cam_id, fill=(0, 180, 70))
    draw.text((12, 575), "VIGIL CCTV — LEKKI PHASE 1", fill=(0, 120, 50))
    img.save(path, quality=85)


@app.on_event("startup")
async def startup_event():
    scenarios = [
        ("scenario_1.jpg", "LOITERING NEAR PERIMETER FENCE", "CAM-03"),
        ("scenario_2.jpg", "MASKED / UNIDENTIFIED INDIVIDUAL", "CAM-01"),
        ("scenario_3.jpg", "PERSON DOWN — POSSIBLE MEDICAL", "CAM-07"),
    ]
    for filename, label, cam_id in scenarios:
        path = SCENARIOS_DIR / filename
        if not path.exists():
            _generate_placeholder(path, label, cam_id)


# ---------------------------------------------------------------------------
# WebSocket — gate <-> resident real-time channel
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive ping
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


async def broadcast(payload: dict):
    message = json.dumps(payload)
    stale = []
    for client in connected_clients:
        try:
            await client.send_text(message)
        except Exception:
            stale.append(client)
    for client in stale:
        connected_clients.remove(client)


# ---------------------------------------------------------------------------
# Feature 1: Visitor verification
# ---------------------------------------------------------------------------

def _resize_image(data: bytes, max_width: int = 800) -> bytes:
    img = Image.open(io.BytesIO(data))
    if img.width > max_width:
        ratio = max_width / img.width
        img = img.resize((max_width, int(img.height * ratio)), Image.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=85)
    return buf.getvalue()


@app.post("/api/visitor/capture")
async def visitor_capture(image: UploadFile = File(...)):
    raw = await image.read()
    resized = _resize_image(raw)
    analysis = analyze_visitor(resized)
    data_uri = "data:image/jpeg;base64," + base64.standard_b64encode(resized).decode()
    payload = {
        "type": "visitor_notification",
        "image": data_uri,
        **analysis,
    }
    await broadcast(payload)
    return {"status": "notification_sent", "analysis": analysis}


# ---------------------------------------------------------------------------
# Feature 2: Threat scene detection
# ---------------------------------------------------------------------------

class ThreatRequest(BaseModel):
    scenario_id: int


@app.post("/api/threat/analyze")
async def threat_analyze(body: ThreatRequest):
    if body.scenario_id not in (1, 2, 3):
        raise HTTPException(status_code=400, detail="scenario_id must be 1, 2, or 3")
    path = SCENARIOS_DIR / f"scenario_{body.scenario_id}.jpg"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Scenario image not found")
    image_bytes = path.read_bytes()
    result = analyze_threat(image_bytes)
    return result


# ---------------------------------------------------------------------------
# Feature 3: Alert cascade (SSE)
# ---------------------------------------------------------------------------

class CascadeRequest(BaseModel):
    incident: dict


@app.post("/api/alert/cascade")
async def alert_cascade(body: CascadeRequest):
    incident = body.incident

    async def event_stream():
        for tier_def in ALERT_TIERS:
            if tier_def["delay"] > 0:
                await asyncio.sleep(tier_def["delay"])

            emergency_message = None
            if tier_def["requires_emergency_message"]:
                from datetime import datetime
                import pytz
                tz = pytz.timezone("Africa/Lagos")
                ts = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S WAT")
                emergency_message = generate_emergency_message(incident, ts)

            payload = build_alert_payload(tier_def, incident, emergency_message)
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
