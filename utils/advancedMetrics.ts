import { Submission, KoboQuestion } from '../types';

/**
 * Advanced metrics and KPI calculations for data analysis
 */

export interface CompletionMetrics {
  totalSubmissions: number;
  completionRate: number;
  questionCompletionRates: { [questionName: string]: number };
  averageCompletionTime: number;
}

export interface ConsistencyMetrics {
  overallConsistency: number;
  questionConsistencyScores: { [questionName: string]: number };
  potentialInconsistencies: Array<{
    submissionId: string;
    questionName: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface AnomalyMetrics {
  totalAnomalies: number;
  anomaliesByType: { [type: string]: number };
  flaggedSubmissions: Array<{
    submissionId: string;
    anomalyType: string;
    description: string;
    confidence: number;
  }>;
}

export interface DataQualityScore {
  overallScore: number; // 0-100
  completionScore: number;
  consistencyScore: number;
  timelinessScore: number;
  accuracyScore: number;
  breakdown: {
    completion: number;
    consistency: number;
    timeliness: number;
    accuracy: number;
  };
}

/**
 * Calculate completion metrics for submissions
 */
export const calculateCompletionMetrics = (
  submissions: Submission[],
  questions: KoboQuestion[]
): CompletionMetrics => {
  if (submissions.length === 0) {
    return {
      totalSubmissions: 0,
      completionRate: 0,
      questionCompletionRates: {},
      averageCompletionTime: 0
    };
  }

  const requiredQuestions = questions.filter(q => q.required);
  const totalSubmissions = submissions.length;

  // Calculate overall completion rate
  const completeSubmissions = submissions.filter(submission => {
    return requiredQuestions.every(q => {
      const value = submission.data[q.name];
      return value !== undefined && value !== null && value !== '';
    });
  });

  const completionRate = (completeSubmissions.length / totalSubmissions) * 100;

  // Calculate per-question completion rates
  const questionCompletionRates: { [questionName: string]: number } = {};
  questions.forEach(question => {
    const answeredCount = submissions.filter(s => {
      const value = s.data[question.name];
      return value !== undefined && value !== null && value !== '';
    }).length;
    questionCompletionRates[question.name] = (answeredCount / totalSubmissions) * 100;
  });

  // Calculate average completion time (simplified - using timestamp differences)
  const completionTimes = submissions
    .filter(s => s.timestamp)
    .map(s => new Date(s.timestamp).getTime())
    .sort((a, b) => a - b);

  const averageCompletionTime = completionTimes.length > 1
    ? (completionTimes[completionTimes.length - 1] - completionTimes[0]) / completionTimes.length
    : 0;

  return {
    totalSubmissions,
    completionRate,
    questionCompletionRates,
    averageCompletionTime
  };
};

/**
 * Calculate consistency metrics for responses
 */
export const calculateConsistencyMetrics = (
  submissions: Submission[],
  questions: KoboQuestion[]
): ConsistencyMetrics => {
  const potentialInconsistencies: Array<{
    submissionId: string;
    questionName: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  const questionConsistencyScores: { [questionName: string]: number } = {};

  // Check for logical inconsistencies (simplified example)
  submissions.forEach(submission => {
    // Example: Check if age and education level are consistent
    const age = submission.data['age'];
    const education = submission.data['education_level'];

    if (age && education) {
      const ageNum = parseInt(age);
      if (ageNum < 6 && ['secondary', 'university'].includes(education)) {
        potentialInconsistencies.push({
          submissionId: submission.id,
          questionName: 'education_level',
          issue: 'Age and education level inconsistency',
          severity: 'high'
        });
      }
    }

    // Check for unusual response patterns
    questions.forEach(question => {
      const value = submission.data[question.name];
      if (question.type === 'integer' && value) {
        const numValue = parseInt(value);
        if (numValue < 0 || numValue > 1000) { // Arbitrary bounds
          potentialInconsistencies.push({
            submissionId: submission.id,
            questionName: question.name,
            issue: 'Unusual numeric value',
            severity: 'medium'
          });
        }
      }
    });
  });

  // Calculate consistency scores per question (simplified)
  questions.forEach(question => {
    const responses = submissions.map(s => s.data[question.name]).filter(v => v !== undefined);
    const uniqueResponses = new Set(responses);
    const consistencyScore = responses.length > 0 ? (responses.length / uniqueResponses.size) / responses.length : 1;
    questionConsistencyScores[question.name] = Math.min(consistencyScore * 100, 100);
  });

  const overallConsistency = Object.values(questionConsistencyScores).reduce((sum, score) => sum + score, 0) / Object.keys(questionConsistencyScores).length;

  return {
    overallConsistency,
    questionConsistencyScores,
    potentialInconsistencies
  };
};

/**
 * Detect anomalies in submission data
 */
export const detectAnomalies = (
  submissions: Submission[],
  questions: KoboQuestion[]
): AnomalyMetrics => {
  const anomalies: Array<{
    submissionId: string;
    anomalyType: string;
    description: string;
    confidence: number;
  }> = [];

  const anomaliesByType: { [type: string]: number } = {};

  submissions.forEach(submission => {
    // Check for duplicate submissions (simplified)
    const duplicateCount = submissions.filter(s =>
      JSON.stringify(s.data) === JSON.stringify(submission.data) && s.id !== submission.id
    ).length;

    if (duplicateCount > 0) {
      anomalies.push({
        submissionId: submission.id,
        anomalyType: 'duplicate',
        description: 'Potential duplicate submission',
        confidence: 0.8
      });
      anomaliesByType['duplicate'] = (anomaliesByType['duplicate'] || 0) + 1;
    }

    // Check for outlier values
    questions.forEach(question => {
      if (question.type === 'integer' || question.type === 'decimal') {
        const value = parseFloat(submission.data[question.name]);
        if (!isNaN(value)) {
          const allValues = submissions
            .map(s => parseFloat(s.data[question.name]))
            .filter(v => !isNaN(v))
            .sort((a, b) => a - b);

          if (allValues.length > 4) {
            const q1 = allValues[Math.floor(allValues.length * 0.25)];
            const q3 = allValues[Math.floor(allValues.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;

            if (value < lowerBound || value > upperBound) {
              anomalies.push({
                submissionId: submission.id,
                anomalyType: 'outlier',
                description: `Outlier value for ${question.name}: ${value}`,
                confidence: 0.7
              });
              anomaliesByType['outlier'] = (anomaliesByType['outlier'] || 0) + 1;
            }
          }
        }
      }
    });

    // Check for rapid submissions (potential bot activity)
    const submissionTime = new Date(submission.timestamp).getTime();
    const recentSubmissions = submissions.filter(s => {
      const time = new Date(s.timestamp).getTime();
      return Math.abs(time - submissionTime) < 60000; // Within 1 minute
    });

    if (recentSubmissions.length > 5) {
      anomalies.push({
        submissionId: submission.id,
        anomalyType: 'rapid_submission',
        description: 'Unusually rapid submission pattern detected',
        confidence: 0.6
      });
      anomaliesByType['rapid_submission'] = (anomaliesByType['rapid_submission'] || 0) + 1;
    }
  });

  return {
    totalAnomalies: anomalies.length,
    anomaliesByType,
    flaggedSubmissions: anomalies
  };
};

/**
 * Calculate overall data quality score
 */
export const calculateDataQualityScore = (
  submissions: Submission[],
  questions: KoboQuestion[]
): DataQualityScore => {
  const completion = calculateCompletionMetrics(submissions, questions);
  const consistency = calculateConsistencyMetrics(submissions, questions);
  const anomalies = detectAnomalies(submissions, questions);

  // Calculate timeliness (simplified - based on submission distribution)
  const submissionTimes = submissions.map(s => new Date(s.timestamp).getTime());
  const timeSpan = Math.max(...submissionTimes) - Math.min(...submissionTimes);
  const expectedSubmissions = timeSpan / (24 * 60 * 60 * 1000); // Expected per day
  const actualRate = submissions.length / Math.max(expectedSubmissions, 1);
  const timelinessScore = Math.min(actualRate * 50, 100); // Normalize to 0-100

  // Calculate accuracy (inverse of anomalies)
  const accuracyScore = Math.max(0, 100 - (anomalies.totalAnomalies / submissions.length) * 200);

  // Overall score is weighted average
  const overallScore = (
    completion.completionRate * 0.4 +
    consistency.overallConsistency * 0.3 +
    timelinessScore * 0.15 +
    accuracyScore * 0.15
  );

  return {
    overallScore,
    completionScore: completion.completionRate,
    consistencyScore: consistency.overallConsistency,
    timelinessScore,
    accuracyScore,
    breakdown: {
      completion: completion.completionRate,
      consistency: consistency.overallConsistency,
      timeliness: timelinessScore,
      accuracy: accuracyScore
    }
  };
};
