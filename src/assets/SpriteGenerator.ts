/**
 * Generates Gabe Hollow's character sprite sheet.
 * 32x32 pixel art, 3/4 top-down view.
 * 4 directions x 4 walk frames + 4 idle frames = 20 frames
 * Layout: each row is a direction (down, left, right, up), 4 walk frames + 1 idle = 5 cols
 */

const FRAME_W = 32;
const FRAME_H = 32;

// Color palette - gritty, slightly muted
const COLORS = {
  skin: '#d4a574',
  skinShadow: '#b8865c',
  skinHighlight: '#e8c098',
  hair: '#4a3728',
  hairHighlight: '#5e4838',
  scruff: '#6b5344',
  jacket: '#6b4226',
  jacketShadow: '#4a2e1a',
  jacketHighlight: '#7d5233',
  jacketCollar: '#5a3820',
  jeans: '#3a4a6b',
  jeansShadow: '#2a3650',
  jeansHighlight: '#4a5a7b',
  shoes: '#2a2420',
  shoesShadow: '#1a1410',
  belt: '#3a2a1a',
  outline: '#1a1210',
  eye: '#1a1a2a',
  eyeWhite: '#e8e0d0',
};

type Dir = 'down' | 'left' | 'right' | 'up';

function setPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function drawGabeFrame(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  dir: Dir,
  frame: number, // 0-3 walk, 4 = idle
) {
  const ox = offsetX;
  const oy = offsetY;
  const C = COLORS;
  const isIdle = frame === 4;
  const walkCycle = frame % 4;

  // Leg bob for walk animation
  const leftLegOffset = isIdle ? 0 : [0, -1, 0, 1][walkCycle];
  const rightLegOffset = isIdle ? 0 : [0, 1, 0, -1][walkCycle];
  // Arm swing
  const leftArmOffset = isIdle ? 0 : [0, 1, 0, -1][walkCycle];
  const rightArmOffset = isIdle ? 0 : [0, -1, 0, 1][walkCycle];
  // Body bob
  const bodyBob = isIdle ? 0 : [0, 0, 0, 0][walkCycle];

  if (dir === 'down') {
    drawGabeDown(ctx, ox, oy, C, bodyBob, leftLegOffset, rightLegOffset, leftArmOffset, rightArmOffset);
  } else if (dir === 'up') {
    drawGabeUp(ctx, ox, oy, C, bodyBob, leftLegOffset, rightLegOffset, leftArmOffset, rightArmOffset);
  } else if (dir === 'left') {
    drawGabeSide(ctx, ox, oy, C, bodyBob, leftLegOffset, rightLegOffset, leftArmOffset, rightArmOffset, false);
  } else {
    drawGabeSide(ctx, ox, oy, C, bodyBob, leftLegOffset, rightLegOffset, leftArmOffset, rightArmOffset, true);
  }
}

function drawGabeDown(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, C: typeof COLORS,
  bodyBob: number, leftLeg: number, rightLeg: number, leftArm: number, rightArm: number,
) {
  const by = bodyBob;

  // Hair (top of head)
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 3 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 4 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 5 + by, x <= 12 || x >= 19 ? C.hair : C.hairHighlight);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 6 + by, C.hair);

  // Face
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 7 + by, C.skin);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 8 + by, x === 11 || x === 20 ? C.skinShadow : C.skin);
  // Eyes row
  for (let x = 11; x <= 20; x++) {
    if (x === 13 || x === 18) setPixel(ctx, ox + x, oy + 9 + by, C.eyeWhite);
    else if (x === 14 || x === 17) setPixel(ctx, ox + x, oy + 9 + by, C.eye);
    else if (x === 11 || x === 20) setPixel(ctx, ox + x, oy + 9 + by, C.skinShadow);
    else setPixel(ctx, ox + x, oy + 9 + by, C.skin);
  }
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 10 + by, x === 11 || x === 20 ? C.skinShadow : C.skin);
  // Scruff/chin
  for (let x = 13; x <= 18; x++) setPixel(ctx, ox + x, oy + 11 + by, x >= 14 && x <= 17 ? C.scruff : C.skin);
  for (let x = 14; x <= 17; x++) setPixel(ctx, ox + x, oy + 12 + by, C.skinShadow);

  // Jacket collar
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 13 + by, C.jacketCollar);

  // Jacket body
  for (let y = 14; y <= 19; y++) {
    for (let x = 10; x <= 21; x++) {
      if (x === 10 || x === 21) setPixel(ctx, ox + x, oy + y + by, C.jacketShadow);
      else if (x === 11 || x === 20) setPixel(ctx, ox + x, oy + y + by, C.jacket);
      else if (x === 15 || x === 16) setPixel(ctx, ox + x, oy + y + by, C.jacketShadow); // center seam
      else setPixel(ctx, ox + x, oy + y + by, y <= 16 ? C.jacketHighlight : C.jacket);
    }
  }

  // Left arm
  for (let y = 14; y <= 18; y++) {
    const ay = y + leftArm;
    if (ay >= 14 && ay <= 20) {
      setPixel(ctx, ox + 8, oy + ay + by, C.jacketShadow);
      setPixel(ctx, ox + 9, oy + ay + by, C.jacket);
    }
  }
  setPixel(ctx, ox + 8, oy + 19 + leftArm + by, C.skin);
  setPixel(ctx, ox + 9, oy + 19 + leftArm + by, C.skinShadow);

  // Right arm
  for (let y = 14; y <= 18; y++) {
    const ay = y + rightArm;
    if (ay >= 14 && ay <= 20) {
      setPixel(ctx, ox + 22, oy + ay + by, C.jacket);
      setPixel(ctx, ox + 23, oy + ay + by, C.jacketShadow);
    }
  }
  setPixel(ctx, ox + 22, oy + 19 + rightArm + by, C.skinShadow);
  setPixel(ctx, ox + 23, oy + 19 + rightArm + by, C.skin);

  // Belt
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 20 + by, C.belt);

  // Jeans
  for (let y = 21; y <= 25; y++) {
    // Left leg
    const ly = y + leftLeg;
    if (ly >= 21 && ly <= 27) {
      for (let x = 11; x <= 14; x++) {
        setPixel(ctx, ox + x, oy + ly + by, x === 11 ? C.jeansShadow : C.jeans);
      }
    }
    // Right leg
    const ry = y + rightLeg;
    if (ry >= 21 && ry <= 27) {
      for (let x = 17; x <= 20; x++) {
        setPixel(ctx, ox + x, oy + ry + by, x === 20 ? C.jeansShadow : C.jeans);
      }
    }
  }
  // Gap between legs
  setPixel(ctx, ox + 15, oy + 21 + by, C.jeansShadow);
  setPixel(ctx, ox + 16, oy + 21 + by, C.jeansShadow);

  // Shoes
  for (let x = 10; x <= 14; x++) setPixel(ctx, ox + x, oy + 26 + leftLeg + by, C.shoes);
  for (let x = 10; x <= 14; x++) setPixel(ctx, ox + x, oy + 27 + leftLeg + by, x <= 11 ? C.shoes : C.shoesShadow);
  for (let x = 17; x <= 21; x++) setPixel(ctx, ox + x, oy + 26 + rightLeg + by, C.shoes);
  for (let x = 17; x <= 21; x++) setPixel(ctx, ox + x, oy + 27 + rightLeg + by, x >= 20 ? C.shoes : C.shoesShadow);
}

function drawGabeUp(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, C: typeof COLORS,
  bodyBob: number, leftLeg: number, rightLeg: number, leftArm: number, rightArm: number,
) {
  const by = bodyBob;

  // Hair (back of head - more visible from behind)
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 3 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 4 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 5 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 6 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 7 + by, C.hairHighlight);
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 8 + by, C.hair);

  // Neck
  for (let x = 14; x <= 17; x++) setPixel(ctx, ox + x, oy + 9 + by, C.skin);
  for (let x = 13; x <= 18; x++) setPixel(ctx, ox + x, oy + 10 + by, C.skinShadow);

  // Ears visible from back slightly
  setPixel(ctx, ox + 11, oy + 8 + by, C.skinShadow);
  setPixel(ctx, ox + 20, oy + 8 + by, C.skinShadow);

  // Jacket collar (back)
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 11 + by, C.jacketCollar);

  // Jacket back
  for (let y = 12; y <= 19; y++) {
    for (let x = 10; x <= 21; x++) {
      if (x === 10 || x === 21) setPixel(ctx, ox + x, oy + y + by, C.jacketShadow);
      else if (x === 11 || x === 20) setPixel(ctx, ox + x, oy + y + by, C.jacket);
      else setPixel(ctx, ox + x, oy + y + by, y <= 15 ? C.jacket : C.jacketShadow);
    }
  }

  // Arms (back view)
  for (let y = 12; y <= 18; y++) {
    const lay = y + leftArm;
    if (lay >= 12 && lay <= 20) {
      setPixel(ctx, ox + 8, oy + lay + by, C.jacketShadow);
      setPixel(ctx, ox + 9, oy + lay + by, C.jacket);
    }
    const ray = y + rightArm;
    if (ray >= 12 && ray <= 20) {
      setPixel(ctx, ox + 22, oy + ray + by, C.jacket);
      setPixel(ctx, ox + 23, oy + ray + by, C.jacketShadow);
    }
  }

  // Belt
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 20 + by, C.belt);

  // Jeans (back)
  for (let y = 21; y <= 25; y++) {
    const ly = y + leftLeg;
    if (ly >= 21 && ly <= 27) {
      for (let x = 11; x <= 14; x++) setPixel(ctx, ox + x, oy + ly + by, C.jeansShadow);
    }
    const ry = y + rightLeg;
    if (ry >= 21 && ry <= 27) {
      for (let x = 17; x <= 20; x++) setPixel(ctx, ox + x, oy + ry + by, C.jeansShadow);
    }
  }
  setPixel(ctx, ox + 15, oy + 21 + by, C.jeansShadow);
  setPixel(ctx, ox + 16, oy + 21 + by, C.jeansShadow);

  // Shoes
  for (let x = 10; x <= 14; x++) setPixel(ctx, ox + x, oy + 26 + leftLeg + by, C.shoes);
  for (let x = 10; x <= 14; x++) setPixel(ctx, ox + x, oy + 27 + leftLeg + by, C.shoesShadow);
  for (let x = 17; x <= 21; x++) setPixel(ctx, ox + x, oy + 26 + rightLeg + by, C.shoes);
  for (let x = 17; x <= 21; x++) setPixel(ctx, ox + x, oy + 27 + rightLeg + by, C.shoesShadow);
}

function drawGabeSide(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, C: typeof COLORS,
  bodyBob: number, leftLeg: number, rightLeg: number, leftArm: number, rightArm: number,
  facingRight: boolean,
) {
  const by = bodyBob;
  // We draw facing right, then mirror for left
  const px = (x: number, _y: number) => facingRight ? ox + x : ox + (31 - x);

  // Hair
  for (let x = 12; x <= 20; x++) setPixel(ctx, px(x, 3), oy + 3 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, px(x, 4), oy + 4 + by, C.hair);
  for (let x = 11; x <= 20; x++) setPixel(ctx, px(x, 5), oy + 5 + by, C.hair);
  for (let x = 11; x <= 19; x++) setPixel(ctx, px(x, 6), oy + 6 + by, x >= 18 ? C.hairHighlight : C.hair);

  // Face (side)
  for (let x = 12; x <= 20; x++) setPixel(ctx, px(x, 7), oy + 7 + by, x >= 19 ? C.skin : C.hair);
  for (let x = 12; x <= 21; x++) setPixel(ctx, px(x, 8), oy + 8 + by, x <= 12 ? C.hair : C.skin);
  // Eye (side - one visible)
  for (let x = 12; x <= 21; x++) {
    if (x === 19) setPixel(ctx, px(x, 9), oy + 9 + by, C.eyeWhite);
    else if (x === 20) setPixel(ctx, px(x, 9), oy + 9 + by, C.eye);
    else if (x <= 12) setPixel(ctx, px(x, 9), oy + 9 + by, C.hair);
    else setPixel(ctx, px(x, 9), oy + 9 + by, C.skin);
  }
  for (let x = 13; x <= 21; x++) setPixel(ctx, px(x, 10), oy + 10 + by, C.skin);
  // Scruff
  for (let x = 15; x <= 21; x++) setPixel(ctx, px(x, 11), oy + 11 + by, x >= 18 ? C.scruff : C.skin);
  for (let x = 16; x <= 19; x++) setPixel(ctx, px(x, 12), oy + 12 + by, C.skinShadow);

  // Jacket collar
  for (let x = 13; x <= 19; x++) setPixel(ctx, px(x, 13), oy + 13 + by, C.jacketCollar);

  // Jacket body (side view - slimmer)
  for (let y = 14; y <= 19; y++) {
    for (let x = 11; x <= 20; x++) {
      if (x <= 11 || x >= 20) setPixel(ctx, px(x, y), oy + y + by, C.jacketShadow);
      else setPixel(ctx, px(x, y), oy + y + by, y <= 16 ? C.jacketHighlight : C.jacket);
    }
  }

  // Back arm (behind body)
  for (let y = 14; y <= 18; y++) {
    const ay = y + rightArm;
    if (ay >= 14 && ay <= 20) {
      setPixel(ctx, px(10, ay), oy + ay + by, C.jacketShadow);
    }
  }

  // Front arm
  for (let y = 14; y <= 18; y++) {
    const ay = y + leftArm;
    if (ay >= 14 && ay <= 20) {
      setPixel(ctx, px(21, ay), oy + ay + by, C.jacket);
      setPixel(ctx, px(22, ay), oy + ay + by, C.jacketShadow);
    }
  }
  setPixel(ctx, px(21, 19), oy + 19 + leftArm + by, C.skin);
  setPixel(ctx, px(22, 19), oy + 19 + leftArm + by, C.skinShadow);

  // Belt
  for (let x = 11; x <= 20; x++) setPixel(ctx, px(x, 20), oy + 20 + by, C.belt);

  // Jeans (side)
  for (let y = 21; y <= 25; y++) {
    // Back leg
    const bly = y + rightLeg;
    if (bly >= 21 && bly <= 27) {
      for (let x = 12; x <= 15; x++) {
        setPixel(ctx, px(x, bly), oy + bly + by, C.jeansShadow);
      }
    }
    // Front leg
    const fly = y + leftLeg;
    if (fly >= 21 && fly <= 27) {
      for (let x = 15; x <= 19; x++) {
        setPixel(ctx, px(x, fly), oy + fly + by, x <= 16 ? C.jeansShadow : C.jeans);
      }
    }
  }

  // Shoes
  for (let x = 11; x <= 15; x++) setPixel(ctx, px(x, 26), oy + 26 + rightLeg + by, C.shoes);
  for (let x = 11; x <= 15; x++) setPixel(ctx, px(x, 27), oy + 27 + rightLeg + by, C.shoesShadow);
  for (let x = 14; x <= 20; x++) setPixel(ctx, px(x, 26), oy + 26 + leftLeg + by, C.shoes);
  for (let x = 14; x <= 20; x++) setPixel(ctx, px(x, 27), oy + 27 + leftLeg + by, C.shoesShadow);
}

export function generateGabeSprite(scene: Phaser.Scene): void {
  // 5 columns (4 walk + 1 idle) x 4 rows (down, left, right, up)
  const cols = 5;
  const rows = 4;
  const canvas = document.createElement('canvas');
  canvas.width = cols * FRAME_W;
  canvas.height = rows * FRAME_H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const directions: Dir[] = ['down', 'left', 'right', 'up'];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      drawGabeFrame(ctx, col * FRAME_W, row * FRAME_H, directions[row], col);
    }
  }

  // Add to Phaser's texture manager as a spritesheet
  const texture = scene.textures.addCanvas('gabe-sheet', canvas);
  if (texture) {
    // Manually add frames for sprite sheet usage
    const data = texture.get();
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const frameName = `${directions[row]}_${col}`;
        texture.add(frameName, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
      }
    }
    // Also add numeric frames for spritesheet-style access
    let frameIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        texture.add(frameIndex, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H);
        frameIndex++;
      }
    }
  }
}

export function createGabeAnimations(scene: Phaser.Scene): void {
  const directions: Dir[] = ['down', 'left', 'right', 'up'];
  const fps = 8;

  for (let row = 0; row < directions.length; row++) {
    const dir = directions[row];

    // Walk animation (frames 0-3 of each row)
    scene.anims.create({
      key: `gabe-walk-${dir}`,
      frames: [0, 1, 2, 3].map(col => ({
        key: 'gabe-sheet',
        frame: `${dir}_${col}`,
      })),
      frameRate: fps,
      repeat: -1,
    });

    // Idle animation (frame 4 of each row)
    scene.anims.create({
      key: `gabe-idle-${dir}`,
      frames: [{ key: 'gabe-sheet', frame: `${dir}_4` }],
      frameRate: 1,
      repeat: -1,
    });
  }
}
