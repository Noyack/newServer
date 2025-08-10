import { mysqlTable, varchar, timestamp, boolean, json, int, mysqlEnum, decimal, text, date } from 'drizzle-orm/mysql-core';
import { v4 as uuidv4 } from 'uuid';
import { users } from '.';

// Basic Information Table
export const basicInfo = mysqlTable('basic_info', {
  id: varchar('basic_info_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  currentAge: int('current_age'),
  expectedRetirementAge: int('expected_retirement_age'),
  maritalStatus: mysqlEnum('marital_status', ['single', 'married', 'divorced', 'widowed', 'separated', 'domestic_partnership']),
  spouseAge: int('spouse_age'),
  dependentsCount: int('dependents_count'),
  dependentAges: text('dependent_ages'),
  employmentStatus: mysqlEnum('employment_status', ['employed', 'self-employed', 'unemployed', 'retired', 'student']),
  profession: varchar('profession', { length: 100 }),
  yearsInPosition: int('years_in_position'),
  expectedCareerChange: varchar('expected_career_change', { length: 100 }),
  careerChangeYears: int('career_change_years'),
  hasPension: boolean('has_pension'),
  has401kMatch: boolean('has_401k_match'),
  hasStockOptions: boolean('has_stock_options'),
  healthStatus: mysqlEnum('health_status', ['excellent', 'good', 'fair', 'poor']),
  familyHealthConcerns: json('family_health_concerns'),
  medicalConditions: json('medical_conditions'),
  riskTolerance: int('risk_tolerance'),
  investmentExperience: json('investment_experience'),
  majorInvestmentTimeHorizon:int('majorInvestmentTimeHorizon'),
  lifestyleSacrifice: int('lifestyleSacrifice'),
  longTermCare: int('longTermCare'),
  futureCareNeeds: json('future_care_needs'), // or appropriate type
  investmentResponse: varchar('investment_response', { length: 100 }), 
  otherMedicalConditions: text('other_medical_conditions'),
  supportingAdultChildren: boolean('supporting_adult_children'),
  supportingOtherRelatives: boolean('supporting_other_relatives'),
  supportingParents: boolean('supporting_parents'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').onUpdateNow()
});

// Income Sources Table
export const incomeSources = mysqlTable('income_sources', {
  id: varchar('income_source_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  type: mysqlEnum('type', ['salary', 'self_employment', 'pension', 'social_security', 'investments', 'rental', 'other']).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  frequency: mysqlEnum('frequency', ['weekly', 'biweekly', 'bimonthly', 'monthly', 'quarterly', 'annual', 'irregular']).notNull(),
  description: text('description'),
  taxStatus: mysqlEnum('tax_status', ['fully_taxable', 'partially_taxable', 'tax_free']),
  growthRate: decimal('growth_rate', { precision: 5, scale: 2 }),
  duration: varchar('duration', { length: 50 }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Emergency Funds Table
export const emergencyFunds = mysqlTable('emergency_funds', {
  id: varchar('fund_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
  totalEmergencySavings: decimal('total_emergency_savings', { precision: 15, scale: 2 }).default('0'),
  monthlyEssentialExpenses: decimal('monthly_essential_expenses', { precision: 15, scale: 2 }),
  targetCoverageMonths: int('target_coverage_months').default(6),
  hasUsedEmergencyFunds: boolean('has_used_emergency_funds').default(false),
  hasLineOfCredit: boolean('has_line_of_credit').default(false),
  hasInsuranceCoverage: boolean('has_insurance_coverage').default(false),
  hasFamilySupport: boolean('has_family_support').default(false),
  familySupportDetails: text('family_support_details'),
  otherLiquidAssets: decimal('other_liquid_assets', { precision: 15, scale: 2 }).default('0'),
  monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }).default('0'),
  targetCompletionDate: date('target_completion_date'),
  jobSecurityLevel: int('job_security_level'),
  healthConsiderations: text('health_considerations'),
  majorUpcomingExpenses: text('major_upcoming_expenses'),
  dependentCount: int('dependent_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});

// Emergency Savings Accounts
export const emergencySavingsAccounts = mysqlTable('emergency_savings_accounts', {
  id: varchar('account_id', { length: 36 }).primaryKey().$defaultFn(() => uuidv4()),
  fundId: varchar('fund_id', { length: 36 }).notNull().references(() => emergencyFunds.id),
  accountType: varchar('account_type', { length: 50 }).notNull(),
  institution: varchar('institution', { length: 100 }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }),
  liquidityPeriod: varchar('liquidity_period', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow()
});