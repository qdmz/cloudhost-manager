const express = require('express')
const router = express.Router()
const { Node, Image } = require('../models')
const { auth, admin } = require('../middleware/auth')

// 获取节点列表
router.get('/', auth, async (req, res) => {
  try {
    const nodes = await Node.findAll({ 
      order: [['id', 'ASC']]
    })
    res.json({ code: 200, data: nodes })
  } catch (error) {
    console.error('Nodes list error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

// 获取节点统计
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' });
    }
    res.json({
      code: 200,
      data: {
        ...node.toJSON(),
        available_resources: {
          cpu_cores: node.cpu_usage || 0,
          memory_mb: node.memory_usage || 0,
          memory_total_mb: node.memory_total || 0
        }
      }
    });
  } catch (error) {
    console.error('[Nodes] Get stats error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

// 获取节点镜像
router.get('/:id/images', auth, async (req, res) => {
  try {
    const images = await Image.findAll({ 
      where: { node_id: req.params.id, status: 'active' }
    })
    res.json({ code: 200, data: images })
  } catch (error) {
    console.error('Node images error:', error.message)
    res.json({ code: 500, message: '获取失败' })
  }
})

// 测试节点连接
router.post("/:id/test-connection", auth, admin, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' });
    }
    
    const https = require('https');
    const url = require('url');
    
    const parsedUrl = new URL(node.host);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: '/api2/json/access/ticket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CloudHost-Admin'
      }
    };
    
    const postData = `username=${encodeURIComponent(node.api_user)}&password=${encodeURIComponent(node.ssh_password || '')}`;
    
    const req2 = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data && result.data.ticket) {
            res.json({
              code: 200,
              message: '连接成功',
              data: {
                connected: true,
                nodeInfo: {
                  hostname: result.data.hostname || 'Unknown',
                  version: result.data.version || 'Unknown',
                  uptime: result.data.uptime || 0
                }
              }
            });
          } else {
            res.json({ code: 401, message: '认证失败，请检查 API 配置', data: { connected: false } });
          }
        } catch (e) {
          res.json({ code: 500, message: '连接失败: ' + e.message, data: { connected: false } });
        }
      });
    });
    
    req2.on('error', (e) => {
      res.json({ code: 500, message: '网络错误: ' + e.message, data: { connected: false } });
    });
    
    req2.write(postData);
    req2.end();
  } catch (error) {
    console.error('[Nodes] Test connection error:', error);
    res.json({ code: 500, message: '服务器错误', data: { connected: false } });
  }
});

// 获取节点的虚拟机模板
router.get("/:id/templates", auth, admin, async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.json({ code: 404, message: '节点不存在' });
    }
    
    const https = require('https');
    
    const ticketUrl = new URL('/api2/json/access/ticket', node.host);
    const ticketOptions = {
      hostname: ticketUrl.hostname,
      port: ticketUrl.port || 443,
      path: ticketUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    const ticketPostData = `username=${encodeURIComponent(node.api_user)}&password=${encodeURIComponent(node.ssh_password || '')}`;
    
    https.request(ticketOptions, (ticketResponse) => {
      let ticketData = '';
      ticketResponse.on('data', (chunk) => { ticketData += chunk; });
      ticketResponse.on('end', async () => {
        try {
          const ticketResult = JSON.parse(ticketData);
          if (!ticketResult.data || !ticketResult.data.ticket) {
            return res.json({ code: 401, message: '认证失败' });
          }
          
          const cookie = `PVEAuthCookie=${ticketResult.data.ticket}`;
          const csrf = ticketResult.data.CSRFPreventionToken;
          
          const templatesUrl = new URL('/api2/json/nodes/' + encodeURIComponent(node.name) + '/template', node.host);
          const templatesOptions = {
            hostname: templatesUrl.hostname,
            port: templatesUrl.port || 443,
            path: templatesUrl.pathname,
            method: 'GET',
            headers: {
              'Cookie': cookie,
              'CSRFPreventionToken': csrf
            }
          };
          
          https.request(templatesOptions, (templatesResponse) => {
            let templateData = '';
            templatesResponse.on('data', (chunk) => { templateData += chunk; });
            templatesResponse.on('end', () => {
              try {
                const templatesResult = JSON.parse(templateData);
                const templates = templatesResult.data || [];
                
                const formattedTemplates = templates.map(t => ({
                  templateId: t.templateId,
                  storage: t.storage,
                  content: t.content,
                  vmid: t.vmid
                }));
                
                res.json({
                  code: 200,
                  data: {
                    templates: formattedTemplates,
                    availableResources: {
                      cpu: node.cpu_usage || 0,
                      memory: node.memory_usage || 0,
                      memoryTotal: node.memory_total || 0
                    }
                  }
                });
              } catch (e) {
                res.json({ code: 500, message: '解析模板失败: ' + e.message });
              }
            });
          }).on('error', (e) => {
            res.json({ code: 500, message: '获取模板失败: ' + e.message });
          }).end();
          
        } catch (e) {
          res.json({ code: 500, message: '解析认证响应失败: ' + e.message });
        }
      });
    }).on('error', (e) => {
      res.json({ code: 500, message: '认证请求失败: ' + e.message });
    }).write(ticketPostData).end();
  } catch (error) {
    console.error('[Nodes] Get templates error:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
