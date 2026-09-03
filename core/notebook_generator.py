"""Physical Notebook Generator & Knowledge Compressor (Enriched V2.1).

Converts raw session events and drill results into a structured, compressed physical notebook page.
Includes:
- Active Vocabulary with Color Anchors & Plurals
- Core Grammar Patterns (Movement vs Rest)
- Spoken Street Contractions (im, am, ins, aufs)
- Sentence-Lengthener Templates
- Phonetic & Pronunciation Keys (ich-Laut vs ach-Laut)
- Personalized Mistakes
- Handwriting Task & Post-Writing Active Recall Drill
"""

from __future__ import annotations
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class NotebookGenerator:
    def __init__(self, output_dir: str = "data/notebooks"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_session_notebook(
        self,
        session_id: str,
        studied_items: List[Dict[str, Any]],
        demonstrated_items: List[str],
        unstable_items: List[str],
        mistakes_made: List[Dict[str, str]],
        model_sentences: List[Dict[str, str]],
        core_patterns: List[Dict[str, str]],
        post_writing_quiz: List[Dict[str, str]],
        street_contractions: Optional[List[Dict[str, str]]] = None,
        sentence_template: Optional[Dict[str, str]] = None,
        phonetic_key: Optional[Dict[str, Any]] = None
    ) -> str:
        today_str = datetime.now(timezone.utc).strftime("%d/%m/%Y")
        
        lines = []
        lines.append(f"# 🇩🇪 DEUTSCH TAGEBUCH — SESSION #{session_id}")
        lines.append(f"**Datum**: {today_str} | **Fokus**: Spatial Cases & Action-Location Anchors\n")
        lines.append("---\n")

        # 1. New / Active Vocabulary
        lines.append("## 1. 🆕 WORTSCHATZ (Active Vocabulary)")
        lines.append("| Artikel + Nomen | Plural | Bedeutung | Farb-Anker | Suffix-Regel |")
        lines.append("| :--- | :--- | :--- | :--- | :--- |")
        for item in studied_items:
            color = item.get("color_anchor", "").capitalize()
            suffix = item.get("suffix_heuristic", "-")
            status_icon = "✓" if item.get("lemma") in demonstrated_items else "⚠"
            lines.append(f"| **{item.get('article')} {item.get('lemma')}** {status_icon} | {item.get('plural', '-')} | {item.get('meaning', '')} | {color} | `{suffix}` |")
        lines.append("")

        # 2. Core Grammar Patterns
        lines.append("## 2. 🧠 WICHTIGE STRUKTUREN (Core Patterns)")
        for pat in core_patterns:
            lines.append(f"- **{pat.get('title')}**:")
            lines.append(f"  * 👉 `{pat.get('rule')}`")
            lines.append(f"  * *Erklärung*: {pat.get('explanation')}")
        lines.append("")

        # 3. Spoken Street Contractions & Phonetics
        if street_contractions or phonetic_key:
            lines.append("## 3. 🗣️ GESPROCHENE KÜRZUNGEN & PHONETIK (Street German & Audio)")
            if street_contractions:
                lines.append("**Umgangssprachliche Verschmelzungen:**")
                for c in street_contractions:
                    lines.append(f"- `{c.get('formal')}` ➔ **`{c.get('spoken')}`** ({c.get('case')} {c.get('gender')})")
            if phonetic_key:
                lines.append(f"\n**Phonetik-Fokus ({phonetic_key.get('symbol', '')}):**")
                lines.append(f"- *Regel*: {phonetic_key.get('rule', '')}")
                lines.append(f"- *Beispielwörter*: `{', '.join(phonetic_key.get('triggers', []))}`")
            lines.append("")

        # 4. Sentence-Lengthener Template & Model Sentences
        lines.append("## 4. 💬 MUSTERSÄTZE & SATZ-BAUKASTEN (Model Sentences)")
        if sentence_template:
            lines.append(f"> **Satz-Template**: `{sentence_template.get('structure', '')}`")
        for sent in model_sentences:
            lines.append(f"- **{sent.get('german')}**")
            lines.append(f"  * (*{sent.get('translation')}*) — `Trigger: {sent.get('trigger')}`")
        lines.append("")

        # 5. My Mistakes Today
        lines.append("## 5. ❌ MEINE FEHLER HEUTE (My Personal Mistakes to Intercept)")
        if mistakes_made:
            for m in mistakes_made:
                lines.append(f"- ❌ Gesagt: `{m.get('wrong')}`")
                lines.append(f"  ✅ Richtig: `{m.get('correct')}` (*{m.get('reason')}*)")
        else:
            lines.append("- *Keine kritischen Fehler in dieser Session. Sehr saubere Aussprache & Grammatik!*")
        lines.append("")

        # 6. Physical Handwriting Directive
        lines.append("## ✍️ HANDSCHRIFT-AUFGABE (Physical Notebook Protocol)")
        lines.append("> [!IMPORTANT]")
        lines.append("> 1. Nimm dein echtes physisches Notizheft (Real Paper Notebook).")
        lines.append("> 2. Schreibe alle Abschnitte 1 bis 5 sauber von Hand auf.")
        lines.append("> 3. Lies jeden Satz LAUT vor, während du ihn schreibst (Neuromotor Voice-Hand Dual Encoding).")
        lines.append("> 4. Sage **\"Fertig\"** oder drücke Enter für den schnellen Abschluss-Test.")
        lines.append("")

        # 7. Post-Writing Retrieval Quiz
        lines.append("## 🔁 RETRIEVAL-TEST (Sofort nach dem Schreiben)")
        lines.append("Schließe dein Notizbuch und beantworte aus dem Gedächtnis:")
        for idx, q in enumerate(post_writing_quiz, 1):
            lines.append(f"{idx}. **Frage**: {q.get('question')}")
            lines.append(f"   * *Erwartete Antwort*: `{q.get('expected')}`")
        lines.append("\n---")
        lines.append(f"*Gespeichert in: data/notebooks/Session_{session_id}.md*")

        content = "\n".join(lines)
        
        filepath = os.path.join(self.output_dir, f"Session_{session_id}.md")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        return content
