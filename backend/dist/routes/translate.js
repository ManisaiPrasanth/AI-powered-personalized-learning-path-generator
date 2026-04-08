"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
exports.translateRouter = (0, express_1.Router)();
async function translateOne(text, target) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}` +
        `&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok)
        return text;
    let data;
    try {
        data = (await res.json());
    }
    catch {
        return text;
    }
    const parts = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = parts
        .map((p) => (Array.isArray(p) && typeof p[0] === 'string' ? p[0] : ''))
        .join('')
        .trim();
    return translated || text;
}
exports.translateRouter.post('/', [
    (0, express_validator_1.body)('target').isIn(['hi', 'es']),
    (0, express_validator_1.body)('texts').isArray({ min: 1, max: 200 }),
    (0, express_validator_1.body)('texts.*').isString().isLength({ min: 0, max: 4000 })
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { target, texts } = req.body;
    const out = await Promise.all(texts.map(async (t) => {
        if (!t.trim())
            return t;
        try {
            return await translateOne(t, target);
        }
        catch {
            return t;
        }
    }));
    return res.json({ translations: out });
});
