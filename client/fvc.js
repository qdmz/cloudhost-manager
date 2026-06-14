const fs = require("fs");
const code = fs.readFileSync("/root/cloudhost-manager/client/dist/assets/vue-core-97d480ef.js", "utf8");
const formatted = code.replace(/;/g, ";\n").replace(/{/g, "{\n").replace(/}/g, "}\n");
const lines = formatted.split("\n");
console.log("Total lines:", lines.length);
for (let i = 0; i < 20; i++) {
  console.log("Line " + (i+1) + ":", lines[i].substring(0, 200));
}
