"""Unit Tests for German Acquisition Core Engine (V2.1 with 100-Source Hacks)."""

import unittest
import os
import shutil
import tempfile
import json
from core.mastery_engine import MasteryEngine, ItemState
from core.session_planner import SessionPlanner
from core.notebook_generator import NotebookGenerator
from core.companion_prompt import CompanionPromptBuilder


class TestGermanEngine(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.curriculum_file = os.path.join(self.test_dir, "curriculum_graph.json")
        self.profile_file = os.path.join(self.test_dir, "learner_profile.json")
        self.events_file = os.path.join(self.test_dir, "events.jsonl")
        
        sample_curriculum = {
            "skills": {
                "spatial_case_contrast": {
                    "id": "spatial_case_contrast",
                    "name": "Spatial Contrast"
                }
            },
            "street_contractions": [
                {"formal": "in dem", "spoken": "im", "case": "Dativ", "gender": "masculine"}
            ],
            "sentence_templates": {
                "template_d_spatial": {
                    "structure": "[Object A] [Verb V2] neben [Object B]."
                }
            },
            "phonetics": {
                "ach_laut": {"symbol": "/x/", "rule": "Throat sound", "triggers": ["Buch"]}
            },
            "vocabulary": [
                {
                    "id": "glas",
                    "lemma": "Glas",
                    "article": "das",
                    "plural": "die Gläser",
                    "color_anchor": "green",
                    "meaning": "glass"
                },
                {
                    "id": "tisch",
                    "lemma": "Tisch",
                    "article": "der",
                    "plural": "die Tische",
                    "color_anchor": "blue",
                    "meaning": "table"
                }
            ]
        }
        with open(self.curriculum_file, "w", encoding="utf-8") as f:
            json.dump(sample_curriculum, f)

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_mastery_state_transitions(self):
        engine = MasteryEngine(data_dir=self.test_dir)
        
        self.assertEqual(engine.evaluate_item_mastery(0, 0, 0, 1500, 0, 0), ItemState.UNSEEN)
        self.assertEqual(engine.evaluate_item_mastery(1, 0, 0, 1500, 0, 1), ItemState.INTRODUCED)
        self.assertEqual(engine.evaluate_item_mastery(2, 1, 1, 1500, 0, 1), ItemState.RECOGNIZED)
        self.assertEqual(engine.evaluate_item_mastery(4, 3, 2, 1200, 0, 1), ItemState.RECALLED)
        self.assertEqual(engine.evaluate_item_mastery(6, 5, 4, 1100, 1, 1), ItemState.TRANSFERRED)
        self.assertEqual(engine.evaluate_item_mastery(8, 7, 5, 950, 2, 2), ItemState.STABLE)

    def test_event_sourcing_rebuild(self):
        engine = MasteryEngine(data_dir=self.test_dir)
        
        engine.append_event({
            "session_id": "S001",
            "target_type": "vocabulary",
            "item_id": "glas",
            "is_correct": True,
            "latency_ms": 1100,
            "context": "naming"
        })
        engine.append_event({
            "session_id": "S001",
            "target_type": "spatial_case",
            "item_id": "spatial_case_contrast",
            "case": "Akkusativ",
            "is_correct": True,
            "latency_ms": 1200
        })
        engine.append_event({
            "session_id": "S001",
            "target_type": "spatial_case",
            "item_id": "spatial_case_contrast",
            "case": "Dativ",
            "is_correct": False,
            "error_id": "ERR_DATIVE",
            "latency_ms": 2200
        })

        rebuilt = engine.rebuild_state_from_events()
        
        self.assertEqual(rebuilt["total_sessions"], 1)
        self.assertIn("glas", rebuilt["vocabulary"])
        self.assertEqual(rebuilt["vocabulary"]["glas"]["attempts"], 1)
        
        spatial_skill = rebuilt["skills"]["spatial_case_contrast"]
        self.assertEqual(spatial_skill["attempts"], 2)
        self.assertEqual(spatial_skill["correct"], 1)
        self.assertEqual(spatial_skill["akkusativ_accuracy"], 1.0)
        self.assertEqual(spatial_skill["dativ_accuracy"], 0.0)

    def test_session_planner_with_hacks(self):
        engine = MasteryEngine(data_dir=self.test_dir)
        planner = SessionPlanner(engine.curriculum, engine.profile)
        mission = planner.plan_session()
        
        self.assertTrue(len(mission.preferred_objects) > 0)
        self.assertIn("structure", mission.sentence_template)
        self.assertIn("symbol", mission.phonetic_focus)
        self.assertTrue(len(mission.forbidden_targets) > 0)

    def test_notebook_generator_enriched(self):
        output_dir = os.path.join(self.test_dir, "notebooks")
        generator = NotebookGenerator(output_dir=output_dir)
        
        content = generator.generate_session_notebook(
            session_id="S001",
            studied_items=[{"article": "das", "lemma": "Glas", "plural": "die Gläser", "meaning": "glass", "color_anchor": "green", "suffix_heuristic": "-"}],
            demonstrated_items=["Glas"],
            unstable_items=[],
            mistakes_made=[{"wrong": "auf der Tisch", "correct": "auf den Tisch", "reason": "Akkusativ"}],
            model_sentences=[{"german": "Ich stelle das Glas auf den Tisch.", "translation": "I put the glass on the table", "trigger": "Wohin?"}],
            core_patterns=[{"title": "Wohin? -> Akkusativ", "rule": "stellen + auf + Akk", "explanation": "Movement"}],
            post_writing_quiz=[{"question": "Wohin kommt das Glas?", "expected": "Auf den Tisch."}],
            street_contractions=[{"formal": "in dem", "spoken": "im", "case": "Dativ", "gender": "masculine"}],
            sentence_template={"structure": "[Object A] [Verb V2] [Object B]"},
            phonetic_key={"symbol": "/x/", "rule": "Deep throat friction", "triggers": ["Buch"]}
        )
        
        self.assertIn("# 🇩🇪 DEUTSCH TAGEBUCH — SESSION #S001", content)
        self.assertIn("GESPROCHENE KÜRZUNGEN", content)
        self.assertIn("HANDSCHRIFT-AUFGABE", content)
        self.assertTrue(os.path.exists(os.path.join(output_dir, "Session_S001.md")))

    def test_companion_prompt_builder_enriched(self):
        engine = MasteryEngine(data_dir=self.test_dir)
        planner = SessionPlanner(engine.curriculum, engine.profile)
        mission = planner.plan_session()
        
        prompt = CompanionPromptBuilder.build_system_prompt(mission)
        self.assertIn("100-SOURCE MASTER MATRIX", prompt)
        self.assertIn("60/40 PRODUCTION", prompt)
        self.assertIn("2-7-15 MICRO-SRS", prompt)
        self.assertTrue(len(prompt.split()) < 350)


if __name__ == "__main__":
    unittest.main()
