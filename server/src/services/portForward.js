var Op = require("sequelize").Op;

function getNextPorts(nodeId, maxPorts) {
  return new Promise(function(resolve, reject) {
    var models = require("../models");
    var Node = models.Node;
    var Service = models.Service;
    var PortForward = models.PortForward;
    
    Node.findByPk(nodeId).then(function(node) {
      if (!node) { reject(new Error("Node not found")); return; }
      var rangeStart = node.port_range_start || 30001;
      var rangeEnd = node.port_range_end || 31000;
      
      Service.findAll({ where: { node_id: nodeId }, attributes: ["id"] }).then(function(services) {
        var serviceIds = services.map(function(s) { return s.id; });
        
        PortForward.findAll({
          where: { service_id: { [Op.in]: serviceIds } },
          attributes: ["external_port", "port_range_end"]
        }).then(function(usedPorts) {
          var usedSet = new Set();
          usedPorts.forEach(function(pf) {
            usedSet.add(pf.external_port);
            if (pf.port_range_end && pf.port_range_end > pf.external_port) {
              for (var p = pf.external_port + 1; p <= pf.port_range_end; p++) {
                usedSet.add(p);
              }
            }
          });
          
          var assigned = [];
          var port = rangeStart;
          while (assigned.length < maxPorts && port <= rangeEnd) {
            if (!usedSet.has(port)) assigned.push(port);
            port++;
          }
          
          if (assigned.length < maxPorts) {
            reject(new Error("No enough ports available (need " + maxPorts + ", have " + assigned.length + ")"));
            return;
          }
          resolve(assigned);
        });
      });
    }).catch(function(e) { reject(e); });
  });
}

function createAutoPortForwards(service, nodeId) {
  return new Promise(function(resolve, reject) {
    var models = require("../models");
    var Node = models.Node;
    var PortForward = models.PortForward;
    
    Node.findByPk(nodeId).then(function(node) {
      if (!node) { reject(new Error("Node not found")); return; }
      var maxPorts = node.max_ports_per_vm || 5;
      
      var Service = models.Service;
      
      Service.findAll({ where: { node_id: nodeId }, attributes: ["id"] }).then(function(services) {
        var serviceIds = services.map(function(s) { return s.id; });
        
        PortForward.findAll({
          where: { service_id: { [Op.in]: serviceIds } },
          attributes: ["external_port", "port_range_end"]
        }).then(function(usedPorts) {
          var usedSet = new Set();
          usedPorts.forEach(function(pf) {
            usedSet.add(pf.external_port);
            if (pf.port_range_end && pf.port_range_end > pf.external_port) {
              for (var p = pf.external_port + 1; p <= pf.port_range_end; p++) {
                usedSet.add(p);
              }
            }
          });
          
          var assigned = [];
          var port = node.port_range_start || 30001;
          var rangeEnd = node.port_range_end || 31000;
          while (assigned.length < maxPorts && port <= rangeEnd) {
            if (!usedSet.has(port)) {
              assigned.push(port);
            }
            port++;
          }
          
          if (assigned.length < maxPorts) {
            reject(new Error("No enough ports (need " + maxPorts + ", have " + assigned.length + ")"));
            return;
          }
          
          var mappings = [
            { external_port: assigned[0], internal_port: 22, fwd_type: "ssh", protocol: "tcp" },
            { external_port: assigned[1], internal_port: 80, fwd_type: "http", protocol: "tcp" },
            { external_port: assigned[2], internal_port: 443, fwd_type: "https", protocol: "tcp" },
            { external_port: assigned[3], internal_port: 5900, fwd_type: "vnc", protocol: "tcp" },
            { external_port: assigned[4], internal_port: assigned[4], fwd_type: "custom", protocol: "tcp" }
          ];
          
          var results = [];
          var idx = 0;
          function createNext() {
            if (idx >= mappings.length) {
              service.update({ ssh_port: assigned[0], vnc_port: assigned[3] }).then(function() {
                resolve({
                  ports: assigned,
                  ssh_port: assigned[0],
                  http_port: assigned[1],
                  https_port: assigned[2],
                  vnc_port: assigned[3],
                  custom_port: assigned[4]
                });
              }).catch(reject);
              return;
            }
            var m = mappings[idx];
            PortForward.create({
              service_id: service.id,
              user_id: service.user_id,
              internal_ip: service.ipv4 || "",
              external_port: m.external_port,
              internal_port: m.internal_port,
              fwd_type: m.fwd_type,
              protocol: m.protocol
            }).then(function(pf) {
              results.push(pf);
              idx++;
              createNext();
            }).catch(reject);
          }
          createNext();
        });
      });
    }).catch(reject);
  });
}

function getUsedPortsForService(serviceId) {
  return new Promise(function(resolve, reject) {
    var models = require("../models");
    var PortForward = models.PortForward;
    
    PortForward.findAll({
      where: { service_id: serviceId, status: "active" },
      order: [["external_port", "ASC"]]
    }).then(function(allPfs) {
      var result = { ssh: null, http: null, https: null, vnc: null, custom: [] };
      allPfs.forEach(function(pf) {
        if (pf.fwd_type === "ssh") result.ssh = pf;
        else if (pf.fwd_type === "http") result.http = pf;
        else if (pf.fwd_type === "https") result.https = pf;
        else if (pf.fwd_type === "vnc") result.vnc = pf;
        else result.custom.push(pf);
      });
      resolve(result);
    }).catch(reject);
  });
}

module.exports = { getNextPorts: getNextPorts, createAutoPortForwards: createAutoPortForwards, getUsedPortsForService: getUsedPortsForService };
