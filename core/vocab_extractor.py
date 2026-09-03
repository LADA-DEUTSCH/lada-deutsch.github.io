"""Transcript Vocabulary Extractor.

Scans saved session transcripts for German nouns with articles and
updates the learner profile vocabulary automatically.

Detects patterns like:
  - "der Stuhl", "die Maus", "das Kissen"
  - "eine Flasche", "ein Glas"
  - Quoted German words in AI speech: "Hallo", "Wasser"
"""

from __future__ import annotations
import re
import json
import os
from typing import Any, Dict, List, Set, Tuple


# German articles that precede nouns
ARTICLE_PATTERNS = [
    # Standard: "der Stuhl", "die Maus", "das Kissen"
    r'\b(der|die|das|ein|eine|einen|einem|einer)\s+([A-ZÄÖÜ][a-zäöüß]+)\b',
]

# Patterns to catch German words taught without a preceding article
# e.g. '"Stuhl," very good', 'it\'s "Wasser"', 'In German, we call that "Maus"'
QUOTED_WORD_PATTERNS = [
    # Quoted German word: "Stuhl" or "Wasser" or 'Hallo'
    r'["\u201c\u201e]([A-ZÄÖÜ][a-zäöüß]{2,})["\u201d\u201f]',
    # "That means X" / "That's X" patterns
    r'(?:means?|call(?:ed)?|is|say)\s+["\u201c]?([A-ZÄÖÜ][a-zäöüß]{2,})["\u201d]?',
]

# Contextual article patterns: 'Der Stuhl, if you want the article'
CONTEXTUAL_ARTICLE = [
    r'["\u201c]?(Der|Die|Das)\s+([A-ZÄÖÜ][a-zäöüß]+)["\u201d]?[,.]',
]

# Common false positives to ignore (English words that happen to be capitalized)
FALSE_POSITIVES = {
    # English words
    "German", "English", "Darija", "Moroccan",
    "You", "That", "This", "What", "How", "Can", "Want",
    "Let", "Now", "See", "Try", "Perfect", "Excellent",
    "Fantastic", "Right", "Very", "Pretty", "Simple",
    "Quick", "Good", "Great", "Hey", "Welcome", "Today",
    "And", "The", "Your", "Like", "Want", "Maybe",
    "Anything", "Something", "Looking", "Holding",
    "Exactly", "Yeah", "Sure", "Cool", "Nice",
    "Camera", "Colors", "Also", "Well", "Super",
    "Spot", "Remember", "Almost", "Nearly", "Wanna",
    "Does", "Just", "Before", "Back", "Ready",
    # German function words (prepositions, pronouns, conjunctions, adverbs)
    "Auf", "Unter", "Meine", "Mein", "Dein", "Deine",
    "Ich", "Sie", "Wir", "Ihr", "Sein", "Seine",
    "Neben", "Hinter", "Vor", "Zwischen",
    "Aber", "Oder", "Und", "Weil", "Dass", "Wenn",
    "Nicht", "Kein", "Keine", "Hier", "Dort",
    "Noch", "Schon", "Auch", "Dann", "Jetzt",
    "Wohin", "Richtig", "Genau", "Perfekt", "Toll",
    "Sehr", "Gut",
}

# Map of informal articles to canonical form
ARTICLE_MAP = {
    "der": "der",
    "die": "die",
    "das": "das",
    "ein": "ein",
    "eine": "eine",
    "einen": "den",
    "einem": "dem",
    "einer": "der",
}

# Guess the definite article from the indefinite
INDEFINITE_TO_DEFINITE = {
    "ein": "der/das",   # ambiguous — needs context
    "eine": "die",
    "einen": "den",
    "einem": "dem",
    "einer": "der",
}


def extract_vocabulary_from_transcript(transcript: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Extract German nouns with articles from a session transcript.
    
    Returns a list of dicts: [{"lemma": "Stuhl", "article": "der"}, ...]
    """
    found: Dict[str, Dict[str, str]] = {}

    for turn in transcript:
        if turn.get("role") != "model":
            continue

        text = turn.get("text", "")

        # 1. Standard article + noun patterns
        for pattern in ARTICLE_PATTERNS:
            matches = re.findall(pattern, text)
            for article_raw, noun in matches:
                if noun in FALSE_POSITIVES or len(noun) < 3:
                    continue
                noun_lower = noun.lower()
                if noun_lower in found:
                    continue
                article = article_raw.lower()
                if article in ("der", "die", "das"):
                    definite = article
                elif article in INDEFINITE_TO_DEFINITE:
                    definite = INDEFINITE_TO_DEFINITE[article]
                else:
                    definite = "der"
                found[noun_lower] = {"lemma": noun, "article": definite}

        # 2. Contextual article patterns: "Der Stuhl," at sentence boundaries
        for pattern in CONTEXTUAL_ARTICLE:
            matches = re.findall(pattern, text)
            for article_raw, noun in matches:
                if noun in FALSE_POSITIVES or len(noun) < 3:
                    continue
                noun_lower = noun.lower()
                if noun_lower not in found:
                    found[noun_lower] = {"lemma": noun, "article": article_raw.lower()}

        # 3. Quoted standalone German words (no article nearby)
        for pattern in QUOTED_WORD_PATTERNS:
            matches = re.findall(pattern, text)
            for noun in matches:
                if noun in FALSE_POSITIVES or len(noun) < 3:
                    continue
                noun_lower = noun.lower()
                if noun_lower not in found:
                    # Try to find an article elsewhere in the same turn
                    article_match = re.search(
                        r'\b(der|die|das)\s+' + re.escape(noun), text, re.IGNORECASE
                    )
                    if article_match:
                        definite = article_match.group(1).lower()
                    else:
                        definite = "—"  # Unknown article, mark for later
                    found[noun_lower] = {"lemma": noun, "article": definite}

    return list(found.values())


def extract_vocabulary_from_all_sessions(sessions_dir: str = "data/sessions") -> List[Dict[str, str]]:
    """Scan all saved session transcripts and extract a combined vocabulary list."""
    all_vocab: Dict[str, Dict[str, str]] = {}

    if not os.path.isdir(sessions_dir):
        return []

    for fname in sorted(os.listdir(sessions_dir)):
        if not fname.endswith(".json"):
            continue
        fpath = os.path.join(sessions_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
            transcript = data.get("transcript", [])
            words = extract_vocabulary_from_transcript(transcript)
            for w in words:
                key = w["lemma"].lower()
                if key not in all_vocab:
                    all_vocab[key] = w
        except Exception:
            continue

    return list(all_vocab.values())


def update_learner_profile_vocabulary(
    profile_path: str = "data/learner_profile.json",
    sessions_dir: str = "data/sessions"
) -> Dict[str, Any]:
    """Extract vocabulary from all transcripts and merge into the learner profile."""
    extracted = extract_vocabulary_from_all_sessions(sessions_dir)

    # Load existing profile
    profile: Dict[str, Any] = {}
    if os.path.exists(profile_path):
        with open(profile_path, "r", encoding="utf-8") as f:
            profile = json.load(f)

    existing_vocab = profile.get("vocabulary", {})

    # Merge: only add new words, don't overwrite existing mastery data
    for word in extracted:
        key = word["lemma"].lower()
        if key not in existing_vocab:
            existing_vocab[key] = {
                "lemma": word["lemma"],
                "article": word["article"],
                "plural": "",
                "state": "introduced",
                "attempts": 1,
                "correct": 1,
                "consecutive_correct": 1,
                "last_latency_ms": 1500,
                "last_practiced": None,
            }

    profile["vocabulary"] = existing_vocab

    # Save
    os.makedirs(os.path.dirname(profile_path), exist_ok=True)
    with open(profile_path, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2, ensure_ascii=False)

    return profile


def get_recent_topics(sessions_dir: str = "data/sessions", max_sessions: int = 3) -> List[str]:
    """Extract brief topic summaries from recent session transcripts."""
    topics: List[str] = []

    if not os.path.isdir(sessions_dir):
        return topics

    files = sorted(
        [f for f in os.listdir(sessions_dir) if f.endswith(".json")],
        reverse=True
    )[:max_sessions]

    for fname in files:
        fpath = os.path.join(sessions_dir, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
            transcript = data.get("transcript", [])
            # Find first substantive AI turn
            for turn in transcript:
                if turn.get("role") == "model" and len(turn.get("text", "")) > 50:
                    # Extract first sentence as topic hint
                    first_sentence = turn["text"].split(".")[0].strip()
                    if len(first_sentence) > 20:
                        topics.append(first_sentence[:80])
                    break
        except Exception:
            continue

    return topics
