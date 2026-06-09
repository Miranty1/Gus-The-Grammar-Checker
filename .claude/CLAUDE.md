# Claude Code Instructions

## Skills

This project has a set of skills in `.claude/skills/`. Read the relevant skill file **before** starting any task that matches its description.

### User Skills

| Skill | File | When to use |
|---|---|---|
| **impeccable** | `.claude/skills/user/impeccable.md` | Any UI work — designing, redesigning, auditing, or polishing frontend interfaces, components, layouts, typography, color, spacing, motion |
| **emil-design-eng** | `.claude/skills/user/emil-design-eng.md` | Component polish, animation decisions, and making UI feel exceptional — read alongside impeccable for high-quality frontend work |
| **grill-me** | `.claude/skills/user/grill-me.md` | When asked to stress-test a plan, design, or architecture — interview the user relentlessly until reaching shared understanding |
| **handoff** | `.claude/skills/user/handoff.md` | When asked to compact the conversation or create a handoff document for another agent |

### Public Skills

| Skill | File | When to use |
|---|---|---|
| **docx** | `.claude/skills/public/docx.md` | Creating, reading, editing, or manipulating Word (.docx) files |
| **pdf** | `.claude/skills/public/pdf.md` | Creating, filling, merging, splitting, or watermarking PDF files |
| **pdf-reading** | `.claude/skills/public/pdf-reading.md` | Reading or extracting content from existing PDF files |
| **pptx** | `.claude/skills/public/pptx.md` | Any task involving PowerPoint (.pptx) files |
| **xlsx** | `.claude/skills/public/xlsx.md` | Any task involving spreadsheet files (.xlsx, .csv, .tsv) |
| **frontend-design** | `.claude/skills/public/frontend-design.md` | Aesthetic direction, typography, and visual design decisions for new UI |
| **file-reading** | `.claude/skills/public/file-reading.md` | Reading uploaded files whose content is not yet in context |
| **product-self-knowledge** | `.claude/skills/public/product-self-knowledge.md` | Any response that would include specific facts about Anthropic's products (Claude API, Claude Code, Claude.ai) |

## Usage

When a task matches a skill above, read the skill file first:
```
read_file(".claude/skills/user/impeccable.md")
```
Then proceed with the task following the skill's guidance.
