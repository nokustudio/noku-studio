import os
import re
import math

js_file_path = os.path.join(os.path.dirname(__file__), 'script-secondary.js')

def get_current_values():
    # Fallbacks in case extraction fails
    defaults = {
        'scale_factor': 0.6,
        'x_offset': 0.0,
        'y_offset': 0.02,
        'rotation_angle': -30,
        'camera_x': 0.0,
        'camera_y': 0.45,
        'zoom': 4.5
    }
    
    if not os.path.exists(js_file_path):
        return defaults

    try:
        with open(js_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Extract camera X, Y and zoom (camera Z)
        camera_match = re.search(r'camera\.position\.set\(([\d\.-]+),\s*([\d\.-]+),\s*([\d\.-]+)\);\s*//\s*CONFIG:\s*camera_position', content)
        if camera_match:
            defaults['camera_x'] = float(camera_match.group(1))
            defaults['camera_y'] = float(camera_match.group(2))
            defaults['zoom'] = float(camera_match.group(3))

        # 2. Extract X-position offset
        x_match = re.search(r'introModelX\s*=\s*ndcX\s*\*\s*halfFrustumW\s*\+\s*camera\.position\.x\s*\+\s*([\d\.-]+);\s*//\s*CONFIG:\s*x_offset', content)
        if x_match:
            defaults['x_offset'] = float(x_match.group(1))

        # 3. Extract Y-position offset
        y_match = re.search(r'introModelY\s*=\s*ndcY\s*\*\s*halfFrustumH\s*\+\s*camera\.position\.y\s*\+\s*([\d\.-]+);\s*//\s*CONFIG:\s*y_offset', content)
        if y_match:
            defaults['y_offset'] = float(y_match.group(1))

        # 4. Extract Scale factor
        scale_match = re.search(r'introModelScale\s*=\s*Math\.max\(0\.25,\s*Math\.min\(1\.1,\s*\(imgHeightWorld\s*/\s*1\.35\)\s*\*\s*([\d\.-]+)\)\);\s*//\s*CONFIG:\s*scale_factor', content)
        if scale_match:
            defaults['scale_factor'] = float(scale_match.group(1))

        # 5. Extract Rotation Angle (read in radians, convert to degrees)
        rot_match = re.search(r'let\s+introModelRotY\s*=\s*([\d\.-]+);\s*//\s*CONFIG:\s*fallback_rot_y', content)
        if rot_match:
            rad_val = float(rot_match.group(1))
            defaults['rotation_angle'] = int(round(rad_val * 180.0 / math.pi))

    except Exception as e:
        print(f"Warning: Failed to extract current settings from JS file: {e}. Using defaults.")

    return defaults

def run_update(scale_factor, x_offset, y_offset, rotation_angle, camera_x, camera_y, zoom):
    fallback_x = camera_x + x_offset
    fallback_y = camera_y + y_offset
    fallback_scale = 0.70 * scale_factor
    fallback_rot_y = (rotation_angle * math.pi) / 180.0

    try:
        with open(js_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Camera position (X, Y and Z)
        content = re.sub(
            r'camera\.position\.set\([\d\.-]+,\s*[\d\.-]+,\s*[\d\.-]+\);\s*//\s*CONFIG:\s*camera_position',
            f'camera.position.set({camera_x}, {camera_y}, {zoom}); // CONFIG: camera_position',
            content
        )

        # 2. Fallback X
        content = re.sub(
            r'let\s+introModelX\s*=\s*[\d\.-]+;\s*//\s*CONFIG:\s*fallback_x',
            f'let introModelX = {fallback_x:.4f}; // CONFIG: fallback_x',
            content
        )

        # 3. Fallback Y
        content = re.sub(
            r'let\s+introModelY\s*=\s*[\d\.-]+;\s*//\s*CONFIG:\s*fallback_y',
            f'let introModelY = {fallback_y:.4f}; // CONFIG: fallback_y',
            content
        )

        # 4. Fallback Scale
        content = re.sub(
            r'let\s+introModelScale\s*=\s*[\d\.-]+;\s*//\s*CONFIG:\s*fallback_scale',
            f'let introModelScale = {fallback_scale:.4f}; // CONFIG: fallback_scale',
            content
        )

        # 5. Fallback Rotation Y
        content = re.sub(
            r'let\s+introModelRotY\s*=\s*[\d\.\-\s\*/a-zA-Z]+;\s*//\s*CONFIG:\s*fallback_rot_y',
            f'let introModelRotY = {fallback_rot_y:.6f}; // CONFIG: fallback_rot_y',
            content
        )

        # 6. X Offset in dynamic calculation
        content = re.sub(
            r'introModelX\s*=\s*ndcX\s*\*\s*halfFrustumW\s*\+\s*camera\.position\.x\s*\+\s*[\d\.-]+;\s*//\s*CONFIG:\s*x_offset',
            f'introModelX = ndcX * halfFrustumW + camera.position.x + {x_offset}; // CONFIG: x_offset',
            content
        )

        # 7. Y Offset in dynamic calculation
        content = re.sub(
            r'introModelY\s*=\s*ndcY\s*\*\s*halfFrustumH\s*\+\s*camera\.position\.y\s*\+\s*[\d\.-]+;\s*//\s*CONFIG:\s*y_offset',
            f'introModelY = ndcY * halfFrustumH + camera.position.y + {y_offset}; // CONFIG: y_offset',
            content
        )

        # 8. Scale factor in dynamic calculation
        content = re.sub(
            r'introModelScale\s*=\s*Math\.max\(0\.25,\s*Math\.min\(1\.1,\s*\(imgHeightWorld\s*/\s*1\.35\)\s*\*\s*[\d\.-]+\)\);\s*//\s*CONFIG:\s*scale_factor',
            f'introModelScale = Math.max(0.25, Math.min(1.1, (imgHeightWorld / 1.35) * {scale_factor})); // CONFIG: scale_factor',
            content
        )

        # 9. Phase 1 target rotation
        content = re.sub(
            r'targetRotY\s*=\s*[\d\.\-\s\*/a-zA-Z]+;\s*//\s*CONFIG:\s*rot_y_phase1',
            f'targetRotY = {fallback_rot_y:.6f}; // CONFIG: rot_y_phase1',
            content
        )

        # 10. Phase 2 Desktop Keyframe 0 Rotation
        content = re.sub(
            r'\[0\.0,\s*[\d\.\-\s\*/a-zA-Z]+\],\s*//\s*CONFIG:\s*rot_y_phase2_desktop',
            f'[0.0, {fallback_rot_y:.6f}], // CONFIG: rot_y_phase2_desktop',
            content
        )

        # 11. Phase 2 Mobile Keyframe 0 Rotation
        content = re.sub(
            r'\[0\.0,\s*[\d\.\-\s\*/a-zA-Z]+\],\s*//\s*CONFIG:\s*rot_y_phase2_mobile',
            f'[0.0, {fallback_rot_y:.6f}], // CONFIG: rot_y_phase2_mobile',
            content
        )

        # 12. Blend Target Rotation
        content = re.sub(
            r'targetRotY\s*=\s*\([\d\.\-\s\*/a-zA-Z]+\)\s*\*\s*\(1\s*-\s*blendEased\)\s*\+\s*baseRotY\s*\*\s*blendEased;\s*//\s*CONFIG:\s*rot_y_blend',
            f'targetRotY = ({fallback_rot_y:.6f}) * (1 - blendEased) + baseRotY * blendEased; // CONFIG: rot_y_blend',
            content
        )

        with open(js_file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print('\n========================================')
        print('[SUCCESS] CONFIGURATION SUCCESSFULLY UPDATED!')
        print('========================================')
        print(f'- Scale Factor:      {scale_factor}')
        print(f'- X-Position Offset: {x_offset}')
        print(f'- Y-Position Offset: {y_offset}')
        print(f'- Rotation Angle:    {rotation_angle} deg ({fallback_rot_y:.4f} rad)')
        print(f'- Camera X Position: {camera_x}')
        print(f'- Camera Y Position: {camera_y}')
        print(f'- Zoom (Camera Z):   {zoom}')
        print('----------------------------------------')
        print(f'- Calculated Fallback X:     {fallback_x:.4f}')
        print(f'- Calculated Fallback Y:     {fallback_y:.4f}')
        print(f'- Calculated Fallback Scale: {fallback_scale:.4f}')
        print('========================================\n')
        
    except Exception as e:
        print(f"Error updating config file: {e}")

def main():
    current = get_current_values()
    
    print('\n--- Noku 3D Model Configuration Script (Python) ---')
    print('Press ENTER to keep the current values shown in brackets.\n')
    
    # 1. Scale Factor
    ans = input(f"Enter Scale Factor [{current['scale_factor']}]: ").strip()
    scale_factor = float(ans) if ans else current['scale_factor']
    
    # 2. X-Position Offset
    ans = input(f"Enter X-Position Offset [{current['x_offset']}]: ").strip()
    x_offset = float(ans) if ans else current['x_offset']
    
    # 3. Y-Position Offset
    ans = input(f"Enter Y-Position Offset [{current['y_offset']}]: ").strip()
    y_offset = float(ans) if ans else current['y_offset']
    
    # 4. Rotation Angle
    ans = input(f"Enter Rotation Angle in Degrees (e.g. -30 for left, 30 for right) [{current['rotation_angle']}]: ").strip()
    rotation_angle = float(ans) if ans else current['rotation_angle']
    
    # 5. Camera X Position
    ans = input(f"Enter Camera X Position [{current['camera_x']}]: ").strip()
    camera_x = float(ans) if ans else current['camera_x']
    
    # 6. Camera Y Position
    ans = input(f"Enter Camera Y Position [{current['camera_y']}]: ").strip()
    camera_y = float(ans) if ans else current['camera_y']

    # 7. Zoom (Camera Z)
    ans = input(f"Enter Zoom / Camera Z Position [{current['zoom']}]: ").strip()
    zoom = float(ans) if ans else current['zoom']
    
    run_update(scale_factor, x_offset, y_offset, rotation_angle, camera_x, camera_y, zoom)

if __name__ == '__main__':
    main()
