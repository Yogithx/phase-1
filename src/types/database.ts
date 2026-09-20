export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Department { id: number; name: string; code: string; }
export interface UserProfile { id: number; email: string; role: 'admin' | 'faculty' | 'counselor'; created_at: string; }
export interface Student { id: number; name: string; email: string; department_id: number; year: number; enrollment_date: string; }
export interface AttendanceRecord { id: number; student_id: number; date: string; status: 'present' | 'absent' | 'late'; subject: string; }
export interface AcademicRecord { id: number; student_id: number; course: string; score: number; date: string; }
export interface EngagementRecord { id: number; student_id: number; lms_logins: number; assignments_submitted: number; time_on_task: number; date: string; }
export type RiskTier = 'GREEN' | 'AMBER' | 'RED' | 'CRITICAL';
export type RiskTrajectory = 'improving' | 'stable' | 'deteriorating';
export interface RiskAssessment { id: number; student_id: number; risk_score: number; tier: RiskTier; trajectory: RiskTrajectory; created_at: string; }
export interface RootCauseAssessment { id: number; student_id: number; primary_cause: string; confidence: number; factors: string[]; created_at: string; }
export interface Intervention { id: number; student_id: number; type: string; status: 'recommended' | 'pending' | 'assigned' | 'in_progress' | 'completed'; assigned_to: number | null; due_date: string | null; outcome: string | null; created_at: string; }
