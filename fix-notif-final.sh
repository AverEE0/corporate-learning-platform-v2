#!/bin/bash
cd /root/corporate-learning-platform-v2

sed -i 's|^import { NotificationsList }|// import { NotificationsList }|' components/notifications/notifications-bell.tsx

echo "Fixed notifications-bell.tsx"

