import { all, initDb, run } from './connection';

async function seed() {
  await initDb();

  const existingCourses = await all<{ id: number }>('SELECT id FROM Courses LIMIT 1');
  if (existingCourses.length > 0) {
    console.log('Seed skipped: data already exists.');
    return;
  }

  // Courses
  await run(
    `INSERT INTO Courses (title, slug, description, total_units)
     VALUES
     ('Machine Learning', 'machine-learning', 'End-to-end introduction to Machine Learning with math, algorithms, and practical intuition.', 6),
     ('Data Science', 'data-science', 'Data Science course content coming soon.', 0),
     ('Artificial Intelligence', 'artificial-intelligence', 'Artificial Intelligence course content coming soon.', 0),
     ('Blockchain', 'blockchain', 'Blockchain course content coming soon.', 0),
     ('Web Development', 'web-development', 'Web Development course content coming soon.', 0),
     ('Java Programming', 'java-programming', 'Java Programming course content coming soon.', 0)
    `
  );

  const courses = await all<{ id: number; slug: string }>('SELECT id, slug FROM Courses');
  const mlCourse = courses.find((c) => c.slug === 'machine-learning');
  if (!mlCourse) {
    throw new Error('Machine Learning course not found after insert.');
  }

  // Units for Machine Learning
  const unitTitles = [
    'Introduction to Machine Learning',
    'Mathematics for ML',
    'Supervised Learning',
    'Unsupervised Learning',
    'Model Optimization',
    'Introduction to Neural Networks'
  ];

  for (let i = 0; i < unitTitles.length; i++) {
    await run(
      `INSERT INTO Units (course_id, unit_number, title, content)
       VALUES (?, ?, ?, ?)`,
      [
        mlCourse.id,
        i + 1,
        unitTitles[i],
        `High-level content for ${unitTitles[i]}. The full explanation is provided in the frontend as structured sections, examples, and diagrams.`
      ]
    );
  }

  const baseUnits = await all<{ id: number; unit_number: number }>(
    'SELECT id, unit_number FROM Units WHERE course_id = ? AND is_detailed_version_of IS NULL ORDER BY unit_number',
    [mlCourse.id]
  );

  // Detailed versions (one-to-one for each unit)
  for (const unit of baseUnits) {
    await run(
      `INSERT INTO Units (course_id, unit_number, title, is_detailed_version_of, detailed_content)
       VALUES (?, ?, ?, ?, ?)`,
      [
        mlCourse.id,
        unit.unit_number,
        `Unit ${unit.unit_number} Detailed`,
        unit.id,
        `Detailed version of Unit ${unit.unit_number} with extended explanations, case studies, and visual intuition.`
      ]
    );
  }

  const units = await all<{ id: number; unit_number: number }>(
    'SELECT id, unit_number FROM Units WHERE course_id = ? AND is_detailed_version_of IS NULL ORDER BY unit_number',
    [mlCourse.id]
  );

  // Quizzes: one per base unit, 10 questions each, 10 marks per question
  for (const unit of units) {
    await run(
      `INSERT INTO Quizzes (unit_id, title, total_marks)
       VALUES (?, ?, ?)`,
      [unit.id, `Unit ${unit.unit_number} Quiz`, 100]
    );
  }

  const quizzes = await all<{ id: number; unit_id: number; unit_number: number }>(
    `SELECT q.id, q.unit_id, u.unit_number
     FROM Quizzes q
     JOIN Units u ON u.id = q.unit_id
     WHERE u.course_id = ? AND u.is_detailed_version_of IS NULL`,
    [mlCourse.id]
  );

  for (const quiz of quizzes) {
    if (quiz.unit_number === 1) {
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
        await run(
          `INSERT INTO Questions
           (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quiz.id,
            q.text,
            q.a,
            q.b,
            q.c,
            q.d,
            q.correct,
            'Review Unit 1: Introduction to Machine Learning for a deeper explanation.'
          ]
        );
      }
    } else {
      // Fallback: generic questions for other units (can be customized later per unit)
      for (let i = 1; i <= 10; i++) {
        await run(
          `INSERT INTO Questions
           (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quiz.id,
            `Question ${i} for unit ${quiz.unit_number}: conceptual check.`,
            'Option A',
            'Option B',
            'Option C',
            'Option D',
            'a',
            'Explanation for why option A is correct in this conceptual check.'
          ]
        );
      }
    }
  }

  console.log('Seed completed successfully.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed', err);
    process.exit(1);
  });

