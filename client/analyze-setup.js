import urllib.request
url = "https://cloudhost.ypvps.com/assets/vue-core-97d480ef.js"
code = urllib.request.urlopen(url).read().decode()

# 找到所有 setup( 的位置
positions = []
start = 0
while True:
    idx = code.find("setup(", start)
    if idx == -1:
        break
    positions.append(idx)
    start = idx + 1

print(f"Found {len(positions)} setup( occurrences")
for pos in positions:
    # 找到这个 setup 函数的完整体
    depth = 0
    end = pos
    for i, c in enumerate(code[pos:]):
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = pos + i + 1
                break
    
    func_body = code[pos:end]
    # 检查是否有 ref 的调用（ref( 但排除 setup 参数中的 ref）
    # 找 "ref(" 模式
    ref_calls = []
    search_start = func_body.find("setup(") + 8  # 跳过 setup( 参数
    while True:
        idx2 = func_body.find("ref(", search_start)
        if idx2 == -1:
            break
        ref_calls.append(func_body[max(0,idx2-10):idx2+20])
        search_start = idx2 + 1
    
    # 也找 "=ref" 或 ",ref" 模式
    ref_assigns = []
    search_start = func_body.find("setup(") + 8
    while True:
        idx2 = func_body.find("ref,", search_start)
        if idx2 == -1:
            break
        ref_assigns.append(func_body[max(0,idx2-10):idx2+10])
        search_start = idx2 + 1
    
    print(f"\nAt {pos}:")
    print(f"  ref calls: {ref_calls}")
    print(f"  ref assigns: {ref_assigns}")
    # 显示函数体
    snippet = func_body[:300].replace("\n", " ")
    print(f"  Body: {snippet}")
