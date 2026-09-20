/**
 * Intervention Knowledge Base for ESS
 * Maps root cause label → recommended intervention options.
 * Used to pre-fill the AssignInterventionModal dropdown.
 */

export interface InterventionOption {
  type: string;
  description: string;
}

export const interventionKnowledgeBase: Record<string, InterventionOption[]> = {
  ACADEMIC_DIFFICULTY: [
    { type: 'Academic Tutoring',       description: 'Subject-specific tutoring sessions' },
    { type: 'Study Skills Workshop',   description: 'Study techniques and time management' },
    { type: 'Peer Mentoring',          description: 'Peer tutor assignment' },
    { type: 'Personalised Support',    description: 'Individualised academic support plan' },
  ],
  POSSIBLE_FINANCIAL_HARDSHIP: [
    { type: 'Financial Aid Referral',  description: 'Financial aid office information and referral' },
    { type: 'Emergency Scholarship',   description: 'Emergency scholarship opportunities' },
    { type: 'Emergency Support',       description: 'Emergency financial assistance application' },
    { type: 'Work-Study Info',         description: 'Work-study job information and enrolment' },
  ],
  POSSIBLE_HEALTH_ISSUE: [
    { type: 'Health Centre Referral',  description: 'Health centre counselling and support' },
    { type: 'Flexible Deadlines',      description: 'Temporary deadline extension if needed' },
    { type: 'Reintegration Support',   description: 'Supported return-to-study plan' },
    { type: 'Counselling Services',    description: 'Emotional wellbeing counselling referral' },
  ],
  SOCIAL_ISOLATION: [
    { type: 'Peer Buddy Programme',    description: 'Peer buddy / study partner assignment' },
    { type: 'Faculty Mentoring',       description: 'One-on-one faculty mentor assignment' },
    { type: 'Student Group Referral',  description: 'Introduction to relevant student group/club' },
    { type: 'Counselling Referral',    description: 'Social wellbeing counselling referral' },
  ],
  MOTIVATIONAL_BELONGING: [
    { type: 'Career Counselling',      description: 'Career exploration and goal-setting session' },
    { type: 'Faculty Mentoring',       description: 'One-on-one mentor assignment for purpose/direction' },
    { type: 'Course Relevance Talk',   description: 'Discussion on course relevance and future pathways' },
    { type: 'Leadership Opportunity',  description: 'Introduction to student leadership opportunity' },
  ],
  MULTIPLE_FACTORS: [
    { type: 'Counsellor Case Review',  description: 'Full multi-disciplinary case review with counsellor' },
    { type: 'Holistic Support Plan',   description: 'Comprehensive multi-pronged support plan' },
    { type: 'Welfare Check-In',        description: 'Structured in-person welfare conversation' },
  ],
  UNCERTAIN: [
    { type: 'Welfare Check-In',        description: 'Structured in-person welfare conversation' },
    { type: 'Adviser Meeting',         description: 'Formal structured adviser meeting' },
  ],
};

export const DEFAULT_INTERVENTIONS: InterventionOption[] = [
  { type: 'Faculty Meeting',           description: 'General faculty check-in' },
  { type: 'Counselor Check-In',        description: 'Counsellor welfare check' },
  { type: 'Academic Tutoring',         description: 'Subject-specific tutoring' },
  { type: 'Peer Mentoring',            description: 'Peer mentor assignment' },
  { type: 'Financial Aid Referral',    description: 'Financial aid office information' },
  { type: 'Health Centre Referral',    description: 'Health centre referral' },
];

export function getInterventionsForCause(causeLabel: string): InterventionOption[] {
  if (interventionKnowledgeBase[causeLabel]) return interventionKnowledgeBase[causeLabel];
  const map: Record<string, string> = {
    'Academic Difficulty':                  'ACADEMIC_DIFFICULTY',
    'Possible Financial Hardship':          'POSSIBLE_FINANCIAL_HARDSHIP',
    'Possible Health-Related Circumstances':'POSSIBLE_HEALTH_ISSUE',
    'Social Isolation':                     'SOCIAL_ISOLATION',
    'Motivational / Belonging Issue':       'MOTIVATIONAL_BELONGING',
    'Multiple Contributing Factors':        'MULTIPLE_FACTORS',
    'Uncertain — Assessment Required':      'UNCERTAIN',
  };
  const key = map[causeLabel];
  if (key && interventionKnowledgeBase[key]) return interventionKnowledgeBase[key];
  return DEFAULT_INTERVENTIONS;
}

export const STATUS_PROGRESSION: Record<string, string> = {
  recommended: 'pending',
  pending:     'assigned',
  assigned:    'in_progress',
  in_progress: 'completed',
  completed:   'completed',
};

export const STATUS_LABELS: Record<string, string> = {
  recommended: 'Recommended',
  pending:     'Pending',
  assigned:    'Assigned',
  in_progress: 'In Progress',
  completed:   'Completed',
};

export const STATUS_COLORS: Record<string, string> = {
  recommended: 'bg-slate-700      text-slate-300   border-slate-600',
  pending:     'bg-amber-500/10   text-amber-400   border-amber-500/20',
  assigned:    'bg-sky-500/10     text-sky-400     border-sky-500/20',
  in_progress: 'bg-indigo-500/10  text-indigo-400  border-indigo-500/20',
  completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};
