/**
 * Root Cause Classification Engine for Early Student Support (ESS)
 *
 * CORE DIFFERENTIATOR: Classifies the likely underlying support need using
 * evidence-based PATTERN MATCHING across attendance, academic, engagement,
 * and behavioural signals.
 *
 * CRITICAL LANGUAGE RULES:
 *   - NEVER assert a condition as fact ("Student has financial problems").
 *   - ALWAYS frame as a pattern-based possibility ("Financial hardship is a
 *     possible contributing factor based on attendance pattern").
 *   - ALWAYS show confidence %, always list contributing factors.
 *   - ALWAYS handle UNCERTAIN explicitly — never force a classification.
 */

// ─── Input type ───────────────────────────────────────────────────────────────

export interface RootCauseInput {
  // ── Attendance (0-1 or 0-100 accepted; normalised internally)
  attendance?: number;           // current period rate
  attendancePrev?: number;       // previous period rate
  attendanceSuddenDrop?: boolean;// true if >20% drop in ≤2 weeks
  attendanceStable?: boolean;    // ±3% across periods

  // ── Academics (0-1 or 0-100)
  academicScore?: number;        // current score / GPA normalised
  academicScorePrev?: number;    // previous score
  quizPerformance?: number;      // quiz score (0-1 or 0-100)
  academicStable?: boolean;      // ±4% across periods

  // ── Engagement / LMS
  lmsLogins?: number;            // logins/week
  lmsLoginsPrev?: number;
  expectedLmsLogins?: number;    // default 7
  timeOnTaskHoursPerWeek?: number; // study hours/week
  assignmentsSubmitted?: number;
  assignmentsTotal?: number;
  recentLmsRecovery?: boolean;   // bounced back after drop

  // ── Social / participation proxies
  forumParticipation?: number;   // 0-1
  peerInteraction?: number;      // 0-1

  // ── Explicit trend override (optional)
  engagementTrend?: 'IMPROVING' | 'STABLE' | 'DECLINING';
  attendanceTrend?: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

// ─── Output type ──────────────────────────────────────────────────────────────

export type RootCauseLabel =
  | 'ACADEMIC_DIFFICULTY'
  | 'POSSIBLE_FINANCIAL_HARDSHIP'
  | 'POSSIBLE_HEALTH_ISSUE'
  | 'SOCIAL_ISOLATION'
  | 'MOTIVATIONAL_BELONGING'
  | 'MULTIPLE_FACTORS'
  | 'UNCERTAIN';

export interface RootCauseAssessment {
  cause: RootCauseLabel;
  displayLabel: string;            // human-readable label for UI
  confidence: number;              // 0–100
  contributing: string[];          // evidence bullets (cautious language)
  altCauses: { cause: string; confidence: number; reason: string }[];
  recommendedInterventions: string[];
  explanation: string;             // plain-language paragraph
  dataCompleteness: number;        // 0–100%; how much data was available
}

// ─── Configuration ────────────────────────────────────────────────────────────

export const ROOT_CAUSE_CONFIG = {
  confidenceThreshold: 60,          // below this → UNCERTAIN

  patterns: {
    academicDifficulty: {
      academicScoreMax: 0.60,        // score ≤ 60% triggers consideration
      timeOnTaskMin: 8,              // ≥ 8 hrs/week studying
      engagementMin: 0.40,           // still engaged (not withdrawn)
      quizMax: 0.60,                 // quiz score ≤ 60%
      baseConfidence: 75,
    },
    financialHardship: {
      attendanceMax: 0.65,           // attendance < 65%
      attendanceTrend: 'DECLINING',
      engagementMax: 0.35,           // very low LMS activity
      baseConfidence: 65,
    },
    healthIssue: {
      requiresSuddenDrop: true,
      requiresNoPriorDecline: true,
      recoveryBonus: 10,             // confidence boost if recovery observed
      baseConfidence: 58,
    },
    socialIsolation: {
      forumMax: 0.25,
      peerMax: 0.30,
      requiresAcademicStable: true,
      baseConfidence: 62,
    },
    motivationalBelonging: {
      engagementTrend: 'DECLINING',
      requiresAttendanceStable: true,
      requiresAcademicStable: true,
      baseConfidence: 71,
    },
  },

  interventionMap: {
    ACADEMIC_DIFFICULTY:         ['Academic Tutoring', 'Study Skills Workshop', 'Personalised Learning Support', 'Peer Mentoring'],
    POSSIBLE_FINANCIAL_HARDSHIP: ['Financial Aid Referral', 'Fee Support Information', 'Work-Study Programmes', 'Emergency Scholarship'],
    POSSIBLE_HEALTH_ISSUE:       ['Health Centre Referral', 'Flexible Deadline Extension', 'Reintegration Support', 'Counselling Services'],
    SOCIAL_ISOLATION:            ['Peer Buddy Programme', 'Faculty Mentoring', 'Student Group Referral', 'Counselling Referral'],
    MOTIVATIONAL_BELONGING:      ['Career Counselling', 'Faculty Mentoring', 'Course Relevance Discussion', 'Leadership Opportunities'],
    MULTIPLE_FACTORS:            ['Counsellor Case Review', 'Multi-disciplinary Assessment', 'Holistic Support Plan'],
    UNCERTAIN:                   ['In-Person Welfare Check', 'Structured Adviser Meeting'],
  } as Record<RootCauseLabel, string[]>,

  displayLabels: {
    ACADEMIC_DIFFICULTY:         'Academic Difficulty',
    POSSIBLE_FINANCIAL_HARDSHIP: 'Possible Financial Hardship',
    POSSIBLE_HEALTH_ISSUE:       'Possible Health-Related Circumstances',
    SOCIAL_ISOLATION:            'Social Isolation',
    MOTIVATIONAL_BELONGING:      'Motivational / Belonging Issue',
    MULTIPLE_FACTORS:            'Multiple Contributing Factors',
    UNCERTAIN:                   'Uncertain — Assessment Required',
  } as Record<RootCauseLabel, string>,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Normalise a 0-100 or 0-1 value to 0-1 */
function norm(v: number | undefined): number | null {
  if (v === undefined || v === null) return null;
  return v > 1 ? v / 100 : v;
}

/** Engagement ratio: lmsLogins / expectedLoginsPerWeek clamped to 0-1 */
function engagementRatio(input: RootCauseInput): number | null {
  const logins = input.lmsLogins;
  if (logins === undefined) return null;
  const expected = input.expectedLmsLogins ?? 7;
  return Math.min(1, logins / expected);
}

/** Assignment completion ratio */
function assignmentRatio(input: RootCauseInput): number | null {
  if (input.assignmentsSubmitted === undefined || !input.assignmentsTotal) return null;
  return Math.min(1, input.assignmentsSubmitted / input.assignmentsTotal);
}

/** Infer attendance trend from current vs previous */
function inferAttendanceTrend(input: RootCauseInput): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  if (input.attendanceTrend) return input.attendanceTrend;
  const curr = norm(input.attendance);
  const prev = norm(input.attendancePrev);
  if (curr === null || prev === null) return 'STABLE';
  if (curr < prev - 0.03) return 'DECLINING';
  if (curr > prev + 0.03) return 'IMPROVING';
  return 'STABLE';
}

/** Infer engagement trend from LMS logins */
function inferEngagementTrend(input: RootCauseInput): 'IMPROVING' | 'STABLE' | 'DECLINING' {
  if (input.engagementTrend) return input.engagementTrend;
  const logins = input.lmsLogins;
  const loginsPrev = input.lmsLoginsPrev;
  if (logins === undefined || loginsPrev === undefined) return 'STABLE';
  if (logins < loginsPrev - 1) return 'DECLINING';
  if (logins > loginsPrev + 1) return 'IMPROVING';
  return 'STABLE';
}

/** Count how much data is available (for confidence & completeness) */
function dataCompleteness(input: RootCauseInput): number {
  const fields = [
    input.attendance,
    input.attendancePrev,
    input.academicScore,
    input.academicScorePrev,
    input.lmsLogins,
    input.assignmentsSubmitted,
    input.quizPerformance,
    input.timeOnTaskHoursPerWeek,
  ];
  const available = fields.filter(f => f !== undefined && f !== null).length;
  return Math.round((available / fields.length) * 100);
}

// ─── Pattern match functions ──────────────────────────────────────────────────

interface PatternResult {
  matched: boolean;
  confidence: number;
  signals: string[];
}

function matchAcademicDifficulty(input: RootCauseInput): PatternResult {
  const cfg = ROOT_CAUSE_CONFIG.patterns.academicDifficulty;
  const score = norm(input.academicScore);
  const quiz  = norm(input.quizPerformance);
  const engag = engagementRatio(input);
  const hours = input.timeOnTaskHoursPerWeek;

  const signals: string[] = [];
  let matchCount = 0;
  let conf = cfg.baseConfidence;

  if (score !== null && score <= cfg.academicScoreMax) {
    matchCount++;
    signals.push(`Academic performance is low (${Math.round(score * 100)}%) — below the ${Math.round(cfg.academicScoreMax * 100)}% threshold`);
  }

  if (engag !== null && engag >= cfg.engagementMin) {
    matchCount++;
    signals.push(`LMS engagement remains above ${Math.round(cfg.engagementMin * 100)}% — student is still attempting to engage`);
  }

  if (hours !== undefined && hours >= cfg.timeOnTaskMin) {
    matchCount++;
    conf += 8;
    signals.push(`Study time is elevated (${hours} hrs/week) — effort is present but performance has not improved`);
    signals.push('Pattern: student is working hard but not achieving expected results — consistent with content difficulty');
  }

  if (quiz !== null && quiz <= cfg.quizMax) {
    matchCount++;
    conf += 5;
    signals.push(`Quiz performance is low (${Math.round(quiz * 100)}%) — indicates gaps in conceptual understanding`);
  }

  if (hours === undefined) conf -= 10;

  return { matched: matchCount >= 2, confidence: Math.min(conf, 92), signals };
}

function matchFinancialHardship(input: RootCauseInput): PatternResult {
  const cfg = ROOT_CAUSE_CONFIG.patterns.financialHardship;
  const attend = norm(input.attendance);
  const engag  = engagementRatio(input);
  const trend  = inferAttendanceTrend(input);

  const signals: string[] = [];
  let matchCount = 0;
  let conf = cfg.baseConfidence;

  if (attend !== null && attend < cfg.attendanceMax) {
    matchCount++;
    signals.push(`Attendance is significantly low (${Math.round(attend * 100)}%) — sustained absence is a potential indicator of external time conflicts`);
  }

  if (trend === 'DECLINING') {
    matchCount++;
    conf += 5;
    signals.push('Attendance is following a declining trend — gradual withdrawal is consistent with increasing external pressures (possible work commitments)');
  }

  if (engag !== null && engag < cfg.engagementMax) {
    matchCount++;
    signals.push(`LMS engagement is very low (${Math.round(engag * 100)}% of expected activity) — limited digital access or time availability may be a contributing factor`);
    signals.push('Important: Financial hardship is a possible contributing factor based on the attendance and engagement pattern — not a confirmed diagnosis');
  }

  return { matched: matchCount >= 2, confidence: Math.min(conf, 80), signals };
}

function matchHealthIssue(input: RootCauseInput): PatternResult {
  const cfg = ROOT_CAUSE_CONFIG.patterns.healthIssue;
  const signals: string[] = [];
  let matchCount = 0;
  let conf = cfg.baseConfidence;

  if (input.attendanceSuddenDrop === true) {
    matchCount++;
    signals.push('A sudden, sharp drop in attendance was detected (not gradual) — this pattern is more consistent with an acute event (e.g., illness) than ongoing disengagement');
  }

  const attendTrend = inferAttendanceTrend(input);
  const wasDecliningSteadily = (attendTrend === 'DECLINING') && !input.attendanceSuddenDrop;

  if (!wasDecliningSteadily) {
    matchCount++;
    signals.push('Prior to the drop, attendance was not in a declining trend — absence appears event-driven, not behavioural');
  }

  if (input.recentLmsRecovery === true) {
    matchCount++;
    conf += cfg.recoveryBonus;
    signals.push('Recent return to LMS activity has been observed — this recovery pattern may indicate the acute episode is resolving');
  }

  signals.push('Health-related circumstances may warrant compassionate outreach — based on absence pattern only, not a medical assessment');

  return { matched: matchCount >= 2, confidence: Math.min(conf, 80), signals };
}

function matchSocialIsolation(input: RootCauseInput): PatternResult {
  const cfg = ROOT_CAUSE_CONFIG.patterns.socialIsolation;
  const forum = norm(input.forumParticipation);
  const peer  = norm(input.peerInteraction);
  const acadStable = input.academicStable ?? false;

  const signals: string[] = [];
  let matchCount = 0;
  let conf = cfg.baseConfidence;

  if (forum !== null && forum <= cfg.forumMax) {
    matchCount++;
    signals.push(`Forum participation is very low (${Math.round(forum * 100)}%) — limited peer-to-peer interaction in online spaces`);
  }

  if (peer !== null && peer <= cfg.peerMax) {
    matchCount++;
    signals.push(`Peer interaction signals are low (${Math.round(peer * 100)}%) — student may be experiencing social disconnection`);
  }

  if (acadStable) {
    matchCount++;
    conf += 5;
    signals.push('Academic performance is stable — risk does not appear to stem from content difficulty, pointing toward social or motivational factors');
  }

  signals.push('Social isolation is identified as a pattern — human outreach (not a diagnostic label) is recommended');

  return { matched: matchCount >= 2, confidence: Math.min(conf, 82), signals };
}

function matchMotivationalBelonging(input: RootCauseInput): PatternResult {
  const cfg = ROOT_CAUSE_CONFIG.patterns.motivationalBelonging;
  const engTrend  = inferEngagementTrend(input);
  const attendStable = input.attendanceStable ?? (inferAttendanceTrend(input) === 'STABLE');
  const acadStable   = input.academicStable ?? false;

  const signals: string[] = [];
  let matchCount = 0;
  let conf = cfg.baseConfidence;

  if (engTrend === 'DECLINING') {
    matchCount++;
    signals.push('LMS engagement is declining — decreasing initiative and digital participation may indicate motivational difficulty');
  }

  if (attendStable) {
    matchCount++;
    conf += 5;
    signals.push('Attendance is stable — the student is still physically present, suggesting external barriers are not the primary factor');
  }

  if (acadStable) {
    matchCount++;
    conf += 5;
    signals.push('Academic scores are stable — this is not a performance crisis but potentially a sense-of-belonging or purpose issue');
  }

  signals.push('Pattern suggests a motivational or belonging concern — not an inability to perform. Proactive mentoring or career relevance discussion is recommended');

  return { matched: matchCount >= 2, confidence: Math.min(conf, 85), signals };
}

// ─── Main classifier ──────────────────────────────────────────────────────────

export function classifyRootCause(input: RootCauseInput): RootCauseAssessment {
  const completeness = dataCompleteness(input);

  const academic     = matchAcademicDifficulty(input);
  const financial    = matchFinancialHardship(input);
  const health       = matchHealthIssue(input);
  const social       = matchSocialIsolation(input);
  const motivational = matchMotivationalBelonging(input);

  const allResults: { label: RootCauseLabel; result: PatternResult }[] = [
    { label: 'ACADEMIC_DIFFICULTY',         result: academic },
    { label: 'POSSIBLE_FINANCIAL_HARDSHIP', result: financial },
    { label: 'POSSIBLE_HEALTH_ISSUE',       result: health },
    { label: 'SOCIAL_ISOLATION',            result: social },
    { label: 'MOTIVATIONAL_BELONGING',      result: motivational },
  ];

  const matched = allResults.filter(r => r.result.matched);

  // MULTIPLE FACTORS
  if (matched.length >= 2 && matched.every(m => m.result.confidence >= ROOT_CAUSE_CONFIG.confidenceThreshold)) {
    const top2 = matched.sort((a, b) => b.result.confidence - a.result.confidence).slice(0, 2);
    const avgConf = Math.round((top2[0].result.confidence + top2[1].result.confidence) / 2) - 10;
    return build(
      'MULTIPLE_FACTORS',
      Math.max(50, avgConf),
      [
        `Multiple independent warning patterns were detected (${top2.map(m => ROOT_CAUSE_CONFIG.displayLabels[m.label]).join(' + ')})`,
        'Isolating a single primary cause is not possible from available data alone',
        'A counsellor or adviser review is recommended to determine the predominant factor',
      ],
      buildAltCauses(matched),
      ROOT_CAUSE_CONFIG.interventionMap.MULTIPLE_FACTORS,
      `This student's profile matches multiple risk patterns simultaneously (${top2.map(m => ROOT_CAUSE_CONFIG.displayLabels[m.label]).join(' and ')}). Because no single cause is clearly dominant, a holistic human assessment is the recommended next step.`,
      completeness,
    );
  }

  // SINGLE BEST MATCH
  if (matched.length === 1) {
    const best = matched[0];
    if (best.result.confidence >= ROOT_CAUSE_CONFIG.confidenceThreshold) {
      const alts = buildAltCauses(allResults.filter(r => r.label !== best.label && r.result.confidence > 0));
      return build(
        best.label,
        best.result.confidence,
        best.result.signals,
        alts,
        ROOT_CAUSE_CONFIG.interventionMap[best.label],
        buildExplanation(best.label, best.result),
        completeness,
      );
    }
  }

  // STRONGEST MATCH below threshold
  if (matched.length >= 1) {
    const best = matched.sort((a, b) => b.result.confidence - a.result.confidence)[0];
    const finalConf = Math.max(35, best.result.confidence - 15);
    if (finalConf >= 40) {
      return build(
        best.label,
        finalConf,
        [
          ...best.result.signals,
          'Note: Confidence is below the recommended threshold — additional data collection is advised before acting on this classification',
        ],
        buildAltCauses(allResults.filter(r => r.label !== best.label)),
        ROOT_CAUSE_CONFIG.interventionMap[best.label],
        buildExplanation(best.label, best.result),
        completeness,
      );
    }
  }

  // UNCERTAIN
  return build(
    'UNCERTAIN',
    Math.max(10, completeness / 2),
    [
      'Insufficient evidence exists to classify the likely underlying support need with confidence',
      `Only ${completeness}% of the expected data signals are available — more data is required`,
      'A structured conversation with the student by an adviser is the recommended first step',
    ],
    [],
    ROOT_CAUSE_CONFIG.interventionMap.UNCERTAIN,
    'The available data does not provide sufficient evidence to identify a likely root cause with the required confidence. A direct welfare conversation with the student is recommended to gather additional context before any automated support action is taken.',
    completeness,
  );
}

// ─── Builder helpers ──────────────────────────────────────────────────────────

function build(
  cause: RootCauseLabel,
  confidence: number,
  contributing: string[],
  altCauses: { cause: string; confidence: number; reason: string }[],
  recommendedInterventions: string[],
  explanation: string,
  dataCompleteness: number,
): RootCauseAssessment {
  return {
    cause,
    displayLabel: ROOT_CAUSE_CONFIG.displayLabels[cause],
    confidence: Math.round(confidence),
    contributing,
    altCauses,
    recommendedInterventions,
    explanation,
    dataCompleteness,
  };
}

function buildAltCauses(
  others: { label: RootCauseLabel; result: PatternResult }[],
): { cause: string; confidence: number; reason: string }[] {
  return others
    .filter(o => o.result.confidence > 0)
    .sort((a, b) => b.result.confidence - a.result.confidence)
    .slice(0, 3)
    .map(o => ({
      cause: ROOT_CAUSE_CONFIG.displayLabels[o.label],
      confidence: Math.round(o.result.confidence * 0.4),
      reason: o.result.matched
        ? `Pattern partially matched (${o.result.signals.length} signal(s) detected)`
        : 'Pattern did not match — included for completeness',
    }));
}

function buildExplanation(label: RootCauseLabel, result: PatternResult): string {
  const explanations: Record<RootCauseLabel, string> = {
    ACADEMIC_DIFFICULTY:
      `This student's profile shows signs that are consistent with academic content difficulty. Performance metrics are below expected thresholds and, where study-time data is available, the student appears to be investing effort without corresponding improvement. ${result.signals.length > 0 ? 'Financial, health, and disengagement causes appear less consistent with the observed data.' : ''}`,
    POSSIBLE_FINANCIAL_HARDSHIP:
      `The attendance and engagement pattern observed for this student may be consistent with external time or resource constraints. Financial hardship is identified here as a possible contributing factor based on an absence and low-engagement pattern — not as a confirmed circumstance. Outreach should be exploratory and non-presumptuous.`,
    POSSIBLE_HEALTH_ISSUE:
      `The pattern of sudden absence (rather than gradual withdrawal) combined with${ result.signals.find(s => s.includes('recovery')) ? ' observable signs of recovery' : ' no prior declining trend'} may be consistent with a short-term health-related event. This classification is a pattern observation — not a medical assessment. Compassionate, non-intrusive outreach is recommended.`,
    SOCIAL_ISOLATION:
      `This student's profile shows low peer and forum interaction signals while academic performance remains relatively stable. This combination is often associated with social disconnection rather than academic inability. Proactive connection-building (peer buddy, group activities) is recommended.`,
    MOTIVATIONAL_BELONGING:
      `Engagement is declining while attendance and academic performance remain stable — a pattern that often reflects a motivational, identity, or sense-of-belonging challenge rather than an external barrier. Career counselling, mentoring, and discussions about course relevance have the strongest evidence base for this profile.`,
    MULTIPLE_FACTORS:
      `Multiple independent risk patterns are simultaneously present in this student's profile. Because no single cause is clearly dominant, a holistic counsellor assessment is recommended before any targeted intervention is applied.`,
    UNCERTAIN:
      `Available data does not provide sufficient evidence to identify a likely root cause. A direct structured conversation with the student is the recommended first step.`,
  };
  return explanations[label];
}
