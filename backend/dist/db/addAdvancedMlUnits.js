"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function addAdvancedMlUnits() {
    await (0, connection_1.initDb)();
    const mlCourse = await (0, connection_1.get)('SELECT id, total_units FROM Courses WHERE slug = ?', ['machine-learning']);
    if (!mlCourse) {
        console.error('Machine Learning course not found.');
        process.exit(1);
    }
    const existingUnits = await (0, connection_1.all)('SELECT unit_number FROM Units WHERE course_id = ? AND is_detailed_version_of IS NULL', [mlCourse.id]);
    const existingNumbers = new Set(existingUnits.map((u) => u.unit_number));
    const newUnits = [
        {
            unit_number: 7,
            title: 'Ensemble Methods',
            content: 'This unit covers bagging, boosting, and common ensemble techniques such as Random Forests and Gradient Boosting, focusing on why combining multiple models often leads to better performance.'
        },
        {
            unit_number: 8,
            title: 'Advanced Evaluation & Hyperparameter Tuning',
            content: 'This unit dives into cross-validation strategies, hyperparameter search, and diagnostic tools like learning curves and validation curves.'
        },
        {
            unit_number: 9,
            title: 'Neural Networks and Deep Learning',
            content: 'This unit introduces multi-layer perceptrons, backpropagation intuition, activation functions, and common optimization techniques like SGD with momentum and Adam.'
        },
        {
            unit_number: 10,
            title: 'Computer Vision with CNNs',
            content: 'This unit explains how convolutional neural networks process images using filters, feature maps, and pooling, and how transfer learning can be used for image classification tasks.'
        },
        {
            unit_number: 11,
            title: 'Sequence Models and Time Series',
            content: 'This unit covers recurrent neural networks (RNNs), LSTMs/GRUs at a conceptual level, and introduces time-series forecasting basics and temporal validation strategies.'
        },
        {
            unit_number: 12,
            title: 'NLP and Transformers',
            content: 'This unit walks through text preprocessing, vector representations, attention mechanisms, and the high-level ideas behind Transformer architectures and modern language models.'
        },
        {
            unit_number: 13,
            title: 'Deployment and MLOps',
            content: 'This unit focuses on taking models to production: saving and serving models via APIs, monitoring performance and drift, and basic ideas behind CI/CD for ML systems.'
        },
        {
            unit_number: 14,
            title: 'Ethics, Fairness, and Responsible AI',
            content: 'This unit discusses bias in data and models, fairness considerations, transparency, explainability, and responsible use of AI systems.'
        }
    ];
    for (const u of newUnits) {
        if (existingNumbers.has(u.unit_number)) {
            continue;
        }
        await (0, connection_1.run)(`INSERT INTO Units (course_id, unit_number, title, content)
       VALUES (?, ?, ?, ?)`, [mlCourse.id, u.unit_number, u.title, u.content]);
    }
    // Create quizzes and generic questions for new units
    const advancedUnits = await (0, connection_1.all)(`SELECT id, unit_number
     FROM Units
     WHERE course_id = ? AND is_detailed_version_of IS NULL AND unit_number >= 7
     ORDER BY unit_number`, [mlCourse.id]);
    for (const unit of advancedUnits) {
        const existingQuiz = await (0, connection_1.get)('SELECT id FROM Quizzes WHERE unit_id = ?', [unit.id]);
        if (!existingQuiz) {
            await (0, connection_1.run)(`INSERT INTO Quizzes (unit_id, title, total_marks)
         VALUES (?, ?, ?)`, [unit.id, `Unit ${unit.unit_number} Quiz`, 100]);
        }
    }
    const quizzes = await (0, connection_1.all)(`SELECT q.id, q.unit_id, u.unit_number
     FROM Quizzes q
     JOIN Units u ON u.id = q.unit_id
     WHERE u.course_id = ? AND u.is_detailed_version_of IS NULL AND u.unit_number >= 7`, [mlCourse.id]);
    for (const quiz of quizzes) {
        const existingQuestions = await (0, connection_1.all)('SELECT id FROM Questions WHERE quiz_id = ?', [quiz.id]);
        if (existingQuestions.length > 0) {
            continue;
        }
        for (let i = 1; i <= 10; i++) {
            await (0, connection_1.run)(`INSERT INTO Questions
         (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                quiz.id,
                `Advanced question ${i} for unit ${quiz.unit_number}: conceptual and practical understanding check.`,
                'Option A',
                'Option B',
                'Option C',
                'Option D',
                'a',
                'Refer to the corresponding advanced unit content for a detailed explanation.'
            ]);
        }
    }
    // Update course total_units to 14
    await (0, connection_1.run)('UPDATE Courses SET total_units = ? WHERE id = ?', [14, mlCourse.id]);
    console.log('Advanced Machine Learning units (7-14) added or updated successfully.');
}
addAdvancedMlUnits()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('Failed to add advanced ML units', err);
    process.exit(1);
});
