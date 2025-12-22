#!/usr/bin/env python3
import sys

content = '''"use client"

export function NotificationsList({ onRead }: { onRead?: () => void }) {
  return (
    <div className="p-8 text-center text-muted-foreground">
      <p>Уведомления загружаются...</p>
    </div>
  )
}
'''

with open('/root/corporate-learning-platform-v2/components/notifications/notifications-list.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Created notifications-list.tsx")

