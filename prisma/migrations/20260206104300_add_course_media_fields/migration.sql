-- AlterTable
ALTER TABLE `course_chapters` ADD COLUMN `duration` INTEGER NULL;

-- AlterTable
ALTER TABLE `course_modules` ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `module_image` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `course_sections` ADD COLUMN `attachments` VARCHAR(191) NULL,
    ADD COLUMN `duration` INTEGER NULL,
    ADD COLUMN `image_url` VARCHAR(191) NULL,
    ADD COLUMN `is_preview` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `section_type` VARCHAR(191) NULL;
