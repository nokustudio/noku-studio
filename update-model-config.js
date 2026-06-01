const fs = require('fs');
const path = require('path');
const readline = require('readline');

const jsFilePath = path.join(__dirname, 'script-secondary.js');

// Default values (current parameters)
let scaleFactor = 0.6;
let yOffset = 0.02;
let rotationAngle = -30;
let cameraY = 0.45;

function runUpdate() {
  const fallbackY = cameraY + yOffset;
  const fallbackScale = 0.70 * scaleFactor;
  const fallbackRotY = (rotationAngle * Math.PI) / 180;

  try {
    let content = fs.readFileSync(jsFilePath, 'utf8');

    // 1. Camera Y Position
    content = content.replace(
      /camera\.position\.set\(0,\s*[\d\.-]+,\s*4\.5\);\s*\/\/\s*CONFIG:\s*camera_y/g,
      `camera.position.set(0, ${cameraY}, 4.5); // CONFIG: camera_y`
    );

    // 2. Fallback Y
    content = content.replace(
      /let\s+introModelY\s*=\s*[\d\.-]+;\s*\/\/\s*CONFIG:\s*fallback_y/g,
      `let introModelY = ${fallbackY.toFixed(4)}; // CONFIG: fallback_y`
    );

    // 3. Fallback Scale
    content = content.replace(
      /let\s+introModelScale\s*=\s*[\d\.-]+;\s*\/\/\s*CONFIG:\s*fallback_scale/g,
      `let introModelScale = ${fallbackScale.toFixed(4)}; // CONFIG: fallback_scale`
    );

    // 4. Fallback Rotation Y
    content = content.replace(
      /let\s+introModelRotY\s*=\s*[\d\.\-\s\*\/a-zA-Z]+;\s*\/\/\s*CONFIG:\s*fallback_rot_y/g,
      `let introModelRotY = ${fallbackRotY.toFixed(6)}; // CONFIG: fallback_rot_y`
    );

    // 5. Y Offset in dynamic calculation
    content = content.replace(
      /introModelY\s*=\s*ndcY\s*\*\s*halfFrustumH\s*\+\s*camera\.position\.y\s*\+\s*[\d\.-]+;\s*\/\/\s*CONFIG:\s*y_offset/g,
      `introModelY = ndcY * halfFrustumH + camera.position.y + ${yOffset}; // CONFIG: y_offset`
    );

    // 6. Scale factor in dynamic calculation
    content = content.replace(
      /introModelScale\s*=\s*Math\.max\(0\.25,\s*Math\.min\(1\.1,\s*\(imgHeightWorld\s*\/\s*1\.35\)\s*\*\s*[\d\.-]+\)\);\s*\/\/\s*CONFIG:\s*scale_factor/g,
      `introModelScale = Math.max(0.25, Math.min(1.1, (imgHeightWorld / 1.35) * ${scaleFactor})); // CONFIG: scale_factor`
    );

    // 7. Phase 1 target rotation
    content = content.replace(
      /targetRotY\s*=\s*[\d\.\-\s\*\/a-zA-Z]+;\s*\/\/\s*CONFIG:\s*rot_y_phase1/g,
      `targetRotY = ${fallbackRotY.toFixed(6)}; // CONFIG: rot_y_phase1`
    );

    // 8. Phase 2 Desktop Keyframe 0 Rotation
    content = content.replace(
      /\[0\.0,\s*[\d\.\-\s\*\/a-zA-Z]+\],\s*\/\/\s*CONFIG:\s*rot_y_phase2_desktop/g,
      `[0.0, ${fallbackRotY.toFixed(6)}], // CONFIG: rot_y_phase2_desktop`
    );

    // 9. Phase 2 Mobile Keyframe 0 Rotation
    content = content.replace(
      /\[0\.0,\s*[\d\.\-\s\*\/a-zA-Z]+\],\s*\/\/\s*CONFIG:\s*rot_y_phase2_mobile/g,
      `[0.0, ${fallbackRotY.toFixed(6)}], // CONFIG: rot_y_phase2_mobile`
    );

    // 10. Blend Target Rotation
    content = content.replace(
      /targetRotY\s*=\s*\([\d\.\-\s\*\/a-zA-Z]+\)\s*\*\s*\(1\s*-\s*blendEased\)\s*\+\s*baseRotY\s*\*\s*blendEased;\s*\/\/\s*CONFIG:\s*rot_y_blend/g,
      `targetRotY = (${fallbackRotY.toFixed(6)}) * (1 - blendEased) + baseRotY * blendEased; // CONFIG: rot_y_blend`
    );

    fs.writeFileSync(jsFilePath, content, 'utf8');
    console.log('\n========================================');
    console.log('✓ CONFIGURATION SUCCESSFULLY UPDATED!');
    console.log('========================================');
    console.log(`• Scale Factor:     ${scaleFactor}`);
    console.log(`• Y-Position Offset: ${yOffset}`);
    console.log(`• Rotation Angle:   ${rotationAngle}° (${fallbackRotY.toFixed(4)} rad)`);
    console.log(`• Camera Y Position: ${cameraY}`);
    console.log('----------------------------------------');
    console.log(`• Calculated Fallback Y:     ${fallbackY.toFixed(4)}`);
    console.log(`• Calculated Fallback Scale: ${fallbackScale.toFixed(4)}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('Error updating config file:', err);
  }
}

// Check arguments
const args = process.argv.slice(2);
if (args.length >= 4) {
  scaleFactor = parseFloat(args[0]);
  yOffset = parseFloat(args[1]);
  rotationAngle = parseFloat(args[2]);
  cameraY = parseFloat(args[3]);
  runUpdate();
} else {
  // Run interactive prompts using built-in readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askScale = () => {
    rl.question(`Enter Scale Factor [default ${scaleFactor}]: `, (ans) => {
      if (ans.trim() !== '') scaleFactor = parseFloat(ans);
      askYOffset();
    });
  };

  const askYOffset = () => {
    rl.question(`Enter Y-Position Offset [default ${yOffset}]: `, (ans) => {
      if (ans.trim() !== '') yOffset = parseFloat(ans);
      askRotation();
    });
  };

  const askRotation = () => {
    rl.question(`Enter Rotation Angle in Degrees (e.g. -30 for left, 30 for right) [default ${rotationAngle}]: `, (ans) => {
      if (ans.trim() !== '') rotationAngle = parseFloat(ans);
      askCameraY();
    });
  };

  const askCameraY = () => {
    rl.question(`Enter Camera Y Position [default ${cameraY}]: `, (ans) => {
      if (ans.trim() !== '') cameraY = parseFloat(ans);
      rl.close();
      runUpdate();
    });
  };

  console.log('\n--- Noku 3D Model Configuration Script ---');
  console.log('Press ENTER to keep the default values shown in brackets.\n');
  askScale();
}
