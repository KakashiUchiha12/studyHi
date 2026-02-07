-- AlterTable
ALTER TABLE `Notification` ADD COLUMN `sender_id` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
