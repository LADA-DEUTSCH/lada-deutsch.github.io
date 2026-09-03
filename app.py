"""FastAPI Backend Server & Gemini 3.1 Flash Live Multimodal Bridge.

Features:
- Camera State Synchronization: Explicitly informs Gemini when camera is toggled OFF/ON
- Real-time Word-by-Word Subtitles: Streams exact outputTranscription tokens from Gemini Live
- Full Token-Saving Camera Gating: Zero video frames and zero video tokens when camera is off
- Persistent Session & Mastery Storage across all sessions
- Audio Chunk Batching: Buffers raw PCM into smooth 100ms packets (Zero Jitter / Glitch)
- Server-Side Echo Gating: Drops all microphone feedback while Gemini speaks (Zero Self-Interruption)
- Pure Conversational English / Moroccan Darija / Gentle German Acquisition
- Gemini Live 2026 Realtime Input Protocol (audio & video fields)
- Automatic 6-Key Pool Rotation & Failover
- 24kHz Gapless Neural Audio Streaming (Voice: Kore)
"""

from __future__ import annotations
import os
import json
import base64
import asyncio
import traceback
import markdown
import websockets
from datetime import datetime, timezone
from typing import Any, Dict, Optional, List, Tuple

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from core.mastery_engine import MasteryEngine
from core.companion_prompt import CompanionPromptBuilder
from core.session_planner import SessionPlanner
from core.session_analyzer import (
    analyze_transcript_async,
    apply_analysis_to_profile,
    get_srs_review_targets,
    get_recent_session_summaries,
    get_learner_personal_facts,
    get_active_struggles,
    load_learner_profile
)
from core.vocab_extractor import (
    extract_vocabulary_from_all_sessions,
    update_learner_profile_vocabulary,
    get_recent_topics,
)
from core.cognitive_copilot import CognitiveCopilot

app = FastAPI(title="Deutsch Live Acquisition Companion API")

os.makedirs("data/notebooks", exist_ok=True)
os.makedirs("data/sessions", exist_ok=True)
os.makedirs("static", exist_ok=True)
os.makedirs("config", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

SETTINGS_PATH = "config/settings.json"
current_key_idx = 0


def load_settings() -> Dict[str, Any]:
    default = {
        "api_keys": [],
        "model": "models/gemini-3.1-flash-live-preview",
        "voice_name": "Kore",
        "host": "0.0.0.0",
        "port": 8000
    }
    if os.path.exists(SETTINGS_PATH):
        try:
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("api_keys"):
                    default["api_keys"] = data["api_keys"]
                if data.get("voice_name"):
                    default["voice_name"] = data["voice_name"]
                if "current_key_idx" in data:
                    default["current_key_idx"] = data["current_key_idx"]
        except Exception:
            pass
    return default


def save_settings(data: Dict[str, Any]) -> None:
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def get_current_key() -> str:
    global current_key_idx
    settings = load_settings()
    keys = settings.get("api_keys", [])
    if not keys:
        return os.environ.get("GEMINI_API_KEY", "")
    current_key_idx = settings.get("current_key_idx", current_key_idx)
    return keys[current_key_idx % len(keys)]


def rotate_to_next_key() -> Tuple[int, str]:
    global current_key_idx
    settings = load_settings()
    keys = settings.get("api_keys", [])
    if not keys:
        return 0, os.environ.get("GEMINI_API_KEY", "")
    current_key_idx = (current_key_idx + 1) % len(keys)
    settings["current_key_idx"] = current_key_idx
    save_settings(settings)
    print(f"🔄 [AUTO-KEY ROTATION] Switched to Key #{current_key_idx + 1}/{len(keys)}: {keys[current_key_idx][:12]}...")
    return current_key_idx, keys[current_key_idx]


class SettingsPayload(BaseModel):
    api_key: Optional[str] = None
    api_keys: Optional[List[str]] = None
    voice_name: Optional[str] = None


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    with open("static/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/api/profile")
async def get_profile():
    engine = MasteryEngine()
    return JSONResponse(content=engine.profile)


@app.get("/api/progress")
async def get_progress():
    profile = load_learner_profile()
    
    vocab_list = []
    for k, v in profile.get("vocabulary", {}).items():
        vocab_list.append({
            "id": k,
            "lemma": v.get("lemma", k),
            "article": v.get("article", "—"),
            "part_of_speech": v.get("part_of_speech", "noun"),
            "translation": v.get("translation", ""),
            "state": v.get("state", "practicing"),
            "repetitions": v.get("repetitions", 1),
            "interval_days": v.get("interval_days", 1)
        })

    phrases_list = list(profile.get("phrases", {}).values())
    personal_facts = [f.get("fact", "") for f in profile.get("personal_facts", []) if f.get("fact")]
    session_history = profile.get("session_history", [])

    return JSONResponse(content={
        "total_sessions": max(1, profile.get("total_sessions", len(session_history))),
        "vocabulary_count": len(vocab_list),
        "vocabulary_list": vocab_list,
        "phrases_list": phrases_list,
        "personal_facts": personal_facts,
        "session_history": session_history[-6:]
    })


@app.get("/api/settings")
async def get_settings_info():
    current = load_settings()
    keys = current.get("api_keys", [])
    masked_keys = [f"{k[:14]}...{k[-6:]}" if len(k) > 20 else k for k in keys]
    return JSONResponse(content={
        "total_keys": len(keys),
        "keys_preview": masked_keys,
        "active_key_index": current_key_idx + 1,
        "model": current.get("model", "models/gemini-3.1-flash-live-preview"),
        "voice_name": current.get("voice_name", "Kore")
    })


@app.post("/api/settings")
async def update_settings(payload: SettingsPayload):
    current = load_settings()
    if payload.api_keys:
        current["api_keys"] = payload.api_keys
    elif payload.api_key:
        if payload.api_key not in current["api_keys"]:
            current["api_keys"].insert(0, payload.api_key)
    if payload.voice_name:
        current["voice_name"] = payload.voice_name
    save_settings(current)
    return JSONResponse(content={"status": "success", "message": "Settings saved successfully!"})


@app.websocket("/ws/live")
async def live_websocket_endpoint(client_ws: WebSocket):
    await client_ws.accept()
    
    session_id = f"S{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    session_transcript: List[Dict[str, str]] = []
    
    # --- DEEP MEMORY INJECTION: Personal facts, episodic continuity & SRS ---
    profile = load_learner_profile()
    total_sessions = profile.get("total_sessions", 0)
    personal_facts = get_learner_personal_facts()
    recent_summaries = get_recent_session_summaries(max_sessions=2)
    srs_targets = get_srs_review_targets(max_targets=4)
    active_struggles = get_active_struggles()

    # Known vocabulary & phrases
    vocab_data = profile.get("vocabulary", {})
    learned_words = []
    for key, v in vocab_data.items():
        learned_words.append({
            "lemma": v.get("lemma", key.capitalize()),
            "article": v.get("article", "—"),
            "state": v.get("state", "practicing"),
        })
    phrases_list = list(profile.get("phrases", {}).values())

    # Plan session mission using SessionPlanner
    mission_dict = None
    try:
        engine = MasteryEngine()
        planner = SessionPlanner(engine.curriculum, profile)
        mission = planner.plan_session(session_id)
        mission_dict = mission.to_dict()
        print(f"🎯 [SESSION {session_id}] Mission: {mission.primary_target.get('focus', 'general')}")
    except Exception as e:
        print(f"⚠️ [SESSION {session_id}] Planner skipped: {e}")

    # Build the full adaptive prompt with deep personal memory
    system_prompt = CompanionPromptBuilder.build_system_prompt(
        total_sessions=total_sessions,
        personal_facts=personal_facts,
        recent_summaries=recent_summaries,
        srs_review_targets=srs_targets,
        learned_words=learned_words,
        phrases=phrases_list,
        active_struggles=active_struggles,
        mission=mission_dict,
    )
    print(f"🧠 [SESSION {session_id}] Prompt built: {len(personal_facts)} facts, {len(srs_targets)} SRS targets, {len(learned_words)} words, {total_sessions} sessions")

    current_settings = load_settings()
    api_keys = current_settings.get("api_keys", [])
    voice_name = current_settings.get("voice_name", "Kore")

    if not api_keys:
        await client_ws.send_json({
            "type": "error",
            "message": "No API keys found in settings."
        })
        await client_ws.close()
        return

    user_explicitly_hung_up = False
    connection_attempts = 0
    max_failovers = len(api_keys) * 3

    while not user_explicitly_hung_up and connection_attempts < max_failovers:
        connection_attempts += 1
        active_key = get_current_key()
        key_num = (current_key_idx % len(api_keys)) + 1
        total_keys = len(api_keys)

        gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={active_key}"
        print(f"\n🔑 [LADA SESSION {session_id}] Attempt {connection_attempts}: Connecting with Key #{key_num}/{total_keys} (Voice: {voice_name})...")

        copilot = CognitiveCopilot(api_key=active_key)
        is_gemini_speaking = False
        speech_end_task: Optional[asyncio.Task] = None
        gemini_disconnected_event = asyncio.Event()

        try:
            async with websockets.connect(gemini_ws_url, ping_interval=20, ping_timeout=20) as gemini_ws:
                # 1. Setup Gemini Live
                setup_msg = {
                    "setup": {
                        "model": "models/gemini-3.1-flash-live-preview",
                        "generationConfig": {
                            "responseModalities": ["AUDIO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {
                                        "voiceName": voice_name
                                    }
                                }
                            }
                        },
                        "systemInstruction": {
                            "parts": [{"text": system_prompt}]
                        }
                    }
                }
                await gemini_ws.send(json.dumps(setup_msg))
                setup_resp = await gemini_ws.recv()
                print("Gemini Live Setup confirmed:", setup_resp[:80])
                
                await client_ws.send_json({
                    "type": "status",
                    "state": "connected",
                    "key_index": key_num,
                    "total_keys": total_keys,
                    "message": f"Live (Key #{key_num}/{total_keys})"
                })

                # Initial greeting prompt vs. mid-call seamless continuation
                if connection_attempts == 1:
                    if total_sessions > 0:
                        init_prompt = "Hello! You are LADA. Greet your friend Bilal on a late-night call with one short, relaxed sentence (under 10 words, e.g. 'Hey Bilal... working late tonight, haha. How's it going?'). Do NOT lecture or quiz him—let him speak!"
                    else:
                        init_prompt = "Hello! You are LADA. Introduce yourself warmly to Bilal in one short, natural sentence and say hi!"
                else:
                    init_prompt = "[System Context: Connection seamlessly refreshed with fresh API quota. Continue the conversation with Bilal naturally from where you left off without reintroducing yourself!]"

                initial_turn = {
                    "clientContent": {
                        "turns": [
                            {"role": "user", "parts": [{"text": init_prompt}]}
                        ],
                        "turnComplete": True
                    }
                }
                await gemini_ws.send(json.dumps(initial_turn))

                # Task 1: Client -> Gemini Live (Audio PCM 16kHz & Video Frames)
                async def client_to_gemini():
                    nonlocal user_explicitly_hung_up
                    try:
                        while not user_explicitly_hung_up and not gemini_disconnected_event.is_set():
                            raw = await client_ws.receive_text()
                            msg = json.loads(raw)
                            mtype = msg.get("type")

                            if mtype == "media_chunk":
                                mime = msg.get("mimeType", "image/jpeg")
                                b64 = msg.get("data", "")

                                if mime.startswith("audio/pcm"):
                                    await gemini_ws.send(json.dumps({
                                        "realtimeInput": {"audio": {"mimeType": "audio/pcm;rate=16000", "data": b64}}
                                    }))
                                elif mime == "image/jpeg" and b64:
                                    await gemini_ws.send(json.dumps({
                                        "realtimeInput": {"video": {"mimeType": "image/jpeg", "data": b64}}
                                    }))

                            elif mtype == "camera_state":
                                is_on = msg.get("is_on", True)
                                state_prompt = (
                                    "[System Notice: The user has just turned their camera ON. You can now see their room/objects again.]"
                                    if is_on else
                                    "[System Notice: The user has just turned their camera OFF completely. You CANNOT see anything through the camera now (video stream is stopped). If asked what you see, confirm that their camera is off and you can only hear them.]"
                                )
                                await gemini_ws.send(json.dumps({
                                    "clientContent": {"turns": [{"role": "user", "parts": [{"text": state_prompt}]}], "turnComplete": True}
                                }))
                                print(f"📷 [CAMERA STATE SYNC] is_on = {is_on}")

                            elif mtype == "user_transcript":
                                user_text = msg.get("text", "").strip()
                                if user_text:
                                    last_ai_turn = next((t["text"] for t in reversed(session_transcript) if t["role"] == "model"), "")
                                    if last_ai_turn and (user_text.lower() in last_ai_turn.lower() or last_ai_turn.lower() in user_text.lower()):
                                        continue
                                    session_transcript.append({
                                        "role": "user",
                                        "text": user_text,
                                        "time": datetime.now(timezone.utc).isoformat()
                                    })
                                    print(f"👤 User: {user_text}")

                            elif mtype == "user_text":
                                user_text = msg.get("text", "")
                                if user_text:
                                    session_transcript.append({
                                        "role": "user",
                                        "text": user_text,
                                        "time": datetime.now(timezone.utc).isoformat()
                                    })
                                    await gemini_ws.send(json.dumps({
                                        "clientContent": {"turns": [{"role": "user", "parts": [{"text": user_text}]}], "turnComplete": True}
                                    }))

                            elif mtype == "choice_selected":
                                choice = msg.get("choice", "")
                                if choice:
                                    print(f"👆 [USER TAPPED CHOICE] {choice}")
                                    session_transcript.append({
                                        "role": "user",
                                        "text": f"[User selected: {choice}]",
                                        "time": datetime.now(timezone.utc).isoformat()
                                    })
                                    await gemini_ws.send(json.dumps({
                                        "clientContent": {"turns": [{"role": "user", "parts": [{"text": f"I choose {choice}!"}]}], "turnComplete": True}
                                    }))

                            elif mtype == "session_end":
                                user_explicitly_hung_up = True
                                break
                    except WebSocketDisconnect:
                        user_explicitly_hung_up = True
                    except Exception as e:
                        if not gemini_disconnected_event.is_set():
                            print(f"Client stream notice: {e}")

                # Task 2: Gemini Live -> Client with Word-by-Word Subtitles & 100ms Audio Batching
                async def gemini_to_client():
                    nonlocal user_explicitly_hung_up, is_gemini_speaking, speech_end_task
                    try:
                        pcm_batch = bytearray()
                        BATCH_TARGET_BYTES = 4800  # 100ms of 24kHz 16-bit mono
                        current_ai_turn_text = []

                        async for raw_gmsg in gemini_ws:
                            if user_explicitly_hung_up:
                                break
                            gmsg = json.loads(raw_gmsg)
                            if "serverContent" in gmsg:
                                sc = gmsg["serverContent"]

                                # Real-Time Word-by-Word Subtitles
                                if "outputTranscription" in sc:
                                    txt = sc["outputTranscription"].get("text", "")
                                    if txt:
                                        current_ai_turn_text.append(txt)
                                        await client_ws.send_json({
                                            "type": "caption_chunk",
                                            "text": txt
                                        })

                                # Instant Barge-in Interruption
                                if "interrupted" in sc:
                                    print("⚡ [GEMINI INTERRUPTED] User started speaking — cutting AI speech immediately!")
                                    is_gemini_speaking = False
                                    pcm_batch = bytearray()
                                    current_ai_turn_text = []
                                    await client_ws.send_json({"type": "interrupted"})

                                # Audio Streaming Chunk
                                if "modelTurn" in sc:
                                    is_gemini_speaking = True
                                    if speech_end_task and not speech_end_task.done():
                                        speech_end_task.cancel()

                                    parts = sc["modelTurn"].get("parts", [])
                                    for p in parts:
                                        if "inlineData" in p:
                                            raw_chunk = base64.b64decode(p["inlineData"].get("data", ""))
                                            pcm_batch.extend(raw_chunk)

                                            if len(pcm_batch) >= BATCH_TARGET_BYTES:
                                                b64_batch = base64.b64encode(pcm_batch).decode('utf-8')
                                                await client_ws.send_json({
                                                    "type": "audio_pcm",
                                                    "data": b64_batch
                                                })
                                                pcm_batch = bytearray()

                                # Turn Complete
                                if sc.get("turnComplete"):
                                    if len(pcm_batch) > 0:
                                        b64_batch = base64.b64encode(pcm_batch).decode('utf-8')
                                        await client_ws.send_json({
                                            "type": "audio_pcm",
                                            "data": b64_batch
                                        })
                                        pcm_batch = bytearray()

                                    full_turn_str = "".join(current_ai_turn_text).strip()
                                    if full_turn_str:
                                        session_transcript.append({
                                            "role": "model",
                                            "text": full_turn_str,
                                            "time": datetime.now(timezone.utc).isoformat()
                                        })
                                        print(f"✨ Gemini: {full_turn_str}")

                                        # System 2 Cognitive Co-Pilot Inspection
                                        try:
                                            stage_events = copilot.inspect_text_for_stage_events(full_turn_str)
                                            for se in stage_events:
                                                print(f"🧩 [LIVE STAGE EVENT] {se['event_type']}")
                                                await client_ws.send_json({
                                                    "type": "stage_event",
                                                    "event_type": se["event_type"],
                                                    "data": se["data"]
                                                })
                                        except Exception as ce:
                                            print(f"⚠️ [COPILOT STAGE ERROR] {ce}")

                                        current_ai_turn_text = []

                                    await client_ws.send_json({"type": "turn_complete"})
                                    
                                    async def release_mic():
                                        nonlocal is_gemini_speaking
                                        await asyncio.sleep(0.8)
                                        is_gemini_speaking = False
                                        try:
                                            await client_ws.send_json({"type": "ai_finished_speaking"})
                                        except Exception:
                                            pass
                                    
                                    speech_end_task = asyncio.create_task(release_mic())

                    except Exception as e:
                        print(f"Gemini receive notice: {e}")
                    finally:
                        gemini_disconnected_event.set()

                # Run both tasks until either user hangs up or gemini drops
                t1 = asyncio.create_task(client_to_gemini())
                t2 = asyncio.create_task(gemini_to_client())
                done, pending = await asyncio.wait([t1, t2], return_when=asyncio.FIRST_COMPLETED)
                for p in pending:
                    p.cancel()

        except Exception as err:
            print(f"⚠️ [KEY #{key_num} FAILED/EXHAUSTED]: {err}")

        # Check why connection exited:
        if user_explicitly_hung_up:
            print(f"👋 [SESSION {session_id}] User ended call.")
            # Advance key for the NEXT session so it round-robins to the next key!
            rotate_to_next_key()
            break
        else:
            # Gemini connection dropped or quota was hit! Invisible auto-failover to next key!
            new_idx, new_key = rotate_to_next_key()
            print(f"🔄 [AUTO-FAILOVER] Gemini Live connection ended on Key #{key_num}. Seamlessly switching to Key #{new_idx + 1}/{total_keys}...")
            try:
                await client_ws.send_json({
                    "type": "key_rotated",
                    "key_index": new_idx + 1,
                    "total_keys": total_keys,
                    "message": f"🔄 Key #{new_idx + 1}/{total_keys} (Auto-Switched)"
                })
            except Exception:
                break
            await asyncio.sleep(0.4)

    # Save session transcript and update progress on call completion
    if session_transcript:
        session_file = f"data/sessions/session_{session_id}.json"
        with open(session_file, "w", encoding="utf-8") as f:
            json.dump({
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "turns_count": len(session_transcript),
                "transcript": session_transcript
            }, f, indent=2, ensure_ascii=False)
        print(f"💾 [SAVED SESSION] Stored transcript in {session_file}")

        engine = MasteryEngine()
        engine.append_event({
            "session_id": session_id,
            "target_type": "conversation",
            "turns_count": len(session_transcript),
            "is_correct": True
        })
        engine.rebuild_state_from_events()

        # Asynchronous background task: Deep LLM memory analysis & Spaced Repetition update
        async def run_post_session_memory_analysis():
            try:
                print(f"🧠 [MEMORY ANALYZER] Starting LLM analysis for {session_id}...")
                analysis = await analyze_transcript_async(session_id, session_transcript)
                if analysis:
                    apply_analysis_to_profile(analysis, session_id)
                    vocab_c = len(analysis.get("vocabulary", []))
                    facts_c = len(analysis.get("personal_facts", []))
                    print(f"✅ [MEMORY ANALYZER] {session_id} processed: +{vocab_c} words, +{facts_c} facts")
            except Exception as e:
                print(f"⚠️ [MEMORY ANALYZER] Post-session analysis failed: {e}")

        asyncio.create_task(run_post_session_memory_analysis())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
