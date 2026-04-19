# VIGIL

**Visual Intelligence for Gated Infrastructure & Landmark Security**

A demo system that puts Claude's vision model at a Nigerian estate gate, handling visitor access, threat detection, and emergency escalation. Built for the Claude Code Hackathon.

## The Problem

Private security in Nigerian gated estates has one failure point: the guard at the gate. He's underpaid, sometimes bribed, sometimes asleep. VIGIL replaces that single point of failure with a system that doesn't take money, doesn't get tired, and writes its own incident reports.

## What the Demo Shows

**1. Visitor verification**
A live webcam captures the visitor. Claude analyzes the image (clothing, demeanor, risk level) and sends a notification to the resident's panel. One tap to approve or deny. The gate indicator updates immediately.

**2. Threat detection**
Three pre-loaded CCTV scenarios: loitering near the perimeter fence, a masked individual at the entrance, a collapsed person. Select one, click Analyze. Claude reads the frame and returns a threat classification, confidence score, and a recommended response.

**3. Alert cascade**
Triggered automatically after any threat detection. Tier 1 goes to the gate officer (immediate). Tier 2 escalates to estate management (2.5s). Tier 3 contacts emergency services (5s), with a dispatch message drafted by Claude in real time, specific to the incident.

## Stack

| Layer     | Technology                                               |
| --------- | -------------------------------------------------------- |
| Backend   | FastAPI + Uvicorn                                        |
| AI        | Claude claude-sonnet-4-6 (vision + text)                 |
| Real-time | WebSockets (visitor notifications) + SSE (alert cascade) |
| Frontend  | React + Vite + Tailwind CSS                              |
| Design    | Google Stitch ("Kinetic Terminal" design system)         |

## Setup

**Backend**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
python app.py
```

**Frontend**

```bash
cd frontend
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

## Running the Demo

1. **Visitor flow:** Click _Capture Visitor_ in the Gate Camera panel. If camera access is blocked, Demo Mode sends a test image. Watch the notification appear in the Resident panel, then approve or deny.

2. **Threat detection:** Pick a scenario from the dropdown in Threat Detection, click _Analyze_. Claude returns a classification and recommended action within a few seconds.

3. **Alert cascade:** Fires automatically after threat analysis. Watch Tier 1 -> 2 -> 3 populate. Tier 3 includes a Claude-drafted dispatch message addressed to LASEMA and the Divisional Police Officer.

## Notes

- The webcam feed works in any modern browser. Chrome may require the page to be served over localhost (already the case).
- Scenario images in `backend/static/scenarios/` are auto-generated as CCTV-style placeholders on first run if you haven't replaced them with real images.
- All Claude calls include hardcoded fallbacks, so the demo won't crash if the API is slow or returns unexpected output.
- The backend runs fine from the project root: `python backend/app.py`.
