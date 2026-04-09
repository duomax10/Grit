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

// Extract tileset ID from MCP response
function extractTilesetId(result) {
  const content = result?.result?.content || result?.content || [];
  const items = Array.isArray(content) ? content : [content];
  for (const item of items) {
    if (item.type === 'text' && item.text) {
      const match = item.text.match(/Tileset ID:\*\*\s*`([^`]+)`/);
      if (match) return match[1];
    }
  }
  return null;
}

// Poll get_tileset until ready, then save the images
async function waitAndDownload(tilesetId, name) {
  console.log(`  Polling for tileset ${tilesetId}...`);
  const maxAttempts = 30; // 30 * 10s = 5 minutes max
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`    Attempt ${attempt + 1}/${maxAttempts}...`);
    const result = await callMcpTool('get_tileset', { tileset_id: tilesetId });

    const content = result?.result?.content || result?.content || [];
    const items = Array.isArray(content) ? content : [content];

    // Check for images in response
    let hasImages = false;
    let imageCount = 0;
    for (const item of items) {
      if (item.type === 'image' && item.data) {
        hasImages = true;
        const outPath = join(ASSETS, `${name}-${imageCount}.png`);
        saveBase64Image(item.data, outPath);
        imageCount++;
      } else if (item.type === 'text') {
        console.log(`    Status: ${item.text.slice(0, 200)}`);
        if (item.text.includes('Unknown tool')) {
          console.error(`    ✗ Tool not found — aborting`);
          return false;
        }
        if (item.text.includes('still processing') || item.text.includes('Processing')) {
          break;
        }
      }
    }

    if (hasImages) {
      console.log(`  ✓ Downloaded ${imageCount} images for ${name}`);
      return true;
    }

    // Wait 10 seconds before next poll
    console.log(`    Still processing, waiting 10s...`);
    await new Promise(r => setTimeout(r, 10000));
  }

  console.error(`  ✗ Timed out waiting for tileset ${tilesetId}`);
  return false;
}

async function main() {
  console.log('=== Wang Tileset Generator (PixelLab MCP) ===\n');

  // First, list available tools to discover the right names
  console.log('Listing available MCP tools...');
  try {
    const listBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {},
    };
    const listResp = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(listBody),
    });
    const listText = await listResp.text();
    // Parse SSE or JSON
    const lines = listText.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.result && data.result.tools) {
            console.log('Available tools:');
            for (const tool of data.result.tools) {
              console.log(`  - ${tool.name}: ${(tool.description || '').slice(0, 100)}`);
            }
          }
        } catch (_e) { /* skip */ }
      }
    }
  } catch (err) {
    console.log('Could not list tools:', err.message);
  }

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

  // Step 1: Submit all tileset generation requests
  const pending = [];
  for (const ts of tilesets) {
    console.log(`\nSubmitting: ${ts.name}`);
    try {
      const result = await callMcpTool('create_topdown_tileset', {
        lower_description: ts.lower_description,
        upper_description: ts.upper_description,
      });

      const tilesetId = extractTilesetId(result);
      if (tilesetId) {
        console.log(`  ✓ Submitted. Tileset ID: ${tilesetId}`);
        pending.push({ name: ts.name, id: tilesetId });
      } else {
        console.error(`  ✗ Could not extract tileset ID from response`);
        const content = result?.result?.content || result?.content || [];
        for (const item of Array.isArray(content) ? content : [content]) {
          if (item.type === 'text') console.log(`    ${item.text.slice(0, 300)}`);
        }
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`  ✗ FAILED: ${err.message}`);
      process.exitCode = 1;
    }
  }

  if (pending.length === 0) {
    console.error('\nNo tilesets submitted successfully.');
    process.exit(1);
  }

  // Step 2: Wait for processing (initial wait)
  console.log(`\nWaiting 60s for initial processing...`);
  await new Promise(r => setTimeout(r, 60000));

  // Step 3: Poll and download each tileset
  for (const ts of pending) {
    console.log(`\nDownloading: ${ts.name} (${ts.id})`);
    const ok = await waitAndDownload(ts.id, ts.name);
    if (!ok) process.exitCode = 1;
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
