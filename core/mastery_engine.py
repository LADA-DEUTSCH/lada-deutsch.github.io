"""Mastery Engine & Event Sourcing for German Acquisition System.

Implements the 5-stage behavioral state machine:
UNSEEN -> INTRODUCED -> RECOGNIZED -> RECALLED -> TRANSFERRED -> STABLE
Prevents AI hallucinations by computing learner state deterministically from raw events.
"""

from __future__ import annotations
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class ItemState:
    UNSEEN = "unseen"
    INTRODUCED = "introduced"
    RECOGNIZED = "recognized"
    RECALLED = "recalled"
    TRANSFERRED = "transferred"
    STABLE = "stable"


class MasteryEngine:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.events_path = os.path.join(data_dir, "events.jsonl")
        self.profile_path = os.path.join(data_dir, "learner_profile.json")
        self.curriculum_path = os.path.join(data_dir, "curriculum_graph.json")
        
        self.curriculum = self._load_json(self.curriculum_path, default={"skills": {}, "vocabulary": []})
        self.profile = self._load_json(self.profile_path, default=self._create_empty_profile())

    def _load_json(self, path: str, default: Any) -> Any:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return default

    def _save_json(self, path: str, data: Any) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _create_empty_profile(self) -> Dict[str, Any]:
        return {
            "learner_id": "default_learner",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_session_at": None,
            "total_sessions": 0,
            "current_frontier": {
                "primary": "spatial_case_contrast",
                "secondary": "article_automaticity"
            },
            "skills": {},
            "vocabulary": {},
            "error_patterns": [],
            "review_queue": [],
            "curiosity_queue": []
        }

    def append_event(self, event: Dict[str, Any]) -> None:
        """Appends a new interaction event to the immutable events.jsonl ledger."""
        if "timestamp" not in event:
            event["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        os.makedirs(self.data_dir, exist_ok=True)
        with open(self.events_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")

    def evaluate_item_mastery(self, attempts: int, correct: int, consecutive_correct: int, 
                              median_latency_ms: float, transfer_count: int, sessions_count: int) -> str:
        """Determines the behavioral stage for a learning item based on objective evidence."""
        if attempts == 0:
            return ItemState.UNSEEN
        if attempts == 1 and not correct:
            return ItemState.INTRODUCED
        if attempts >= 1 and correct == 1 and consecutive_correct <= 1:
            return ItemState.RECOGNIZED
        
        # Recalled: At least 3 correct, consecutive >= 2, latency < 1800ms
        if correct >= 3 and consecutive_correct >= 2 and median_latency_ms <= 1800:
            # Stable: Spaced across >= 2 sessions, 5+ consecutive correct, latency < 1300ms
            if consecutive_correct >= 5 and sessions_count >= 2 and median_latency_ms <= 1300 and transfer_count >= 2:
                return ItemState.STABLE
            # Transferred: Used successfully in novel syntactic or movement context >= 1
            if transfer_count >= 1:
                return ItemState.TRANSFERRED
            return ItemState.RECALLED
        
        if correct >= 1:
            return ItemState.RECOGNIZED
        return ItemState.INTRODUCED

    def rebuild_state_from_events(self) -> Dict[str, Any]:
        """Reconstructs the entire learner profile deterministically by replaying events.jsonl."""
        if not os.path.exists(self.events_path):
            return self.profile

        raw_events: List[Dict[str, Any]] = []
        with open(self.events_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        raw_events.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue

        # Aggregate stats
        vocab_stats: Dict[str, Dict[str, Any]] = {}
        skill_stats: Dict[str, Dict[str, Any]] = {}
        error_counts: Dict[str, Dict[str, Any]] = {}
        session_ids = set()

        for ev in raw_events:
            session_id = ev.get("session_id", "S000")
            session_ids.add(session_id)
            target_type = ev.get("target_type", "vocabulary")
            item_id = ev.get("item_id", "")
            is_correct = ev.get("is_correct", False)
            latency = ev.get("latency_ms", 1500)
            context = ev.get("context", "")
            error_id = ev.get("error_id")

            # Error tracking
            if error_id:
                if error_id not in error_counts:
                    error_counts[error_id] = {
                        "id": error_id,
                        "pattern": ev.get("error_pattern", error_id),
                        "count": 0,
                        "last_observed": ev.get("timestamp")
                    }
                error_counts[error_id]["count"] += 1
                error_counts[error_id]["last_observed"] = ev.get("timestamp")

            # Vocabulary stats
            if target_type == "vocabulary" and item_id:
                if item_id not in vocab_stats:
                    # Lookup vocab details from curriculum
                    lemma_meta = next((v for v in self.curriculum.get("vocabulary", []) if v["id"] == item_id), None)
                    lemma = lemma_meta["lemma"] if lemma_meta else item_id.capitalize()
                    article = lemma_meta["article"] if lemma_meta else "der"
                    plural = lemma_meta["plural"] if lemma_meta else ""
                    vocab_stats[item_id] = {
                        "lemma": lemma,
                        "article": article,
                        "plural": plural,
                        "attempts": 0,
                        "correct": 0,
                        "consecutive_correct": 0,
                        "latencies": [],
                        "transfers": 0,
                        "sessions": set(),
                        "last_practiced": ev.get("timestamp")
                    }
                
                v = vocab_stats[item_id]
                v["attempts"] += 1
                v["sessions"].add(session_id)
                v["latencies"].append(latency)
                v["last_practiced"] = ev.get("timestamp")

                if is_correct:
                    v["correct"] += 1
                    v["consecutive_correct"] += 1
                    if "movement" in context or "sentence" in context or "action" in context:
                        v["transfers"] += 1
                else:
                    v["consecutive_correct"] = 0

            # Grammar/Skill stats
            if target_type in ("spatial_case", "skill", "grammar"):
                skill_id = item_id or ev.get("skill_id", "spatial_case_contrast")
                if skill_id not in skill_stats:
                    skill_stats[skill_id] = {
                        "attempts": 0,
                        "correct": 0,
                        "akkusativ_attempts": 0,
                        "akkusativ_correct": 0,
                        "dativ_attempts": 0,
                        "dativ_correct": 0
                    }
                s = skill_stats[skill_id]
                s["attempts"] += 1
                if is_correct:
                    s["correct"] += 1
                
                case = ev.get("case")
                if case == "Akkusativ":
                    s["akkusativ_attempts"] += 1
                    if is_correct:
                        s["akkusativ_correct"] += 1
                elif case == "Dativ":
                    s["dativ_attempts"] += 1
                    if is_correct:
                        s["dativ_correct"] += 1

        # Calculate final state for each vocab item
        processed_vocab: Dict[str, Any] = {}
        for item_id, v in vocab_stats.items():
            latencies = v["latencies"]
            median_lat = sorted(latencies)[len(latencies)//2] if latencies else 1500
            state = self.evaluate_item_mastery(
                attempts=v["attempts"],
                correct=v["correct"],
                consecutive_correct=v["consecutive_correct"],
                median_latency_ms=median_lat,
                transfer_count=v["transfers"],
                sessions_count=len(v["sessions"])
            )
            processed_vocab[item_id] = {
                "lemma": v["lemma"],
                "article": v["article"],
                "plural": v["plural"],
                "state": state,
                "attempts": v["attempts"],
                "correct": v["correct"],
                "consecutive_correct": v["consecutive_correct"],
                "last_latency_ms": latencies[-1] if latencies else 1500,
                "last_practiced": v["last_practiced"]
            }

        # Calculate skill levels
        processed_skills: Dict[str, Any] = {}
        for skill_id, s in skill_stats.items():
            conf = s["correct"] / s["attempts"] if s["attempts"] > 0 else 0.0
            level = "stable" if conf >= 0.85 and s["attempts"] >= 10 else ("developing" if conf >= 0.6 else "emerging")
            
            entry = {
                "level": level,
                "confidence": round(conf, 2),
                "attempts": s["attempts"],
                "correct": s["correct"]
            }
            if s["akkusativ_attempts"] > 0:
                entry["akkusativ_accuracy"] = round(s["akkusativ_correct"] / s["akkusativ_attempts"], 2)
            if s["dativ_attempts"] > 0:
                entry["dativ_accuracy"] = round(s["dativ_correct"] / s["dativ_attempts"], 2)
            processed_skills[skill_id] = entry

        # Format error patterns
        processed_errors = []
        for e_id, e_info in error_counts.items():
            freq = "high" if e_info["count"] >= 3 else ("medium" if e_info["count"] >= 2 else "low")
            processed_errors.append({
                "id": e_id,
                "pattern": e_info["pattern"],
                "frequency": freq,
                "count": e_info["count"],
                "last_observed": e_info["last_observed"]
            })

        # Update profile
        self.profile["total_sessions"] = len(session_ids)
        self.profile["vocabulary"] = processed_vocab
        if processed_skills:
            self.profile["skills"].update(processed_skills)
        self.profile["error_patterns"] = processed_errors

        # Save rebuilt state
        self._save_json(self.profile_path, self.profile)
        return self.profile

    def save(self) -> None:
        self._save_json(self.profile_path, self.profile)
