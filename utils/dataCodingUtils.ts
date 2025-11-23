import { Submission, KoboQuestion } from '../types';

/**
 * Maps textual responses to numerical/categorical codes for statistical analysis
 */
export const codeResponse = (value: any, question: KoboQuestion): any => {
    if (!question.choices || !Array.isArray(question.choices)) {
        return value; // Return as-is for non-choice questions
    }

    if (Array.isArray(value)) {
        // Handle select_multiple
        return value.map(v => {
            const choice = question.choices!.find(c => c.name === v);
            return choice ? question.choices!.indexOf(choice) + 1 : v;
        });
    } else {
        // Handle select_one
        const choice = question.choices!.find(c => c.name === value);
        return choice ? question.choices!.indexOf(choice) + 1 : value;
    }
};

/**
 * Adds coded versions of responses to submission data
 */
export const addCodedData = (submissions: Submission[], questions: KoboQuestion[]): Submission[] => {
    return submissions.map(submission => {
        const codedData: { [key: string]: any } = {};

        questions.forEach(question => {
            const originalValue = submission.data[question.name];
            if (originalValue !== undefined) {
                codedData[question.name] = codeResponse(originalValue, question);
                codedData[`${question.name}_coded`] = codedData[question.name];
                codedData[`${question.name}_text`] = originalValue;
            }
        });

        return {
            ...submission,
            data: {
                ...submission.data,
                ...codedData
            }
        };
    });
};

/**
 * Gets frequency counts for a coded question
 */
export const getFrequencyCounts = (submissions: Submission[], questionName: string): { [key: string]: number } => {
    const counts: { [key: string]: number } = {};

    submissions.forEach(submission => {
        const value = submission.data[questionName];
        if (value !== undefined && value !== null) {
            const key = String(value);
            counts[key] = (counts[key] || 0) + 1;
        }
    });

    return counts;
};

/**
 * Gets submission trends over time
 */
export const getSubmissionTrends = (submissions: Submission[]): { date: string; count: number }[] => {
    const trends: { [key: string]: number } = {};

    submissions.forEach(submission => {
        const date = new Date(submission.timestamp).toISOString().split('T')[0];
        trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
};
