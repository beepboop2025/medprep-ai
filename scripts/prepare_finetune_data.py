"""
Convert MedMCQA JSONL to chat-format JSONL for SFT fine-tuning.

Output format (ChatML-style):
{
  "messages": [
    {"role": "system", "content": "You are a medical exam tutor..."},
    {"role": "user", "content": "<question + options>"},
    {"role": "assistant", "content": "<answer + explanation>"}
  ]
}
"""
import json
import random
import os

SYSTEM_PROMPT = (
    "You are MedPrep AI, an expert medical exam tutor. "
    "When given a multiple-choice question, analyze each option carefully, "
    "provide the correct answer, and explain the reasoning. "
    "If the question involves a clinical scenario, walk through the "
    "differential diagnosis. Be concise but thorough."
)

OPTION_MAP = {1: "A", 2: "B", 3: "C", 4: "D"}

def format_question(r: dict) -> str:
    """Format a MedMCQA record into a user prompt."""
    parts = [r["question"], ""]
    parts.append(f"A) {r['opa']}")
    parts.append(f"B) {r['opb']}")
    parts.append(f"C) {r['opc']}")
    parts.append(f"D) {r['opd']}")

    subject = r.get("subject_name", "")
    topic = r.get("topic_name", "")
    if subject and subject != "Unknown":
        meta = f"[Subject: {subject}"
        if topic and topic != "None":
            meta += f" | Topic: {topic}"
        meta += "]"
        parts.append(f"\n{meta}")

    return "\n".join(parts)


def format_answer(r: dict) -> str:
    """Format the correct answer + explanation."""
    cop = r.get("cop", 1)
    letter = OPTION_MAP.get(cop, "A")
    option_key = {1: "opa", 2: "opb", 3: "opc", 4: "opd"}.get(cop, "opa")
    answer_text = r.get(option_key, "")

    parts = [f"**Correct Answer: {letter}) {answer_text}**"]

    exp = r.get("exp")
    if exp and exp != "None" and exp.strip():
        parts.append(f"\n**Explanation:** {exp.strip()}")

    return "\n".join(parts)


def convert_file(input_path: str, output_path: str, include_no_exp: bool = True):
    """Convert a JSONL file to chat-format JSONL."""
    records = []
    skipped = 0

    with open(input_path) as f:
        for line in f:
            r = json.loads(line)

            # Skip if missing critical fields
            if not r.get("question") or not r.get("cop"):
                skipped += 1
                continue

            has_exp = r.get("exp") and r["exp"] != "None" and r["exp"].strip()
            if not include_no_exp or has_exp or random.random() < 0.3:
                # Keep all with explanations, sample 30% without
                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": format_question(r)},
                    {"role": "assistant", "content": format_answer(r)},
                ]
                records.append({
                    "messages": messages,
                    "subject": r.get("subject_name", "Unknown"),
                    "id": r.get("id", ""),
                })

    # Shuffle for training
    random.seed(42)
    random.shuffle(records)

    with open(output_path, "w") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"  {input_path} → {output_path}: {len(records)} records ({skipped} skipped)")
    return len(records)


if __name__ == "__main__":
    os.makedirs("/Users/mrinal/medprep-ai/data", exist_ok=True)

    print("Converting MedMCQA to fine-tuning format...\n")

    train_n = convert_file(
        "/Users/mrinal/Downloads/data/train.json",
        "/Users/mrinal/medprep-ai/data/train_chat.jsonl",
        include_no_exp=True,
    )

    val_n = convert_file(
        "/Users/mrinal/Downloads/data/dev.json",
        "/Users/mrinal/medprep-ai/data/val_chat.jsonl",
        include_no_exp=True,
    )

    print(f"\nDone! Train: {train_n}, Val: {val_n}")

    # Print a sample
    print("\n--- Sample Record ---")
    with open("/Users/mrinal/medprep-ai/data/train_chat.jsonl") as f:
        sample = json.loads(f.readline())
    for msg in sample["messages"]:
        print(f"\n[{msg['role'].upper()}]")
        print(msg["content"])
