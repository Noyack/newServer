ALTER TABLE `basic_info` ADD `longTermCare` int;--> statement-breakpoint
ALTER TABLE `basic_info` ADD `future_care_needs` json;--> statement-breakpoint
ALTER TABLE `basic_info` ADD `investment_response` varchar(100);--> statement-breakpoint
ALTER TABLE `basic_info` ADD `other_medical_conditions` text;--> statement-breakpoint
ALTER TABLE `basic_info` ADD `supporting_adult_children` boolean;--> statement-breakpoint
ALTER TABLE `basic_info` ADD `supporting_other_relatives` boolean;--> statement-breakpoint
ALTER TABLE `basic_info` ADD `supporting_parents` boolean;