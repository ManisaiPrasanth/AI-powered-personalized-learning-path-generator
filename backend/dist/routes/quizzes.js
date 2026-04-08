"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quizRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const connection_1 = require("../db/connection");
exports.quizRouter = (0, express_1.Router)();
exports.quizRouter.get('/unit/:unitId', async (req, res) => {
    const userId = req.user.userId;
    const unitId = Number(req.params.unitId);
    const unit = await (0, connection_1.get)('SELECT id, course_id FROM Units WHERE id = ? AND is_detailed_version_of IS NULL', [unitId]);
    if (!unit) {
        return res.status(404).json({ message: 'Unit not found.' });
    }
    const progress = await (0, connection_1.get)('SELECT is_unlocked FROM UserProgress WHERE user_id = ? AND unit_id = ?', [userId, unit.id]);
    if (!progress || !progress.is_unlocked) {
        return res.status(403).json({ message: 'Unit is locked. Complete previous units first.' });
    }
    const quiz = await (0, connection_1.get)('SELECT id, title, total_marks FROM Quizzes WHERE unit_id = ?', [unit.id]);
    if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found for this unit.' });
    }
    const questions = await (0, connection_1.all)(`SELECT id, question_text, option_a, option_b, option_c, option_d
     FROM Questions
     WHERE quiz_id = ?
     ORDER BY id`, [quiz.id]);
    return res.json({
        quiz: {
            id: quiz.id,
            title: quiz.title,
            totalMarks: quiz.total_marks
        },
        questions: questions.map((q) => ({
            id: q.id,
            text: q.question_text,
            options: {
                a: q.option_a,
                b: q.option_b,
                c: q.option_c,
                d: q.option_d
            }
        }))
    });
});
exports.quizRouter.post('/submit', [
    (0, express_validator_1.body)('unitId').isInt({ gt: 0 }),
    (0, express_validator_1.body)('answers').isArray({ min: 1 }),
    (0, express_validator_1.body)('answers.*.questionId').isInt({ gt: 0 }),
    (0, express_validator_1.body)('answers.*.selectedOption').isIn(['a', 'b', 'c', 'd'])
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user.userId;
    const { unitId, answers } = req.body;
    const unit = await (0, connection_1.get)('SELECT id, course_id, unit_number FROM Units WHERE id = ? AND is_detailed_version_of IS NULL', [unitId]);
    if (!unit) {
        return res.status(404).json({ message: 'Unit not found.' });
    }
    const quiz = await (0, connection_1.get)('SELECT id, total_marks FROM Quizzes WHERE unit_id = ?', [unit.id]);
    if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found for this unit.' });
    }
    const dbQuestions = await (0, connection_1.all)('SELECT id, correct_option FROM Questions WHERE quiz_id = ?', [quiz.id]);
    if (dbQuestions.length !== 10) {
        return res.status(500).json({ message: 'Quiz is misconfigured (needs 10 questions).' });
    }
    let correctCount = 0;
    for (const q of dbQuestions) {
        const answer = answers.find((a) => a.questionId === q.id);
        if (answer && answer.selectedOption === q.correct_option) {
            correctCount += 1;
        }
    }
    const scorePerQuestion = quiz.total_marks / dbQuestions.length;
    const score = correctCount * scorePerQuestion;
    const passed = score >= 70;
    await (0, connection_1.run)(`INSERT INTO Scores (user_id, quiz_id, unit_id, score, passed)
       VALUES (?, ?, ?, ?, ?)`, [userId, quiz.id, unit.id, Math.round(score), passed ? 1 : 0]);
    const existingProgress = await (0, connection_1.get)('SELECT id FROM UserProgress WHERE user_id = ? AND unit_id = ?', [userId, unit.id]);
    if (existingProgress) {
        await (0, connection_1.run)(`UPDATE UserProgress
         SET last_score = ?, last_attempt_at = CURRENT_TIMESTAMP, is_completed = ?
         WHERE id = ?`, [Math.round(score), passed ? 1 : 0, existingProgress.id]);
    }
    else {
        await (0, connection_1.run)(`INSERT INTO UserProgress
         (user_id, course_id, unit_id, is_unlocked, is_completed, last_score, last_attempt_at)
         VALUES (?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`, [userId, unit.course_id, unit.id, passed ? 1 : 0, Math.round(score)]);
    }
    let nextUnitUnlocked = false;
    let nextUnitNumber = null;
    if (passed) {
        const nextUnit = await (0, connection_1.get)(`SELECT id, unit_number
         FROM Units
         WHERE course_id = ? AND is_detailed_version_of IS NULL AND unit_number = ?
         ORDER BY unit_number
         LIMIT 1`, [unit.course_id, unit.unit_number + 1]);
        if (nextUnit) {
            nextUnitNumber = nextUnit.unit_number;
            const existingNext = await (0, connection_1.get)('SELECT id FROM UserProgress WHERE user_id = ? AND unit_id = ?', [userId, nextUnit.id]);
            if (existingNext) {
                await (0, connection_1.run)('UPDATE UserProgress SET is_unlocked = 1 WHERE id = ?', [existingNext.id]);
            }
            else {
                await (0, connection_1.run)(`INSERT INTO UserProgress
             (user_id, course_id, unit_id, is_unlocked, is_completed)
             VALUES (?, ?, ?, 1, 0)`, [userId, unit.course_id, nextUnit.id]);
            }
            nextUnitUnlocked = true;
        }
    }
    return res.json({
        score: Math.round(score),
        passed,
        message: passed
            ? 'Congratulations! You passed.'
            : 'You need to score at least 70%.',
        nextUnitUnlocked,
        nextUnitNumber
    });
});
