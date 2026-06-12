require("dotenv").config({ path: "/root/cloudhost-manager/.env" });
const { Service } = require("./src/models");
const jwt = require("jsonwebtoken");
const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: "1h" });
const axios = require("axios");

async function test() {
  const svc = await Service.findOne({ where: { id: 1 } });
  console.log("Service 1 user_id:", svc.user_id);
  
  // Try with user_id 3's service 5
  const token3 = jwt.sign({ userId: 3 }, process.env.JWT_SECRET, { expiresIn: "1h" });
  try {
    const r = await axios.get("http://localhost:8111/api/services/5", {
      headers: { Authorization: "Bearer " + token3 }
    });
    var d = r.data.data;
    console.log("Service 5 name:", d.name);
    console.log("ssh_port:", d.ssh_port, "http_port:", d.http_port, "https_port:", d.https_port);
    console.log("vnc_port:", d.vnc_port, "custom_ports:", JSON.stringify(d.custom_ports));
  } catch(e) {
    console.log("Error:", e.response ? e.response.data : e.message);
  }
}
test();
