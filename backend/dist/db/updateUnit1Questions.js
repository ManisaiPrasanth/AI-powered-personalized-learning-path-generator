"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
async function updateUnit1Questions() {
    await (0, connection_1.initDb)();
    // Find Machine Learning course
    const mlCourse = await (0, connection_1.get)('SELECT id FROM Courses WHERE slug = ?', ['machine-learning']);
    if (!mlCourse) {
        console.error('Machine Learning course not found. Did you run migrations/seed?');
        process.exit(1);
    }
    // Find base unit 1 (not detailed)
    const unit1 = await (0, connection_1.get)('SELECT id FROM Units WHERE course_id = ? AND unit_number = 1 AND is_detailed_version_of IS NULL', [mlCourse.id]);
    if (!unit1) {
        console.error('Unit 1 for Machine Learning not found.');
        process.exit(1);
    }
    // Find quiz for unit 1
    const quiz = await (0, connection_1.get)('SELECT id FROM Quizzes WHERE unit_id = ?', [unit1.id]);
    if (!quiz) {
        console.error('Quiz for Unit 1 not found.');
        process.exit(1);
    }
    // Remove existing generic questions
    await (0, connection_1.run)('DELETE FROM Questions WHERE quiz_id = ?', [quiz.id]);
    // Insert improved Unit 1 questions
    const questions = [
        {
            text: 'Which of the following best describes Machine Learning?',
            a: 'Writing explicit rules for every possible input',
            b: 'Allowing computers to learn patterns from data and improve over time',
            c: 'Storing large amounts of data in databases',
            d: 'Running programs faster using better hardware',
            correct: 'b'
        },
        {
            text: 'In supervised learning, the training data consists of:',
            a: 'Only input features without any outputs',
            b: 'Inputs paired with correct outputs (labels)',
            c: 'A sequence of actions and rewards',
            d: 'Randomly generated numbers',
            correct: 'b'
        },
        {
            text: 'Which task is a typical example of classification in supervised learning?',
            a: 'Predicting tomorrow’s temperature as a real number',
            b: 'Grouping customers into similar segments without labels',
            c: 'Deciding whether an email is spam or not spam',
            d: 'Reducing the number of features in a dataset',
            correct: 'c'
        },
        {
            text: 'Unsupervised learning is mainly used to:',
            a: 'Predict a numeric target',
            b: 'Find hidden structure or groups in unlabeled data',
            c: 'Maximize long-term reward through actions',
            d: 'Manually label new datasets',
            correct: 'b'
        },
        {
            text: 'Which scenario best matches reinforcement learning?',
            a: 'A model that clusters customers into groups',
            b: 'A model that predicts house prices from features',
            c: 'An agent that learns to play a game by receiving rewards and penalties',
            d: 'A model that compresses images',
            correct: 'c'
        },
        {
            text: 'Which of the following is a common step in a standard ML workflow?',
            a: 'Buying more servers before defining the problem',
            b: 'Training a model without checking data quality',
            c: 'Defining the problem, collecting data, preprocessing, training, then evaluating',
            d: 'Deploying the model before evaluating it',
            correct: 'c'
        },
        {
            text: 'In the ML workflow, data preprocessing usually happens:',
            a: 'After deployment to production',
            b: 'Before model training, to clean and transform the data',
            c: 'Only if the model performs poorly',
            d: 'Only for image data, not tabular data',
            correct: 'b'
        },
        {
            text: 'Which of these is a real-world application of Machine Learning?',
            a: 'Hard-coded rule-based menu in a restaurant POS',
            b: 'Text editor that only checks spelling with a fixed word list',
            c: 'Email spam filter that improves as it sees more labeled emails',
            d: 'Static web page with no user interaction',
            correct: 'c'
        },
        {
            text: 'Why is labeled data important for supervised learning?',
            a: 'It reduces the size of the dataset',
            b: 'It tells the model which clusters to form',
            c: 'It provides ground truth so the model can learn the mapping from inputs to outputs',
            d: 'It avoids the need for evaluation',
            correct: 'c'
        },
        {
            text: 'Which statement about Machine Learning is TRUE?',
            a: 'ML models never make mistakes once trained',
            b: 'ML completely replaces human expertise in all domains',
            c: 'ML helps automate pattern discovery and prediction but still needs human oversight',
            d: 'ML can only be applied to image data',
            correct: 'c'
        }
    ];
    for (const q of questions) {
        await (0, connection_1.run)(`INSERT INTO Questions
       (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
            quiz.id,
            q.text,
            q.a,
            q.b,
            q.c,
            q.d,
            q.correct,
            'Review Unit 1: Introduction to Machine Learning for a deeper explanation.'
        ]);
    }
    console.log('Unit 1 questions updated successfully.');
}
updateUnit1Questions()
    .then(() => process.exit(0))
    .catch((err) => {
    console.error('Failed to update Unit 1 questions', err);
    process.exit(1);
});
