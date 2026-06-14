#!/bin/bash
# Deploy socat port forwards to PVE host
# Run from cloudhost-manager server, socat runs on PVE

echo "Deploying port forwards to PVE..."

# Generate socat commands from DB
mysql cloudhost -N -e "SELECT CONCAT(socat TCP-LISTEN:, pf.external_port, \",fork,reuseaddr,nodelay TCP:\", pf.internal_ip, \":\", pf.internal_port, \" &\") FROM port_forwards pf JOIN services s ON pf.service_id = s.id WHERE pf.status=active AND pf.internal_ip !=  AND pf.internal_ip IS NOT NULL ORDER BY pf.external_port;" > /tmp/pve_socat_cmds.txt

# Write script to PVE
echo #!/bin/bash | sshpass -p "thanks123A#" ssh -o StrictHostKeyChecking=no root@pve.ypvps.com "cat > /tmp/pve_socat.sh"
cat /tmp/pve_socat_cmds.txt | sshpass -p "thanks123A#" ssh -o StrictHostKeyChecking=no root@pve.ypvps.com "cat >> /tmp/pve_socat.sh"
chmod +x /tmp/pve_socat.sh

# Execute on PVE
sshpass -p "thanks123A#" ssh -o StrictHostKeyChecking=no root@pve.ypvps.com "bash /tmp/pve_socat.sh"
sleep 2

# Verify
COUNT=$(sshpass -p "thanks123A#" ssh -o StrictHostKeyChecking=no root@pve.ypvps.com "ps aux | grep socat | grep -v grep | wc -l")
echo "Started $COUNT socat processes on PVE"
