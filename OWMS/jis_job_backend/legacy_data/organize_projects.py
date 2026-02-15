import re
import collections

def get_group(line):
    # Try to extract a meaningful group
    
    # 1. Company Name like (주)OOO, (유)OOO
    # Stop at colon or space
    match = re.match(r'^(\([주유]\)\s*[^:\s]+)', line)
    if match:
        return match.group(1)
    
    match = re.match(r'^([^:\s]+\(주\))', line)
    if match:
        return match.group(1)
        
    # 2. Year like 2024년, 2025-2026
    match = re.match(r'^(20\d\d[-~]?\d*)', line)
    if match:
        return match.group(1) + "년 관련"
        
    # 3. Status like (영업), (실행)
    match = re.match(r'^(\(\w{2}\))', line) # (영업), (실행), (수공)
    if match:
        return match.group(1)
        
    # 4. English start
    if re.match(r'^[A-Za-z]', line):
        return "English / Other"
        
    return "기타"

def main():
    path = r"D:\AI_PJ\OWMS\jis_job_backend\legacy_data\projects_cleaned.txt"
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = [l.strip() for l in f if l.strip()]
    except:
        print("File not found")
        return

    groups = collections.defaultdict(list)
    
    for line in lines:
        group = get_group(line)
        groups[group].append(line)
        
    # Sort groups
    sorted_groups = sorted(groups.keys())
    
    out_path = r"D:\AI_PJ\OWMS\jis_job_backend\legacy_data\projects_organized.txt"
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(f"프로젝트 목록 정리 (총 {len(lines)}건)\n")
        f.write("="*50 + "\n\n")
        
        # Prioritize Year groups, then Company, then Others
        # Just alphabetical for now
        
        for group in sorted_groups:
            items = sorted(groups[group])
            f.write(f"[{group}] - {len(items)}건\n")
            for item in items:
                f.write(f"  - {item}\n")
            f.write("\n")
            
    print(f"Organized into {out_path}")

if __name__ == "__main__":
    main()
