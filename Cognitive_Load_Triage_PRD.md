# Product Requirements Document

## Cognitive Load Triage

**Tagline:** Dump everything. Decide one thing.

| Field | Detail |
|---|---|
| Hackathon | USAII Global AI Hackathon 2026 |
| Track | Undergraduate |
| Challenge | Challenge Brief 3 — Build the "Second Brain" for Real Life |
| Direction | A — Life Decision Simulator (reframed as decision-moment triage) |
| Build window | June 14–21, 2026 |
| Document version | 1.0 |
| Status | Final-day build reference |

---

## 1. Overview & Problem Statement

Modern overload isn't an information problem — it's a sorting problem. Students and early professionals carry a tangled mix of real decisions, half-finished worries, simple tasks, and background anxiety, and treat all of it with the same mental urgency. That's what causes burnout and stalled progress, not lack of data.

Most existing tools either oversimplify (pros/cons lists) or overwhelm (generic productivity dashboards). Neither tells a person what *kind* of thought they're actually dealing with — which is the real bottleneck.

**Cognitive Load Triage** is a second brain that doesn't think *for* the user. It takes an unstructured brain dump and sorts each thought into the right category, then surfaces exactly one decision the user can act on right now.

---

## 2. Goals & Non-Goals

**Goals**
- Take messy, unstructured input and classify it accurately into four actionable categories.
- Surface a single highest-leverage decision instead of a flat list.
- Move the user from confusion → clarity → one concrete action.
- Demonstrate a clean, judge-legible AI architecture: structured reasoning, not a single LLM call doing everything.

**Non-Goals (MVP)**
- The tool does not make decisions for the user.
- The tool does not track long-term outcomes or provide therapy-adjacent advice.
- The tool does not attempt to resolve "needs more info" items automatically — it only names the missing piece.

---

## 3. Target User & Persona

**Primary user:** A college student, recent grad, or early professional facing simultaneous, unrelated sources of mental load — a mix of real decisions, vague tasks, and background worry — with no clear sense of which to act on first.

**Representative scenario (from user testing input):**
> "worried about the bajaj interview, also need to decide if I drop DL elective, mom wants me to visit this weekend, should I learn rust, forgot to email professor about extension, feels like I'm behind on everything"

This single dump contains a real decision, a task, a vague aspiration, an open obligation, and pure anxiety — all in one breath. That mix is the product's actual target, not any single item in isolation.

---

## 4. Core Concept / Value Proposition

> "Not every thought in your head is a decision. Dump it. Sort it. Decide one thing."

The product's differentiator is **separation of concerns**: language understanding (LLM) decides *what kind* of thought something is; a deterministic formula decides *which one matters most right now*; generative AI is only used to sharpen the one follow-up question that moves that single item forward. No single AI call is asked to do everything — which is also the direct answer to "why does this need AI, and why not just an LLM wrapper."

---

## 5. User Flow

**Step 1 — Dump**
User types or voice-records a stream-of-consciousness brain dump. No structure required.

**Step 2 — Triage**
The system parses the dump into discrete thought units and classifies each into one of four buckets:

| Bucket | Definition |
|---|---|
| Decide now | A real decision with enough information to act on today |
| Needs more info | A decision blocked on a specific, nameable missing piece |
| Task, not a decision | Needs doing, requires no reasoning |
| Let go / not yours right now | Background anxiety with no actionable next step at this moment |

**Step 3 — Surface one decision moment**
Among "decide now" items, the system ranks by a deterministic priority score and selects the single highest-leverage item. It then generates one sharpened follow-up question to move that specific decision forward.

**Step 4 — Output**
A four-bucket triage board, plus one highlighted card: the top-priority decision and a named next step (e.g. *"You have enough information to decide on the DL elective today — here's the one factor you haven't weighed yet."*).

**The decision moment (explicit, for judges):**
*After dumping their thoughts, the user decides: which one thing do I act on right now?*

---

## 6. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR1 | Accept free-text input via typing | MVP |
| FR2 | Accept voice input via Web Speech API, transcribed client-side | MVP |
| FR3 | Segment raw input into discrete thought units (LLM) | MVP |
| FR4 | Run distress/crisis-language safety scan on every unit before classification | MVP |
| FR5 | Classify each non-flagged unit into one of 4 buckets, with urgency/impact/reversibility scores (LLM, structured JSON output) | MVP |
| FR6 | Compute deterministic priority score for all "decide now" items | MVP |
| FR7 | Generate one sharpened follow-up question for the top-ranked item (LLM) | MVP |
| FR8 | Render four-bucket board with the top decision highlighted | MVP |
| FR9 | Allow manual recategorization of any item (tap/swipe) | MVP |
| FR10 | Persist session history locally (IndexedDB) | Stretch |
| FR11 | Detect recurring flagged/avoided items across sessions | Stretch |
| FR12 | Daily prompt nudge (Web Push) | Stretch |

---

## 7. AI Architecture
*(Maps directly to the Devpost "AI Architecture Explanation" field: Inputs → AI capability → Processing → Outputs)*

**Inputs:** Unstructured text or voice-transcribed brain dump (one or more thoughts in a single entry).

**AI capability used:**
- NLP segmentation and classification (LLM, structured output)
- Narrow generative AI for one follow-up question (LLM)
- *Not* used for: ranking, prioritization, or any final decision

**Processing pipeline:**
1. Segmentation (LLM) — splits raw input into atomic thought units
2. Safety check (deterministic, rule-based) — runs **before** the AI classifier; flagged units bypass AI sorting entirely
3. Classification (LLM) — sorts remaining units into 4 buckets with urgency / impact / reversibility scores
4. Priority ranking (deterministic formula) — `score = urgency × impact × (1 / reversibility)`, computed in plain code, not the LLM
5. Follow-up generation (LLM) — one sharpened question, scoped only to the top-ranked item

**Outputs:** Four-bucket triage board + one highlighted "today's decision" card with a named next step.

**Why LLM vs. a rules engine (judge-facing justification):**
Classification genuinely requires language understanding — "I should learn Rust" and "I need to decide if I drop DL elective" are structurally similar sentences but different categories (vague aspiration vs. real decision). Keyword matching cannot reliably tell these apart. The ranking and safety-gating steps, by contrast, are deliberately *not* delegated to the LLM — they're deterministic and auditable, which is itself part of the system's design argument.

---

## 8. Technical Architecture & Stack (free-tier only)

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React + Vite, PWA manifest | Free |
| Voice capture | Web Speech API (browser-native) | Free |
| API key protection | Cloudflare Workers or Vercel Edge Functions as proxy | Free tier |
| LLM | Groq API (Llama 3.3 70B) or Gemini 2.0 Flash | Free tier |
| Safety pre-filter | Plain regex/keyword check, server-side in the Worker | Free |
| Priority ranking | Plain function in the Worker/backend | Free |
| On-device storage | IndexedDB (`idb` library) | Free |
| Deployment | Vercel / Netlify free tier, or Streamlit Community Cloud for a faster non-PWA build | Free |
| Optional stretch | ChromaDB + sentence-transformers (local) for cross-session pattern memory | Free |

**Fallback option:** Ollama + a small local model (e.g. Llama 3.2 3B / Phi-3-mini) for a fully offline demo with zero external API dependency, if free-tier rate limits become a concern during live demo recording.

---

## 9. Data Requirements & Disclosure

- No real user data is required for the MVP. All test scenarios used in development and demo are synthetic, written to represent realistic brain-dump content (mixed decisions, tasks, and worries).
- No personally identifying information is stored remotely; session data lives in local IndexedDB only.
- No external dataset or labor-market/cost-of-living data is required for this direction, since the tool reasons over user-provided text rather than comparing external paths.

---

## 10. Responsible AI Requirements

**1. Realistic risk:** The system could misclassify something serious (e.g. a mental-health-adjacent worry) into "let go," which would be actively harmful — telling someone to deprioritize something that needs attention.

**2. Concrete mitigation:** A deterministic, rule-based safety layer runs **before** any AI classification. Anything matching distress-adjacent language is never auto-sorted into "let go" — it is flagged directly for the user with no AI judgment applied. This is enforced server-side so it cannot be bypassed client-side.

**3. Human-in-the-loop:** The AI decides which *bucket* a thought belongs to — it never decides the actual content of any decision. The user can recategorize any item with one tap or swipe. What to actually do about the flagged item, the elective, or the interview is always left to the user; the AI's only job is reducing noise so the real decision is visible.

---

## 11. Success Metrics (mapped to judging rubric)

| Dimension | Weight | How this PRD addresses it |
|---|---|---|
| Problem Understanding | 20% | Section 1 — names the actual problem (sorting, not information) with a concrete user scenario |
| AI Reasoning | 30% | Section 7 — explicit LLM vs. deterministic split, justified per step |
| Solution Design | 25% | Sections 5–8 — coherent input → reasoning → output pipeline |
| Impact & Insight | 15% | Section 4 — single decision moment, not a generic productivity dashboard |
| Responsible AI | 10% | Section 10 — named risk, concrete mitigation, explicit human-in-loop boundary |

---

## 12. MVP Scope vs. Stretch Goals

**MVP (must ship for submission):** FR1–FR9 — full pipeline, text + voice input, four-bucket board, one highlighted decision, manual recategorization.

**Stretch (only if time remains):** FR10–FR12 — local history, recurring-pattern detection, push nudges.

---

## 13. Out of Scope

- Long-term outcome tracking ("did this decision work out?")
- Any AI-generated final recommendation or verdict
- Integration with external calendars, task managers, or productivity tools
- Multi-user / shared boards

---

## 14. Risks & Open Questions

| Risk | Notes |
|---|---|
| Free-tier LLM rate limits during live demo | Pre-test the full flow once; record a clean take rather than relying on a live call if quota is tight |
| Misclassification edge cases (vague items that could fit two buckets) | Acceptable for MVP — manual recategorization (FR9) is the explicit safety valve |
| Voice transcription accuracy on accented/code-mixed speech | Text input remains the reliable fallback path |

**Open question:** Should the safety keyword list be shown to judges as part of the architecture explanation, or only described at the pattern level in the submission? *(Recommendation: describe the mechanism and its function in the submission; do not publish the literal keyword list.)*

---

## 15. Final-Day Build Plan
*(Build window closes June 21, 2026 — today)*

| Time block | Focus |
|---|---|
| Hour 1 | Wire Groq/Gemini API key behind a Cloudflare Worker or Vercel Edge proxy; confirm structured JSON output works for segmentation + classification |
| Hour 2 | Build the safety pre-filter (regex layer) and deterministic ranking function; test against the sample brain dump in Section 3 |
| Hour 3 | Build the four-bucket UI (Streamlit for speed, or React if already scaffolded); wire it to the pipeline output |
| Hour 4 | Add the top-decision card + follow-up question generation; add manual recategorization (tap/swipe) |
| Hour 5 | End-to-end test with 2–3 realistic brain dumps; fix misclassification edge cases |
| Hour 6 | Record the 3–5 minute pitch video (problem + user, how the AI works, live walkthrough, responsible AI choice); finalize Devpost fields using Sections 7, 10, 11 above |

---

*End of document.*
