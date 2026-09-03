"""LADA System 2 Cognitive Co-Pilot Engine.

Runs in parallel with the live conversation stream to provide:
1. Instant compound word decomposition for Generative UI (e.g. Teekanne -> Tee + Kanne)
2. Articulatory phonetic cues (tongue position, mouth shape, Darija sound bridges)
3. Interactive choice pills detection for on-screen tap-ability
4. Asynchronous cognitive evaluation of user fatigue, latency, and conversational state
"""

from __future__ import annotations
import os
import re
import json
import asyncio
from typing import Any, Dict, List, Optional
import httpx

# Pre-indexed compound breakdowns for lightning-fast <1ms UI rendering
COMPOUND_DATABASE: Dict[str, Dict[str, Any]] = {
    "teekanne": {
        "lemma": "die Teekanne",
        "translation": "teapot",
        "parts": [
            {"word": "der Tee", "meaning": "tea", "gender": "der"},
            {"word": "die Kanne", "meaning": "pot / pitcher", "gender": "die"}
        ],
        "rule": "In German, the last word gives the gender: 'die Kanne' -> 'die Teekanne'!"
    },
    "zahnbürste": {
        "lemma": "die Zahnbürste",
        "translation": "toothbrush",
        "parts": [
            {"word": "der Zahn", "meaning": "tooth", "gender": "der"},
            {"word": "die Bürste", "meaning": "brush", "gender": "die"}
        ],
        "rule": "Last word determines gender: 'die Bürste' -> 'die Zahnbürste'!"
    },
    "zahnburste": {
        "lemma": "die Zahnbürste",
        "translation": "toothbrush",
        "parts": [
            {"word": "der Zahn", "meaning": "tooth", "gender": "der"},
            {"word": "die Bürste", "meaning": "brush", "gender": "die"}
        ],
        "rule": "Last word determines gender: 'die Bürste' -> 'die Zahnbürste'!"
    },
    "mauspad": {
        "lemma": "das Mauspad",
        "translation": "mousepad",
        "parts": [
            {"word": "die Maus", "meaning": "mouse", "gender": "die"},
            {"word": "das Pad", "meaning": "pad", "gender": "das"}
        ],
        "rule": "Loanword fusion: 'das Pad' -> 'das Mauspad'!"
    },
    "wasserflasche": {
        "lemma": "die Wasserflasche",
        "translation": "water bottle",
        "parts": [
            {"word": "das Wasser", "meaning": "water", "gender": "das"},
            {"word": "die Flasche", "meaning": "bottle", "gender": "die"}
        ],
        "rule": "'die Flasche' gives the feminine gender!"
    },
    "tastatur": {
        "lemma": "die Tastatur",
        "translation": "keyboard",
        "parts": [
            {"word": "die Taste", "meaning": "key / button", "gender": "die"},
            {"word": "-ur", "meaning": "collection suffix", "gender": "die"}
        ],
        "rule": "Words ending in -ur are always feminine ('die')!"
    },
    "fernseher": {
        "lemma": "der Fernseher",
        "translation": "television",
        "parts": [
            {"word": "fern", "meaning": "far / distant", "gender": ""},
            {"word": "der Seher", "meaning": "viewer / seer", "gender": "der"}
        ],
        "rule": "Literal: 'the far-seer'!"
    }
}

# Physical articulatory phonetic guides with Moroccan Darija sound bridges
PHONETIC_GUIDES: Dict[str, Dict[str, Any]] = {
    "ch_ich": {
        "sound": "The 'ich' sound (/ç/) — 'Teppich', 'ich', 'nicht'",
        "tongue_position": "Tongue blade flat against hard palate. Blow air like a hissing cat.",
        "darija_bridge": "DO NOT use Moroccan 'خ' (kh)! 'خ' is too deep in the throat. Make the sound at the front roof of your mouth.",
        "tip": "Say English 'huge' or 'human' — notice the initial whisper? That's the German 'ich'!"
    },
    "ch_ach": {
        "sound": "The 'ach' sound (/x/) — 'Nacht', 'Buch', 'machen'",
        "tongue_position": "Back of tongue near uvula.",
        "darija_bridge": "Just like the soft Moroccan 'خ' (kh) in 'khobz'!",
        "tip": "Occurs ONLY after a, o, u, au."
    },
    "z_sound": {
        "sound": "German 'Z' (/ts/) — 'Zahnbürste', 'Zeit', 'Zimmer'",
        "tongue_position": "Tip of tongue behind upper front teeth, releasing with a sharp 'T-S'.",
        "darija_bridge": "Like 'ts' (تس) in Moroccan. NEVER the buzzing 'Z' in English 'zebra'!",
        "tip": "Think of the English word 'cats' -> 'ts'!"
    },
    "ue_sound": {
        "sound": "Umlaut 'ü' (/yː/) — 'Bürste', 'Tür', 'über'",
        "tongue_position": "Shape your lips to say 'OOH' (pouting), but push your tongue forward to say 'EEE'.",
        "darija_bridge": "Pout your lips tightly and say 'ee'!",
        "tip": "Whistle position with 'ee' sound."
    },
    "oe_sound": {
        "sound": "Umlaut 'ö' (/øː/) — 'schön', 'öffnen', 'hören'",
        "tongue_position": "Shape lips to say 'O', but position tongue to say 'AY'.",
        "darija_bridge": "Like the French 'eu' sound in 'bleu'.",
        "tip": "Round lips, flat tongue."
    }
}


class CognitiveCopilot:
    """System 2 reasoning co-pilot running parallel to Gemini Live audio."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.last_triggered_cards = set()

    def inspect_text_for_stage_events(self, text: str) -> List[Dict[str, Any]]:
        """Inspects live AI speech text for compound words, phonetic cues, and choices."""
        events = []
        text_lower = text.lower()

        # 1. Check for compound words in database
        for key, data in COMPOUND_DATABASE.items():
            if key in text_lower and key not in self.last_triggered_cards:
                events.append({
                    "event_type": "compound_card",
                    "data": data
                })
                self.last_triggered_cards.add(key)
                if len(self.last_triggered_cards) > 10:
                    self.last_triggered_cards.pop()
                break  # Max 1 compound card per burst

        # 2. Check for articulatory sound cues
        if any(w in text_lower for w in ["teppich", "ich", "nicht"]) and "ch_ich" not in self.last_triggered_cards:
            events.append({
                "event_type": "phonetic_cue",
                "data": PHONETIC_GUIDES["ch_ich"]
            })
            self.last_triggered_cards.add("ch_ich")
        elif any(w in text_lower for w in ["zahnbürste", "zahnburste", "zeit", "zimmer"]) and "z_sound" not in self.last_triggered_cards:
            events.append({
                "event_type": "phonetic_cue",
                "data": PHONETIC_GUIDES["z_sound"]
            })
            self.last_triggered_cards.add("z_sound")

        # 3. Check for binary / choice questions ("X oder Y?")
        choice_match = re.search(r'([A-Za-zÄÖÜäöüß]+)\s+oder\s+([A-Za-zÄÖÜäöüß]+)\?', text)
        if choice_match:
            c1, c2 = choice_match.group(1), choice_match.group(2)
            events.append({
                "event_type": "choice_pills",
                "data": {
                    "question": f"{c1} oder {c2}?",
                    "choices": [c1, c2]
                }
            })

        return events

    async def evaluate_fatigue_and_strategy(
        self,
        recent_turns: List[Dict[str, str]],
        local_hour: int = 0
    ) -> Optional[Dict[str, Any]]:
        """System 2 reasoning pass to assess learner fatigue and strategic direction."""
        if not self.api_key or len(recent_turns) < 3:
            return None

        prompt = f"""You are LADA's inner cognitive reasoning engine (System 2).
Analyze these recent conversational turns with learner Bilal (it is currently {local_hour}:00 at night).
Evaluate:
1. Energy/Fatigue level: "alert", "relaxed", or "exhausted"
2. Conversational dynamic: "flowing", "hesitant", or "disengaged"
3. Recommended next strategic move: one brief directive for LADA's next turn.

Return ONLY JSON:
{{
  "fatigue_level": "relaxed",
  "next_move_directive": "Keep turns under 10 words, tease him gently about working late, use German word for tired (müde)."
}}"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={self.api_key}"
        transcript_str = "\n".join([f"{t.get('role', 'user')}: {t.get('text', '')}" for t in recent_turns[-4:]])
        payload = {
            "contents": [{"role": "user", "parts": [{"text": "TRANSCRIPT:\n" + transcript_str}]}],
            "systemInstruction": {"parts": [{"text": prompt}]},
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw = data["candidates"][0]["content"]["parts"][0]["text"]
                    return json.loads(raw.strip())
        except Exception:
            pass
        return None
