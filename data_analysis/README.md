# Data Analysis Methodology

This directory contains a static prototype that renders JSON‑LD artifacts produced by a structured, schema‑driven AI workflow. The goal is to transform unstructured inputs (raw transcripts and whiteboard photos) into consistent JSON‑LD using local schemas, then reconcile multiple viewpoints into a final data product.

## Overview
- Inputs: raw transcript text, timestamped transcript, and whiteboard images (photos).
- Schemas: JSON‑LD shapes in `schemas/*.json` and prompts under `schemas/prompts/` guide AI to emit structured output.
- Outputs: staged JSON‑LD files in `data/` representing transcript, speakers, cleaned transcript, two whiteboard analyses, a reconciled whiteboard, and the final dataset.

## Directory Layout
- `raw_data/`
  - `transcript_export.txt`, `transcript_with_timestamps.txt`, `audio.m4a`
  - `board_1.jpg`, `board_2.jpg` (whiteboard images)
- `schemas/`
  - `transcript.schema.gemini.json`, `author.schema.gemini.json`
  - `whiteboard.schema.openai.json`, `data.schema.openai.json`, `data.schema.gemini.json`
  - `prompts/` prompts driving each stage:
    - `transcript.gemini.txt`, `authors.gemini.txt`, `transcript-clean.gemini copy.txt`
    - `whiteboard.openai.txt`, `reconciling.whiteboard.openai.txt`, `data.gemini.txt`
- `data/` (generated)
  - `transcript.jsonld`, `speakers.jsonld`, `transcript.clean.jsonld`
  - `whiteboard.transcript.jsonld`, `whiteboard.images.jsonld`, `whiteboard.jsonld`
  - `data.jsonld` (final data output)

## End‑to‑End Pipeline
1) Raw transcript → `transcript.jsonld`
- Source: `raw_data/transcript_export.txt` (or `transcript_with_timestamps.txt`).
- Prompt: `schemas/prompts/transcript.gemini.txt`
- Schema: `schemas/transcript.schema.gemini.json`
- Result: `data/transcript.jsonld` with `@context`, `@type`, transcript metadata, participants/authors, and utterances (optionally timestamped). Include provenance (e.g., `prov:wasDerivedFrom`).

2) Extract authors → `speakers.jsonld`
- Input: `data/transcript.jsonld`
- Prompt: `schemas/prompts/authors.gemini.txt`
- Schema: `schemas/author.schema.gemini.json`
- Result: `data/speakers.jsonld` listing unique people/organizations with stable IDs and aliases.

3) Authors + transcript → `transcript.clean.jsonld`
- Inputs: `data/transcript.jsonld`, `data/speakers.jsonld`
- Prompt: `schemas/prompts/transcript-clean.gemini copy.txt`
- Goal: normalize speaker names, fix obvious transcription errors, harmonize timestamps, and attach speaker references using IDs from `speakers.jsonld`.
- Result: `data/transcript.clean.jsonld` preserving original content and ordering, with corrected speaker attribution and light cleanup.

4) Cleaned transcript → whiteboard analysis from text
- Input: `data/transcript.clean.jsonld`
- Prompt: `schemas/prompts/whiteboard.openai.txt`
- Schema: `schemas/whiteboard.schema.openai.json`
- Result: `data/whiteboard.transcript.jsonld` representing a structured “whiteboard” view: nodes (entities/ideas), edges (relations), themes, assumptions, decisions, open questions, and provenance.

5) Whiteboard images → whiteboard analysis from vision
- Inputs: `raw_data/board_1.jpg`, `raw_data/board_2.jpg`
- Prompt: `schemas/prompts/whiteboard.openai.txt` (vision‑enabled model)
- Schema: `schemas/whiteboard.schema.openai.json`
- Steps: OCR and layout understanding → extract text boxes, connectors, clusters → map to nodes/edges per schema.
- Result: `data/whiteboard.images.jsonld` with the same schema as step 4 and image provenance.

6) Reconcile whiteboards → `whiteboard.jsonld`
- Inputs: `data/whiteboard.transcript.jsonld`, `data/whiteboard.images.jsonld`
- Prompt: `schemas/prompts/reconciling.whiteboard.openai.txt`
- Method: merge nodes by label/aliases, deduplicate via `schema:sameAs` or custom `sameAs` fields, unify edges, keep conflicting claims annotated, and carry forward full provenance (`prov:wasDerivedFrom` both sources).
- Result: `data/whiteboard.jsonld` — a single, reconciled “whiteboard” document.

7) Final whiteboard + cleaned transcript → `data.jsonld`
- Inputs: `data/whiteboard.jsonld`, `data/transcript.clean.jsonld`
- Prompt: `schemas/prompts/data.gemini.txt`
- Schema: `schemas/data.schema.openai.json` or `schemas/data.schema.gemini.json`
- Output: `data/data.jsonld` — consolidated entities, relationships, events/timeline, topics, and references that the front‑end can render. Include links back to source utterances and whiteboard nodes for traceability.

## JSON‑LD & Schema Notes
- Always include `@context` and `@type` from the relevant schema file.
- Emit stable IDs (`@id`) for people, entities, and nodes to support reconciliation and cross‑refs.
- Preserve provenance throughout with fields like `prov:wasDerivedFrom`, source file names, timestamps, and model metadata.
- Validate shape against the referenced schema before accepting an artifact as the next stage’s input.

## File Naming Conventions
- Transcript: `data/transcript.jsonld`
- Speakers: `data/speakers.jsonld`
- Cleaned transcript: `data/transcript.clean.jsonld`
- Whiteboard (from transcript): `data/whiteboard.transcript.jsonld`
- Whiteboard (from images): `data/whiteboard.images.jsonld`
- Reconciled whiteboard: `data/whiteboard.jsonld`
- Final dataset: `data/data.jsonld`

## Reproducibility
For each artifact, store the prompt, model, and parameters used (temperature, top‑p, etc.). Prompts are kept under `schemas/prompts/`. Include a small metadata block alongside outputs (or inside JSON‑LD) noting model name/version and date generated.

## Local Preview
This prototype is static. Serve with any static server and open `index.html`:

```bash
npx http-server data_analysis
```

Then inspect the staged JSON‑LD under `data/` as the UI renders each step.
