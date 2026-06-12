const fs = require("fs");
const path = "/root/cloudhost-manager/client/dist/assets/vue-core-97d480ef.js";
let content = fs.readFileSync(path, "utf8");

const refFunc = "function ref(t){return t&&t.__v_isRef===!0?t:new zl(t,!1)}";

// 在 }; 之前插入 ref 函数和修改 export
content = content.replace(
  /(^.*export\{[^}]*sr as f[^}]*\};$)/m,
  function(match) {
    return refFunc + "\n" + match.replace("sr as f", "ref as f");
  }
);

fs.writeFileSync(path, content);
console.log("Patched!");
