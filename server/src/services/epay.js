
const crypto = require('crypto');
const { getConfigs } = require('./config');

/**
 * 易支付服务类
 */
class EpayService {
    
    constructor() {
        // 可以在配置中设置 sign_type，默认 MD5，很多易支付系统使用 MD5
        this.defaultSignType = 'MD5';
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
            siteUrl: configs.site_url || process.env.SITE_URL,
            signType: configs.epay_sign_type || process.env.EPAY_SIGN_TYPE || this.defaultSignType
        };
    }
    
    /**
     * MD5 签名
     */
    md5Sign(data, key) {
        return crypto.createHash('md5').update(data + key).digest('hex');
    }
    
    /**
     * MD5 验签
     */
    md5Verify(data, sign, key) {
        const expectedSign = this.md5Sign(data, key);
        return expectedSign === sign;
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
        
        console.log('[Epay Config:', {
            epayUrl: config.epayUrl,
            epayPid: config.epayPid,
            siteUrl: config.siteUrl,
            signType: config.signType
        });
        
        const params = {
            pid: config.epayPid,
            type: type,
            out_trade_no: orderId,
            notify_url: `${config.siteUrl}/api/pay/notify`,
            return_url: `${config.siteUrl}/#/orders`,
            name: name,
            money: money
        };
        
        // 签名
        const signString = this.generateSignString(params);
        let sign;
        if (config.signType === 'RSA') {
            sign = this.rsaSign(signString, config.epayPrivateKey);
        } else {
            // 默认 MD5
            sign = this.md5Sign(signString, config.epayKey);
        }
        
        params.sign = sign;
        params.sign_type = config.signType;
        
        // 构建支付链接
        let payUrl = config.epayUrl;
        payUrl += (payUrl.includes('?') ? '&' : '?');
        
        const queryParams = [];
        for (const [key, value] of Object.entries(params)) {
            queryParams.push(`${key}=${encodeURIComponent(value)}`);
        }
        payUrl += queryParams.join('&');
        
        console.log('[Epay] Generated Pay URL:', payUrl);
        console.log('[Epay] Sign String:', signString);
        console.log('[Epay] Sign:', sign);
        
        return payUrl;
    }
    
    /**
     * 验证支付通知签名
     */
    async verifyNotify(params) {
        const config = await this.getConfig();
        
        const signString = this.generateSignString(params);
        console.log('[Epay] Verify Notify - Sign String:', signString);
        console.log('[Epay] Verify Notify - Received Sign:', params.sign);
        
        if (params.sign_type === 'RSA' || config.signType === 'RSA') {
            return this.rsaVerify(signString, params.sign, config.epayPublicKey);
        } else {
            // 默认 MD5
            return this.md5Verify(signString, params.sign, config.epayKey);
        }
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
