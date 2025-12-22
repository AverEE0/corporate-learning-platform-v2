#!/bin/bash
cd /root/corporate-learning-platform-v2

# Исправляем экранирование в style jsx
python3 << 'PYEOF'
with open('components/ui/rich-text-editor.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Заменяем неправильное экранирование
content = content.replace('{\\\`', '{`')
content = content.replace('}\\\`}', '}`}')

with open('components/ui/rich-text-editor.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed escaping')
PYEOF

