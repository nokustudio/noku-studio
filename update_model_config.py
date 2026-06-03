import os
import re
import sys

def get_config_paths():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    js_path = os.path.join(script_dir, 'script.js')
    return js_path

def parse_current_config(js_path):
    config = {
        'js_y_keyframe': None,
        'js_target_y': None,
        'js_angle_deg': None
    }
    
    if not os.path.exists(js_path):
        print(f"Error: Could not find script.js at {js_path}")
        sys.exit(1)

    with open(js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()

    # Find landing Y keyframe
    y_kf_match = re.search(r'\[1\.0,\s*(-?\d+\.?\d*)\]\s*//\s*Slides smoothly to the final centered Y coordinate', js_content)
    if y_kf_match:
        config['js_y_keyframe'] = float(y_kf_match.group(1))

    # Find targetY in Phase 2
    target_y_match = re.search(r'let targetY\s*=\s*(-?\d+\.?\d*);', js_content)
    if target_y_match:
        config['js_target_y'] = float(target_y_match.group(1))

    # Find angle in degrees
    angle_match = re.search(r'\((\d+)\s*\*\s*Math\.PI\s*\/\s*180\)', js_content)
    if angle_match:
        config['js_angle_deg'] = int(angle_match.group(1))

    return config, js_content

def main():
    js_path = get_config_paths()
    config, js_content = parse_current_config(js_path)

    print("=" * 60)
    print("         Current 3D Model Configuration Tracker")
    print("=" * 60)
    print(f"1. Model Landing Y Keyframe (script.js):   {config['js_y_keyframe'] if config['js_y_keyframe'] is not None else 'Not Found'}")
    print(f"2. Model Phase 2 targetY (script.js):       {config['js_target_y'] if config['js_target_y'] is not None else 'Not Found'}")
    print(f"3. Model Relative Rotation Angle (deg):     {config['js_angle_deg'] if config['js_angle_deg'] is not None else 'Not Found'} degrees")
    print("=" * 60)

    try:
        new_y_input = input("Enter new Y-coordinate (press Enter to keep current): ").strip()
    except (KeyboardInterrupt, EOFError):
        new_y_input = ""
        print()

    try:
        new_angle_input = input("Enter new rotation angle in degrees (press Enter to keep current): ").strip()
    except (KeyboardInterrupt, EOFError):
        new_angle_input = ""
        print()

    updated = False
    
    new_y = config['js_target_y']
    if new_y_input:
        try:
            new_y = float(new_y_input)
            updated = True
        except ValueError:
            print(f"Error: Invalid Y-coordinate '{new_y_input}'. Must be a number.")
            sys.exit(1)

    new_angle = config['js_angle_deg']
    if new_angle_input:
        try:
            new_angle = int(new_angle_input)
            updated = True
        except ValueError:
            print(f"Error: Invalid angle '{new_angle_input}'. Must be an integer.")
            sys.exit(1)

    if not updated:
        print("No updates entered. Exiting.")
        sys.exit(0)

    # 1. Update JS content
    new_js_content = js_content
    if new_y_input:
        # Update keyframe Y
        new_js_content = re.sub(
            r'\[1\.0,\s*-?\d+\.?\d*\]\s*//\s*Slides smoothly to the final centered Y coordinate',
            f'[1.0, {new_y}] // Slides smoothly to the final centered Y coordinate',
            new_js_content
        )
        # Update let targetY
        new_js_content = re.sub(
            r'let targetY\s*=\s*-?\d+\.?\d*;',
            f'let targetY = {new_y};',
            new_js_content
        )

    if new_angle_input:
        # Update all instances of the relative degree rotation formula
        new_js_content = re.sub(
            r'-?\d+\.?\d*\s*\*\s*Math\.PI\s*/\s*180',
            f'{new_angle} * Math.PI / 180',
            new_js_content
        )

    # Write changes
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_js_content)

    print("\n" + "=" * 60)
    print("Configuration updated successfully!")
    print(f"Updated Y-coordinate to: {new_y}")
    print(f"Updated rotation angle to: {new_angle} degrees")
    print("=" * 60)

if __name__ == '__main__':
    main()
