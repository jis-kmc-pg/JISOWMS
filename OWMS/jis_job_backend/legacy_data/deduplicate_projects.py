import re

def normalize_line(text):
    # 1. Basic stripe
    text = text.strip()
    
    # 2. Remove leading numbering e.g. "1. ", "502. ", "1) "
    text = re.sub(r'^\d+[\.\)]\s*', '', text)
    
    # 3. Canonicalize spaces to single space
    text = re.sub(r'\s+', ' ', text)
    
    # 4. Remove ";2and2;" artifact
    text = text.replace(';2and2;', '&')
    
    return text.strip()

def clean_project_name(text):
    # Clean up common patterns that make items "similar" but not identical
    
    # Remove "(Part Name)" or "(Name)" at end of string
    # Try to match typical patterns for names/positions in parens
    # e.g. (김영주 과장), (장재훈차장), (실행), (영업)
    # Be careful not to remove (Valid Info) e.g. (2차)
    
    # Strategy: Remove specific prefixes often used for categorization
    prefixes = [r'^\(영업\)\s*', r'^\(실행\)\s*', r'^\(우수조달\)\s*', r'^\d+\.\s*']
    for p in prefixes:
        text = re.sub(p, '', text)
        
    # Remove suffixes in parens which look like people names
    # Heuristic: Parens containing "과장", "대리", "팀장", "주무관", "부장", "이사", "대표"
    text = re.sub(r'\([^\)]*(?:과장|대리|부장|차장|이사|주무관|대표|팀장|사원|주임)[^\)]*\)', '', text)
    
    # Remove "(Company Name)" if it's just repeating? No, removing company might make it ambiguous.
    
    # Remove trailing parens with just digits/dates? e.g. (2024년)
    # text = re.sub(r'\(\d+년\)$', '', text)
    
    return text.strip()

def is_substring_match(shorter, longer):
    # Check if shorter is a clean substring of longer
    # And longer doesn't add much "Project" info, just "Meta" info.
    # Heuristic: If longer starts with shorter, or longer ends with shorter.
    
    if shorter in longer:
        # Check if the extra part is just noise?
        # e.g. "Project A" in "Project A - Name"
        diff = longer.replace(shorter, "").strip()
        # If diff is mainly special chars or names?
        # Let's just assume if it's a substring, the shorter one is the canonical "Project Name".
        return True
    return False

def main():
    path = r"D:\AI_PJ\OWMS\jis_job_backend\legacy_data\projects_2025_2026.txt"
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    # Phase 1: Normalization & Basic Clean
    normalized_items = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("=====") or line.startswith("프로젝트 목록") or line.startswith("총 "):
            continue
        
        norm = normalize_line(line)
        cleaned_name = clean_project_name(norm) # Remove "Manager Name" etc.
        
        if len(cleaned_name) < 2: continue
        
        normalized_items.append(cleaned_name)
        
    # Phase 2: Deduplicate by exact string
    unique_items = sorted(list(set(normalized_items)))
    print(f"Unique items after normalization: {len(unique_items)}")
    
    # Phase 3: Substring reduction (O(N^2) but N ~ 4000, doable in seconds)
    # Sort by length ascending so we check shorter against longer
    unique_items.sort(key=len)
    
    toremove = set()
    for i in range(len(unique_items)):
        if i in toremove: continue
        shorter = unique_items[i]
        
        for j in range(i + 1, len(unique_items)):
            if j in toremove: continue
            longer = unique_items[j]
            
            # Optimization: If len(longer) is huge compared to shorter?
            
            # If shorter is substring of longer
            if shorter in longer:
                # We usually prefer standard name.
                # "Project" vs "Company : Project" -> "Company : Project" is more specific?
                # "Project" vs "Project (Note)" -> "Project" is cleaner.
                
                # Logic:
                # If "Colons" in shorter: It's likely "Company : Project".
                # If "Colons" in longer: It's also "Company : Project ...".
                
                # Rule: If shorter is >= 4 chars and longer contains shorter.
                # Mark longer for removal? OR shorter?
                # User wants "Remove similar/duplicate".
                # Usually we want the *Canonical* name.
                # I'll keep the SHORTER one as it is likely the base project name.
                # Exception: If shorter is too short (e.g. "2024년") -> Don't matching.
                
                if len(shorter) < 6: continue
                
                # Danger: "서초구" in "서초구 청사" -> Don't delete "서초구 청사".
                # Only delete if longer looks like "Shorter + Noise".
                # Noise = spaces, parens, hyphens.
                
                remain = longer.replace(shorter, "").strip()
                # If remaining is just special chars or digits or common words?
                # Let's purely check if remaining is wrapped in parens or after a dash.
                
                # Heuristic: "Start match" or "End match" is stronger.
                if longer.startswith(shorter) or longer.endswith(shorter):
                     # Likely safe to keep shorter.
                     toremove.add(j)
                else:
                    # "A Project B" contains "Project" -> Don't delete "A Project B" just because "Project" exists.
                    pass
    
    final_list = []
    for i in range(len(unique_items)):
        if i not in toremove:
            final_list.append(unique_items[i])
            
    final_list.sort()
    
    out_path = r"D:\AI_PJ\OWMS\jis_job_backend\legacy_data\projects_cleaned.txt"
    with open(out_path, 'w', encoding='utf-8') as f:
        for item in final_list:
            f.write(item + "\n")
            
    print(f"Final Count: {len(final_list)}")
    print(f"Saved to {out_path}")

if __name__ == "__main__":
    main()
