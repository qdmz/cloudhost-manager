const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { auth } = require("../middleware/auth");
const { sendEmail } = require("../services/email");
const { Op } = require("sequelize");
const { get, del } = require("../cache/captchaCache");

// Captcha validation middleware
function validateCaptcha(req, res, next) {
  const { captcha_code, captcha_key } = req.body;

  if (!captcha_code || !captcha_key) {
    return res.json({ code: 400, message: "请完成验证码" });
  }

  const entry = get(captcha_key);
  if (!entry) {
    return res.json({ code: 400, message: "验证码已过期，请刷新重试" });
  }

  if (entry.code.toUpperCase() !== captcha_code.toUpperCase()) {
    del(captcha_key);
    return res.json({ code: 400, message: "验证码错误" });
  }

  // Valid - remove from cache (one-time use)
  del(captcha_key);
  next();
}

// Register
router.post("/register", validateCaptcha, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({ code: 400, message: "请填写完整信息" });
    }

    if (password.length < 6) {
      return res.json({ code: 400, message: "密码长度不能少于6位" });
    }

    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return res.json({ code: 400, message: "用户名已存在" });
    }

    const user = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, 10),
      role: "user"
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      code: 200,
      message: "注册成功",
      data: { token, user: { id: user.id, username: user.username, email: user.email } }
    });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "注册失败" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.json({ code: 400, message: "请填写用户名和密码" });
    }

    // Support both username and email login
    const user = await User.findOne({
      where: { [Op.or]: [{ username: username }, { email: username }] }
    });

    if (!user) {
      return res.json({ code: 401, message: "用户名或密码错误" });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.json({ code: 401, message: "用户名或密码错误" });
    }

    if (user.status === "disabled") {
      return res.json({ code: 403, message: "账户已被禁用" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      code: 200,
      message: "登录成功",
      data: { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } }
    });
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "登录失败" });
  }
});

// Forgot Password
router.post("/forgot-password", validateCaptcha, async (req, res) => {
  try {
    const { email: username } = req.body;

    if (!email) {
      return res.json({ code: 400, message: "请输入注册邮箱" });
    }

    const user = await User.findOne({ where: { email: username } });

    if (!user) {
      return res.json({ code: 404, message: "该邮箱未注册" });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Save to auth_requests table
    const { AuthRequest } = require("../models");
    await AuthRequest.create({
      user_id: user.id,
      type: "password_reset",
      token: resetToken,
      expires_at: new Date(Date.now() + 60 * 60 * 1000)
    });

    // Send email with reset link
    try {
      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
      await sendEmail(
        email,
        "密码重置",
        `<h1>密码重置</h1><p>请点击以下链接重置密码：</p><p><a href="${resetLink}">点击这里重置密码</a></p><p>链接有效期1小时</p>`
      );
      res.json({
        code: 200,
        message: "如果该邮箱已注册，重置链接已发送"
      });
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      res.json({
        code: 200,
        message: "如果该邮箱已注册，重置链接已发送"
      });
    }
  } catch (error) {
    console.error(error);
    res.json({ code: 500, message: "发送失败" });
  }
});

module.exports = router;
