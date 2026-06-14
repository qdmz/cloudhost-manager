#!/bin/bash
# Save socat PIDs and create PM2 config for auto-restart

cd /root/cloudhost-manager

# Create a startup script
cat > start-port-forwards.sh << 'EOF'
#!/bin/bash
# Start socat for all valid port forwards

sleep 5  # Wait for services to be ready

mysql -u root -pcloudhost123 cloudhost -N -e "
SELECT pf.external_port, pf.internal_ip, pf.internal_port 
FROM port_forwards pf 
WHERE pf.status='active' AND pf.internal_ip != '' AND pf.internal_ip IS NOT NULL
ORDER BY pf.external_port;" | while IFS=$'\t' read -r ext_port int_ip int_port; do
    # Check if already running
    if ss -tlnp 2>/dev/null | grep -q ":${ext_port} " ; then
        continue
    fi
    socat TCP-LISTEN:${ext_port},fork,reuseaddr TCP:${int_ip}:${int_port} &
done
EOF

chmod +x start-port-forwards.sh

# Kill old socat processes
pkill -f "socat TCP-LISTEN.*fork" 2>/dev/null
sleep 1

# Start fresh
bash start-port-forwards.sh

# Add to crontab for auto-start on reboot
(crontab -l 2>/dev/null | grep -v "socat\|start-port-forwards"; echo "@reboot bash /root/cloudhost-manager/start-port-forwards.sh") | crontab -

echo "Port forwards started and configured for auto-restart"
