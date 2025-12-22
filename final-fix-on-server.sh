#!/bin/bash
cd /root/corporate-learning-platform-v2

# Убираем onError из useEditor
sed -i '/onError:/,/},$/d' components/ui/rich-text-editor.tsx
sed -i '/onDestroy: () => {/,/},$/{
/onDestroy: () => {/a\
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm focus:outline-none min-h-[200px] max-w-none px-4 py-3",
        "data-placeholder": placeholder || "Введите текст...",
      },
    },
}' components/ui/rich-text-editor.tsx 2>/dev/null || echo "Trying alternative fix..."

# Альтернативный способ - просто удалить строки с onError
python3 << 'PYEOF'
with open('components/ui/rich-text-editor.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if 'onError:' in line:
        skip = True
        continue
    if skip and ('},' in line or '],' in line) and lines[i-1].strip().startswith('}'):
        skip = False
        if '],' not in line:
            continue
    if not skip:
        new_lines.append(line)

with open('components/ui/rich-text-editor.tsx', 'w') as f:
    f.writelines(new_lines)

print('Fixed onError')
PYEOF

echo "File fixed"

