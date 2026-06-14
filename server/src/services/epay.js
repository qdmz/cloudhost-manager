const crypto = require('crypto');
const { getConfigs } = require('./config');

/**
 * 易支付服务类
 */
class EpayService {
    
    constructor() {
        this.defaultSignType = 'MD5';
    }
    
    /**
     * 获取配置
     */
    async getConfig() {
        const configs = await getConfigs();
        
        const epayKey = configs.epay_key || process.env.EPAY_KEY;
        const epayPid = configs.epay_pid || process.env.EPAY_PID;
        
        return {
            epayUrl: configs.epay_url || process.env.EPAY_URL || 'https://epay.example.com/submit.php',
            epayPid: epayPid || '1',
            epayKey: epayKey || '',
            epayPrivateKey: configs.epay_private_key || process.env.EPAY_PRIVATE_KEY || '',
            epayPublicKey: configs.epay_public_key || process.env.EPAY_PUBLIC_KEY || '',
            siteUrl: configs.site_url || process.env.SITE_URL || 'https://example.com',
            signType: configs.epay_sign_type || process.env.EPAY_SIGN_TYPE || this.defaultSignType
        };
    }
    
    /**
     * MD5 签名
     */
    md5Sign(data, key) {
        const signStr = data + key;
        return crypto.createHash('md5').update(signStr).digest('hex');
    }
    
    /**
     * RSA 签名（SHA256WithRSA）
     */
    rsaSign(data, privateKey) {
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
        let key = publicKey;
        if (!key.includes('-----BEGIN')) {
            key = '-----BEGIN PUBLIC KEY-----\n' + key + '\n-----END PUBLIC KEY-----';
        }
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        return verify.verify(key, sign, 'base64');
    }
    
    /**
     * 生成待签名字符串
     */
    generateSignString(params) {
        const sortedKeys = Object.keys(params)
            .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '' && params[key] != null)
            .sort();
        return sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    }
    
    /**
     * 创建支付参数
     */
    async createPayment(orderId, name, money, type = 'alipay') {
        const config = await this.getConfig();
        
        // 验证配置是否完整
        if (!config.epayUrl || config.epayUrl === 'https://epay.example.com/submit.php') {
            console.log('[Epay] EPAY URL not configured, skipping payment creation');
            return null;
        }
        if (!config.epayKey) {
            console.log('[Epay] EPAY key not configured, skipping payment creation');
            return null;
        }
        
        let epayType = type;
        if (type === 'wechat') epayType = 'wxpay';
        if (type === 'qqpay') epayType = 'qqpay';
        
        const params = {
            pid: config.epayPid,
            type: epayType,
            out_trade_no: orderId,
            notify_url: `${config.siteUrl}/api/pay/notify`,
            return_url: `${config.siteUrl}/#/orders`,
            name: name,
            money: money
        };
        
        const signString = this.generateSignString(params);
        let sign;
        if (config.signType === 'RSA' && config.epayPrivateKey) {
            sign = this.rsaSign(signString, config.epayPrivateKey);
        } else {
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
        
        return payUrl;
    }
    
    /**
     * 验证支付通知签名
     */
    async verifyNotify(params) {
        const config = await this.getConfig();
        
        const signString = this.generateSignString(params);
        
        if (params.sign_type === 'RSA' || config.signType === 'RSA') {
            if (!config.epayPublicKey) return false;
            return this.rsaVerify(signString, params.sign, config.epayPublicKey);
        } else {
            return this.md5Verify(signString, params.sign, config.epayKey);
        }
    }
    
    /**
     * MD5 验签
     */
    md5Verify(data, sign, key) {
        const expectedSign = this.md5Sign(data, key);
        return expectedSign === sign;
    }
}

module.exports = new EpayService();
