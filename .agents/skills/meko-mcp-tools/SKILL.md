---
name: meko-mcp-tools
description: Behavioral guide for AI agents using Meko MCP tools. Triggers when calling MCP tools, storing memories, persisting knowledge, managing datapacks, or searching shared knowledge bases through Meko.
license: Apache-2.0
metadata:
  author: Meko
  version: "3.5.0"
  tags: mcp, tools, datapack, memory, conversation, rag, meko
---

# Meko MCP Tools — Agent Behavioral Guide

Meko is agent-native data infrastructure that enables continuous learning from context windows through collective memory and shared knowledge.

## Project Meko Configuration
- **Datapack Name**: `meko_default_datapack`
- **Pinned Datapack ID**: `18666721-2dd5-4d14-8e0d-bbbe30a3287b`
- **Server URL**: `https://mcp.mekodata.ai/mcp`
- **Agent ID Convention**: `antigravity:hackcbs`

## Tool Calling Conventions

### 1. Recall prior context (`context_search`)
```
context_search(
  query="<user preferences, decisions, architecture>",
  agent_id="antigravity:hackcbs",
  conversation_id="<active_conversation_id>",
  datapack_id="18666721-2dd5-4d14-8e0d-bbbe30a3287b"
)
```

### 2. Search shared knowledge base (`knowledgebase_search`)
```
knowledgebase_search(
  query="<query>",
  datapack_id="18666721-2dd5-4d14-8e0d-bbbe30a3287b",
  conversation_id="<active_conversation_id>",
  limit=10
)
```

### 3. Store explicit durable memory (`memory_add`)
Only for explicit "remember this" requests or critical facts:
```
memory_add(
  text="<fact to remember>",
  agent_id="antigravity:hackcbs",
  conversation_id="<active_conversation_id>",
  datapack_id="18666721-2dd5-4d14-8e0d-bbbe30a3287b"
)
```
