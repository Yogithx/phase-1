/**
 * Multi-Factor Risk Scoring Engine for Early Student Support (ESS)
 * 
 * Computes composite risk score (0.00 - 1.00), support tier (GREEN, AMBER, RED, CRITICAL),
 * trajectory (improving, stable, deteriorating), and confidence score from attendance,
 * academic performance, engagement metrics, and historical trends.
 */

export interface StudentMetricsInput {
  attendance?: {
    currentRate?: number;    // 0-100 or 0-1 scale
    previousRate?: number;   // 0-100 or 0-1 scale
    absentCount?: number;
    totalClasses?: number;
  } | number;

  academics?: {
    gpa?: number;            // 0-4.0 scale
    currentScore?: number;   // 0-100 percentage
    previousScore?: number;  // 0-100 percentage
  } | number;

  engagement?: {
    lmsLogins?: number;             // Logins per week
    previousLmsLogins?: number;
    expectedLoginsPerWeek?: number; // default 7
    assignmentsSubmitted?: number;
    assignmentsTotal?: number;
    timeOnTaskMinutes?: number;
  } | number;

  trend?: 'improving' | 'stable' | 'deteriorating' | string;
}

export type RiskTier = 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL';
export type RiskTrajectory = 'improving' | 'stable' | 'deteriorating';

export interface RiskAssessmentResult {
  score: number;             // 0.00 - 1.00
  tier: RiskTier;            // GREEN, AMBER, RED, CRITICAL
  trajectory: RiskTrajectory;// improving, stable, deteriorating
  confidence: number;        // 0 - 100%
  contributingFactors: {
    attendance: number;      // 0.00 - 1.00
    academic: number;        // 0.00 - 1.00
    engagement: number;      // 0.00 - 1.00
    trend: number;           // 0.00 - 1.00
  };
}

// === CONFIGURATION ===
// Config object for administrative tuning
export const RISK_CONFIG = {
  weights: {
    attendance: 0.30,
    academic: 0.35,
    engagement: 0.20,
    trend: 0.15,
  },
  tiers: {
    critical: 0.75,
    red: 0.55,
    amber: 0.35,
  },
  thresholds: {
    low_attendance: 0.65,         // 65% = risky
    low_gpa: 2.8,
    low_engagement: 0.30,         // 30% of expected activity
    declining_trend_penalty: 0.10,
    declining_academic_penalty: 0.15,
    expected_lms_logins: 7,
  },
};

/**
 * Normalizes input value to 0-1 range
 */
function clamp(val: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * ATTENDANCE COMPONENT (0-1 scale)
 * Lower attendance = higher risk
 * Declining trend = additional penalty
 */
export function calculateAttendanceComponent(student: StudentMetricsInput): number {
  let rate: number | null = null;
  let isDeclining = false;

  if (typeof student.attendance === 'number') {
    rate = student.attendance > 1 ? student.attendance / 100 : student.attendance;
  } else if (student.attendance) {
    const { currentRate, previousRate, absentCount, totalClasses } = student.attendance;
    if (typeof currentRate === 'number') {
      rate = currentRate > 1 ? currentRate / 100 : currentRate;
    } else if (typeof absentCount === 'number' && typeof totalClasses === 'number' && totalClasses > 0) {
      rate = (totalClasses - absentCount) / totalClasses;
    }

    if (typeof previousRate === 'number' && typeof currentRate === 'number') {
      const prev = previousRate > 1 ? previousRate / 100 : previousRate;
      const curr = currentRate > 1 ? currentRate / 100 : currentRate;
      if (curr < prev - 0.03) {
        isDeclining = true;
      }
    }
  }

  // Default neutral risk if no data
  if (rate === null) return 0.40;

  // Base risk calculation:
  // e.g. 100% attendance => ~0.05 risk
  // 75% attendance => ~0.40 risk
  // 64% attendance => ~0.65 risk
  // 50% attendance => ~0.85 risk
  let risk = (1 - rate) * 1.5;
  if (rate < RISK_CONFIG.thresholds.low_attendance) {
    risk += 0.15; // Low attendance penalty
  }

  if (isDeclining) {
    risk += RISK_CONFIG.thresholds.declining_trend_penalty; // 0.10 penalty
  }

  return Number(clamp(risk).toFixed(3));
}

/**
 * ACADEMIC COMPONENT (0-1 scale)
 * Lower GPA / score = higher risk
 * Declining grades = additional penalty
 */
export function calculateAcademicComponent(student: StudentMetricsInput): number {
  let scorePct: number | null = null;
  let isDeclining = false;

  if (typeof student.academics === 'number') {
    const val = student.academics;
    if (val <= 4.0) {
      scorePct = val / 4.0;
    } else {
      scorePct = val / 100;
    }
  } else if (student.academics) {
    const { gpa, currentScore, previousScore } = student.academics;
    if (typeof currentScore === 'number') {
      scorePct = currentScore > 1 ? currentScore / 100 : currentScore;
    } else if (typeof gpa === 'number') {
      scorePct = gpa / 4.0;
    }

    if (typeof previousScore === 'number' && typeof currentScore === 'number') {
      const prev = previousScore > 1 ? previousScore / 100 : previousScore;
      const curr = currentScore > 1 ? currentScore / 100 : currentScore;
      if (curr < prev - 0.04) {
        isDeclining = true;
      }
    }
  }

  if (scorePct === null) return 0.40;

  // Example: 2.8 GPA (70%) => risk approx 0.60
  // GPA 4.0 (100%) => risk 0.05
  // GPA 2.0 (50%) => risk 0.85
  let risk = (1 - scorePct) * 1.6;
  if (scorePct < (RISK_CONFIG.thresholds.low_gpa / 4.0)) {
    risk += 0.12;
  }

  if (isDeclining) {
    risk += RISK_CONFIG.thresholds.declining_academic_penalty; // 0.15 penalty
  }

  return Number(clamp(risk).toFixed(3));
}

/**
 * ENGAGEMENT COMPONENT (0-1 scale)
 * Lower LMS activity = higher risk
 * Less assignment completion = higher risk
 */
export function calculateEngagementComponent(student: StudentMetricsInput): number {
  let lmsRatio: number | null = null;
  let assignmentRatio: number | null = null;

  if (typeof student.engagement === 'number') {
    const val = student.engagement > 1 ? student.engagement / 100 : student.engagement;
    return Number(clamp(1 - val).toFixed(3));
  } else if (student.engagement) {
    const { lmsLogins, expectedLoginsPerWeek, assignmentsSubmitted, assignmentsTotal } = student.engagement;
    const expected = expectedLoginsPerWeek ?? RISK_CONFIG.thresholds.expected_lms_logins;

    if (typeof lmsLogins === 'number') {
      lmsRatio = clamp(lmsLogins / expected);
    }

    if (typeof assignmentsSubmitted === 'number' && typeof assignmentsTotal === 'number' && assignmentsTotal > 0) {
      assignmentRatio = clamp(assignmentsSubmitted / assignmentsTotal);
    }
  }

  if (lmsRatio === null && assignmentRatio === null) return 0.40;

  // Combine LMS and Assignments
  let engScore = 0;
  if (lmsRatio !== null && assignmentRatio !== null) {
    engScore = (lmsRatio * 0.45) + (assignmentRatio * 0.55);
  } else if (lmsRatio !== null) {
    engScore = lmsRatio;
  } else if (assignmentRatio !== null) {
    engScore = assignmentRatio;
  }

  // Lower engagement = higher risk
  const risk = (1 - engScore) * 1.2;
  return Number(clamp(risk).toFixed(3));
}

/**
 * TREND DETECTORS & COMPONENT
 */
export function isImproving(student: StudentMetricsInput): boolean {
  if (student.trend === 'improving') return true;
  if (student.trend === 'deteriorating') return false;

  let improveCount = 0;
  let declineCount = 0;

  if (typeof student.attendance === 'object' && student.attendance) {
    const { currentRate, previousRate } = student.attendance;
    if (typeof currentRate === 'number' && typeof previousRate === 'number') {
      if (currentRate > previousRate + 2) improveCount++;
      if (currentRate < previousRate - 2) declineCount++;
    }
  }

  if (typeof student.academics === 'object' && student.academics) {
    const { currentScore, previousScore } = student.academics;
    if (typeof currentScore === 'number' && typeof previousScore === 'number') {
      if (currentScore > previousScore + 3) improveCount++;
      if (currentScore < previousScore - 3) declineCount++;
    }
  }

  if (typeof student.engagement === 'object' && student.engagement) {
    const { lmsLogins, previousLmsLogins } = student.engagement;
    if (typeof lmsLogins === 'number' && typeof previousLmsLogins === 'number') {
      if (lmsLogins > previousLmsLogins + 1) improveCount++;
      if (lmsLogins < previousLmsLogins - 1) declineCount++;
    }
  }

  return improveCount > declineCount;
}

export function isDeteriorating(student: StudentMetricsInput): boolean {
  if (student.trend === 'deteriorating') return true;
  if (student.trend === 'improving') return false;

  let declineCount = 0;
  let improveCount = 0;

  if (typeof student.attendance === 'object' && student.attendance) {
    const { currentRate, previousRate } = student.attendance;
    if (typeof currentRate === 'number' && typeof previousRate === 'number') {
      if (currentRate < previousRate - 3) declineCount++;
      if (currentRate > previousRate + 3) improveCount++;
    }
  }

  if (typeof student.academics === 'object' && student.academics) {
    const { currentScore, previousScore } = student.academics;
    if (typeof currentScore === 'number' && typeof previousScore === 'number') {
      if (currentScore < previousScore - 4) declineCount++;
      if (currentScore > previousScore + 4) improveCount++;
    }
  }

  if (typeof student.engagement === 'object' && student.engagement) {
    const { lmsLogins, previousLmsLogins } = student.engagement;
    if (typeof lmsLogins === 'number' && typeof previousLmsLogins === 'number') {
      if (lmsLogins < previousLmsLogins - 2) declineCount++;
      if (lmsLogins > previousLmsLogins + 2) improveCount++;
    }
  }

  return declineCount > improveCount;
}

/**
 * TREND COMPONENT (0-1 scale)
 * Deteriorating = high risk (~0.75-0.85)
 * Stable = neutral (~0.45)
 * Improving = low risk (~0.20)
 */
export function calculateTrendComponent(student: StudentMetricsInput): number {
  if (isDeteriorating(student)) return 0.75;
  if (isImproving(student)) return 0.20;
  return 0.45;
}

/**
 * CONFIDENCE CALCULATION
 * Based on data completeness: 0 - 100%
 */
export function calculateConfidence(student: StudentMetricsInput): number {
  let score = 0;

  if (student.attendance !== undefined && student.attendance !== null) {
    score += 30;
    if (typeof student.attendance === 'object' && typeof student.attendance.previousRate === 'number') {
      score += 10;
    }
  }

  if (student.academics !== undefined && student.academics !== null) {
    score += 30;
    if (typeof student.academics === 'object' && typeof student.academics.previousScore === 'number') {
      score += 10;
    }
  }

  if (student.engagement !== undefined && student.engagement !== null) {
    score += 20;
  }

  return Math.min(100, Math.max(10, score));
}

/**
 * Main calculation entrypoint: Calculates multi-factor composite risk score
 */
export function calculateRiskScore(student: StudentMetricsInput): RiskAssessmentResult {
  // 1. Component scores
  const attendanceScore = calculateAttendanceComponent(student);
  const academicScore = calculateAcademicComponent(student);
  const engagementScore = calculateEngagementComponent(student);
  const trendScore = calculateTrendComponent(student);

  // 2. Composite score (weighted average)
  const compositeScore = (
    attendanceScore * RISK_CONFIG.weights.attendance +
    academicScore * RISK_CONFIG.weights.academic +
    engagementScore * RISK_CONFIG.weights.engagement +
    trendScore * RISK_CONFIG.weights.trend
  );

  const roundedScore = Number(clamp(compositeScore).toFixed(2));

  // 3. Tier assignment
  let tier: RiskTier = 'GREEN';
  if (roundedScore >= RISK_CONFIG.tiers.critical) {
    tier = 'CRITICAL';
  } else if (roundedScore >= RISK_CONFIG.tiers.red) {
    tier = 'RED';
  } else if (roundedScore >= RISK_CONFIG.tiers.amber) {
    tier = 'AMBER';
  }

  // 4. Trajectory detection
  let trajectory: RiskTrajectory = 'stable';
  if (isImproving(student)) trajectory = 'improving';
  if (isDeteriorating(student)) trajectory = 'deteriorating';

  // 5. Confidence calculation
  const confidence = calculateConfidence(student);

  return {
    score: roundedScore,
    tier,
    trajectory,
    confidence,
    contributingFactors: {
      attendance: attendanceScore,
      academic: academicScore,
      engagement: engagementScore,
      trend: trendScore,
    },
  };
}
