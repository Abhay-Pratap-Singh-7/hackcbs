const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const STATE_PATH = path.join(ROOT_DIR, '.agents', 'meko-session.json');

// Read API Key from .env
function getApiKey() {
  if (process.env.MEKO_API_KEY) return process.env.MEKO_API_KEY;
  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    const match = envContent.match(/MEKO_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match) return match[1].trim();
  }
  return 'mko_tkn_v7jd2ro3ilhglssqho727jauvxmbucfj5ebd5pi';
}

const API_KEY = getApiKey();
const DEFAULT_DATAPACK_ID = '9cbd56ea-9eb5-4dd6-a9e6-9858b66f426d'; // meko_default_datapack
const AGENT_ID = 'gemini:hackcbs';

function getSessionState() {
  if (fs.existsSync(STATE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    } catch (e) {}
  }
  return {};
}

function saveSessionState(state) {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function callMcpTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 100000),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    });

    const req = https.request('https://mcp.mekodata.ai/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'meko-agent-client/1.0',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const lines = data.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              return resolve(JSON.parse(line.slice(6)));
            } catch (e) {}
          }
        }
        resolve({ raw: data });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function ensureConversation() {
  let state = getSessionState();
  if (state.conversation_id) {
    return state.conversation_id;
  }

  const res = await callMcpTool('conversation_create', { agent_id: AGENT_ID });
  let convId = '';
  try {
    const parsed = JSON.parse(res.result.content[0].text);
    convId = parsed.id || parsed.conversation_id;
  } catch (e) {
    console.error('Failed to parse conversation_create:', res);
  }

  if (convId) {
    state.conversation_id = convId;
    state.datapack_id = DEFAULT_DATAPACK_ID;
    state.agent_id = AGENT_ID;
    state.created_at = new Date().toISOString();
    saveSessionState(state);
  }
  return convId;
}

async function main() {
  const [,, cmd, ...rest] = process.argv;
  const input = rest.join(' ').trim();

  if (!cmd || cmd === 'help') {
    console.log(`Meko CLI Utility
Usage:
  node scripts/meko.js status
  node scripts/meko.js save <text>
  node scripts/meko.js message <role> <content>
  node scripts/meko.js search <query>
  node scripts/meko.js context <query>
  node scripts/meko.js datapacks
`);
    return;
  }

  if (cmd === 'status') {
    const state = getSessionState();
    console.log(JSON.stringify({
      apiKeyConfigured: !!API_KEY,
      datapackId: state.datapack_id || DEFAULT_DATAPACK_ID,
      agentId: AGENT_ID,
      conversationId: state.conversation_id || '(none)'
    }, null, 2));
    return;
  }

  const conversationId = await ensureConversation();

  if (cmd === 'save') {
    if (!input) {
      console.error('Error: specify text to save');
      process.exit(1);
    }
    const res = await callMcpTool('memory_add', {
      datapack_id: DEFAULT_DATAPACK_ID,
      agent_id: AGENT_ID,
      conversation_id: conversationId,
      text: input
    });
    console.log(JSON.stringify(res, null, 2));
  } else if (cmd === 'message') {
    const userPrompt = rest[0] || '';
    const assistantReply = rest.slice(1).join(' ') || '(in progress)';
    const res = await callMcpTool('conversation_add_message', {
      conversation_id: conversationId,
      agent_id: AGENT_ID,
      input: userPrompt,
      output: assistantReply
    });
    console.log(JSON.stringify(res, null, 2));
  } else if (cmd === 'search') {
    const res = await callMcpTool('memory_search', {
      datapack_id: DEFAULT_DATAPACK_ID,
      conversation_id: conversationId,
      query: input
    });
    console.log(JSON.stringify(res, null, 2));
  } else if (cmd === 'context') {
    const res = await callMcpTool('context_search', {
      datapack_id: DEFAULT_DATAPACK_ID,
      conversation_id: conversationId,
      query: input
    });
    console.log(JSON.stringify(res, null, 2));
  } else if (cmd === 'datapacks') {
    const res = await callMcpTool('datapack_search', {
      conversation_id: conversationId,
      limit: 10,
      include_total: true
    });
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
