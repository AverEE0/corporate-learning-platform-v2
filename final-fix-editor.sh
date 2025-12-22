#!/bin/bash
cd /root/corporate-learning-platform-v2

# Исправляем style jsx на dangerouslySetInnerHTML
sed -i 's|<style jsx global>{\`|<style dangerouslySetInnerHTML={{__html: \`|' components/ui/rich-text-editor.tsx
sed -i 's|}\`}</style>|\`}} />|' components/ui/rich-text-editor.tsx

echo "Fixed style tag"

