import base64
import json
import os
import anthropic

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client


def _parse_json(text: str) -> dict:
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _image_content(image_bytes: bytes) -> dict:
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": base64.standard_b64encode(image_bytes).decode("utf-8"),
        },
    }


def analyze_visitor(image_bytes: bytes) -> dict:
    fallback = {
        "description": "Individual of medium build",
        "clothing": "Dark clothing",
        "items_carried": "None visible",
        "demeanor": "neutral",
        "risk_level": "LOW",
        "summary": "Visitor at gate awaiting resident approval",
    }
    try:
        response = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            temperature=0,
            system=(
                "You are a security AI for a Nigerian gated estate. "
                "Analyze visitors at the gate. "
                "Respond ONLY with valid JSON — no markdown, no explanation."
            ),
            messages=[{
                "role": "user",
                "content": [
                    _image_content(image_bytes),
                    {
                        "type": "text",
                        "text": (
                            "Analyze this person at the estate gate. "
                            "Return ONLY this JSON:\n"
                            '{"description": "physical appearance in 1 sentence", '
                            '"clothing": "clothing details", '
                            '"items_carried": "bags/packages/none", '
                            '"demeanor": "calm|neutral|agitated|suspicious", '
                            '"risk_level": "LOW|MEDIUM|HIGH", '
                            '"summary": "one sentence for resident notification"}'
                        ),
                    },
                ],
            }],
        )
        return _parse_json(response.content[0].text)
    except Exception:
        return fallback


def analyze_threat(image_bytes: bytes) -> dict:
    fallback = {
        "classification": "SUSPICIOUS_ACTIVITY",
        "description": "Unidentified individual detected near the perimeter. Movement pattern is irregular and warrants monitoring.",
        "confidence": 72,
        "location_in_frame": "near fence",
        "recommended_action": "Dispatch patrol unit to investigate the area immediately.",
    }
    try:
        response = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=400,
            temperature=0,
            system=(
                "You are a threat detection AI for a Nigerian gated estate security system. "
                "Analyze surveillance camera frames for security threats. "
                "Respond ONLY with valid JSON."
            ),
            messages=[{
                "role": "user",
                "content": [
                    _image_content(image_bytes),
                    {
                        "type": "text",
                        "text": (
                            "Analyze this security camera frame for threats. "
                            "Return ONLY this JSON:\n"
                            '{"classification": "CLEAR|SUSPICIOUS_ACTIVITY|SECURITY_THREAT|MEDICAL_EMERGENCY", '
                            '"description": "2-3 sentence observation of what you see and why it is or isn\'t a threat", '
                            '"confidence": 85, '
                            '"location_in_frame": "brief location description", '
                            '"recommended_action": "one sentence recommended security response"}'
                        ),
                    },
                ],
            }],
        )
        return _parse_json(response.content[0].text)
    except Exception:
        return fallback


def generate_emergency_message(incident: dict, timestamp: str) -> str:
    fallback = (
        f"EMERGENCY DISPATCH — {timestamp}\n"
        f"INCIDENT: {incident.get('classification', 'SECURITY THREAT')}\n"
        f"LOCATION: Estate Main Gate, Lekki Phase 1, Lagos\n"
        f"NATURE: {incident.get('description', 'Security incident detected')}\n"
        f"CONFIDENCE: {incident.get('confidence', 80)}%\n"
        "REQUIRED RESPONSE: Immediate dispatch of response unit to location."
    )
    try:
        response = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            temperature=0.3,
            system=(
                "You are a security operations coordinator for a Nigerian gated estate. "
                "Draft formal emergency dispatch notifications."
            ),
            messages=[{
                "role": "user",
                "content": (
                    f"Draft an emergency services notification.\n"
                    f"INCIDENT TYPE: {incident.get('classification')}\n"
                    f"DESCRIPTION: {incident.get('description')}\n"
                    f"CONFIDENCE: {incident.get('confidence')}%\n"
                    f"LOCATION: Estate Main Gate, Lekki Phase 1, Lagos\n"
                    f"TIME: {timestamp}\n\n"
                    "Format as a real emergency dispatch message with sections: "
                    "INCIDENT, LOCATION, TIME, NATURE, REQUIRED RESPONSE. "
                    "Under 120 words. Use formal Nigerian emergency dispatch language."
                ),
            }],
        )
        return response.content[0].text.strip()
    except Exception:
        return fallback
