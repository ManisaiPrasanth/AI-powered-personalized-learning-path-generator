import { all, get, initDb, run } from './connection';

type Mcq = {
  text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: 'a' | 'b' | 'c' | 'd';
  explanation: string;
};

function assertTen(unitNumber: number, questions: Mcq[]) {
  if (questions.length !== 10) {
    throw new Error(`Unit ${unitNumber} must have exactly 10 questions (found ${questions.length}).`);
  }
}

async function updateMachineLearningQuestions() {
  await initDb();

  const mlCourse = await get<{ id: number }>('SELECT id FROM Courses WHERE slug = ?', [
    'machine-learning'
  ]);
  if (!mlCourse) {
    console.error('Machine Learning course not found. Run migrate/seed first.');
    process.exit(1);
  }

  const baseUnits = await all<{ id: number; unit_number: number; title: string }>(
    'SELECT id, unit_number, title FROM Units WHERE course_id = ? AND is_detailed_version_of IS NULL ORDER BY unit_number',
    [mlCourse.id]
  );

  const questionsByUnit: Record<number, Mcq[]> = {
    1: [
      {
        text: 'Which of the following best describes Machine Learning?',
        a: 'Writing explicit rules for every possible input',
        b: 'Allowing computers to learn patterns from data and improve over time',
        c: 'Storing large amounts of data in databases',
        d: 'Running programs faster using better hardware',
        correct: 'b',
        explanation:
          'ML learns patterns from data rather than relying only on hand-written rules.'
      },
      {
        text: 'In supervised learning, the training data consists of:',
        a: 'Only input features without any outputs',
        b: 'Inputs paired with correct outputs (labels)',
        c: 'A sequence of actions and rewards',
        d: 'Randomly generated numbers',
        correct: 'b',
        explanation: 'Supervised learning uses labeled examples (X, y).'
      },
      {
        text: 'Which task is a typical example of classification in supervised learning?',
        a: 'Predicting tomorrow’s temperature as a real number',
        b: 'Grouping customers into similar segments without labels',
        c: 'Deciding whether an email is spam or not spam',
        d: 'Reducing the number of features in a dataset',
        correct: 'c',
        explanation: 'Spam detection predicts a discrete label (spam / not spam).'
      },
      {
        text: 'Unsupervised learning is mainly used to:',
        a: 'Predict a numeric target',
        b: 'Find hidden structure or groups in unlabeled data',
        c: 'Maximize long-term reward through actions',
        d: 'Manually label new datasets',
        correct: 'b',
        explanation: 'Unsupervised learning looks for structure (clusters, components) without labels.'
      },
      {
        text: 'Which scenario best matches reinforcement learning?',
        a: 'A model that clusters customers into groups',
        b: 'A model that predicts house prices from features',
        c: 'An agent that learns to play a game by receiving rewards and penalties',
        d: 'A model that compresses images',
        correct: 'c',
        explanation: 'RL learns by interacting with an environment using rewards.'
      },
      {
        text: 'Which of the following is a common step in a standard ML workflow?',
        a: 'Buying more servers before defining the problem',
        b: 'Training a model without checking data quality',
        c: 'Defining the problem, collecting data, preprocessing, training, then evaluating',
        d: 'Deploying the model before evaluating it',
        correct: 'c',
        explanation: 'A typical workflow includes problem framing → data → training → evaluation.'
      },
      {
        text: 'In the ML workflow, data preprocessing usually happens:',
        a: 'After deployment to production',
        b: 'Before model training, to clean and transform the data',
        c: 'Only if the model performs poorly',
        d: 'Only for image data, not tabular data',
        correct: 'b',
        explanation: 'Preprocessing prepares usable features and removes noise before training.'
      },
      {
        text: 'Which of these is a real-world application of Machine Learning?',
        a: 'Hard-coded rule-based menu in a restaurant POS',
        b: 'Text editor that only checks spelling with a fixed word list',
        c: 'Email spam filter that improves as it sees more labeled emails',
        d: 'Static web page with no user interaction',
        correct: 'c',
        explanation: 'Spam filters improve with more labeled examples and retraining.'
      },
      {
        text: 'Why is labeled data important for supervised learning?',
        a: 'It reduces the size of the dataset',
        b: 'It tells the model which clusters to form',
        c: 'It provides ground truth so the model can learn the mapping from inputs to outputs',
        d: 'It avoids the need for evaluation',
        correct: 'c',
        explanation: 'Labels provide the target the model is trying to predict.'
      },
      {
        text: 'Which statement about Machine Learning is TRUE?',
        a: 'ML models never make mistakes once trained',
        b: 'ML completely replaces human expertise in all domains',
        c: 'ML helps automate pattern discovery and prediction but still needs human oversight',
        d: 'ML can only be applied to image data',
        correct: 'c',
        explanation: 'ML is powerful but requires monitoring, validation, and responsible use.'
      }
    ],
    2: [
      {
        text: 'In ML, a feature vector \(x\) is most commonly represented as a:',
        a: 'Scalar',
        b: 'Vector',
        c: 'Matrix',
        d: 'Graph',
        correct: 'b',
        explanation: 'A single data point is typically represented as a vector of features.'
      },
      {
        text: 'What does the dot product \(w \\cdot x\) represent in a linear model?',
        a: 'A random guess',
        b: 'A weighted sum of input features',
        c: 'A probability distribution',
        d: 'A clustering assignment',
        correct: 'b',
        explanation: 'Linear models compute a weighted sum of features (plus bias).'
      },
      {
        text: 'Which quantity measures the “spread” of a dataset around its mean?',
        a: 'Median',
        b: 'Variance',
        c: 'Mode',
        d: 'Skewness only',
        correct: 'b',
        explanation: 'Variance (and standard deviation) measure dispersion.'
      },
      {
        text: 'If an event has probability 0, it is:',
        a: 'Certain',
        b: 'Impossible (in the model)',
        c: 'Equally likely as any other event',
        d: 'Always dependent on other events',
        correct: 'b',
        explanation: 'Probability 0 indicates impossibility under the assumed model.'
      },
      {
        text: 'Which is TRUE about probability vs statistics?',
        a: 'Probability predicts the past from samples, statistics predicts the future',
        b: 'Probability models uncertainty; statistics uses data to estimate model properties',
        c: 'They are unrelated fields',
        d: 'Statistics is only used for plotting charts',
        correct: 'b',
        explanation: 'Probability provides a model; statistics uses observed data to infer parameters.'
      },
      {
        text: 'Gradient descent updates parameters in order to:',
        a: 'Increase the loss',
        b: 'Minimize the loss by moving opposite the gradient',
        c: 'Randomly explore parameter space',
        d: 'Guarantee a global minimum in all cases',
        correct: 'b',
        explanation: 'Updates follow the negative gradient direction to reduce loss.'
      },
      {
        text: 'A learning rate in gradient descent controls:',
        a: 'How many features you have',
        b: 'The step size of parameter updates',
        c: 'The number of layers in a neural network',
        d: 'The train/test split ratio',
        correct: 'b',
        explanation: 'Learning rate scales the update magnitude.'
      },
      {
        text: 'Which matrix operation is commonly used to compute predictions for many samples at once in linear regression?',
        a: 'Element-wise division',
        b: 'Matrix multiplication \(Xw\)',
        c: 'Sorting the matrix',
        d: 'Taking the determinant',
        correct: 'b',
        explanation: 'Predictions can be computed efficiently via \(\\hat{y} = Xw\).'
      },
      {
        text: 'When data points are far from the mean, the variance tends to be:',
        a: 'Smaller',
        b: 'Larger',
        c: 'Always exactly 1',
        d: 'Always 0',
        correct: 'b',
        explanation: 'Greater spread around the mean increases variance.'
      },
      {
        text: 'The gradient of a loss function indicates:',
        a: 'The direction of steepest increase of the loss',
        b: 'The final accuracy of the model',
        c: 'The number of epochs to train',
        d: 'The correct class label',
        correct: 'a',
        explanation: 'Gradients point toward steepest increase; we move opposite to minimize loss.'
      }
    ],
    3: [
      {
        text: 'Linear Regression is primarily used to:',
        a: 'Predict a continuous numeric value',
        b: 'Predict a category label',
        c: 'Cluster unlabeled data',
        d: 'Reduce dimensionality',
        correct: 'a',
        explanation: 'Linear regression models continuous targets.'
      },
      {
        text: 'Logistic Regression is commonly used for:',
        a: 'Time-series clustering',
        b: 'Binary classification',
        c: 'Image compression',
        d: 'Unsupervised learning',
        correct: 'b',
        explanation: 'Logistic regression estimates probability of a class (often binary).'
      },
      {
        text: 'KNN classifies a new point by:',
        a: 'Fitting a line through the data',
        b: 'Looking at the labels of the \(k\) closest training points',
        c: 'Building a deep neural network',
        d: 'Maximizing explained variance',
        correct: 'b',
        explanation: 'KNN uses nearest neighbors in feature space.'
      },
      {
        text: 'A Decision Tree splits data using:',
        a: 'Random noise',
        b: 'Rules on features to increase purity (reduce impurity)',
        c: 'Only the first feature in the dataset',
        d: 'Only PCA components',
        correct: 'b',
        explanation: 'Trees choose splits that improve separation (e.g., Gini, entropy).'
      },
      {
        text: 'Which metric is MOST appropriate when classes are highly imbalanced?',
        a: 'Accuracy only',
        b: 'Precision/Recall (and F1) alongside accuracy',
        c: 'Mean squared error',
        d: 'Variance of features',
        correct: 'b',
        explanation: 'Accuracy can be misleading with imbalance; precision/recall capture trade-offs.'
      },
      {
        text: 'Precision answers the question:',
        a: 'Of all actual positives, how many did we find?',
        b: 'Of all predicted positives, how many were correct?',
        c: 'How close are numeric predictions to true values?',
        d: 'How many clusters exist?',
        correct: 'b',
        explanation: 'Precision = TP / (TP + FP).'
      },
      {
        text: 'Recall answers the question:',
        a: 'Of all actual positives, how many did we find?',
        b: 'Of all predicted positives, how many were correct?',
        c: 'How balanced is the dataset?',
        d: 'How many features are used?',
        correct: 'a',
        explanation: 'Recall = TP / (TP + FN).'
      },
      {
        text: 'Overfitting in supervised learning typically means:',
        a: 'Poor performance on training data and test data',
        b: 'Great performance on training data but poor generalization to new data',
        c: 'The model is too simple',
        d: 'The dataset has no labels',
        correct: 'b',
        explanation: 'Overfitting memorizes training patterns (including noise) and generalizes poorly.'
      },
      {
        text: 'Which is TRUE about K in KNN?',
        a: 'A larger \(k\) always improves accuracy',
        b: 'Choosing \(k\) is a hyperparameter trade-off between bias and variance',
        c: 'KNN does not need a distance function',
        d: 'KNN is always faster than linear models at prediction time',
        correct: 'b',
        explanation: 'Small \(k\) can be noisy; large \(k\) can oversmooth—tune \(k\).'
      },
      {
        text: 'A confusion matrix is used to summarize:',
        a: 'Feature correlations',
        b: 'True/false positives and true/false negatives',
        c: 'Cluster centroids',
        d: 'Gradient descent steps',
        correct: 'b',
        explanation: 'Confusion matrices break down classification outcomes.'
      }
    ],
    4: [
      {
        text: 'K-Means clustering aims to:',
        a: 'Maximize classification accuracy',
        b: 'Minimize within-cluster distances to centroids',
        c: 'Maximize within-cluster variance',
        d: 'Compute probabilities for class labels',
        correct: 'b',
        explanation: 'K-Means minimizes within-cluster sum of squared distances.'
      },
      {
        text: 'In K-Means, choosing \(k\) determines:',
        a: 'The number of features',
        b: 'The number of clusters',
        c: 'The learning rate',
        d: 'The number of test samples',
        correct: 'b',
        explanation: '\(k\) is the cluster count hyperparameter.'
      },
      {
        text: 'A common method to pick \(k\) in K-Means is:',
        a: 'The elbow method',
        b: 'Confusion matrix',
        c: 'Precision-recall curve',
        d: 'Gradient checking',
        correct: 'a',
        explanation: 'The elbow method evaluates inertia vs \(k\).'
      },
      {
        text: 'Hierarchical clustering is characterized by:',
        a: 'A single fixed \(k\) chosen upfront',
        b: 'A dendrogram (tree) of nested clusters',
        c: 'Only working on labeled data',
        d: 'Always being faster than K-Means',
        correct: 'b',
        explanation: 'Hierarchical methods build a clustering tree.'
      },
      {
        text: 'PCA is mainly used to:',
        a: 'Increase the number of features',
        b: 'Reduce dimensionality while preserving variance',
        c: 'Label data automatically',
        d: 'Compute shortest paths',
        correct: 'b',
        explanation: 'PCA projects data onto principal components that capture maximum variance.'
      },
      {
        text: 'Principal components are:',
        a: 'Random directions in feature space',
        b: 'Directions of maximum variance in the data',
        c: 'Always the original features',
        d: 'Cluster centers',
        correct: 'b',
        explanation: 'PCA finds orthogonal directions maximizing variance.'
      },
      {
        text: 'Which is TRUE about scaling features before K-Means?',
        a: 'Scaling is unnecessary because K-Means is scale-invariant',
        b: 'Scaling is often important because distance is sensitive to feature scale',
        c: 'Scaling makes K-Means supervised',
        d: 'Scaling changes the number of clusters automatically',
        correct: 'b',
        explanation: 'Distance-based methods can be dominated by large-scale features.'
      },
      {
        text: 'If two points are very similar in feature space, K-Means is likely to:',
        a: 'Put them in different clusters always',
        b: 'Assign them to the same cluster (depending on centroids)',
        c: 'Label them as positive and negative',
        d: 'Remove one point from the dataset',
        correct: 'b',
        explanation: 'Similar points tend to fall into the same cluster.'
      },
      {
        text: 'A key limitation of K-Means is that it:',
        a: 'Cannot handle any numeric data',
        b: 'Assumes roughly spherical clusters and can be sensitive to initialization',
        c: 'Requires labels',
        d: 'Always finds the global optimum',
        correct: 'b',
        explanation: 'K-Means can converge to local minima and prefers spherical clusters.'
      },
      {
        text: 'PCA can help ML workflows by:',
        a: 'Guaranteeing perfect accuracy',
        b: 'Reducing noise and speeding up models by compressing features',
        c: 'Replacing evaluation metrics',
        d: 'Automatically generating labels',
        correct: 'b',
        explanation: 'Lower-dimensional representations can reduce noise and improve efficiency.'
      }
    ],
    5: [
      {
        text: 'Underfitting happens when:',
        a: 'A model is too complex and memorizes the training data',
        b: 'A model is too simple to capture underlying patterns',
        c: 'The dataset is perfectly labeled',
        d: 'The learning rate is exactly 0',
        correct: 'b',
        explanation: 'Underfitting is high bias: model too simple.'
      },
      {
        text: 'Overfitting happens when:',
        a: 'A model performs poorly on training but well on test',
        b: 'A model learns noise in training data and generalizes poorly',
        c: 'A model uses too few features',
        d: 'A model has no parameters',
        correct: 'b',
        explanation: 'Overfitting is high variance: model fits noise.'
      },
      {
        text: 'Cross-validation is primarily used to:',
        a: 'Increase dataset size',
        b: 'Estimate generalization performance more reliably',
        c: 'Create labels for unlabeled data',
        d: 'Reduce the number of features',
        correct: 'b',
        explanation: 'CV provides robust performance estimates and helps tune hyperparameters.'
      },
      {
        text: 'Which is a hyperparameter (not learned directly from data)?',
        a: 'Weights in linear regression',
        b: 'Bias term in a neuron',
        c: 'Number of neighbors \(k\) in KNN',
        d: 'Predicted probabilities',
        correct: 'c',
        explanation: '\(k\) is chosen by the practitioner; it is not learned from data directly.'
      },
      {
        text: 'Regularization helps primarily to:',
        a: 'Increase overfitting',
        b: 'Reduce overfitting by penalizing large weights',
        c: 'Increase the number of classes',
        d: 'Remove the need for validation',
        correct: 'b',
        explanation: 'Regularization constraints model complexity and improves generalization.'
      },
      {
        text: 'L2 regularization (Ridge) typically encourages weights to be:',
        a: 'Exactly 0',
        b: 'Small but not necessarily zero',
        c: 'Only positive',
        d: 'Only negative',
        correct: 'b',
        explanation: 'L2 shrinks weights smoothly; L1 can drive some to zero.'
      },
      {
        text: 'L1 regularization (Lasso) can have the side-effect of:',
        a: 'Making all weights equal',
        b: 'Driving some weights to exactly zero (feature selection)',
        c: 'Increasing variance dramatically always',
        d: 'Removing the intercept term',
        correct: 'b',
        explanation: 'L1 promotes sparsity and can act as feature selection.'
      },
      {
        text: 'Hyperparameter tuning should be performed using:',
        a: 'The test set directly for decisions',
        b: 'A validation set or cross-validation',
        c: 'Only training accuracy',
        d: 'Random guessing without evaluation',
        correct: 'b',
        explanation: 'The test set should be held out for final evaluation.'
      },
      {
        text: 'If training accuracy is high but validation accuracy is low, the model is likely:',
        a: 'Underfitting',
        b: 'Overfitting',
        c: 'Perfectly fit',
        d: 'Untrainable',
        correct: 'b',
        explanation: 'This pattern indicates poor generalization (overfitting).'
      },
      {
        text: 'Which action can help reduce overfitting?',
        a: 'Use a simpler model or add regularization',
        b: 'Train on less data always',
        c: 'Evaluate only on training set',
        d: 'Increase noise in labels intentionally',
        correct: 'a',
        explanation: 'Reducing capacity and regularization are standard anti-overfitting methods.'
      }
    ],
    6: [
      {
        text: 'A perceptron computes its output by:',
        a: 'Clustering inputs into groups',
        b: 'Taking a weighted sum of inputs plus bias, then applying an activation',
        c: 'Sorting inputs by value',
        d: 'Computing principal components',
        correct: 'b',
        explanation: 'Perceptrons are basic neurons: \(y = f(w \\cdot x + b)\).'
      },
      {
        text: 'Why are activation functions important in neural networks?',
        a: 'They make the network linear',
        b: 'They introduce non-linearity so networks can model complex functions',
        c: 'They remove the need for training data',
        d: 'They guarantee global optimality',
        correct: 'b',
        explanation: 'Without non-linearity, stacked layers collapse into a linear function.'
      },
      {
        text: 'Which activation function is commonly used in modern deep networks due to simplicity and effectiveness?',
        a: 'ReLU',
        b: 'Identity only',
        c: 'Step function only',
        d: 'No activation',
        correct: 'a',
        explanation: 'ReLU is widely used for hidden layers.'
      },
      {
        text: 'A “deep” neural network generally refers to:',
        a: 'A network with many hidden layers',
        b: 'A network trained on small datasets only',
        c: 'A network with only one neuron',
        d: 'A network without parameters',
        correct: 'a',
        explanation: 'Depth refers to multiple layers between input and output.'
      },
      {
        text: 'Training a neural network typically involves minimizing a loss using:',
        a: 'Random guessing',
        b: 'Gradient-based optimization (e.g., gradient descent)',
        c: 'K-Means updates',
        d: 'Only manual weight tuning',
        correct: 'b',
        explanation: 'Neural networks learn via gradient-based optimization.'
      },
      {
        text: 'Backpropagation is used to:',
        a: 'Compute gradients of the loss with respect to network parameters efficiently',
        b: 'Initialize weights randomly',
        c: 'Cluster neurons into groups',
        d: 'Evaluate precision and recall',
        correct: 'a',
        explanation: 'Backprop applies the chain rule to compute gradients through layers.'
      },
      {
        text: 'If a network has no activation functions (all linear layers), it can only learn:',
        a: 'Any non-linear boundary',
        b: 'A linear transformation overall',
        c: 'Perfect classification always',
        d: 'K clusters',
        correct: 'b',
        explanation: 'A composition of linear transforms is still linear.'
      },
      {
        text: 'Which statement is TRUE about neural networks vs logistic regression?',
        a: 'Neural networks can represent more complex functions than logistic regression',
        b: 'Neural networks cannot do classification',
        c: 'Logistic regression always beats neural networks',
        d: 'Neural networks do not require data',
        correct: 'a',
        explanation: 'Neural networks generalize logistic regression with hidden layers.'
      },
      {
        text: 'A common challenge when training deep networks is:',
        a: 'No parameters to tune',
        b: 'Vanishing/exploding gradients',
        c: 'Too much labeled data always',
        d: 'Inability to compute loss',
        correct: 'b',
        explanation: 'Deep networks can suffer gradient instability; activations/initialization help.'
      },
      {
        text: 'In a neural network, weights are:',
        a: 'Fixed rules written by the programmer',
        b: 'Learned parameters adjusted during training',
        c: 'Always equal to 1',
        d: 'The same as labels',
        correct: 'b',
        explanation: 'Weights are learned from data via optimization.'
      }
    ],
    7: [
      {
        text: 'The main goal of ensemble methods is to:',
        a: 'Use a single model to reduce complexity',
        b: 'Combine multiple models to improve robustness and accuracy',
        c: 'Remove the need for training data',
        d: 'Convert regression problems into clustering',
        correct: 'b',
        explanation: 'Ensembles aggregate models to reduce error.'
      },
      {
        text: 'Bagging (Bootstrap Aggregating) typically reduces:',
        a: 'Bias only',
        b: 'Variance by averaging models trained on bootstrap samples',
        c: 'Training data size',
        d: 'The number of features automatically',
        correct: 'b',
        explanation: 'Averaging many models reduces variance.'
      },
      {
        text: 'Random Forests are an ensemble of:',
        a: 'Linear regressions',
        b: 'Decision trees with bagging and feature randomness',
        c: 'K-Means clusterers',
        d: 'Neural networks only',
        correct: 'b',
        explanation: 'Random Forests combine many randomized decision trees.'
      },
      {
        text: 'Boosting differs from bagging because boosting:',
        a: 'Trains models independently in parallel',
        b: 'Trains models sequentially, focusing on previous errors',
        c: 'Requires unlabeled data',
        d: 'Is only for regression',
        correct: 'b',
        explanation: 'Boosting is sequential error-correcting.'
      },
      {
        text: 'Which is a common boosting algorithm?',
        a: 'AdaBoost',
        b: 'KNN',
        c: 'PCA',
        d: 'K-Means',
        correct: 'a',
        explanation: 'AdaBoost is a classic boosting approach.'
      },
      {
        text: 'In Random Forests, choosing a random subset of features at each split helps to:',
        a: 'Make trees more correlated',
        b: 'Decorrelate trees so averaging works better',
        c: 'Increase training error intentionally',
        d: 'Remove the need for bootstrapping',
        correct: 'b',
        explanation: 'Less correlation among trees makes the ensemble stronger.'
      },
      {
        text: 'A typical advantage of ensembles is:',
        a: 'They always reduce both bias and variance to zero',
        b: 'They often improve predictive performance compared to a single model',
        c: 'They require no hyperparameters',
        d: 'They always train faster',
        correct: 'b',
        explanation: 'Ensembles frequently improve generalization.'
      },
      {
        text: 'A typical disadvantage of ensembles is:',
        a: 'They can be less interpretable and more computationally expensive',
        b: 'They cannot be used for classification',
        c: 'They cannot be used for regression',
        d: 'They do not generalize',
        correct: 'a',
        explanation: 'Ensembles can be harder to interpret and costlier to run.'
      },
      {
        text: 'Which statement is TRUE?',
        a: 'Bagging is usually more effective for reducing variance',
        b: 'Bagging always increases variance',
        c: 'Boosting never overfits',
        d: 'Random Forests require labels for clustering',
        correct: 'a',
        explanation: 'Bagging stabilizes unstable learners by reducing variance.'
      },
      {
        text: 'In practice, Random Forests are often a strong baseline because they:',
        a: 'Need no data preprocessing',
        b: 'Work well on many tabular datasets with minimal feature engineering',
        c: 'Always outperform neural networks on images',
        d: 'Are guaranteed to be perfectly accurate',
        correct: 'b',
        explanation: 'Random Forests are robust for many tabular problems.'
      }
    ],
    8: [
      {
        text: 'Why is stratified K-fold cross-validation useful for classification?',
        a: 'It ensures each fold has similar class proportions',
        b: 'It removes the need for labels',
        c: 'It always increases dataset size',
        d: 'It guarantees 100% accuracy',
        correct: 'a',
        explanation: 'Stratification preserves class balance in folds.'
      },
      {
        text: 'A validation curve helps you understand:',
        a: 'How model performance changes as you vary one hyperparameter',
        b: 'How to label data',
        c: 'How many clusters to choose in K-Means',
        d: 'How to compute gradients',
        correct: 'a',
        explanation: 'Validation curves show the effect of a hyperparameter on performance.'
      },
      {
        text: 'A learning curve typically plots performance vs:',
        a: 'Time of day',
        b: 'Training set size',
        c: 'Number of classes',
        d: 'Number of clusters',
        correct: 'b',
        explanation: 'Learning curves show how performance improves with more data.'
      },
      {
        text: 'Grid search tries:',
        a: 'A random subset of hyperparameters',
        b: 'All combinations in a predefined hyperparameter grid',
        c: 'Only one hyperparameter value',
        d: 'Only the best possible combination automatically',
        correct: 'b',
        explanation: 'Grid search enumerates all specified combinations.'
      },
      {
        text: 'Random search is often preferred over grid search when:',
        a: 'There are very few hyperparameters',
        b: 'The search space is large and only a few hyperparameters matter most',
        c: 'You have infinite compute',
        d: 'You do not want any randomness',
        correct: 'b',
        explanation: 'Random search can explore more effectively in large spaces.'
      },
      {
        text: 'Bayesian optimization aims to:',
        a: 'Pick hyperparameters without evaluating models',
        b: 'Use a model to guide the search toward promising hyperparameters',
        c: 'Replace cross-validation',
        d: 'Train neural networks faster without data',
        correct: 'b',
        explanation: 'Bayesian optimization uses surrogate models to guide exploration.'
      },
      {
        text: 'Which practice avoids test set leakage?',
        a: 'Tuning hyperparameters on the test set',
        b: 'Using test set once at the end for final evaluation',
        c: 'Using test set repeatedly for model selection',
        d: 'Training on the test set',
        correct: 'b',
        explanation: 'Keep the test set untouched until the final evaluation.'
      },
      {
        text: 'Nested cross-validation is useful because it:',
        a: 'Provides an unbiased estimate of performance when tuning hyperparameters',
        b: 'Always reduces training time',
        c: 'Removes the need for labels',
        d: 'Works only for clustering',
        correct: 'a',
        explanation: 'Nested CV separates tuning and evaluation to reduce bias.'
      },
      {
        text: 'If training score is low AND validation score is low, you likely have:',
        a: 'High variance (overfitting)',
        b: 'High bias (underfitting)',
        c: 'Perfect fit',
        d: 'Data leakage',
        correct: 'b',
        explanation: 'Both low indicates the model is too simple or features are weak.'
      },
      {
        text: 'If training score is high but validation score is low, you likely have:',
        a: 'Underfitting',
        b: 'Overfitting',
        c: 'Noisy labels always',
        d: 'No hyperparameters',
        correct: 'b',
        explanation: 'This gap indicates poor generalization (overfitting).'
      }
    ],
    9: [
      {
        text: 'Backpropagation relies on which mathematical rule to compute gradients?',
        a: 'Bayes’ rule',
        b: 'Chain rule',
        c: 'Pythagorean theorem',
        d: 'Central limit theorem',
        correct: 'b',
        explanation: 'Backprop uses the chain rule through composed functions.'
      },
      {
        text: 'Which optimizer adapts learning rates per parameter and is widely used?',
        a: 'Adam',
        b: 'K-Means',
        c: 'PCA',
        d: 'Decision Tree splitting',
        correct: 'a',
        explanation: 'Adam combines momentum and adaptive learning rates.'
      },
      {
        text: 'Dropout is primarily used to:',
        a: 'Increase model size',
        b: 'Reduce overfitting by randomly dropping units during training',
        c: 'Speed up inference by removing layers',
        d: 'Guarantee perfect accuracy',
        correct: 'b',
        explanation: 'Dropout is a regularization technique for neural networks.'
      },
      {
        text: 'Batch normalization can help by:',
        a: 'Eliminating the need for data',
        b: 'Stabilizing and accelerating training by normalizing activations',
        c: 'Turning classification into clustering',
        d: 'Removing gradients',
        correct: 'b',
        explanation: 'BatchNorm stabilizes distributions and helps training.'
      },
      {
        text: 'A multi-layer perceptron (MLP) is:',
        a: 'A linear model without hidden layers',
        b: 'A feed-forward neural network with one or more hidden layers',
        c: 'A clustering method',
        d: 'A dimensionality reduction method',
        correct: 'b',
        explanation: 'MLPs are feed-forward networks with hidden layers.'
      },
      {
        text: 'Vanishing gradients are more likely when using:',
        a: 'Sigmoid/tanh activations in deep networks without care',
        b: 'ReLU activations',
        c: 'No activation functions',
        d: 'Decision trees',
        correct: 'a',
        explanation: 'Sigmoid/tanh can saturate, producing tiny gradients.'
      },
      {
        text: 'A typical way to mitigate exploding gradients is:',
        a: 'Gradient clipping',
        b: 'Increasing learning rate dramatically',
        c: 'Removing the loss function',
        d: 'Using fewer labels',
        correct: 'a',
        explanation: 'Clipping caps gradient magnitude to stabilize training.'
      },
      {
        text: 'In supervised deep learning for classification, the last layer often uses:',
        a: 'Softmax (multi-class) or sigmoid (binary)',
        b: 'K-Means',
        c: 'PCA',
        d: 'No function at all',
        correct: 'a',
        explanation: 'Softmax/sigmoid convert logits to probabilities.'
      },
      {
        text: 'An epoch means:',
        a: 'One forward pass only',
        b: 'One full pass through the training dataset',
        c: 'One pass through the test set',
        d: 'One hyperparameter value',
        correct: 'b',
        explanation: 'An epoch is one complete iteration over the training data.'
      },
      {
        text: 'A key reason deep learning can outperform simpler models is:',
        a: 'It always has fewer parameters',
        b: 'It can learn hierarchical feature representations',
        c: 'It never overfits',
        d: 'It does not need preprocessing',
        correct: 'b',
        explanation: 'Deep models learn layered features from raw inputs.'
      }
    ],
    10: [
      {
        text: 'In CNNs, a convolutional filter (kernel) is used to:',
        a: 'Sort pixels by intensity',
        b: 'Extract local spatial patterns (e.g., edges, textures)',
        c: 'Compute probabilities directly',
        d: 'Cluster images into groups',
        correct: 'b',
        explanation: 'Kernels slide across the image to detect local patterns.'
      },
      {
        text: 'Pooling layers are used to:',
        a: 'Increase spatial resolution',
        b: 'Downsample feature maps and add some translational invariance',
        c: 'Compute gradients',
        d: 'Generate labels',
        correct: 'b',
        explanation: 'Pooling reduces dimensionality and helps robustness.'
      },
      {
        text: 'A key advantage of CNNs over fully-connected networks for images is that CNNs:',
        a: 'Ignore spatial structure',
        b: 'Exploit spatial locality and share weights',
        c: 'Require more parameters always',
        d: 'Cannot learn edges',
        correct: 'b',
        explanation: 'Convolutions share weights across locations and preserve spatial structure.'
      },
      {
        text: 'Feature maps are:',
        a: 'Lists of class labels',
        b: 'Outputs of convolutional layers that represent detected features',
        c: 'Hyperparameter grids',
        d: 'Only used in PCA',
        correct: 'b',
        explanation: 'Feature maps encode where features are detected.'
      },
      {
        text: 'Transfer learning means:',
        a: 'Training a CNN from scratch on a tiny dataset only',
        b: 'Reusing a pretrained model and fine-tuning it on your task',
        c: 'Switching from images to text only',
        d: 'Replacing labels with clusters',
        correct: 'b',
        explanation: 'Pretrained CNNs can be adapted to new tasks with less data.'
      },
      {
        text: 'Which is TRUE about convolution vs fully connected layers?',
        a: 'Convolution layers have local receptive fields and shared weights',
        b: 'Convolution layers connect every input pixel to every neuron uniquely',
        c: 'Fully connected layers preserve spatial arrangement naturally',
        d: 'Fully connected layers always use fewer parameters than convolution',
        correct: 'a',
        explanation: 'Convolutions are local and share weights across the image.'
      },
      {
        text: 'A stride in convolution controls:',
        a: 'The learning rate',
        b: 'The step size of the filter as it slides over the image',
        c: 'The number of classes',
        d: 'The batch size',
        correct: 'b',
        explanation: 'Stride affects output size and computation.'
      },
      {
        text: 'Padding in CNNs is commonly used to:',
        a: 'Remove features near the border',
        b: 'Control output size and preserve edge information',
        c: 'Reduce the number of channels to 1 always',
        d: 'Disable backpropagation',
        correct: 'b',
        explanation: 'Padding can preserve spatial dimensions and border features.'
      },
      {
        text: 'A common loss function for multi-class image classification is:',
        a: 'Cross-entropy loss',
        b: 'K-Means inertia',
        c: 'Explained variance',
        d: 'Silhouette score',
        correct: 'a',
        explanation: 'Cross-entropy is standard for classification.'
      },
      {
        text: 'Data augmentation helps computer vision models by:',
        a: 'Reducing dataset diversity',
        b: 'Increasing effective dataset size and improving generalization',
        c: 'Guaranteeing zero error',
        d: 'Removing the need for validation',
        correct: 'b',
        explanation: 'Augmentation creates varied examples to reduce overfitting.'
      }
    ],
    11: [
      {
        text: 'A key difference between sequence data and tabular data is that sequences:',
        a: 'Have no order',
        b: 'Have an order and temporal dependencies',
        c: 'Have no features',
        d: 'Cannot be modeled',
        correct: 'b',
        explanation: 'Sequence order matters (time, tokens, events).'
      },
      {
        text: 'RNNs are designed to:',
        a: 'Process each input independently',
        b: 'Maintain a hidden state to capture information across time steps',
        c: 'Cluster sequences without labels only',
        d: 'Compute PCA components',
        correct: 'b',
        explanation: 'RNNs propagate a hidden state across the sequence.'
      },
      {
        text: 'LSTMs/GRUs help address:',
        a: 'The need for labels',
        b: 'Long-term dependency issues in vanilla RNNs',
        c: 'The need for convolution',
        d: 'Feature scaling',
        correct: 'b',
        explanation: 'Gates help retain/forget information over long spans.'
      },
      {
        text: 'In time-series forecasting, a proper train/test split should usually be:',
        a: 'Random shuffle split',
        b: 'Chronological split (train on past, test on future)',
        c: 'Split by label value',
        d: 'Split by feature order',
        correct: 'b',
        explanation: 'Avoid leakage by respecting time order.'
      },
      {
        text: 'Teacher forcing in sequence models refers to:',
        a: 'Using true previous outputs as inputs during training',
        b: 'Using K-Means centroids',
        c: 'Dropping tokens randomly at inference',
        d: 'Normalizing feature maps',
        correct: 'a',
        explanation: 'It feeds ground truth tokens during training to stabilize learning.'
      },
      {
        text: 'A sequence-to-one task example is:',
        a: 'Next word prediction',
        b: 'Sentiment classification of a full sentence',
        c: 'Machine translation',
        d: 'Part-of-speech tagging',
        correct: 'b',
        explanation: 'Sentiment classification maps a sequence to a single label.'
      },
      {
        text: 'A sequence-to-sequence task example is:',
        a: 'Predicting house prices',
        b: 'Machine translation',
        c: 'PCA projection',
        d: 'K-Means clustering',
        correct: 'b',
        explanation: 'Translation maps one sequence to another sequence.'
      },
      {
        text: 'When evaluating forecasting models, you should avoid:',
        a: 'Using only future data',
        b: 'Leaking future information into training features',
        c: 'Using chronological splits',
        d: 'Using error metrics',
        correct: 'b',
        explanation: 'Future leakage makes metrics unrealistically optimistic.'
      },
      {
        text: 'A common metric for regression-based forecasting is:',
        a: 'Mean Absolute Error (MAE)',
        b: 'Precision',
        c: 'Recall',
        d: 'F1 score',
        correct: 'a',
        explanation: 'MAE/MSE/RMSE are common for numeric forecasts.'
      },
      {
        text: 'Which is TRUE about long sequences in RNNs?',
        a: 'They never cause training issues',
        b: 'They can make gradients unstable (vanishing/exploding), motivating gated RNNs',
        c: 'They are handled automatically without any changes',
        d: 'They require clustering instead of prediction',
        correct: 'b',
        explanation: 'Long sequences exacerbate gradient issues; LSTMs/GRUs help.'
      }
    ],
    12: [
      {
        text: 'Tokenization in NLP is the process of:',
        a: 'Converting text into smaller units (tokens) for modeling',
        b: 'Converting images to pixels',
        c: 'Clustering documents',
        d: 'Computing gradients',
        correct: 'a',
        explanation: 'Tokenization turns text into tokens (words/subwords).'
      },
      {
        text: 'TF-IDF is a method to:',
        a: 'Train neural networks faster',
        b: 'Represent text by term importance weights',
        c: 'Generate labels automatically',
        d: 'Perform clustering only',
        correct: 'b',
        explanation: 'TF-IDF weighs terms by frequency and rarity across documents.'
      },
      {
        text: 'Word embeddings aim to:',
        a: 'Represent words as dense vectors capturing semantic similarity',
        b: 'Sort words alphabetically',
        c: 'Remove stopwords',
        d: 'Compute PCA of images',
        correct: 'a',
        explanation: 'Embeddings encode meaning in vector space.'
      },
      {
        text: 'The key idea behind attention is to:',
        a: 'Force the model to ignore the input',
        b: 'Let the model focus on the most relevant parts of the input for each output',
        c: 'Remove the need for parameters',
        d: 'Guarantee perfect translation',
        correct: 'b',
        explanation: 'Attention weights contributions of different tokens dynamically.'
      },
      {
        text: 'Transformers are based primarily on:',
        a: 'Convolutions only',
        b: 'Self-attention mechanisms',
        c: 'Decision trees',
        d: 'K-Means',
        correct: 'b',
        explanation: 'Transformers rely on self-attention instead of recurrence.'
      },
      {
        text: 'Self-attention helps because it:',
        a: 'Processes tokens strictly one at a time',
        b: 'Models relationships between tokens regardless of distance',
        c: 'Always reduces dataset size',
        d: 'Eliminates the need for tokenization',
        correct: 'b',
        explanation: 'Attention can connect distant tokens in a single layer.'
      },
      {
        text: 'Positional encodings are used in Transformers to:',
        a: 'Remove word order',
        b: 'Inject information about token order since attention is order-agnostic',
        c: 'Compute gradients',
        d: 'Increase vocabulary size',
        correct: 'b',
        explanation: 'Transformers need explicit position info.'
      },
      {
        text: 'A major benefit of Transformers over RNNs is that Transformers:',
        a: 'Cannot be parallelized',
        b: 'Can be parallelized over sequence positions during training',
        c: 'Require less data always',
        d: 'Cannot do language modeling',
        correct: 'b',
        explanation: 'Parallelism is a key advantage for training speed.'
      },
      {
        text: 'In modern NLP, subword tokenization (e.g., BPE) helps with:',
        a: 'Increasing unknown tokens for rare words',
        b: 'Handling rare/new words by breaking them into subword units',
        c: 'Removing gradients',
        d: 'Replacing attention',
        correct: 'b',
        explanation: 'Subwords reduce OOV issues and improve generalization.'
      },
      {
        text: 'Which task is a classic NLP application?',
        a: 'Image edge detection',
        b: 'Text sentiment analysis',
        c: 'PCA for tabular data',
        d: 'K-Means customer clustering',
        correct: 'b',
        explanation: 'Sentiment analysis is a common NLP classification problem.'
      }
    ],
    13: [
      {
        text: 'MLOps primarily focuses on:',
        a: 'Only improving model accuracy on a static dataset',
        b: 'Operationalizing ML: deploying, monitoring, and maintaining models in production',
        c: 'Replacing ML with rules',
        d: 'Only doing clustering',
        correct: 'b',
        explanation: 'MLOps covers the lifecycle from training to production and monitoring.'
      },
      {
        text: 'Model serving means:',
        a: 'Training models on a GPU',
        b: 'Making a trained model available for predictions (often via an API)',
        c: 'Collecting labels from users',
        d: 'Running PCA',
        correct: 'b',
        explanation: 'Serving exposes the model for inference.'
      },
      {
        text: 'Data drift refers to:',
        a: 'The model weights changing randomly',
        b: 'Changes in input data distribution over time',
        c: 'Accuracy always increasing',
        d: 'Better preprocessing',
        correct: 'b',
        explanation: 'Drift is a shift in data patterns, which can degrade performance.'
      },
      {
        text: 'Concept drift refers to:',
        a: 'Changes in the relationship between inputs and targets',
        b: 'A new database table',
        c: 'Training on less data',
        d: 'Using a different optimizer',
        correct: 'a',
        explanation: 'Concept drift changes the underlying mapping \(P(y|x)\).'
      },
      {
        text: 'A best practice for reproducibility is to version:',
        a: 'Only the code',
        b: 'Code, data, and model artifacts (and environment) together',
        c: 'Only the UI',
        d: 'Only the CPU model',
        correct: 'b',
        explanation: 'Reproducibility requires versioning across the whole pipeline.'
      },
      {
        text: 'CI/CD in ML commonly helps to:',
        a: 'Automate testing and deployment of models/pipelines',
        b: 'Avoid evaluation',
        c: 'Remove monitoring',
        d: 'Eliminate data collection',
        correct: 'a',
        explanation: 'Automation reduces manual errors and speeds safe iteration.'
      },
      {
        text: 'Monitoring a deployed ML model often includes tracking:',
        a: 'Only CPU temperature',
        b: 'Latency, error rates, and performance metrics over time',
        c: 'Only the training accuracy',
        d: 'Only feature names',
        correct: 'b',
        explanation: 'Production monitoring includes system + model metrics.'
      },
      {
        text: 'A/B testing for ML models helps to:',
        a: 'Compare models in production using controlled experiments',
        b: 'Train models faster',
        c: 'Reduce number of features',
        d: 'Remove labels',
        correct: 'a',
        explanation: 'A/B tests measure impact on real users or systems.'
      },
      {
        text: 'Which is a common risk in production ML systems?',
        a: 'No users',
        b: 'Training-serving skew (differences between training and production data/processing)',
        c: 'Too many metrics',
        d: 'No hyperparameters',
        correct: 'b',
        explanation: 'Skew can cause performance drops at inference time.'
      },
      {
        text: 'Why do we retrain models over time?',
        a: 'To make them slower',
        b: 'To adapt to drift and changing data patterns',
        c: 'Because evaluation is unnecessary',
        d: 'To remove the need for monitoring',
        correct: 'b',
        explanation: 'Retraining keeps models aligned with evolving real-world data.'
      }
    ],
    14: [
      {
        text: 'Bias in ML systems can come from:',
        a: 'Only the model architecture',
        b: 'Data collection, labeling, and historical inequities reflected in data',
        c: 'Only the GPU hardware',
        d: 'Only the UI colors',
        correct: 'b',
        explanation: 'Bias is often rooted in data and societal context.'
      },
      {
        text: 'A fairness concern means that:',
        a: 'All groups always get identical outcomes regardless of context',
        b: 'Model performance or outcomes may differ across demographic groups',
        c: 'The model is too fast',
        d: 'The model is unsupervised',
        correct: 'b',
        explanation: 'Fairness evaluates disparities and potential harm to groups.'
      },
      {
        text: 'Explainability is important because it:',
        a: 'Guarantees higher accuracy',
        b: 'Helps stakeholders understand and trust model decisions',
        c: 'Eliminates the need for data',
        d: 'Makes models random',
        correct: 'b',
        explanation: 'Interpretability supports auditing, debugging, and accountability.'
      },
      {
        text: 'Data privacy in ML often relates to:',
        a: 'Storing passwords in plain text',
        b: 'Protecting sensitive personal information used in training/inference',
        c: 'Increasing model size',
        d: 'Choosing \(k\) in K-Means',
        correct: 'b',
        explanation: 'Privacy protections reduce risk of exposing personal data.'
      },
      {
        text: 'Which is an example of responsible AI practice?',
        a: 'Deploying without monitoring',
        b: 'Auditing model performance across groups and monitoring for drift',
        c: 'Hiding documentation',
        d: 'Using test set for tuning',
        correct: 'b',
        explanation: 'Responsible AI includes evaluation, monitoring, and documentation.'
      },
      {
        text: 'A model that performs well overall but poorly for a minority group illustrates:',
        a: 'No fairness issue',
        b: 'A potential fairness problem',
        c: 'Perfect generalization',
        d: 'A need for fewer features only',
        correct: 'b',
        explanation: 'Disparate performance can cause disproportionate harm.'
      },
      {
        text: 'Accountability in AI means:',
        a: 'No one is responsible for model outcomes',
        b: 'Clear ownership and processes for addressing harm and errors',
        c: 'Only improving speed',
        d: 'Only increasing complexity',
        correct: 'b',
        explanation: 'Accountability assigns responsibility and remediation processes.'
      },
      {
        text: 'A common risk with large language models is:',
        a: 'They cannot generate text',
        b: 'Hallucination: producing plausible but incorrect information',
        c: 'They always reveal training data',
        d: 'They cannot be monitored',
        correct: 'b',
        explanation: 'LLMs can generate confident but wrong statements.'
      },
      {
        text: 'A safe deployment practice includes:',
        a: 'No rate limiting',
        b: 'Input validation, abuse monitoring, and human-in-the-loop for high-stakes use',
        c: 'Skipping security reviews',
        d: 'Publishing private logs',
        correct: 'b',
        explanation: 'Safety includes guardrails and monitoring.'
      },
      {
        text: 'Why should we document datasets and models (e.g., datasheets/model cards)?',
        a: 'To reduce transparency',
        b: 'To communicate intended use, limitations, and risks',
        c: 'To increase bias',
        d: 'To avoid evaluation',
        correct: 'b',
        explanation: 'Documentation supports responsible use and informed decision-making.'
      }
    ]
  };

  for (const unit of baseUnits) {
    const unitQuestions = questionsByUnit[unit.unit_number];
    if (!unitQuestions) {
      // If a unit exists in the DB but we haven't defined a question set yet, skip it safely.
      // This avoids accidental deletion of custom questions.
      // eslint-disable-next-line no-console
      console.warn(
        `Skipping Unit ${unit.unit_number} (${unit.title}): no question bank defined.`
      );
      continue;
    }

    assertTen(unit.unit_number, unitQuestions);

    const quiz = await get<{ id: number }>('SELECT id FROM Quizzes WHERE unit_id = ?', [unit.id]);
    if (!quiz) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping Unit ${unit.unit_number} (${unit.title}): quiz not found.`);
      continue;
    }

    await run('DELETE FROM Questions WHERE quiz_id = ?', [quiz.id]);

    for (const q of unitQuestions) {
      await run(
        `INSERT INTO Questions
         (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [quiz.id, q.text, q.a, q.b, q.c, q.d, q.correct, q.explanation]
      );
    }
  }

  console.log('Machine Learning quiz questions updated successfully.');
}

updateMachineLearningQuestions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to update Machine Learning quiz questions', err);
    process.exit(1);
  });

