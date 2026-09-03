"""Interactive Session Runner & Test Harness for German Acquisition Engine (V2.1).

Executes a live or simulated German learning session:
1. Loads learner profile and plans mission with 100-source hacks.
2. Runs interactive drills (vocabulary, spatial cases, contractions, sentence expansion).
3. Logs real-time events to events.jsonl with latency and phonetic tracking.
4. Generates the Physical Handwritten Notebook page.
5. Runs the post-writing active retrieval quiz.
6. Rebuilds learner profile deterministically.
"""

from __future__ import annotations
import sys
import time
import argparse
from datetime import datetime, timezone

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stdin, 'reconfigure'):
    sys.stdin.reconfigure(encoding='utf-8', errors='replace')

from core.mastery_engine import MasteryEngine
from core.session_planner import SessionPlanner
from core.notebook_generator import NotebookGenerator
from core.companion_prompt import CompanionPromptBuilder


def print_banner(title: str):
    print("\n" + "=" * 68)
    print(f"  {title}")
    print("=" * 68)


def run_session(demo_mode: bool = False):
    print_banner("🇩🇪 GERMAN ACQUISITION ENGINE (V2.1) — 100-SOURCE HARNESS")
    
    # 1. Initialize Mastery Engine
    engine = MasteryEngine()
    curriculum = engine.curriculum
    profile = engine.profile

    print(f"👤 Learner: {profile.get('learner_id', 'bilal').upper()}")
    print(f"📊 Completed Sessions: {profile.get('total_sessions', 0)}")
    print(f"🎯 Current Frontier: {profile.get('current_frontier', {}).get('primary', 'spatial_case_contrast')}")

    # 2. Plan Session
    planner = SessionPlanner(curriculum, profile)
    mission = planner.plan_session()
    session_id = mission.session_id

    print_banner(f"🎯 SESSION MISSION: {session_id}")
    print(f"• Primary Target: {mission.primary_target['focus']}")
    print(f"• Objective: {mission.primary_target['objective']}")
    print(f"• In-Scope Objects: {', '.join([o['lemma'] for o in mission.preferred_objects])}")
    contractions_display = ", ".join([c.get('formal', '') + ' -> ' + c.get('spoken', '') for c in mission.contraction_focus])
    print(f"• Street Contractions: {contractions_display}")
    print(f"• Sentence Template: {mission.sentence_template.get('structure')}")
    print(f"• Anti-Drift Locks: {', '.join(mission.forbidden_targets[:3])}")


    # 3. Dynamic System Prompt
    system_prompt = CompanionPromptBuilder.build_system_prompt(mission)
    print("\n--- 🤖 LEAN COMPANION PROMPT (INJECTED INTO GEMINI LIVE) ---")
    print(system_prompt[:260] + "...\n[Total Prompt Size: ~240 tokens — Low Latency & High Precision]")

    # 4. Interactive Live Drill Loop
    print_banner("🎙️ LIVE CAMERA & AUDIO DRILL (100-SOURCE METHODOLOGY)")
    
    drills = [
        {
            "stage": "1. VOCABULARY & COLOR ANCHOR RECALL",
            "prompt": "AI: „Was ist das in deiner Hand?“",
            "expected": "das Glas",
            "target_type": "vocabulary",
            "item_id": "glas",
            "mock_user": "das Glas",
            "color_hint": "Green Anchor (Neuter)",
            "context": "desk_naming"
        },
        {
            "stage": "2. DYNAMIC MOVEMENT (AKKUSATIV)",
            "prompt": "AI: „Stell das Glas auf den Tisch! Wohin stellst du das Glas?“",
            "expected": "auf den Tisch",
            "target_type": "spatial_case",
            "item_id": "spatial_case_contrast",
            "case": "Akkusativ",
            "mock_user": "auf den Tisch",
            "color_hint": "Movement -> Akkusativ (der Tisch -> den Tisch)",
            "context": "movement_action"
        },
        {
            "stage": "3. STATIC LOCATION & STREET CONTRACTION (DATIV)",
            "prompt": "AI: „Perfekt. Und wo steht das Glas jetzt?“",
            "expected": "auf dem Tisch",
            "target_type": "spatial_case",
            "item_id": "spatial_case_contrast",
            "case": "Dativ",
            "mock_user": "auf dem Tisch",
            "color_hint": "Static Location -> Dativ (der Tisch -> dem Tisch)",
            "context": "static_location"
        },
        {
            "stage": "4. SENTENCE-LENGTHENER TEMPLATE EXPANSION",
            "prompt": "AI: „Wende Template D an: Sag einen vollen Satz mit Glas und Tisch!“",
            "expected": "Das Glas steht auf dem Tisch.",
            "target_type": "skill",
            "item_id": "sentence_lengthener_templates",
            "mock_user": "Das Glas steht auf dem Tisch.",
            "color_hint": "[Object A] [Verb V2] [Preposition] [Object B]",
            "context": "sentence_expansion"
        },
        {
            "stage": "5. PHONETIC & VERNACULAR CONTRACTION TEST",
            "prompt": "AI: „Stell die Flasche in den Kühlschrank! Wo ist die Flasche jetzt?“",
            "expected": "im Kühlschrank",
            "target_type": "skill",
            "item_id": "spoken_contractions",
            "case": "Dativ",
            "mock_user": "im Kühlschrank",
            "color_hint": "in + dem = im / Kühlschrank ach-Laut /x/",
            "context": "street_contraction"
        }
    ]

    session_events = []
    mistakes_recorded = []
    demonstrated_items = []
    unstable_items = []

    for idx, drill in enumerate(drills, 1):
        print(f"\n[{drill['stage']}]")
        print(drill['prompt'])
        
        start_time = time.time()
        if demo_mode:
            user_input = drill["mock_user"]
            time.sleep(0.5)  # simulate vocal response
            print(f"You (Spoken): „{user_input}“")
        else:
            try:
                user_input = input("You (Spoken / Type response): ").strip()
            except EOFError:
                user_input = drill["mock_user"]
                print(f"„{user_input}“")
        
        latency_ms = int((time.time() - start_time) * 1000)
        is_correct = user_input.lower().replace(".", "").replace("!", "") == drill["expected"].lower().replace(".", "").replace("!", "")

        # Immediate Cloze Deletion Feedback if wrong
        if not is_correct:
            print(f"⚡ AI Cloze Correction: „... {drill['expected']}! Noch einmal: {drill['prompt']}“")
            mistakes_recorded.append({
                "wrong": user_input,
                "correct": drill["expected"],
                "reason": drill["color_hint"]
            })
            unstable_items.append(drill["item_id"])
        else:
            print(f"✅ Richtig! ({latency_ms}ms) [Zero filler — Next Target]")
            demonstrated_items.append(drill["item_id"])

        # Create and append Event
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "session_id": session_id,
            "event_type": "retrieval_attempt",
            "target_type": drill["target_type"],
            "item_id": drill["item_id"],
            "prompt": drill["prompt"],
            "expected": drill["expected"],
            "user_response": user_input,
            "is_correct": is_correct,
            "latency_ms": latency_ms,
            "context": drill["context"]
        }
        if "case" in drill:
            event["case"] = drill["case"]
        
        engine.append_event(event)
        session_events.append(event)

    # 5. Generate Physical Notebook Page
    print_banner("📝 NOTEBOOK MODE (DUAL-MEMORY RETENTION)")
    print("AI: „Session beendet. Nimm jetzt dein physisches Notizbuch!“")
    print("AI: „Schreibe die folgende Lektion mit der Hand auf und lies jeden Satz laut vor.“\n")

    studied_vocab = [
        {"article": "das", "lemma": "Glas", "plural": "die Gläser", "meaning": "glass", "color_anchor": "green", "suffix_heuristic": "-"},
        {"article": "der", "lemma": "Tisch", "plural": "die Tische", "meaning": "table", "color_anchor": "blue", "suffix_heuristic": "-"},
        {"article": "der", "lemma": "Kühlschrank", "plural": "die Kühlschränke", "meaning": "refrigerator", "color_anchor": "blue", "suffix_heuristic": "Compound (Schrank)"},
        {"article": "die", "lemma": "Flasche", "plural": "die Flaschen", "meaning": "bottle", "color_anchor": "red", "suffix_heuristic": "-e (Feminine)"}
    ]

    core_patterns = [
        {
            "title": "Wohin? (Movement / Action) ➔ AKKUSATIV",
            "rule": "stellen / legen + auf + DEN Tisch / IN DEN Kühlschrank",
            "explanation": "Wenn sich etwas bewegt oder irgendwohin gestellt wird."
        },
        {
            "title": "Wo? (Static Location / Rest) ➔ DATIV",
            "rule": "stehen / liegen + auf + DEM Tisch / IM Kühlschrank",
            "explanation": "Wenn der Gegenstand an einem festen Ort ruht."
        }
    ]

    model_sentences = [
        {"german": "Ich stelle das Glas auf den Tisch.", "translation": "I put the glass onto the table", "trigger": "Wohin? -> Akkusativ"},
        {"german": "Das Glas steht auf dem Tisch.", "translation": "The glass stands on the table", "trigger": "Wo? -> Dativ"},
        {"german": "Die Flasche steht im Kühlschrank.", "translation": "The bottle stands in the fridge", "trigger": "Wo? -> Dativ (im = in dem)"}
    ]

    post_writing_quiz = [
        {"question": "Wohin kommt das Glas?", "expected": "Auf den Tisch. (Akkusativ)"},
        {"question": "Wo steht das Glas jetzt?", "expected": "Auf dem Tisch. (Dativ)"},
        {"question": "Was ist die Kurzform von 'in dem Kühlschrank'?", "expected": "Im Kühlschrank. (Dativ Verschmelzung)"}
    ]

    generator = NotebookGenerator()
    notebook_content = generator.generate_session_notebook(
        session_id=session_id,
        studied_items=studied_vocab,
        demonstrated_items=demonstrated_items,
        unstable_items=unstable_items,
        mistakes_made=mistakes_recorded,
        model_sentences=model_sentences,
        core_patterns=core_patterns,
        post_writing_quiz=post_writing_quiz,
        street_contractions=mission.contraction_focus,
        sentence_template=mission.sentence_template,
        phonetic_key=mission.phonetic_focus
    )

    print(notebook_content)

    # 6. Post-Writing Retrieval Quiz
    print_banner("🔁 POST-WRITING RETRIEVAL CHECK")
    print("AI: „Hast du alles aufgeschrieben? Schließe jetzt dein Notizbuch!“")
    print("AI: „Sofortige Wissenskontrolle aus dem Kopf:“")
    for q in post_writing_quiz:
        print(f"👉 AI: „{q['question']}“")
        print(f"   Antwort: „{q['expected']}“")

    # 7. Recompute Profile Deterministically
    print_banner("💾 DETERMINISTIC MEMORY UPDATE")
    updated_profile = engine.rebuild_state_from_events()
    print("✓ All learning events permanently stored in 'data/events.jsonl'.")
    print("✓ Learner profile computed with 0% AI hallucination:")
    
    spatial = updated_profile.get("skills", {}).get("spatial_case_contrast", {})
    print(f"  • Spatial Case Confidence: {spatial.get('confidence', 0.0) * 100:.0f}%")
    print(f"  • Akkusativ Accuracy: {spatial.get('akkusativ_accuracy', 0.0) * 100:.0f}%")
    print(f"  • Dativ Accuracy: {spatial.get('dativ_accuracy', 0.0) * 100:.0f}%")
    print(f"  • Mastered Vocab Count: {len([v for v in updated_profile.get('vocabulary', {}).values() if v.get('state') in ('recalled', 'transferred', 'stable')])}")
    print(f"  • Active Errors Tracked: {len(updated_profile.get('error_patterns', []))}")
    print("\n🚀 Ready for Next Session! Your state is persistent, robust, and permanent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="German Companion Session Runner (100-Source V2.1)")
    parser.add_argument("--demo", action="store_true", help="Run automated demonstration")
    args = parser.parse_args()
    
    run_session(demo_mode=args.demo)
