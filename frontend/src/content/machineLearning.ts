export type ResourceLink = { label: string; url: string };

export type UnitSection =
  | { type: 'text'; heading: string; body: string; bullets?: string[] }
  | { type: 'code'; heading: string; code: string }
  | { type: 'diagram'; heading: string; diagram: string; caption?: string }
  | { type: 'callout'; tone: 'info' | 'tip' | 'warn'; heading: string; body: string };

export type MlUnitContent = {
  title: string;
  overview: string;
  keyTakeaways: string[];
  sections: UnitSection[];
  resources: {
    youtube: ResourceLink[];
    datasets: ResourceLink[];
    docs: ResourceLink[];
  };
  practice: string[];
  wikiTopic: string;
};

const yt = (q: string): ResourceLink => ({
  label: `YouTube: ${q}`,
  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
});

const kaggle = (q: string): ResourceLink => ({
  label: `Kaggle datasets: ${q}`,
  url: `https://www.kaggle.com/search?q=${encodeURIComponent(q)}`
});

const uci = (q: string): ResourceLink => ({
  label: `UCI datasets: ${q}`,
  url: `https://archive.ics.uci.edu/datasets?search=${encodeURIComponent(q)}`
});

export const mlUnits: Record<number, MlUnitContent> = {
  1: {
    title: 'Introduction to Machine Learning',
    overview:
      'You’ll build a clear mental model of what ML is, the main learning paradigms, and the end-to-end workflow used in real projects.',
    keyTakeaways: [
      'ML learns patterns from data to make predictions/decisions.',
      'Supervised vs unsupervised vs reinforcement learning: different problem setups.',
      'Workflow: define → collect → prepare → train → evaluate → deploy → monitor.'
    ],
    wikiTopic: 'Machine_learning',
    sections: [
      {
        type: 'text',
        heading: 'What is Machine Learning?',
        body:
          'Machine Learning (ML) is a way to build systems that improve performance on a task by learning patterns from data. Instead of hard-coding rules, we fit a model so it can generalize to new, unseen inputs.'
      },
      {
        type: 'diagram',
        heading: 'The ML “recipe”',
        diagram: `Data + Model + Objective  →  Learning
        |
        v
Trained model → Predictions → Decisions`,
        caption: 'ML is optimization: adjust parameters to reduce error on data.'
      },
      {
        type: 'text',
        heading: 'Types of ML (with examples)',
        body:
          'Different paradigms apply depending on what supervision you have.',
        bullets: [
          'Supervised: labeled data (spam vs not spam, house price prediction).',
          'Unsupervised: no labels (customer segmentation, anomaly discovery).',
          'Reinforcement: agent interacts with environment (game playing, robotics).'
        ]
      },
      {
        type: 'callout',
        tone: 'tip',
        heading: 'Real-world intuition',
        body:
          'Think of supervised learning like practicing with an answer key; unsupervised learning like organizing a messy closet into groups; reinforcement learning like learning a sport by trying moves and getting feedback.'
      },
      {
        type: 'code',
        heading: 'Mini example: training a simple model (scikit-learn)',
        code: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# X: features, y: labels
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

pred = model.predict(X_test)
print("accuracy:", accuracy_score(y_test, pred))`
      }
    ],
    resources: {
      youtube: [
        yt('Machine Learning explained for beginners'),
        yt('Andrew Ng machine learning introduction'),
        yt('StatQuest supervised vs unsupervised vs reinforcement learning')
      ],
      datasets: [kaggle('spam email dataset'), uci('adult income'), uci('iris dataset')],
      docs: [
        {
          label: 'scikit-learn: Getting started',
          url: 'https://scikit-learn.org/stable/getting_started.html'
        }
      ]
    },
    practice: [
      'Pick a problem (spam, prices, churn). Write down: inputs (features), output (label), and what “good” means (metric).',
      'Identify which ML type fits your problem and why.'
    ]
  },

  2: {
    title: 'Mathematics for ML',
    overview:
      'You’ll learn the math you actually use: vectors/matrices, probability & statistics, and the intuition of gradient descent.',
    keyTakeaways: [
      'Vectors/matrices represent data and transformations.',
      'Probability models uncertainty; statistics summarizes data and supports inference.',
      'Gradient descent optimizes model parameters by following the loss gradient.'
    ],
    wikiTopic: 'Gradient_descent',
    sections: [
      {
        type: 'text',
        heading: 'Linear algebra basics (what you need)',
        body:
          'In ML, a single sample is usually a feature vector \(x\\). A dataset is often a matrix \(X\\) where each row is a sample. Many models are built from matrix multiplication.'
      },
      {
        type: 'diagram',
        heading: 'Shapes matter',
        diagram: `X (n × d)  ·  w (d × 1)  =  ŷ (n × 1)
n = samples, d = features`,
        caption: 'A common pattern across linear models.'
      },
      {
        type: 'text',
        heading: 'Probability & statistics (practical view)',
        body:
          'Probability answers “what could happen?” Statistics answers “what does the data say happened?” You will repeatedly use mean/variance, distributions, and conditional probability.'
      },
      {
        type: 'text',
        heading: 'Gradient descent intuition',
        body:
          'We define a loss function that measures error. Gradient descent updates parameters in the direction that reduces loss, using the gradient (slope) as guidance.',
        bullets: [
          'Learning rate controls step size.',
          'Too large → divergence; too small → slow learning.',
          'Variants: mini-batch, momentum, Adam.'
        ]
      },
      {
        type: 'code',
        heading: 'Toy gradient descent (1D)',
        code: `# Minimize f(w) = (w - 3)^2
w = 0.0
lr = 0.1
for step in range(20):
    grad = 2 * (w - 3)     # derivative
    w = w - lr * grad
print("w:", w)  # approaches 3`
      }
    ],
    resources: {
      youtube: [
        yt('3Blue1Brown linear algebra essence of linear algebra'),
        yt('StatQuest gradient descent'),
        yt('Probability and statistics for machine learning')
      ],
      datasets: [uci('wine quality'), kaggle('titanic')],
      docs: [
        {
          label: 'scikit-learn: Model selection & evaluation',
          url: 'https://scikit-learn.org/stable/model_selection.html'
        }
      ]
    },
    practice: [
      'Compute mean/variance for a small list manually.',
      'Implement gradient descent for a simple quadratic and plot loss over steps.'
    ]
  },

  3: {
    title: 'Supervised Learning',
    overview:
      'You’ll learn core supervised algorithms and how to evaluate them properly using the right metrics.',
    keyTakeaways: [
      'Regression predicts numbers; classification predicts categories.',
      'KNN is distance-based; trees are rule-based.',
      'Metrics must match the business cost (precision/recall trade-offs).'
    ],
    wikiTopic: 'Supervised_learning',
    sections: [
      {
        type: 'text',
        heading: 'Regression vs classification',
        body:
          'Regression predicts a continuous value (house price). Classification predicts a discrete class (spam/not spam).'
      },
      {
        type: 'text',
        heading: 'Core algorithms',
        body:
          'Linear Regression, Logistic Regression, KNN, and Decision Trees are foundational baselines you should understand deeply.',
        bullets: [
          'Linear Regression: fit best line/plane (least squares).',
          'Logistic Regression: probability of class via sigmoid.',
          'KNN: vote/average among nearest neighbors.',
          'Decision Trees: split features to reduce impurity.'
        ]
      },
      {
        type: 'diagram',
        heading: 'Confusion matrix (binary classification)',
        diagram: `                 Pred +
Actual +     |    TP   |   FN
Actual -     |    FP   |   TN`,
        caption: 'Precision/Recall are derived from TP/FP/FN/TN.'
      },
      {
        type: 'code',
        heading: 'Classification metrics (scikit-learn)',
        code: `from sklearn.metrics import classification_report, confusion_matrix

print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))`
      },
      {
        type: 'callout',
        tone: 'warn',
        heading: 'Accuracy trap',
        body:
          'With imbalanced data, a “dumb” model can get high accuracy by always predicting the majority class. Use precision/recall (and a confusion matrix) to see what’s really happening.'
      }
    ],
    resources: {
      youtube: [yt('StatQuest logistic regression'), yt('KNN explained'), yt('Decision trees explained')],
      datasets: [kaggle('titanic'), uci('breast cancer wisconsin')],
      docs: [
        { label: 'scikit-learn: Supervised learning', url: 'https://scikit-learn.org/stable/supervised_learning.html' }
      ]
    },
    practice: [
      'Train Logistic Regression on Titanic and compare precision/recall vs accuracy.',
      'Try different \(k\) in KNN and observe bias/variance behavior.'
    ]
  },

  4: {
    title: 'Unsupervised Learning',
    overview:
      'You’ll learn clustering and dimensionality reduction—how to find structure without labels.',
    keyTakeaways: [
      'K-Means groups by similarity (distance to centroids).',
      'Hierarchical clustering builds a dendrogram.',
      'PCA compresses features while preserving variance.'
    ],
    wikiTopic: 'K-means_clustering',
    sections: [
      {
        type: 'text',
        heading: 'Clustering: what and why',
        body:
          'Clustering finds groups in data when you don’t have labels. It’s used for segmentation, summarization, and anomaly discovery.'
      },
      {
        type: 'text',
        heading: 'K-Means (high-level algorithm)',
        body:
          'K-Means alternates between assigning points to the nearest centroid and recomputing centroids until convergence.',
        bullets: ['Choose k', 'Initialize centroids', 'Assign points', 'Update centroids', 'Repeat until stable']
      },
      {
        type: 'code',
        heading: 'K-Means in scikit-learn',
        code: `from sklearn.cluster import KMeans

kmeans = KMeans(n_clusters=3, random_state=42, n_init="auto")
labels = kmeans.fit_predict(X)`
      },
      {
        type: 'text',
        heading: 'PCA: compress features',
        body:
          'PCA finds directions (principal components) that capture maximum variance, enabling lower-dimensional representations for visualization or faster models.'
      }
    ],
    resources: {
      youtube: [yt('K-Means clustering explained'), yt('Hierarchical clustering dendrogram explained'), yt('PCA explained')],
      datasets: [uci('iris dataset'), kaggle('customer segmentation')],
      docs: [{ label: 'scikit-learn: Clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html' }]
    },
    practice: [
      'Use PCA to reduce a dataset to 2D and plot it.',
      'Run K-Means on standardized features and compare results with and without scaling.'
    ]
  },

  5: {
    title: 'Model Optimization',
    overview:
      'You’ll learn how to improve generalization: diagnose overfitting/underfitting, validate properly, and tune hyperparameters.',
    keyTakeaways: [
      'Overfitting vs underfitting is bias/variance trade-off.',
      'Cross-validation provides reliable estimates.',
      'Regularization reduces overfitting by constraining parameters.'
    ],
    wikiTopic: 'Regularization_(mathematics)',
    sections: [
      {
        type: 'diagram',
        heading: 'Bias–variance intuition',
        diagram: `Underfit:  high bias, low variance
Overfit:   low bias, high variance
Goal:      balance → good generalization`,
        caption: 'Generalization is the goal, not perfect training accuracy.'
      },
      {
        type: 'text',
        heading: 'Cross-validation & hyperparameter tuning',
        body:
          'Use CV to avoid trusting a single split. Tune hyperparameters on validation/CV, and evaluate final performance once on the test set.'
      },
      {
        type: 'code',
        heading: 'Grid search example',
        code: `from sklearn.model_selection import GridSearchCV
from sklearn.svm import SVC

param_grid = {"C": [0.1, 1, 10], "gamma": [0.01, 0.1, 1]}
search = GridSearchCV(SVC(), param_grid=param_grid, cv=5)
search.fit(X_train, y_train)
print("best:", search.best_params_)`
      },
      {
        type: 'text',
        heading: 'Regularization',
        body:
          'L2 (Ridge) shrinks weights smoothly; L1 (Lasso) can drive some weights to zero (feature selection).'
      }
    ],
    resources: {
      youtube: [yt('Overfitting vs underfitting explained'), yt('Cross validation explained'), yt('Regularization L1 L2 explained')],
      datasets: [kaggle('house prices'), uci('wine quality')],
      docs: [{ label: 'scikit-learn: Cross validation', url: 'https://scikit-learn.org/stable/modules/cross_validation.html' }]
    },
    practice: [
      'Plot train vs validation score for different model complexities.',
      'Try L1 vs L2 regularization and observe which features remain.'
    ]
  },

  6: {
    title: 'Introduction to Neural Networks',
    overview:
      'You’ll understand perceptrons, activations, and why depth enables powerful function approximation.',
    keyTakeaways: [
      'A neuron computes \(f(w·x + b)\).',
      'Non-linear activations unlock expressive models.',
      'Backpropagation + gradient descent trains networks.'
    ],
    wikiTopic: 'Artificial_neural_network',
    sections: [
      {
        type: 'diagram',
        heading: 'A single neuron',
        diagram: `x1 ─┐
x2 ─┼─>  ( w·x + b )  ─>  activation  ─>  ŷ
x3 ─┘`,
        caption: 'Neurons are building blocks: weighted sum + activation.'
      },
      {
        type: 'text',
        heading: 'Activation functions',
        body:
          'Common activations: sigmoid (probabilities), tanh, and ReLU (popular hidden-layer default). Without activations, many layers collapse into one linear layer.'
      },
      {
        type: 'code',
        heading: 'Tiny NN example (conceptual pseudo-code)',
        code: `# forward pass (2-layer MLP)
h = relu(W1 @ x + b1)
y_hat = softmax(W2 @ h + b2)

# training uses gradients via backprop + optimizer (e.g., Adam)`
      }
    ],
    resources: {
      youtube: [yt('Perceptron and activation functions explained'), yt('Backpropagation explained'), yt('Deep learning basics for beginners')],
      datasets: [kaggle('mnist'), uci('handwritten digits')],
      docs: [{ label: 'PyTorch: Getting started', url: 'https://pytorch.org/get-started/locally/' }]
    },
    practice: [
      'Train a simple MLP on MNIST (or Fashion-MNIST) and compare to Logistic Regression.',
      'Experiment with ReLU vs sigmoid and observe training behavior.'
    ]
  },

  // Advanced units (7–14): content + resources (used if you added advanced units in DB)
  7: {
    title: 'Ensemble Methods',
    overview: 'Learn why combining models often boosts accuracy and stability.',
    keyTakeaways: [
      'Bagging reduces variance by averaging many models.',
      'Boosting improves performance by focusing on previous errors.',
      'Random Forests are strong baselines for tabular data.'
    ],
    wikiTopic: 'Ensemble_learning',
    sections: [
      { type: 'text', heading: 'Why ensembles work', body: 'They average out individual model errors and improve robustness.' },
      { type: 'text', heading: 'Bagging vs boosting', body: 'Bagging trains independently; boosting trains sequentially to fix mistakes.' }
    ],
    resources: { youtube: [yt('Random Forest explained'), yt('Gradient boosting explained')], datasets: [kaggle('credit card fraud'), uci('bank marketing')], docs: [{ label: 'scikit-learn: Ensembles', url: 'https://scikit-learn.org/stable/modules/ensemble.html' }] },
    practice: ['Compare a single decision tree vs Random Forest on a tabular dataset.'],
  },
  8: {
    title: 'Advanced Evaluation & Hyperparameter Tuning',
    overview: 'Make evaluation reliable and tune models without leakage.',
    keyTakeaways: ['Use stratified CV for classification', 'Random search scales better', 'Nested CV for unbiased estimates'],
    wikiTopic: 'Cross-validation_(statistics)',
    sections: [
      { type: 'text', heading: 'Cross-validation strategies', body: 'K-fold, stratified, time-series splits—choose based on data structure.' },
      { type: 'text', heading: 'Search methods', body: 'Grid, random, Bayesian optimization—trade-offs in compute vs coverage.' }
    ],
    resources: { youtube: [yt('Cross validation k-fold explained'), yt('Grid search vs random search')], datasets: [kaggle('titanic'), uci('wine quality')], docs: [{ label: 'scikit-learn: Tuning', url: 'https://scikit-learn.org/stable/modules/grid_search.html' }] },
    practice: ['Run random search for an SVM and compare to grid search.']
  },
  9: {
    title: 'Neural Networks and Deep Learning',
    overview: 'Go deeper: training stability, regularization, and modern optimizers.',
    keyTakeaways: ['Chain rule via backprop', 'Adam is a common optimizer', 'Regularization in deep learning (dropout, batchnorm)'],
    wikiTopic: 'Backpropagation',
    sections: [
      { type: 'text', heading: 'Backprop intuition', body: 'Backprop computes gradients efficiently through the network using the chain rule.' },
      { type: 'text', heading: 'Stability tricks', body: 'BatchNorm, dropout, initialization, and gradient clipping improve training.' }
    ],
    resources: { youtube: [yt('Backpropagation chain rule explained'), yt('Adam optimizer explained'), yt('Dropout and batch normalization')], datasets: [kaggle('mnist'), kaggle('cifar10')], docs: [{ label: 'DeepLearning.AI: resources', url: 'https://www.deeplearning.ai/' }] },
    practice: ['Train a small CNN/MLP and add dropout; compare validation accuracy.']
  },
  10: {
    title: 'Computer Vision with CNNs',
    overview: 'Learn convolutions, pooling, and transfer learning for images.',
    keyTakeaways: ['Convolutions extract local features', 'Pooling downsamples and adds invariance', 'Transfer learning helps with limited data'],
    wikiTopic: 'Convolutional_neural_network',
    sections: [
      { type: 'text', heading: 'CNN building blocks', body: 'Conv → activation → pooling → repeat → classifier head.' },
      { type: 'text', heading: 'Transfer learning', body: 'Fine-tune a pretrained model (ResNet/EfficientNet) for your dataset.' }
    ],
    resources: { youtube: [yt('CNN explained'), yt('Transfer learning tutorial')], datasets: [kaggle('cats and dogs'), kaggle('cifar10')], docs: [{ label: 'PyTorch vision', url: 'https://pytorch.org/vision/stable/index.html' }] },
    practice: ['Use a pretrained CNN and fine-tune on a small image dataset.']
  },
  11: {
    title: 'Sequence Models and Time Series',
    overview: 'Model temporal dependencies (RNN/LSTM/GRU) and forecast time series safely.',
    keyTakeaways: ['Respect chronological splits', 'Gated RNNs handle long dependencies', 'Avoid future leakage'],
    wikiTopic: 'Recurrent_neural_network',
    sections: [
      { type: 'text', heading: 'Temporal dependencies', body: 'Sequences have order; models should capture how past influences future.' },
      { type: 'text', heading: 'Time-series validation', body: 'Use walk-forward or time-based splits, not random shuffles.' }
    ],
    resources: { youtube: [yt('LSTM explained'), yt('Time series forecasting basics')], datasets: [kaggle('time series'), uci('electricity load')], docs: [{ label: 'scikit-learn: Time series split', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html' }] },
    practice: ['Forecast a simple time series with a baseline + a sequence model.']
  },
  12: {
    title: 'NLP and Transformers',
    overview: 'Understand tokenization, embeddings, attention, and Transformers.',
    keyTakeaways: ['Tokenization converts text to tokens', 'Attention focuses on relevant tokens', 'Transformers scale via parallelism'],
    wikiTopic: 'Transformer_(machine_learning_model)',
    sections: [
      { type: 'text', heading: 'From tokens to embeddings', body: 'Tokens become vectors; models learn patterns over sequences.' },
      { type: 'text', heading: 'Attention & Transformers', body: 'Self-attention models relationships across a sequence efficiently.' }
    ],
    resources: { youtube: [yt('Attention mechanism explained'), yt('Transformer explained')], datasets: [kaggle('sentiment analysis'), uci('sms spam')], docs: [{ label: 'Hugging Face Transformers', url: 'https://huggingface.co/docs/transformers/index' }] },
    practice: ['Fine-tune a small transformer on sentiment classification.']
  },
  13: {
    title: 'Deployment and MLOps',
    overview: 'Ship models reliably: serving, monitoring, drift, and automation.',
    keyTakeaways: ['Serve models via APIs', 'Monitor drift and performance', 'Version code/data/models for reproducibility'],
    wikiTopic: 'MLOps',
    sections: [
      { type: 'text', heading: 'Serving & monitoring', body: 'Deploy behind an API; track latency, errors, and model metrics.' },
      { type: 'text', heading: 'Drift', body: 'Data changes over time; detect drift and plan retraining workflows.' }
    ],
    resources: { youtube: [yt('MLOps explained'), yt('Model monitoring and drift')], datasets: [kaggle('churn'), kaggle('fraud detection')], docs: [{ label: 'Model cards (Google)', url: 'https://modelcards.withgoogle.com/about' }] },
    practice: ['Write a simple inference API and log inputs/outputs for monitoring.']
  },
  14: {
    title: 'Ethics, Fairness, and Responsible AI',
    overview: 'Build safer AI: fairness, privacy, explainability, and accountability.',
    keyTakeaways: ['Bias can enter through data and labels', 'Evaluate across groups', 'Document limitations and risks'],
    wikiTopic: 'Algorithmic_bias',
    sections: [
      { type: 'text', heading: 'Fairness and bias', body: 'Assess disparities, measure impact, and mitigate where possible.' },
      { type: 'text', heading: 'Privacy and safety', body: 'Protect sensitive data; add guardrails; monitor harmful behaviors.' }
    ],
    resources: { youtube: [yt('Algorithmic bias explained'), yt('Responsible AI model cards')], datasets: [uci('adult income')], docs: [{ label: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework' }] },
    practice: ['Evaluate model performance by subgroup and document findings and mitigations.']
  }
};

