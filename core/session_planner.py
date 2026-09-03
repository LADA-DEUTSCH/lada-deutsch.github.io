"""Session Planner for German Acquisition Companion.

Analyzes learner profile, curriculum graph, and 100-source hacks database to produce a surgical session mission:
- 1 Primary Target Skill
- Supporting Vocabulary / Physical Objects
- Spoken Contractions & Phonetic Calibration Targets
- Sentence-Lengthener Template Selection
- Review Queue Items
- Forbidden Targets (Anti-Drift / Level Containment)
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional


class SessionMission:
    def __init__(
        self,
        session_id: str,
        primary_target: Dict[str, Any],
        supporting_targets: List[str],
        preferred_objects: List[Dict[str, str]],
        sentence_template: Dict[str, str],
        phonetic_focus: Dict[str, Any],
        contraction_focus: List[Dict[str, str]],
        review_items: List[str],
        forbidden_targets: List[str],
        active_error_focus: List[Dict[str, Any]]
    ):
        self.session_id = session_id
        self.primary_target = primary_target
        self.supporting_targets = supporting_targets
        self.preferred_objects = preferred_objects
        self.sentence_template = sentence_template
        self.phonetic_focus = phonetic_focus
        self.contraction_focus = contraction_focus
        self.review_items = review_items
        self.forbidden_targets = forbidden_targets
        self.active_error_focus = active_error_focus

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "primary_target": self.primary_target,
            "supporting_targets": self.supporting_targets,
            "preferred_objects": self.preferred_objects,
            "sentence_template": self.sentence_template,
            "phonetic_focus": self.phonetic_focus,
            "contraction_focus": self.contraction_focus,
            "review_items": self.review_items,
            "forbidden_targets": self.forbidden_targets,
            "active_error_focus": self.active_error_focus
        }


class SessionPlanner:
    def __init__(self, curriculum: Dict[str, Any], profile: Dict[str, Any]):
        self.curriculum = curriculum
        self.profile = profile

    def plan_session(self, session_id: Optional[str] = None) -> SessionMission:
        if not session_id:
            total = self.profile.get("total_sessions", 0) + 1
            session_id = f"S{total:03d}"

        # 1. Primary bottleneck skill diagnosis
        skills = self.profile.get("skills", {})
        spatial_skill = skills.get("spatial_case_contrast", {})
        dativ_acc = spatial_skill.get("dativ_accuracy", 1.0)
        
        if dativ_acc < 0.7:
            primary_target = {
                "skill_id": "spatial_case_contrast",
                "focus": "dativ_spatial_location",
                "objective": "Automate Dativ with static locations ('Wo steht das Glas? -> Auf dem Tisch')",
                "trigger_contrast": "Movement (Wohin? -> Akkusativ) vs. Location (Wo? -> Dativ)"
            }
        else:
            primary_target = {
                "skill_id": "sentence_lengthener_templates",
                "focus": "syntactic_expansion",
                "objective": "Produce multi-clause frames without hesitating on verb order",
                "trigger_contrast": "Template A (Opinion) & Template D (Spatial Anchor)"
            }

        # 2. Select physical context & objects
        vocab_items = self.curriculum.get("vocabulary", [])
        vocab_profile = self.profile.get("vocabulary", {})
        
        candidate_objects = []
        for v in vocab_items:
            v_id = v["id"]
            state = vocab_profile.get(v_id, {}).get("state", "unseen")
            candidate_objects.append({
                "id": v_id,
                "lemma": v["lemma"],
                "article": v["article"],
                "plural": v.get("plural", ""),
                "color_anchor": v.get("color_anchor", "blue"),
                "meaning": v.get("meaning", ""),
                "state": state
            })

        preferred_objects = [o for o in candidate_objects if o["id"] in ("glas", "tisch", "buch", "stuhl", "kuehlschrank", "lampe")]
        if not preferred_objects:
            preferred_objects = candidate_objects[:5]

        # 3. Selected Sentence-Lengthener Template from 100-videos hack
        templates = self.curriculum.get("sentence_templates", {})
        selected_template = templates.get("template_d_spatial", {
            "structure": "[Object A] [Verb V2] neben/auf [Object B].",
            "example": "Das Glas steht auf dem Tisch."
        })

        # 4. Phonetic Calibration target
        phonetics = self.curriculum.get("phonetics", {})
        phonetic_focus = phonetics.get("ach_laut", {
            "symbol": "/x/",
            "triggers": ["Buch", "Kuchen", "Kühlschrank"],
            "rule": "Deep throat friction after a, o, u, au"
        })

        # 5. Spoken Contraction focus (Vernacular Street German)
        contractions = self.curriculum.get("street_contractions", [])
        contraction_focus = [c for c in contractions if c["spoken"] in ("im", "am", "ins", "ans", "aufs")][:4]

        # 6. Spaced review queue
        review_items = self.profile.get("review_queue", [])
        if not review_items:
            review_items = [o["lemma"] for o in preferred_objects[:3]]

        # 7. Anti-drift containment
        forbidden_targets = [
            "Perfekt (Past tense compound verbs)",
            "Präteritum (Simple past)",
            "Subordinate clauses with weil/dass (unless Template A)",
            "Konjunktiv II (Polite / hypothetical)",
            "Abstract philosophical debate",
            "Grammar declension table memorization drills"
        ]

        error_focus = [
            e for e in self.profile.get("error_patterns", [])
            if e.get("frequency") in ("high", "medium")
        ]

        supporting_targets = [
            "der Tisch (Masculine / Blue)",
            "das Glas (Neuter / Green)",
            "der Kühlschrank (Masculine / Blue compound)",
            "stellen (Movement -> Akkusativ)",
            "stehen (Location -> Dativ)"
        ]

        return SessionMission(
            session_id=session_id,
            primary_target=primary_target,
            supporting_targets=supporting_targets,
            preferred_objects=preferred_objects,
            sentence_template=selected_template,
            phonetic_focus=phonetic_focus,
            contraction_focus=contraction_focus,
            review_items=review_items,
            forbidden_targets=forbidden_targets,
            active_error_focus=error_focus
        )
