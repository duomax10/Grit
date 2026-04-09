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
  console.log(`  Args: ${JSON.stringify(args)}`);

  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };

  console.log(`  POST ${MCP_URL}`);
  console.log(`  Body: ${JSON.stringify(body)}`);

  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify(body),
  });

  console.log(`  Status: ${response.status} ${response.statusText}`);
  console.log(`  Content-Type: ${response.headers.get('content-type')}`);

  const text = await response.text();
  console.log(`  Response length: ${text.length}`);
  console.log(`  Response (first 1000 chars): ${text.slice(0, 1000)}`);

  if (!response.ok) {
    throw new Error(`MCP call failed (${response.status}): ${text}`);
  }

  // Try parsing as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // Might be SSE
    const lines = text.split('\n');
    let result = null;
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.result) result = data.result;
          if (data.jsonrpc) result = data;
        } catch (_e) { /* skip */ }
      }
    }
    if (result) return result;
    throw new Error(`Could not parse MCP response: ${text.slice(0, 500)}`);
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
      lower_description: 'dark green cemetery grass, short mowed lawn, pixel art, top-down view',
      upper_description: 'gray gravel crushed stone path, small pebbles, pixel art, top-down view',
    },
    {
      name: 'grass-to-dirt',
      lower_description: 'dark green cemetery grass, short mowed lawn, pixel art, top-down view',
      upper_description: 'brown packed dirt worn earth path, pixel art, top-down view',
    },
  ];

  for (const ts of tilesets) {
    console.log(`\nGenerating: ${ts.name}`);
    try {
      const result = await callMcpTool('create_topdown_tileset', {
        lower_description: ts.lower_description,
        upper_description: ts.upper_description,
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
      console.error(`  ✗ FAILED: ${err.message}`);
      console.error(err.stack);
      process.exitCode = 1;
    }
  }

  console.log('\n=== Done ===');
  if (process.exitCode) {
    console.error('\nSome tileset generation failed. Check logs above.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
