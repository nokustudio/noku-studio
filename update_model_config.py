import os
import re
import math

js_file_path = os.path.join(os.path.dirname(__file__), 'script-secondary.js')

def get_current_values():
    # Fallbacks in case extraction fails
    defaults = {
        'scale_factor': 0.6,
        'y_offset': 0.02,
        'rotation_angle': -30,
        'camera_y': 0.45
    }
    
    if not os.path.exists(js_file_path):
        return defaults

    try:
        with open(js_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Extract camera Y
        camera_match = re.search(r'camera\.position\.set\(0,\s*([\d\.-]+),\s*4\.5\);\s*//\s*CONFIG:\s*camera_y', content)
        if camera_match:
            defaults['camera_y'] = float(camera_match.group(1))

        # 2. Extract Y-position offset
        y_match = re.search(r'introModelY\s*=\s*ndcY\s*\*\s*halfFrustumH\s*\+\s*camera\.position\.y\s*\+\s*([\d\.-]+);\s*//\s*CONFIG:\s*y_offset', content)
        if y_match:
            defaults['y_offset'] = float(y_match.group(1))

        # 3. Extract Scale factor
        scale_match = re.search(r'introModelScale\s*=\s*Math\.max\(0\.25,\s*Math\.min\(1\.1,\s*\(imgHeightWorld\s*/\s*1\.35\)\s*\*\s*([\d\.-]+)\)\);\s*//\s*CONFIG:\s*scale_factor', content)
        if scale_match:
            defaults['scale_factor'] = float(scale_match.group(1))

        # 4. Extract Rotation Angle (read in radians, convert to degrees)
        rot_match = re.search(r'let\s+introModelRotY\s*=\s*([\d\.-]+);\s*//\s*CONFIG:\s*fallback_rot_y', content)
        if rot_match:
            rad_val = float(rot_match.group(1))
            defaults['rotation_angle'] = int(round(rad_val * 180.0 / math.pi))

    except Exception as e:
        print(f"Warning: Failed to extract current settings from JS file: {e}. Using defaults.")

    return defaults

def run_update(scale_factor, y_offset, rotation_angle, camera_y):
    fallback_y = camera_y + y_offset
    fallback_scale = 0.70 * scale_factor
    fallback_rot_y = (rotation_angle * math.pi) / 180.0

    try:
        with open(js_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 1. Camera Y Position
        content = re.sub(
            r'camera\.position\.set\(0,\s*[\d\.-]+,\s*4\.5\);\s*//\s*CONFIG:\s*camera_y',
            f'camera.position.set(0, {camera_y}, 4.5); // CONFIG: camera_y',
            content
        )

        # 2. Fallback Y
        content = re.sub(
            r'let\s+introModelY\s*=\s*[\d\.-]+;\s*//\s*CONFIG:\s*fallback_y',
            f'let introModelY = {fallback_y:.4f}; // CONFIG: fallback_y',
            content
        )

        # 3. Fallback Scale
        content = re.sub(
            r'let\s+introModelScale\s*=\s*[\d\.-]+;\s*//\s*CONFIG:\s*fallback_scale',
            f'let introModelScale = {fallback_scale:.4f}; // CONFIG: fallback_scale',
            content
        )

        # 4. Fallback Rotation Y
        content = re.sub(
            r'let\s+introModelRotY\s*=\s*[\d\.\-\s\*/a-zA-Z]+;\s*//\s*CONFIG:\s*fallback_rot_y',
            f'let introModelRotY = {fallback_rot_y:.6f}; // CONFIG: fallback_rot_y',
            content
        )

        # 5. Y Offset in dynamic calculation
        content = re.sub(
            r'introModelY\s*=\s*ndcY\s*\*\s*halfFrustumH\s*\+\s*camera\.position\.y\s*\+\s*[\d\.-]+;\s*//\s*CONFIG:\s*y_offset',
            f'introModelY = ndcY * halfFrustumH + camera.position.y + {y_offset}; // CONFIG: y_offset',
            content
        )

        # 6. Scale factor in dynamic calculation
        content = re.sub(
            r'introModelScale\s*=\s*Math\.max\(0\.25,\s*Math\.min\(1\.1,\s*\(imgHeightWorld\s*/\s*1\.35\)\s*\*\s*[\d\.-]+\)\);\s*//\s*CONFIG:\s*scale_factor',
            f'introModelScale = Math.max(0.25, Math.min(1.1, (imgHeightWorld / 1.35) * {scale_factor})); // CONFIG: scale_factor',
            content
        )

        # 7. Phase 1 target rotation
        content = re.sub(
            r'targetRotY\s*=\s*[\d\.\-\s\*/a-zA-Z]+;\s*//\s*CONFIG:\s*rot_y_phase1',
            f'targetRotY = {fallback_rot_y:.6f}; // CONFIG: rot_y_phase1',
            content
        )

        # 8. Phase 2 Desktop Keyframe 0 Rotation
        content = re.sub(
            r'\[0\.0,\s*[\d\.\-\s\*/a-zA-Z]+\],\s*//\s*CONFIG:\s*rot_y_phase2_desktop',
            f'[0.0, {fallback_rot_y:.6f}], // CONFIG: rot_y_phase2_desktop',
            content
        )

        # 9. Phase 2 Mobile Keyframe 0 Rotation
        content = re.sub(
            r'\[0\.0,\s*[\d\.\-\s\*/a-zA-Z]+\],\s*//\s*CONFIG:\s*rot_y_phase2_mobile',
            f'[0.0, {fallback_rot_y:.6f}], // CONFIG: rot_y_phase2_mobile',
            content
        )

        # 10. Blend Target Rotation
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
        print(f'- Scale Factor:     {scale_factor}')
        print(f'- Y-Position Offset: {y_offset}')
        print(f'- Rotation Angle:   {rotation_angle} deg ({fallback_rot_y:.4f} rad)')
        print(f'- Camera Y Position: {camera_y}')
        print('----------------------------------------')
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
    
    # 2. Y-Position Offset
    ans = input(f"Enter Y-Position Offset [{current['y_offset']}]: ").strip()
    y_offset = float(ans) if ans else current['y_offset']
    
    # 3. Rotation Angle
    ans = input(f"Enter Rotation Angle in Degrees (e.g. -30 for left, 30 for right) [{current['rotation_angle']}]: ").strip()
    rotation_angle = float(ans) if ans else current['rotation_angle']
    
    # 4. Camera Y Position
    ans = input(f"Enter Camera Y Position [{current['camera_y']}]: ").strip()
    camera_y = float(ans) if ans else current['camera_y']
    
    run_update(scale_factor, y_offset, rotation_angle, camera_y)

if __name__ == '__main__':
    main()
