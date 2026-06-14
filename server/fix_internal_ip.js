require("dotenv").config({ path: "/root/cloudhost-manager/.env" });
const { Service, Node, PortForward } = require("./src/models");
const vm = require("./src/services/vm");

async function fix() {
  const node = await Node.findOne({ where: { type: "pve" } });
  const client = new vm.PVEClient(node);
  const lxcList = await client.request("GET", "/nodes/pve/lxc");
  
  for (const c of lxcList) {
    const vmid = c.vmid || c.vmID;
    const service = await Service.findOne({ where: { vmid: String(vmid) } });
    if (!service) { console.log("  No service for vmid", vmid); continue; }
    if (service.ipv4) { console.log("  Service", service.id, service.name, "already has IP:", service.ipv4); continue; }
    
    const config = await client.request("GET", "/nodes/pve/lxc/" + vmid + "/config");
    let ip = null;
    for (const key of Object.keys(config)) {
      if (key.startsWith("net") && typeof config[key] === "string") {
        const m = config[key].match(/ip=(\d+\.\d+\.\d+\.\d+)/);
        if (m) { ip = m[1]; break; }
      }
    }
    for (const key of Object.keys(config)) {
      if (key.startsWith("ipconfig") && typeof config[key] === "string") {
        const m = config[key].match(/ip=(\d+\.\d+\.\d+\.\d+)/);
        if (m) { ip = m[1]; break; }
      }
    }
    if (ip) {
      await service.update({ ipv4: ip });
      const pf = await PortForward.findOne({ where: { service_id: service.id, internal_port: 22 } });
      if (pf) await pf.update({ internal_ip: ip });
      console.log("Service", service.id, service.name, "vmid", vmid, ":", ip);
    } else {
      console.log("Service", service.id, service.name, "vmid", vmid, ": No IP found");
    }
  }
}
fix();
