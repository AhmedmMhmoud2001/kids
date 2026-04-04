-- Create RBAC tables
CREATE TABLE `app_roles` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `app_roles_key_key`(`key`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `app_permissions` (
  `id` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `module` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `app_permissions_key_key`(`key`),
  UNIQUE INDEX `app_permissions_module_action_key`(`module`, `action`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `assignedBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
  INDEX `user_roles_roleId_idx`(`roleId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `id` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
  INDEX `role_permissions_permissionId_idx`(`permissionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_permissions` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `permissionId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `user_permissions_userId_permissionId_key`(`userId`, `permissionId`),
  INDEX `user_permissions_permissionId_idx`(`permissionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `app_roles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `app_roles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_permissionId_fkey`
    FOREIGN KEY (`permissionId`) REFERENCES `app_permissions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_permissions_permissionId_fkey`
    FOREIGN KEY (`permissionId`) REFERENCES `app_permissions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
