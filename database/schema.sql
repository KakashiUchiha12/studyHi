-- Study Planner Database Schema
-- Run this in phpMyAdmin to create your database structure

-- Disable foreign key checks for bulk operations
SET FOREIGN_KEY_CHECKS=0;

-- Users table
CREATE TABLE IF NOT EXISTS `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) UNIQUE,
    `email` VARCHAR(191) UNIQUE NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- UserProfile table
CREATE TABLE IF NOT EXISTS `UserProfile` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) UNIQUE NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `university` VARCHAR(191),
    `program` VARCHAR(191),
    `current_year` VARCHAR(191),
    `gpa` VARCHAR(191),
    `bio` VARCHAR(191),
    `profile_picture` VARCHAR(191),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Subjects table
CREATE TABLE IF NOT EXISTS `Subject` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#3B82F6',
    `description` VARCHAR(191),
    `code` VARCHAR(191),
    `credits` INTEGER NOT NULL DEFAULT 3,
    `instructor` VARCHAR(191),
    `total_chapters` INTEGER NOT NULL DEFAULT 0,
    `completed_chapters` INTEGER NOT NULL DEFAULT 0,
    `progress` DOUBLE NOT NULL DEFAULT 0.0,
    `next_exam` DATETIME(3),
    `assignments_due` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- SubjectFile table
CREATE TABLE IF NOT EXISTS `SubjectFile` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subject_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `thumbnail_path` VARCHAR(191),
    `category` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `description` VARCHAR(191),
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `download_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS `Task` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subject_id` VARCHAR(191),
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191),
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `due_date` DATETIME(3),
    `completed_at` DATETIME(3),
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `estimated_time` INTEGER,
    `time_spent` INTEGER,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `progress` DOUBLE,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- StudySession table
CREATE TABLE IF NOT EXISTS `StudySession` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subject_id` VARCHAR(191),
    `duration_minutes` INTEGER NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191),
    `efficiency` DOUBLE,
    `session_type` VARCHAR(191),
    `productivity` DOUBLE,
    `topics_covered` VARCHAR(191),
    `materials_used` VARCHAR(191),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- StudyGoal table
CREATE TABLE IF NOT EXISTS `StudyGoal` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subject_id` VARCHAR(191),
    `title` VARCHAR(191) NOT NULL,
    `target_hours` INTEGER NOT NULL,
    `current_hours` INTEGER NOT NULL DEFAULT 0,
    `deadline` DATETIME(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- TestMark table
CREATE TABLE IF NOT EXISTS `TestMark` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `subject_id` VARCHAR(191) NOT NULL,
    `test_name` VARCHAR(191) NOT NULL,
    `test_type` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `max_score` DOUBLE NOT NULL,
    `test_date` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191),
    `mistakes` VARCHAR(191),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- UserSettings table
CREATE TABLE IF NOT EXISTS `UserSettings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) UNIQUE NOT NULL,
    `task_reminders` BOOLEAN NOT NULL DEFAULT true,
    `email_notifications` BOOLEAN NOT NULL DEFAULT false,
    `push_notifications` BOOLEAN NOT NULL DEFAULT true,
    `reminder_time` VARCHAR(191) NOT NULL DEFAULT '09:00',
    `study_session_alerts` BOOLEAN NOT NULL DEFAULT true,
    `default_study_goal` INTEGER NOT NULL DEFAULT 240,
    `preferred_study_time` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `break_reminders` BOOLEAN NOT NULL DEFAULT true,
    `break_duration` INTEGER NOT NULL DEFAULT 15,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `dashboard_layout` VARCHAR(191) NOT NULL DEFAULT 'default',
    `show_progress_bars` BOOLEAN NOT NULL DEFAULT true,
    `compact_mode` BOOLEAN NOT NULL DEFAULT false,
    `auto_backup` BOOLEAN NOT NULL DEFAULT true,
    `data_retention_days` INTEGER NOT NULL DEFAULT 365,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Chapter table
CREATE TABLE IF NOT EXISTS `Chapter` (
    `id` VARCHAR(191) NOT NULL,
    `subject_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191),
    `order` INTEGER NOT NULL,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `estimated_hours` INTEGER NOT NULL DEFAULT 2,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Chapter_subject_id_order_key` (`subject_id`, `order`),
    FOREIGN KEY (`subject_id`) REFERENCES `Subject`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Material table
CREATE TABLE IF NOT EXISTS `Material` (
    `id` VARCHAR(191) NOT NULL,
    `chapter_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191),
    `file_url` VARCHAR(191),
    `file_size` INTEGER,
    `duration` INTEGER,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Material_chapter_id_order_key` (`chapter_id`, `order`),
    FOREIGN KEY (`chapter_id`) REFERENCES `Chapter`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CalendarEvent table
CREATE TABLE IF NOT EXISTS `CalendarEvent` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `start` DATETIME(3) NOT NULL,
    `end` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191),
    `location` VARCHAR(191),
    `priority` VARCHAR(191) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `notificationEnabled` BOOLEAN NOT NULL DEFAULT false,
    `notificationTime` INTEGER NOT NULL DEFAULT 15,
    `color` VARCHAR(191),
    `recurringType` VARCHAR(191),
    `recurringInterval` INTEGER,
    `recurringEndDate` DATETIME(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

