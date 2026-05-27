# Graph Report - ArgoPilot  (2026-05-25)

## Corpus Check
- 24 files · ~21,924 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 46 nodes · 86 edges · 13 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]

## God Nodes (most connected - your core abstractions)
1. `checkOrganicViolations()` - 5 edges
2. `runGeminiVisionPrompt()` - 5 edges
3. `runGeminiPrompt()` - 4 edges
4. `generateMockResponse()` - 3 edges
5. `organicGuardMiddleware()` - 2 edges
6. `fileToGenerativePart()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `runGeminiPrompt()` --calls--> `checkOrganicViolations()`  [INFERRED]
  server/services/geminiService.js → server/middleware/organicGuard.js
- `runGeminiVisionPrompt()` --calls--> `checkOrganicViolations()`  [INFERRED]
  server/services/geminiService.js → server/middleware/organicGuard.js

## Communities (13 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.4
Nodes (6): checkOrganicViolations(), organicGuardMiddleware(), fileToGenerativePart(), generateMockResponse(), runGeminiPrompt(), runGeminiVisionPrompt()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `checkOrganicViolations()` (e.g. with `runGeminiPrompt()` and `runGeminiVisionPrompt()`) actually correct?**
  _`checkOrganicViolations()` has 2 INFERRED edges - model-reasoned connections that need verification._