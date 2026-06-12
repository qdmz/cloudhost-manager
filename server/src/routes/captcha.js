const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { set } = require("../cache/captchaCache");

const CODE_LENGTH = 5;
const CHAR_SET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
  }
  return code;
}

function generateSVG(code) {
  const width = 110;
  const height = 48;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // Background
  svg += `<rect width="100%" height="100%" fill="#f0f0f0"/>`;

  // Noise lines
  const lineCount = 6;
  for (let i = 0; i < lineCount; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const hue = Math.floor(Math.random() * 360);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="hsl(${hue},60%,70%)" stroke-width="1.5"/>`;
  }

  // Noise dots
  for (let i = 0; i < 40; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    svg += `<circle cx="${cx}" cy="${cy}" r="1" fill="rgba(0,0,0,0.2)"/>`;
  }

  // Characters with rotation
  const fontSize = 28;
  const charWidth = width / (CODE_LENGTH + 1);
  for (let i = 0; i < CODE_LENGTH; i++) {
    const char = code[i];
    const x = charWidth * (i + 1);
    const y = height * 0.65 + (Math.random() * 10 - 5);
    const rotation = Math.floor(Math.random() * 20 - 10);
    const hue = Math.floor(Math.random() * 360);
    svg += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="hsl(${hue},70%,35%)" text-anchor="middle" transform="rotate(${rotation},${x},${y})">${char}</text>`;
  }

  svg += "</svg>";
  return svg;
}

// GET /api/captcha - generates and returns a captcha image
router.get("/", (req, res) => {
  const code = generateCode();
  const key = crypto.randomUUID();
  set(key, code);

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("X-Captcha-Key", key);
  res.send(generateSVG(code));
});

module.exports = router;
