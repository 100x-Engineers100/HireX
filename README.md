# HireX — AI Resume Screener

> *Because manually reading 880 resumes is a great way to question your life choices.*

HireX is an internal AI-powered resume screening tool built for the **100x Engineers Launchpad** cohort hiring pipeline. Paste a job description, confirm the parsed criteria, approve a custom scoring rubric, and get a fully ranked candidate shortlist — in under 5 minutes.

No more spreadsheet hell. No more "let me just quickly skim through these 300 PDFs" at midnight.

---

## How It Works

```
You paste a Job Description
        |
        v
GPT-4o extracts structured criteria
(role title, skills, experience, domain)
        |
        v
You confirm + edit the criteria  <-- Step 1 Modal
        |
        v
GPT-4o generates a custom scoring rubric (4-5 dimensions)
        |
        v
You review + edit rubric weights  <-- Step 2 Modal
        |
        v
Engine pre-filters 880+ candidates from C4, C5, C6 cohort CSVs
        |
        v
For each shortlisted candidate:
  --> Fetches their resume PDF from Google Drive
  --> Extracts text via pdf-parse
  --> Scores them against your rubric via GPT-4o
        |
        v
Ranked results table with per-dimension evidence
        |
        v
One-click Excel export (.xlsx)
-- send to your hiring team, who will proceed
   to interview the 11th ranked candidate anyway --
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI Model | GPT-4o via OpenAI SDK |
| PDF Parsing | pdf-parse v1.1.1 |
| CSV Parsing | PapaParse |
| Excel Export | ExcelJS |
| Animations | Framer Motion |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Main UI — the whole show
│   ├── globals.css                   # Design tokens, animations, glassmorphism
│   ├── layout.tsx
│   └── api/
│       ├── parse-jd/                 # POST: JD text -> structured JDCriteria
│       ├── generate-rubric/          # POST: criteria -> scoring rubric
│       ├── score-candidate/          # POST: candidate + rubric -> ScoreResult
│       ├── fetch-resume/             # POST: Drive URL -> PDF buffer
│       └── cohort-data/              # GET: returns C4/C5/C6 CSV rows
├── components/
│   ├── JDConfirmModal.tsx            # Step 1: confirm parsed criteria
│   ├── RubricApprovalModal.tsx       # Step 2: review scoring rubric
│   └── ui/
│       └── animated-state-icons.tsx  # Framer Motion state icons
├── lib/
│   ├── csv-parser.ts                 # Parses cohort CSVs
│   ├── pre-filter.ts                 # Fast rule-based candidate filter
│   ├── column-map.ts                 # Maps messy Tally headers to clean keys
│   ├── pdf-fetcher.ts                # Fetches PDFs from Google Drive
│   ├── pdf-parser.ts                 # Extracts text from PDF buffers
│   ├── llm.ts                        # OpenAI calls + score calculation
│   ├── prompts.ts                    # All LLM prompt builders
│   ├── excel-generator.ts            # Exports results to .xlsx
│   └── utils.ts                      # cn() helper
├── types.ts                          # Shared TypeScript interfaces
public/
└── data/
    ├── c4.csv                        # Cohort 4 — 282 candidates
    ├── c5.csv                        # Cohort 5 — 334 candidates
    └── c6.csv                        # Cohort 6 — 264 candidates
```

---

## The Pipeline — In Detail

### Stage 1 — Parse JD
The raw job description is sent to GPT-4o-mini which extracts:
- Role title
- Minimum years of experience
- Required domain (`software` / `product` / `design` / `data` / `ops` / `other`)
- Required skills (max 8, most important only)
- Whether prior work experience is required
- Whether it's a technical role

You get to review and edit everything before proceeding. The AI is good at this, but it has read approximately 10 million JDs and occasionally gets creative with "5+ years of experience with a 3-year-old framework."

### Stage 2 — Generate Rubric
Based on confirmed criteria, GPT-4o generates 4–5 custom scoring dimensions with:
- A name and description specific to the role
- Scoring anchors at levels 1 (weak), 3 (moderate), and 5 (strong)
- Weights that must sum to exactly 1.0

**Explicitly banned dimensions:**
`"adaptability"`, `"learning mindset"`, `"passion"`, `"collaboration"`, `"communication"`, `"culture fit"`

These cannot be verified from a resume. The rubric scores what the resume can actually prove — specific skills, tools, project complexity, domain depth, experience years. Vibes are not evidence.

### Stage 3 — Pre-Filter
Before any LLM calls, a fast rule-based filter removes candidates who definitively don't match:
- Wrong domain
- Below minimum experience threshold
- Missing required skills (checked against form responses + professional journey)

This typically reduces 880 candidates to ~300–400 for a software role — saving time, API credits, and the quiet despair of scoring someone applying for a backend role with only Canva experience.

### Stage 4 — Score
Each shortlisted candidate goes through:
1. Resume PDF fetched from Google Drive URL in their form submission
2. Text extracted via `pdf-parse`
3. GPT-4o scores each rubric dimension with specific evidence
4. Server-side weighted score calculation *(we don't trust LLM arithmetic)*

```
overall_score = sum(dimension_score * dimension_weight)  // scaled to /10
```

**Recommendation thresholds:**
- `>= 7.0` → **Interview**
- `>= 4.0` → **Maybe**
- `< 4.0` → **Reject**

The prompt explicitly instructs the model: *"absence of evidence is not evidence of inability."* A blank resume section scores 2 minimum — not 1. People forget to write things down; that doesn't make them incompetent.

### Stage 5 — Results
A ranked table with every scored candidate showing:
- Overall score (colour-coded green / yellow / red)
- Recommendation tag (Interview / Maybe / Reject)
- Expandable row with per-dimension breakdown: score, evidence pulled from the resume, reasoning
- One-click Excel export for sharing with the team

---

## Running Locally

### Prerequisites
- Node.js 18+
- An OpenAI API key with GPT-4o access

### Setup

```bash
# Clone the repo
git clone https://github.com/100x-Engineers100/HireX.git
cd HireX

# Install dependencies
npm install

# Create your env file
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
OPENAI_API_KEY=sk-...    # Required. No key, no candidates scored.
```

---

## Cohort Data

| Cohort | Candidates | File |
|---|---|---|
| C4 | 282 | `public/data/c4.csv` |
| C5 | 334 | `public/data/c5.csv` |
| C6 | 264 | `public/data/c6.csv` |
| **Total** | **880** | |

> C3 data does not exist. Please stop asking.

---

## Known Gotchas

**pdf-parse must stay at v1.1.1.**
v2 switched to a class-based API and is not callable the same way. Upgrading will silently break resume fetching. Don't do it.

**CSV headers are full Tally form questions.**
They look like *"What is your current designation and company name (if applicable)?"*. The `column-map.ts` file uses fuzzy `startsWith` matching to normalize them. Don't rename the CSVs or change the column order.

**PapaParse duplicate header warnings** are expected and harmless.
Tally exports repeated column names. The column map handles deduplication.

**Vercel 30s edge timeout.**
Scoring is chunked sequentially with a 300ms delay between candidates to avoid overwhelming the edge runtime. The `/api/score-candidate` and `/api/fetch-resume` routes use Node.js runtime for extended limits.

**Candidates with restricted Google Drive PDFs** will return a fetch error and score 0. Their fault, not ours.

**Image-only PDFs** (scanned documents) return empty text and score poorly.
Submitting a scanned PDF for a software engineering role in 2025 is, in itself, a strong signal.

---

## Design System

| Property | Value |
|---|---|
| Background | `#000000` — pure black, no compromise |
| Primary Accent | `#F96846` coral |
| Display Font | Space Grotesk |
| Mono Font | JetBrains Mono |
| Style | Dark glassmorphism — floating navbar, glow blobs, shimmer buttons |

---

## FAQ

**Q: Why not just use a spreadsheet?**
We did. For three cohorts. It took days, introduced human inconsistency, and made everyone involved question their relationship with Excel. HireX does it in 4 minutes with consistent criteria.

**Q: Can the AI be biased?**
The rubric is evidence-based and role-specific. Soft-skill dimensions that can't be verified from a resume are banned. That said — a poorly written JD produces a poorly calibrated rubric. Garbage in, garbage out. Write a real job description.

**Q: What happens if a candidate's resume is a photo of a printed PDF?**
They score poorly. This is consistent with expectations.

**Q: Does this replace human recruiters?**
It replaces the part where a human spends 3 days doing Ctrl+F on 880 rows. The actual hiring judgment — the conversation, the gut check, the "wait, their GitHub is actually incredible" moment — is still yours.

**Q: Why is it called HireX?**
The X stands for 10x efficiency. Or it was the only name that didn't sound like a healthcare startup. Jury's still out.

---

## Built by

**Vishal Sharma** for the 100x Engineers Launchpad hiring team.

*If you're a candidate who found this repo: hi. Yes, the AI scored you. No, you cannot submit a PR to adjust the rubric weights in your favour.*

---

## License

Internal tool. Not for public distribution.

If you found this repo through GitHub search — congratulations, you've already passed the curiosity filter. That's worth something.
