#!/bin/bash

# Команды для выполнения на сервере одной строкой
# Скопируйте и вставьте на сервере:

cat << 'EOF'

# ============================================
# ВЫПОЛНИТЕ ЭТИ КОМАНДЫ НА СЕРВЕРЕ
# ============================================

cd /root/corporate-learning-platform-v2

# Загрузить скрипт диагностики и исправления
cat > full-diagnose-and-fix.sh << 'SCRIPT_EOF'
EOF

cat full-diagnose-and-fix.sh >> run-on-server.sh

cat << 'EOF'
SCRIPT_EOF

chmod +x full-diagnose-and-fix.sh
./full-diagnose-and-fix.sh

EOF


