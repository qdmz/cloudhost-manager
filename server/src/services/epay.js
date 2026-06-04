
const crypto = require('crypto');
const { getConfigs } = require('./config');

/**
 * 易支付服务类
 */
class EpayService {
    
    constructor() {
        this.signType = 'RSA';
    }
    
    /**
     * 获取配置
     */
    async getConfig() {
        const configs = await getConfigs();
        return {
            epayUrl: configs.epay_url || process.env.EPAY_URL,
            epayPid: configs.epay_pid || process.env.EPAY_PID,
            epayKey: configs.epay_key || process.env.EPAY_KEY,
            epayPrivateKey: configs.epay_private_key || process.env.EPAY_PRIVATE_KEY,
            epayPublicKey: configs.epay_public_key || process.env.EPAY_PUBLIC_KEY,
            siteUrl: configs.site_url || process.env.SITE_URL
        };
    }
    
    /**
     * 生成待签名字符串
     */
    generateSignString(params) {
        const sortedKeys = Object.keys(params)
            .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '')
            .sort();
            
        return sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    }
    
    /**
     * RSA 签名（SHA256WithRSA）
     */
    rsaSign(data, privateKey) {
        // 处理私钥格式
        let key = privateKey;
        if (!key.includes('-----BEGIN')) {
            key = '-----BEGIN PRIVATE KEY-----\n' + key + '\n-----END PRIVATE KEY-----';
        }
        
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        return sign.sign(key, 'base64');
    }
    
    /**
     * RSA 验签
     */
    rsaVerify(data, sign, publicKey) {
        try {
            // 处理公钥格式
            let key = publicKey;
            if (!key.includes('-----BEGIN')) {
                key = '-----BEGIN PUBLIC KEY-----\n' + key + '\n-----END PUBLIC KEY-----';
            }
            
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(data);
            return verify.verify(key, sign, 'base64');
        } catch (e) {
            console.error('验签失败:', e);
            return false;
        }
    }
    
    /**
     * 创建支付参数
     */
    async createPayment(orderId, name, money, type = 'alipay') {
        const config = await this.getConfig();
        
        const params = {
            pid: config.epayPid,
            type: type,
            out_trade_no: orderId,
            notify_url: `${config.siteUrl}/api/pay/notify`,
            return_url: `${config.siteUrl}/#/orders`,
            name: name,
            money: money,
            timestamp: Math.floor(Date.now() / 1000).toString()
        };
        
        // 签名
        const signString = this.generateSignString(params);
        const sign = this.rsaSign(signString, config.epayPrivateKey);
        
        params.sign = sign;
        params.sign_type = this.signType;
        
        // 构建支付链接
        let payUrl = config.epayUrl;
        payUrl += (payUrl.includes('?') ? '&' : '?');
        
        const queryParams = [];
        for (const [key, value] of Object.entries(params)) {
            queryParams.push(`${key}=${encodeURIComponent(value)}`);
        }
        payUrl += queryParams.join('&');
        
        return payUrl;
    }
    
    /**
     * 验证支付通知签名
     */
    async verifyNotify(params) {
        const config = await this.getConfig();
        
        const signString = this.generateSignString(params);
        return this.rsaVerify(signString, params.sign, config.epayPublicKey);
    }
    
    /**
     * 查询订单
     */
    async queryOrder(outTradeNo) {
        const config = await this.getConfig();
        
        const params = {
            pid: config.epayPid,
            out_trade_no: outTradeNo,
            timestamp: Math.floor(Date.now() / 1000).toString()
        };
        
        const signString = this.generateSignString(params);
        const sign = this.rsaSign(signString, config.epayPrivateKey);
        
        params.sign = sign;
        params.sign_type = this.signType;
        
        const url = `${config.epayUrl.replace('/submit.php', '')}/api.php?act=order_query`;
        
        try {
            const axios = require('axios');
            const response = await axios.get(url, { params });
            return response.data;
        } catch (e) {
            console.error('查询订单失败:', e);
            return null;
        }
    }
    
    /**
     * 退款
     */
    async refund(outTradeNo, money) {
        const config = await this.getConfig();
        
        const params = {
            pid: config.epayPid,
            out_trade_no: outTradeNo,
            money: money,
            timestamp: Math.floor(Date.now() / 1000).toString()
        };
        
        const signString = this.generateSignString(params);
        const sign = this.rsaSign(signString, config.epayPrivateKey);
        
        params.sign = sign;
        params.sign_type = this.signType;
        
        const url = `${config.epayUrl.replace('/submit.php', '')}/api.php?act=refund`;
        
        try {
            const axios = require('axios');
            const response = await axios.get(url, { params });
            return response.data;
        } catch (e) {
            console.error('退款失败:', e);
            return null;
        }
    }
}

module.exports = new EpayService();
