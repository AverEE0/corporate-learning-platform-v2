#!/usr/bin/env python3
import re

file_path = 'lib/csrf-middleware.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Исправляем ошибку с pathname
content = content.replace(
    '  const { pathname, method } = request',
    '  const pathname = request.nextUrl.pathname\n  const method = request.method'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File fixed successfully!")

