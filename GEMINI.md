# MEKO Context & Memory Protocol (Always Active)

### Active Datapack
- **Datapack ID**: `9cbd56ea-9eb5-4dd6-a9e6-9858b66f426d`
- **Datapack Name**: `meko_default_datapack`
- **Owner**: Kartik Baliyan (`kartikbaliyan00004@gmail.com`)
- **Agent ID**: `gemini:hackcbs`

### Context Storage Rules
1. **Store Commands & Context**: For every significant user instruction, technical decision, architecture change, requirement, or preference, persist it to MEKO:
   ```bash
   node scripts/meko.js save "<context / durable fact>"
   ```
   Or record the turn to conversation history:
   ```bash
   node scripts/meko.js message "<user command>" "<summary of actions/response>"
   ```
2. **Context Recall**: When answering questions about previous decisions, project context, or user instructions, query MEKO:
   ```bash
   node scripts/meko.js search "<query>"
   # or hybrid context search:
   node scripts/meko.js context "<query>"
   ```
3. **Session Persistence**:
   - Project session state is maintained in `.agents/meko-session.json`.
   - Datapack pin is registered in `~/.claude/meko-capture/pin-gemini_hackcbs.json`.

