# AGENTS.md — Kemureco

## Purpose
Kemureco is a web platform for shisha users to record, manage, and receive recommendations for flavors, mixes, and sessions.

---

## Absolute Rules (Highest Priority)
- All outputs and comments must be written in **Japanese**
- **No destructive changes**
- Maintain **idempotent logic**
- If something is unclear, **ask before assuming**
- After implementation, confirm **HTTP 200 at http://localhost:3000**

---

## Development Flow
- New features or topics **must branch from `main`**
- Delete branches after merging into `main`
- When specifications change, update `doc/specification.md`

---

## Design & Reference Rules
- Frontend design must follow `doc/SKILL.md`
- Prefer **shadcn/ui** for UI implementation
- Authorization and restrictions must be based on **Supabase RLS**

---

## Technical Stack (Fixed)
- Frontend: Next.js 14 (App Router) + TypeScript
- Backend: Supabase (Auth / RLS / Edge Functions)
- Deployment: Cloudflare Pages

---

## LOG.md Policy (Context & Token Efficiency)
- `LOG.md` is the **single source of truth** for project progress and decisions
- At the **start of a new Codex session**, treat `LOG.md` as already read unless stated otherwise
- Do **NOT** assume missing context; request a specific excerpt if needed
- Only **newly appended sections or diffs** of `LOG.md` will be provided in subsequent sessions
- Any implementation, decision, or behavior change **must be appended to `LOG.md`**
- Prefer concise, structured logs to minimize context size

---

## Session Handover Rules
- Do not re-read or request the entire `LOG.md` unless explicitly instructed
- If context is insufficient, ask:
  - which section
  - which timeframe
  - or which decision
- Ensure changes are reproducible from `LOG.md` alone

---

## Priority Order for References
1. This `AGENTS.md`
2. `LOG.md`
3. `doc/specification.md`
4. Source code

