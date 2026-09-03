"""Deep AI Companion Memory & Spaced Repetition (SRS) Engine.

Analyzes session transcripts using Gemini Flash to extract:
1. Personal facts & learner context (home, job, habits, goals, preferences)
2. Rich vocabulary across parts of speech (nouns with articles, verbs, adjectives)
3. Conversational phrases & idioms
4. Specific errors, struggles, and pronunciation difficulties
5. Episodic narrative summaries of each conversation

Also manages Spaced Repetition (SM-2 intervals) to determine which words
are due for review in upcoming sessions.
"""

from __future__ import annotations
import os
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
import httpx

PROFILE_PATH = "data/learner_profile.json"
SETTINGS_PATH = "config/settings.json"
SESSIONS_DIR = "data/sessions"


def get_api_key() -> str:
    """Loads active API key from settings."""
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                keys = cfg.get("api_keys", [])
                if keys:
                    return keys[0]
        except Exception:
            pass
    return os.environ.get("GEMINI_API_KEY", "")


def load_learner_profile() -> Dict[str, Any]:
    """Loads the comprehensive learner profile."""
    if os.path.exists(PROFILE_PATH):
        try:
            with open(PROFILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "learner_id": "bilal",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "total_sessions": 0,
        "personal_facts": [],
        "session_history": [],
        "vocabulary": {},
        "phrases": {},
        "error_patterns": [],
        "review_queue": []
    }


def save_learner_profile(profile: Dict[str, Any]) -> None:
    """Saves the updated learner profile atomically."""
    os.makedirs(os.path.dirname(PROFILE_PATH), exist_ok=True)
    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)


def calculate_next_srs_review(word_entry: Dict[str, Any], accuracy: str) -> Dict[str, Any]:
    """Applies SM-2 inspired Spaced Repetition logic.
    
    accuracy: 'mastered' | 'practiced' | 'struggled' | 'introduced'
    """
    repetitions = word_entry.get("repetitions", 0)
    interval_days = word_entry.get("interval_days", 1)

    if accuracy in ("mastered", "correct"):
        repetitions += 1
        if repetitions == 1:
            interval_days = 1
        elif repetitions == 2:
            interval_days = 3
        elif repetitions == 3:
            interval_days = 7
        else:
            interval_days = min(60, int(interval_days * 2.2))
        state = "mastered" if repetitions >= 4 else "recalled"
    elif accuracy == "struggled":
        repetitions = max(0, repetitions - 1)
        interval_days = 1  # Review again tomorrow!
        state = "struggling"
    else:  # 'introduced' or 'practiced'
        repetitions = max(1, repetitions)
        interval_days = max(1, interval_days)
        state = "practicing"

    now = datetime.now(timezone.utc)
    next_review = now + timedelta(days=interval_days)

    word_entry["repetitions"] = repetitions
    word_entry["interval_days"] = interval_days
    word_entry["state"] = state
    word_entry["last_practiced"] = now.isoformat()
    word_entry["next_review_at"] = next_review.isoformat()
    return word_entry


async def analyze_transcript_async(session_id: str, transcript: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
    """Analyzes a session transcript with Gemini 3.5 Flash and returns structured memory."""
    if not transcript or len(transcript) < 2:
        return None

    api_key = get_api_key()
    if not api_key:
        print(f"⚠️ [MEMORY ANALYZER] No API key available for session {session_id}")
        return None

    # Format transcript lines
    transcript_lines = []
    for turn in transcript:
        role = turn.get("role", "speaker")
        text = turn.get("text", "").strip()
        if text:
            transcript_lines.append(f"{role.upper()}: {text}")

    full_transcript = "\n".join(transcript_lines)
    if len(full_transcript) > 15000:
        full_transcript = full_transcript[-15000:]

    system_instruction = """You are an expert language pedagogue and memory analyst for an intelligent personal German companion.
The companion is conversing with a Moroccan learner using English, Moroccan Darija (الدارجة المغربية), and German.
Extract learning intelligence from this session transcript.
Return ONLY a valid JSON object matching this exact schema:
{
  "personal_facts": [
    "facts learned about the user, their home, objects in room, hobbies, feelings, language skills, or life"
  ],
  "vocabulary": [
    {
      "lemma": "German base word, capitalized if noun",
      "article": "der|die|das or null",
      "part_of_speech": "noun|verb|adjective|preposition|phrase",
      "translation": "English meaning",
      "example_phrase": "example sentence if used, or null",
      "status": "introduced|practiced|mastered|struggled"
    }
  ],
  "phrases": [
    {
      "german": "full useful German phrase or expression",
      "english": "English translation"
    }
  ],
  "mistakes_or_struggles": [
    "specific pronunciation difficulties, grammar confusions, or questions the user asked"
  ],
  "session_summary": "2-3 sentence narrative summarizing what was discussed, what objects were shown on camera, and the conversational vibe"
}
Do NOT include Markdown code blocks or backticks. Return raw JSON only."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": f"SESSION ID: {session_id}\n\nTRANSCRIPT:\n{full_transcript}"}]}
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                return json.loads(raw_text.strip())
            else:
                print(f"⚠️ [MEMORY ANALYZER] Gemini returned status {resp.status_code}: {resp.text[:150]}")
    except Exception as e:
        print(f"⚠️ [MEMORY ANALYZER] Error analyzing session {session_id}: {e}")
    return None


def apply_analysis_to_profile(analysis: Dict[str, Any], session_id: str, session_time: Optional[str] = None) -> Dict[str, Any]:
    """Merges extracted memory and SRS updates into the learner profile."""
    profile = load_learner_profile()
    session_time = session_time or datetime.now(timezone.utc).isoformat()

    # 1. Update personal facts (avoid duplicates)
    existing_facts = set(f.get("fact", "").lower().strip() for f in profile.get("personal_facts", []))
    for fact in analysis.get("personal_facts", []):
        fact_clean = fact.strip()
        if fact_clean and fact_clean.lower() not in existing_facts:
            profile.setdefault("personal_facts", []).append({
                "id": f"fact_{len(profile.get('personal_facts', [])) + 1}",
                "fact": fact_clean,
                "source_session": session_id,
                "created_at": session_time
            })
            existing_facts.add(fact_clean.lower())

    # 2. Update vocabulary with SRS
    vocab_map = profile.setdefault("vocabulary", {})
    for item in analysis.get("vocabulary", []):
        lemma = item.get("lemma", "").strip()
        if not lemma:
            continue
        key = lemma.lower()
        entry = vocab_map.get(key, {
            "lemma": lemma,
            "article": item.get("article") or "—",
            "part_of_speech": item.get("part_of_speech", "noun"),
            "translation": item.get("translation", ""),
            "repetitions": 0,
            "interval_days": 1,
            "state": "introduced"
        })

        if item.get("article") and item["article"] != "—":
            entry["article"] = item["article"]
        if item.get("translation"):
            entry["translation"] = item["translation"]
        if item.get("example_phrase"):
            entry["example_phrase"] = item["example_phrase"]
        if item.get("part_of_speech"):
            entry["part_of_speech"] = item["part_of_speech"]

        status = item.get("status", "practiced")
        entry = calculate_next_srs_review(entry, status)
        vocab_map[key] = entry

    # 3. Update phrases
    phrase_map = profile.setdefault("phrases", {})
    for p in analysis.get("phrases", []):
        g = p.get("german", "").strip()
        if g:
            pkey = g.lower().replace(" ", "_")[:30]
            phrase_map[pkey] = {
                "german": g,
                "english": p.get("english", ""),
                "last_seen_session": session_id,
                "last_practiced": session_time
            }

    # 4. Update mistakes & error patterns
    existing_mistakes = set(m.get("details", "").lower() for m in profile.get("error_patterns", []))
    for m in analysis.get("mistakes_or_struggles", []):
        m_str = m.strip() if isinstance(m, str) else str(m)
        if m_str and m_str.lower() not in existing_mistakes:
            profile.setdefault("error_patterns", []).append({
                "id": f"ERR_{len(profile.get('error_patterns', [])) + 1}",
                "details": m_str,
                "source_session": session_id,
                "last_observed": session_time
            })
            existing_mistakes.add(m_str.lower())

    # 5. Add session narrative to history
    summary = analysis.get("session_summary", "").strip()
    if summary:
        profile.setdefault("session_history", []).append({
            "session_id": session_id,
            "timestamp": session_time,
            "summary": summary
        })

    # 6. Recalculate priority review queue
    now_dt = datetime.now(timezone.utc)
    queue = []
    for k, v in vocab_map.items():
        next_dt = None
        if v.get("next_review_at"):
            try:
                next_dt = datetime.fromisoformat(v["next_review_at"].replace("Z", "+00:00"))
            except Exception:
                pass
        
        is_due = (next_dt and next_dt <= now_dt) or v.get("state") == "struggling"
        if is_due:
            queue.append((k, v.get("state", ""), v.get("interval_days", 1)))

    queue.sort(key=lambda x: (0 if x[1] == "struggling" else 1, x[2]))
    profile["review_queue"] = [q[0] for q in queue[:8]]
    profile["last_session_at"] = session_time
    profile["total_sessions"] = len(profile.get("session_history", [])) or profile.get("total_sessions", 0)

    save_learner_profile(profile)
    return profile


def get_srs_review_targets(max_targets: int = 4) -> List[Dict[str, Any]]:
    """Returns the top priority words due for review right now."""
    profile = load_learner_profile()
    vocab = profile.get("vocabulary", {})
    queue = profile.get("review_queue", [])

    targets = []
    for key in queue[:max_targets]:
        if key in vocab:
            targets.append(vocab[key])
        else:
            targets.append({"lemma": key.capitalize(), "article": "—", "state": "review"})

    if not targets and vocab:
        practicing = [v for v in vocab.values() if v.get("state") in ("practicing", "introduced")]
        targets = practicing[:max_targets]

    return targets


def get_recent_session_summaries(max_sessions: int = 3) -> List[str]:
    """Returns narrative summaries from the most recent sessions."""
    profile = load_learner_profile()
    history = profile.get("session_history", [])
    if history:
        return [h["summary"] for h in history[-max_sessions:] if h.get("summary")]
    return []


def get_learner_personal_facts() -> List[str]:
    """Returns stored personal facts about the user."""
    profile = load_learner_profile()
    return [f["fact"] for f in profile.get("personal_facts", []) if f.get("fact")]


def get_active_struggles() -> List[str]:
    """Returns recent difficulties or errors observed."""
    profile = load_learner_profile()
    errors = profile.get("error_patterns", [])
    return [e.get("details", "") for e in errors[-4:] if e.get("details")]


async def backfill_all_sessions() -> None:
    """Scans all historical session files and enriches the learner profile with LLM analysis."""
    if not os.path.exists(SESSIONS_DIR):
        print("No sessions directory found.")
        return

    session_files = [f for f in os.listdir(SESSIONS_DIR) if f.startswith("session_") and f.endswith(".json")]
    session_files.sort()
    print(f"🔄 [BACKFILL] Found {len(session_files)} session files to analyze...")

    for f in session_files:
        path = os.path.join(SESSIONS_DIR, f)
        try:
            with open(path, "r", encoding="utf-8") as sf:
                data = json.load(sf)
                session_id = data.get("session_id", f.replace("session_", "").replace(".json", ""))
                transcript = data.get("transcript", [])
                timestamp = data.get("timestamp", datetime.now(timezone.utc).isoformat())

                if len(transcript) < 3:
                    print(f"⏩ [BACKFILL] Skipping short session {session_id} ({len(transcript)} turns)")
                    continue

                print(f"🧠 [BACKFILL] Analyzing {session_id} ({len(transcript)} turns)...")
                analysis = await analyze_transcript_async(session_id, transcript)
                if analysis:
                    apply_analysis_to_profile(analysis, session_id, timestamp)
                    vocab_count = len(analysis.get("vocabulary", []))
                    facts_count = len(analysis.get("personal_facts", []))
                    print(f"✅ [BACKFILL] {session_id}: +{vocab_count} words, +{facts_count} facts")
                await asyncio.sleep(0.5)
        except Exception as e:
            print(f"⚠️ [BACKFILL] Failed processing {f}: {e}")

    print("🎉 [BACKFILL] Complete! Learner profile is fully upgraded with deep memory.")


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    print("Starting historical backfill...")
    asyncio.run(backfill_all_sessions())
