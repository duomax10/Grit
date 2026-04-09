/**
 * Generate Wang tilesets via PixelLab MCP server.
 *
 * The tileset generation API is only available through the MCP protocol,
 * not the REST SDK. This script calls the MCP endpoint directly.
 *
 * Usage: node scripts/generate-wang-tiles.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets', 'tiles');

const API_KEY = process.env.PIXELLAB_SECRET || '';
if (!API_KEY) {
  console.error('Set PIXELLAB_SECRET env var');
  process.exit(1);
}

if (!existsSync(ASSETS)) mkdirSync(ASSETS, { recursive: true });

const MCP_URL = 'https://api.pixellab.ai/mcp';

// Call an MCP tool via HTTP
async function callMcpTool(toolName, args) {
  console.log(`  Calling MCP tool: ${toolName}...`);

  // MCP uses JSON-RPC 2.0 over HTTP with SSE transport
  // For the streamable HTTP transport, we POST to the MCP endpoint
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };

  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MCP call failed (${response.status}): ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream')) {
    // SSE response — collect all events
    const text = await response.text();
    const lines = text.split('\n');
    let result = null;
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.result) result = data.result;
          if (data.jsonrpc) result = data;
        } catch (e) {
          // skip non-JSON data lines
        }
      }
    }
    return result;
  } else {
    return await response.json();
  }
}

// Save base64 image data to a file
function saveBase64Image(base64Data, filePath) {
  // Strip data URL prefix if present
  const raw = base64Data.replace(/^data:image\/\w+;base64,/, '');
  writeFileSync(filePath, Buffer.from(raw, 'base64'));
  console.log(`    ✓ Saved: ${filePath}`);
}

async function main() {
  console.log('=== Wang Tileset Generator (PixelLab MCP) ===\n');

  // Define the tileset pairs we need for the graveyard
  const tilesets = [
    {
      name: 'grass-to-gravel',
      lower: 'dark green cemetery grass, short mowed lawn, pixel art, top-down view',
      upper: 'gray gravel crushed stone path, small pebbles, pixel art, top-down view',
    },
    {
      name: 'grass-to-dirt',
      lower: 'dark green cemetery grass, short mowed lawn, pixel art, top-down view',
      upper: 'brown packed dirt worn earth path, pixel art, top-down view',
    },
  ];

  for (const ts of tilesets) {
    console.log(`\nGenerating: ${ts.name}`);
    try {
      const result = await callMcpTool('create_topdown_tileset', {
        lower: ts.lower,
        upper: ts.upper,
      });

      console.log('  MCP response received');
      console.log('  Response type:', typeof result);

      // The MCP response contains the tileset image(s)
      // Parse and save them
      if (result && result.result) {
        const content = result.result.content || result.result;
        if (Array.isArray(content)) {
          for (let i = 0; i < content.length; i++) {
            const item = content[i];
            if (item.type === 'image' && item.data) {
              saveBase64Image(item.data, join(ASSETS, `${ts.name}-${i}.png`));
            } else if (item.type === 'text') {
              console.log(`    Info: ${item.text}`);
            }
          }
        } else if (typeof content === 'object' && content.type === 'image') {
          saveBase64Image(content.data, join(ASSETS, `${ts.name}.png`));
        }
      } else if (result && result.content) {
        for (let i = 0; i < result.content.length; i++) {
          const item = result.content[i];
          if (item.type === 'image' && item.data) {
            saveBase64Image(item.data, join(ASSETS, `${ts.name}-${i}.png`));
          } else if (item.type === 'text') {
            console.log(`    Info: ${item.text}`);
          }
        }
      } else {
        // Dump the raw response structure for debugging
        console.log('  Raw response:', JSON.stringify(result).slice(0, 500));
      }
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
