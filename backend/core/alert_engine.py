from datetime import datetime
import pytz

ALERT_TIERS = [
    {
        "tier": 1,
        "label": "IMMEDIATE ALERT",
        "color": "#f59e0b",
        "delay": 0,
        "recipients": ["Gate Officer Adeyemi", "Patrol Unit B", "Control Room Supervisor"],
        "requires_emergency_message": False,
    },
    {
        "tier": 2,
        "label": "ESCALATION ALERT",
        "color": "#ef4444",
        "delay": 2.5,
        "recipients": ["Estate Manager Okafor", "Residents Committee Chair", "CCTV Supervisor"],
        "requires_emergency_message": False,
    },
    {
        "tier": 3,
        "label": "EMERGENCY DISPATCH",
        "color": "#7c3aed",
        "delay": 2.5,
        "recipients": ["LASEMA Lagos", "Divisional Police Officer", "Private Security Response"],
        "requires_emergency_message": True,
    },
]


def build_alert_payload(tier_def: dict, incident: dict, emergency_message: str | None = None) -> dict:
    tz = pytz.timezone("Africa/Lagos")
    now = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S WAT")
    return {
        "tier": tier_def["tier"],
        "label": tier_def["label"],
        "color": tier_def["color"],
        "recipients": tier_def["recipients"],
        "classification": incident.get("classification", "SECURITY THREAT"),
        "description": incident.get("description", ""),
        "confidence": incident.get("confidence", 0),
        "recommended_action": incident.get("recommended_action", ""),
        "location": "Estate Main Gate, Lekki Phase 1, Lagos",
        "timestamp": now,
        "emergency_message": emergency_message,
    }
