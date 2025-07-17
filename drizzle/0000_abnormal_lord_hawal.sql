CREATE TABLE `asset_allocations` (
	`allocation_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`allocation_type` enum('current','target') NOT NULL,
	`stocks` decimal(5,2) NOT NULL,
	`bonds` decimal(5,2) NOT NULL,
	`cash` decimal(5,2) NOT NULL,
	`real_estate` decimal(5,2) NOT NULL,
	`alternatives` decimal(5,2) NOT NULL,
	`other` decimal(5,2) NOT NULL,
	`liquidity_needs` decimal(5,2),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_allocations_allocation_id` PRIMARY KEY(`allocation_id`)
);
--> statement-breakpoint
CREATE TABLE `asset_details` (
	`detail_id` varchar(36) NOT NULL,
	`asset_id` varchar(36) NOT NULL,
	`detail_key` varchar(50) NOT NULL,
	`detail_value` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `asset_details_detail_id` PRIMARY KEY(`detail_id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`asset_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`asset_type` enum('liquid','investment','retirement','real_estate','business','personal_property') NOT NULL,
	`name` varchar(100) NOT NULL,
	`institution` varchar(100),
	`current_value` decimal(15,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_asset_id` PRIMARY KEY(`asset_id`)
);
--> statement-breakpoint
CREATE TABLE `basic_info` (
	`basic_info_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`current_age` int,
	`expected_retirement_age` int,
	`marital_status` enum('single','married','divorced','widowed','separated','domestic_partnership'),
	`spouse_age` int,
	`dependents_count` int,
	`dependent_ages` text,
	`employment_status` enum('employed','self-employed','unemployed','retired','student'),
	`profession` varchar(100),
	`years_in_position` int,
	`expected_career_change` varchar(100),
	`career_change_years` int,
	`has_pension` boolean,
	`has_401k_match` boolean,
	`has_stock_options` boolean,
	`health_status` enum('excellent','good','fair','poor'),
	`family_health_concerns` json,
	`medical_conditions` json,
	`risk_tolerance` int,
	`investment_experience` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `basic_info_basic_info_id` PRIMARY KEY(`basic_info_id`)
);
--> statement-breakpoint
CREATE TABLE `emergency_funds` (
	`fund_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`total_emergency_savings` decimal(15,2) DEFAULT '0',
	`monthly_essential_expenses` decimal(15,2),
	`target_coverage_months` int DEFAULT 6,
	`has_used_emergency_funds` boolean DEFAULT false,
	`has_line_of_credit` boolean DEFAULT false,
	`has_insurance_coverage` boolean DEFAULT false,
	`has_family_support` boolean DEFAULT false,
	`family_support_details` text,
	`other_liquid_assets` decimal(15,2) DEFAULT '0',
	`monthly_contribution` decimal(15,2) DEFAULT '0',
	`target_completion_date` date,
	`job_security_level` int,
	`health_considerations` text,
	`major_upcoming_expenses` text,
	`dependent_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emergency_funds_fund_id` PRIMARY KEY(`fund_id`)
);
--> statement-breakpoint
CREATE TABLE `emergency_savings_accounts` (
	`account_id` varchar(36) NOT NULL,
	`fund_id` varchar(36) NOT NULL,
	`account_type` varchar(50) NOT NULL,
	`institution` varchar(100),
	`amount` decimal(15,2) NOT NULL,
	`interest_rate` decimal(5,2),
	`liquidity_period` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emergency_savings_accounts_account_id` PRIMARY KEY(`account_id`)
);
--> statement-breakpoint
CREATE TABLE `income_sources` (
	`income_source_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` enum('salary','self_employment','pension','social_security','investments','rental','other') NOT NULL,
	`name` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`frequency` enum('weekly','biweekly','bimonthly','monthly','quarterly','annual','irregular') NOT NULL,
	`description` text,
	`tax_status` enum('fully_taxable','partially_taxable','tax_free'),
	`growth_rate` decimal(5,2),
	`duration` varchar(50),
	`is_primary` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `income_sources_income_source_id` PRIMARY KEY(`income_source_id`)
);
--> statement-breakpoint
CREATE TABLE `debt_details` (
	`detail_id` varchar(36) NOT NULL,
	`debt_id` varchar(36) NOT NULL,
	`detail_key` varchar(50) NOT NULL,
	`detail_value` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debt_details_detail_id` PRIMARY KEY(`detail_id`)
);
--> statement-breakpoint
CREATE TABLE `debt_strategies` (
	`strategy_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`current_strategy` enum('avalanche','snowball','highest_interest','custom','none') NOT NULL,
	`custom_strategy` text,
	`consolidation_plans` text,
	`priority_debt_id` varchar(36),
	`bankruptcy_history` boolean DEFAULT false,
	`bankruptcy_details` text,
	`debt_settlement_activities` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debt_strategies_strategy_id` PRIMARY KEY(`strategy_id`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`debt_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`debt_type` enum('mortgage','auto_loan','student_loan','credit_card','personal_loan','other') NOT NULL,
	`lender` varchar(100) NOT NULL,
	`account_last4` varchar(4),
	`original_amount` decimal(15,2),
	`current_balance` decimal(15,2) NOT NULL,
	`interest_rate` decimal(5,3) NOT NULL,
	`monthly_payment` decimal(15,2) NOT NULL,
	`remaining_term` int,
	`original_term` int,
	`is_joint` boolean DEFAULT false,
	`status` enum('current','past_due','delinquent','in_collection','default','paid_off','in_grace_period') NOT NULL,
	`has_collateral` boolean DEFAULT false,
	`collateral_description` text,
	`has_cosigner` boolean DEFAULT false,
	`cosigner_name` varchar(100),
	`extra_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_debt_id` PRIMARY KEY(`debt_id`)
);
--> statement-breakpoint
CREATE TABLE `expense_categories` (
	`category_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` varchar(50) NOT NULL,
	`total_monthly` decimal(15,2) DEFAULT '0',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expense_categories_category_id` PRIMARY KEY(`category_id`)
);
--> statement-breakpoint
CREATE TABLE `expense_items` (
	`expense_id` varchar(36) NOT NULL,
	`category_id` varchar(36) NOT NULL,
	`subcategory` varchar(50) NOT NULL,
	`description` text,
	`amount` decimal(15,2) NOT NULL,
	`frequency` enum('daily','weekly','biweekly','monthly','quarterly','annual','one_time') NOT NULL,
	`is_variable` boolean DEFAULT false,
	`variable_min` decimal(15,2),
	`variable_max` decimal(15,2),
	`is_tax_deductible` boolean DEFAULT false,
	`priority` enum('essential','important','discretionary','luxury') NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expense_items_expense_id` PRIMARY KEY(`expense_id`)
);
--> statement-breakpoint
CREATE TABLE `hubspot_sync_logs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`action` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hubspot_sync_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`status` boolean NOT NULL DEFAULT true,
	`plan` enum('free','community','investor') NOT NULL DEFAULT 'free',
	`current_period_start` timestamp NOT NULL DEFAULT (now()),
	`current_period_end` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`cancel_at_period_end` boolean DEFAULT false,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`clerk_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`first_name` varchar(255),
	`last_name` varchar(255),
	`age` int,
	`investment_goals` json,
	`investment_accreditation` boolean,
	`risk_tolerance` enum('moderate','conservative','aggressive'),
	`location` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`hubspot_contact_id` varchar(255),
	`plaidUserToken` varchar(255),
	`onboarding` boolean NOT NULL DEFAULT true,
	`metadata` json,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_clerk_id_unique` UNIQUE(`clerk_id`)
);
--> statement-breakpoint
CREATE TABLE `liabilities` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`data` varchar(5000) NOT NULL,
	`last_updated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plaid_items` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`item_id` varchar(255) NOT NULL,
	`access_token` varchar(255) NOT NULL,
	`status` varchar(255) DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plaid_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `asset_allocations` ADD CONSTRAINT `asset_allocations_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_details` ADD CONSTRAINT `asset_details_asset_id_assets_asset_id_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`asset_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `basic_info` ADD CONSTRAINT `basic_info_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_funds` ADD CONSTRAINT `emergency_funds_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emergency_savings_accounts` ADD CONSTRAINT `emergency_savings_accounts_fund_id_emergency_funds_fund_id_fk` FOREIGN KEY (`fund_id`) REFERENCES `emergency_funds`(`fund_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `income_sources` ADD CONSTRAINT `income_sources_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debt_details` ADD CONSTRAINT `debt_details_debt_id_debts_debt_id_fk` FOREIGN KEY (`debt_id`) REFERENCES `debts`(`debt_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debt_strategies` ADD CONSTRAINT `debt_strategies_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `debts` ADD CONSTRAINT `debts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expense_items` ADD CONSTRAINT `expense_items_category_id_expense_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`category_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hubspot_sync_logs` ADD CONSTRAINT `hubspot_sync_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `liabilities` ADD CONSTRAINT `liabilities_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plaid_items` ADD CONSTRAINT `plaid_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;