#!/usr/bin/env python3
import re

file_path = 'lib/bitrix24.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Исправляем ошибку с PHONE
content = content.replace(
    'payload.fields.PHONE = [{ VALUE: contactData.phone, VALUE_TYPE: \'WORK\' }]',
    '(payload.fields as any).PHONE = [{ VALUE: contactData.phone, VALUE_TYPE: \'WORK\' }]'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("File fixed successfully!")

