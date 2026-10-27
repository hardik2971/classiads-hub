-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: classiads
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ad_custom_field_values`
--

DROP TABLE IF EXISTS `ad_custom_field_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ad_custom_field_values` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ad_id` bigint(20) unsigned NOT NULL,
  `custom_field_id` bigint(20) unsigned NOT NULL,
  `value` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ad_custom_field_values_ad_id_custom_field_id_unique` (`ad_id`,`custom_field_id`),
  KEY `ad_custom_field_values_custom_field_id_value_index` (`custom_field_id`,`value`),
  CONSTRAINT `ad_custom_field_values_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ad_custom_field_values_custom_field_id_foreign` FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad_custom_field_values`
--

LOCK TABLES `ad_custom_field_values` WRITE;
/*!40000 ALTER TABLE `ad_custom_field_values` DISABLE KEYS */;
INSERT INTO `ad_custom_field_values` VALUES (1,1,1,'Ford','2026-05-25 06:21:04','2026-05-25 06:21:04'),(2,1,2,'2021','2026-05-25 06:21:04','2026-05-25 06:21:04'),(3,1,4,'petrol','2026-05-25 06:21:04','2026-05-25 06:21:04'),(4,1,5,'automatic','2026-05-25 06:21:04','2026-05-25 06:21:04'),(5,2,1,'Toyota','2026-05-25 06:21:04','2026-05-25 06:21:04'),(6,2,2,'2019','2026-05-25 06:21:04','2026-05-25 06:21:04'),(7,2,4,'petrol','2026-05-25 06:21:04','2026-05-25 06:21:04'),(8,2,5,'manual','2026-05-25 06:21:04','2026-05-25 06:21:04'),(9,5,9,'4','2026-05-25 06:21:05','2026-05-25 06:21:05'),(10,5,10,'3200','2026-05-25 06:21:05','2026-05-25 06:21:05'),(11,6,9,'2','2026-05-25 06:21:05','2026-05-25 06:21:05'),(12,6,10,'1100','2026-05-25 06:21:05','2026-05-25 06:21:05');
/*!40000 ALTER TABLE `ad_custom_field_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ad_images`
--

DROP TABLE IF EXISTS `ad_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ad_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ad_id` bigint(20) unsigned NOT NULL,
  `path` varchar(255) NOT NULL,
  `disk` varchar(32) NOT NULL DEFAULT 'public',
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ad_images_ad_id_index` (`ad_id`),
  CONSTRAINT `ad_images_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad_images`
--

LOCK TABLES `ad_images` WRITE;
/*!40000 ALTER TABLE `ad_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `ad_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ad_sales`
--

DROP TABLE IF EXISTS `ad_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ad_sales` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ad_id` bigint(20) unsigned NOT NULL,
  `seller_id` bigint(20) unsigned NOT NULL,
  `buyer_id` bigint(20) unsigned NOT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ad_sales_ad_id_unique` (`ad_id`),
  KEY `ad_sales_seller_id_foreign` (`seller_id`),
  KEY `ad_sales_buyer_id_index` (`buyer_id`),
  CONSTRAINT `ad_sales_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ad_sales_buyer_id_foreign` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ad_sales_seller_id_foreign` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad_sales`
--

LOCK TABLES `ad_sales` WRITE;
/*!40000 ALTER TABLE `ad_sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `ad_sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ads`
--

DROP TABLE IF EXISTS `ads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` longtext NOT NULL,
  `price` bigint(20) unsigned DEFAULT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `price_type` enum('fixed','negotiable','free','contact') NOT NULL DEFAULT 'fixed',
  `condition` enum('new','used','refurbished') DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `video_url` varchar(255) DEFAULT NULL,
  `country_id` bigint(20) unsigned DEFAULT NULL,
  `state_id` bigint(20) unsigned DEFAULT NULL,
  `city_id` bigint(20) unsigned DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','sold','expired') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(255) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `featured_until` timestamp NULL DEFAULT NULL,
  `views_count` bigint(20) unsigned NOT NULL DEFAULT 0,
  `favorites_count` int(10) unsigned NOT NULL DEFAULT 0,
  `approved_at` timestamp NULL DEFAULT NULL,
  `sold_at` timestamp NULL DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ads_slug_unique` (`slug`),
  KEY `ads_user_id_foreign` (`user_id`),
  KEY `ads_country_id_foreign` (`country_id`),
  KEY `ads_state_id_foreign` (`state_id`),
  KEY `ads_category_id_status_index` (`category_id`,`status`),
  KEY `ads_city_id_status_index` (`city_id`,`status`),
  KEY `ads_latitude_longitude_index` (`latitude`,`longitude`),
  KEY `ads_status_index` (`status`),
  KEY `ads_is_featured_index` (`is_featured`),
  KEY `ads_expires_at_index` (`expires_at`),
  FULLTEXT KEY `ads_title_description_fulltext` (`title`,`description`),
  CONSTRAINT `ads_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `ads_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ads_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ads_state_id_foreign` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ads_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ads`
--

LOCK TABLES `ads` WRITE;
/*!40000 ALTER TABLE `ads` DISABLE KEYS */;
INSERT INTO `ads` VALUES (1,2,2,'Ford Mustang EcoBoost Fastback','ford-mustang-ecoboost-fastback-3snvje','Well-maintained Ford Mustang EcoBoost. Single owner, full service history.',3500000,'USD','negotiable','used',NULL,NULL,1,1,1,NULL,23.2419000,69.6669000,'approved',NULL,1,NULL,149,1,'2026-05-25 06:21:04',NULL,'2026-05-25 06:21:04','2026-06-24 06:21:04','2026-05-25 06:21:04','2026-06-16 01:44:06',NULL),(2,2,2,'Toyota Corolla 2019','toyota-corolla-2019-7qj1ns','Reliable Toyota Corolla, low kilometers, excellent condition.',1500000,'USD','negotiable','used',NULL,NULL,2,3,6,NULL,25.2048000,55.2708000,'approved',NULL,1,NULL,128,0,'2026-05-25 06:21:04',NULL,'2026-05-24 06:21:04','2026-06-24 06:21:04','2026-05-25 06:21:04','2026-05-27 03:24:38',NULL),(3,2,3,'Apple iPhone 15 Pro Max 256GB','apple-iphone-15-pro-max-256gb-k9gzxh','Brand new sealed iPhone 15 Pro Max, 256GB, Natural Titanium.',109900,'USD','negotiable','new',NULL,NULL,1,1,1,NULL,23.2419000,69.6669000,'approved',NULL,0,NULL,115,0,'2026-05-25 06:21:05',NULL,'2026-05-23 06:21:05','2026-06-24 06:21:05','2026-05-25 06:21:05','2026-05-25 06:21:05',NULL),(4,2,3,'Samsung Galaxy S24 Ultra','samsung-galaxy-s24-ultra-ie3yuc','Samsung Galaxy S24 Ultra, 512GB, with warranty.',99900,'USD','negotiable','new',NULL,NULL,2,3,6,NULL,25.2048000,55.2708000,'approved',NULL,0,NULL,197,0,'2026-05-25 06:21:05',NULL,'2026-05-22 06:21:05','2026-06-24 06:21:05','2026-05-25 06:21:05','2026-05-25 06:21:05',NULL),(5,2,1,'Dream Villa 4BHK','dream-villa-4bhk-89gdpn','Spacious 4BHK villa with garden and parking in a prime location.',9999900,'USD','negotiable',NULL,NULL,NULL,2,3,6,NULL,25.2048000,55.2708000,'approved',NULL,0,NULL,369,0,'2026-05-25 06:21:05',NULL,'2026-05-21 06:21:05','2026-06-24 06:21:05','2026-05-25 06:21:05','2026-05-27 05:18:15',NULL),(6,2,1,'2BHK House for Sale','2bhk-house-for-sale-ypkyza','Affordable 2BHK house, ready to move in.',20000,'USD','negotiable',NULL,'09824701742','http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',1,1,10,'Patel Fashion, J-3 Ranjit Nagar Vegetable market',23.2419000,69.6669000,'approved',NULL,1,'2026-06-04 10:35:26',157,1,'2026-05-25 06:21:05','2026-06-11 10:35:53','2026-05-20 06:21:05','2026-06-24 06:21:05','2026-05-25 06:21:05','2026-06-04 05:07:12',NULL);
/*!40000 ALTER TABLE `ads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `country_id` bigint(20) unsigned NOT NULL,
  `state_id` bigint(20) unsigned NOT NULL,
  `city_id` bigint(20) unsigned NOT NULL,
  `name` varchar(150) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `areas_state_id_foreign` (`state_id`),
  KEY `areas_city_id_foreign` (`city_id`),
  KEY `areas_country_id_state_id_city_id_index` (`country_id`,`state_id`,`city_id`),
  KEY `areas_is_active_index` (`is_active`),
  CONSTRAINT `areas_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `areas_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `areas_state_id_foreign` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas`
--

LOCK TABLES `areas` WRITE;
/*!40000 ALTER TABLE `areas` DISABLE KEYS */;
/*!40000 ALTER TABLE `areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `auditable_type` varchar(191) DEFAULT NULL,
  `auditable_id` bigint(20) unsigned DEFAULT NULL,
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_foreign` (`user_id`),
  KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,NULL,'seed.roles_permissions',NULL,NULL,'{\"roles\":5,\"permissions\":94}',NULL,'2026-05-25 06:20:51');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_categories`
--

DROP TABLE IF EXISTS `blog_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blog_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_categories_slug_unique` (`slug`),
  KEY `blog_categories_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_categories`
--

LOCK TABLES `blog_categories` WRITE;
/*!40000 ALTER TABLE `blog_categories` DISABLE KEYS */;
INSERT INTO `blog_categories` VALUES (1,'Announcements','announcements',1,1,'2026-05-25 06:21:08','2026-05-25 06:21:08'),(2,'Tips & Guides','tips-guides',1,2,'2026-05-25 06:21:09','2026-05-25 06:21:09');
/*!40000 ALTER TABLE `blog_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blog_posts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `blog_category_id` bigint(20) unsigned DEFAULT NULL,
  `author_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `body` longtext NOT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `cover_image_path` varchar(255) DEFAULT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `views_count` bigint(20) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_unique` (`slug`),
  KEY `blog_posts_blog_category_id_foreign` (`blog_category_id`),
  KEY `blog_posts_author_id_foreign` (`author_id`),
  KEY `blog_posts_status_index` (`status`),
  KEY `blog_posts_published_at_index` (`published_at`),
  CONSTRAINT `blog_posts_author_id_foreign` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `blog_posts_blog_category_id_foreign` FOREIGN KEY (`blog_category_id`) REFERENCES `blog_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts`
--

LOCK TABLES `blog_posts` WRITE;
/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
INSERT INTO `blog_posts` VALUES (1,1,1,'Secure Transactions Made Simple','secure-transactions-made-simple','How we keep your payments and trades safe.','Our platform uses secure payment gateways and verified profiles to protect buyers and sellers.',NULL,NULL,'published','2026-06-04 01:41:26',2,'2026-05-25 06:21:09','2026-06-04 01:41:26'),(2,1,1,'In-App Chat Feature','in-app-chat-feature','Communicate with buyers and sellers in real time.','Negotiate, make offers, and close deals — all from within the app.',NULL,NULL,'published','2026-06-03 01:41:26',0,'2026-05-25 06:21:09','2026-06-04 01:41:26'),(3,1,1,'Customizable Themes','customizable-themes','Personalize your marketplace experience.','Switch languages, currencies, and themes to suit your needs.',NULL,NULL,'published','2026-06-02 01:41:26',0,'2026-05-25 06:21:09','2026-06-04 01:41:26');
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('classiads-hub-cache-a75f3f172bfb296f2e10cbfc6dfc1883','i:1;',1781594106),('classiads-hub-cache-a75f3f172bfb296f2e10cbfc6dfc1883:timer','i:1781594105;',1781594105),('classiads-hub-cache-categories.tree','O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:14:{i:0;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:1;s:9:\"parent_id\";N;s:4:\"name\";s:11:\"Real Estate\";s:4:\"slug\";s:11:\"real-estate\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"property\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:1;s:9:\"parent_id\";N;s:4:\"name\";s:11:\"Real Estate\";s:4:\"slug\";s:11:\"real-estate\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"property\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:4:{i:0;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:19;s:9:\"parent_id\";i:1;s:4:\"name\";s:16:\"For Sale: Houses\";s:4:\"slug\";s:27:\"real-estate-for-sale-houses\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:19;s:9:\"parent_id\";i:1;s:4:\"name\";s:16:\"For Sale: Houses\";s:4:\"slug\";s:27:\"real-estate-for-sale-houses\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:20;s:9:\"parent_id\";i:1;s:4:\"name\";s:20:\"For Rent: Apartments\";s:4:\"slug\";s:31:\"real-estate-for-rent-apartments\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:20;s:9:\"parent_id\";i:1;s:4:\"name\";s:20:\"For Rent: Apartments\";s:4:\"slug\";s:31:\"real-estate-for-rent-apartments\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:21;s:9:\"parent_id\";i:1;s:4:\"name\";s:10:\"Commercial\";s:4:\"slug\";s:22:\"real-estate-commercial\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:21;s:9:\"parent_id\";i:1;s:4:\"name\";s:10:\"Commercial\";s:4:\"slug\";s:22:\"real-estate-commercial\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:3;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:22;s:9:\"parent_id\";i:1;s:4:\"name\";s:4:\"Land\";s:4:\"slug\";s:16:\"real-estate-land\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:22;s:9:\"parent_id\";i:1;s:4:\"name\";s:4:\"Land\";s:4:\"slug\";s:16:\"real-estate-land\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:2;s:9:\"parent_id\";N;s:4:\"name\";s:15:\"Cars & Vehicles\";s:4:\"slug\";s:13:\"cars-vehicles\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:2;s:9:\"parent_id\";N;s:4:\"name\";s:15:\"Cars & Vehicles\";s:4:\"slug\";s:13:\"cars-vehicles\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:4:{i:0;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:15;s:9:\"parent_id\";i:2;s:4:\"name\";s:4:\"Cars\";s:4:\"slug\";s:18:\"cars-vehicles-cars\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:15;s:9:\"parent_id\";i:2;s:4:\"name\";s:4:\"Cars\";s:4:\"slug\";s:18:\"cars-vehicles-cars\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:16;s:9:\"parent_id\";i:2;s:4:\"name\";s:11:\"Motorcycles\";s:4:\"slug\";s:25:\"cars-vehicles-motorcycles\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:16;s:9:\"parent_id\";i:2;s:4:\"name\";s:11:\"Motorcycles\";s:4:\"slug\";s:25:\"cars-vehicles-motorcycles\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:17;s:9:\"parent_id\";i:2;s:4:\"name\";s:6:\"Trucks\";s:4:\"slug\";s:20:\"cars-vehicles-trucks\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:17;s:9:\"parent_id\";i:2;s:4:\"name\";s:6:\"Trucks\";s:4:\"slug\";s:20:\"cars-vehicles-trucks\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:3;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:18;s:9:\"parent_id\";i:2;s:4:\"name\";s:10:\"Auto Parts\";s:4:\"slug\";s:24:\"cars-vehicles-auto-parts\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:18;s:9:\"parent_id\";i:2;s:4:\"name\";s:10:\"Auto Parts\";s:4:\"slug\";s:24:\"cars-vehicles-auto-parts\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:3;s:9:\"parent_id\";N;s:4:\"name\";s:23:\"Mobile Phones & Tablets\";s:4:\"slug\";s:21:\"mobile-phones-tablets\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:3;s:9:\"parent_id\";N;s:4:\"name\";s:23:\"Mobile Phones & Tablets\";s:4:\"slug\";s:21:\"mobile-phones-tablets\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:3;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:4;s:9:\"parent_id\";N;s:4:\"name\";s:11:\"Electronics\";s:4:\"slug\";s:11:\"electronics\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:4;s:9:\"parent_id\";N;s:4:\"name\";s:11:\"Electronics\";s:4:\"slug\";s:11:\"electronics\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:3:{i:0;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:23;s:9:\"parent_id\";i:4;s:4:\"name\";s:17:\"TV & Home Theater\";s:4:\"slug\";s:27:\"electronics-tv-home-theater\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:23;s:9:\"parent_id\";i:4;s:4:\"name\";s:17:\"TV & Home Theater\";s:4:\"slug\";s:27:\"electronics-tv-home-theater\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:24;s:9:\"parent_id\";i:4;s:4:\"name\";s:22:\"Computers & Networking\";s:4:\"slug\";s:32:\"electronics-computers-networking\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:24;s:9:\"parent_id\";i:4;s:4:\"name\";s:22:\"Computers & Networking\";s:4:\"slug\";s:32:\"electronics-computers-networking\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:25;s:9:\"parent_id\";i:4;s:4:\"name\";s:18:\"Audio & Headphones\";s:4:\"slug\";s:28:\"electronics-audio-headphones\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:25;s:9:\"parent_id\";i:4;s:4:\"name\";s:18:\"Audio & Headphones\";s:4:\"slug\";s:28:\"electronics-audio-headphones\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:4;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:5;s:9:\"parent_id\";N;s:4:\"name\";s:15:\"Home Appliances\";s:4:\"slug\";s:15:\"home-appliances\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:4;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:5;s:9:\"parent_id\";N;s:4:\"name\";s:15:\"Home Appliances\";s:4:\"slug\";s:15:\"home-appliances\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:4;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:5;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:6;s:9:\"parent_id\";N;s:4:\"name\";s:24:\"Furniture, Home & Garden\";s:4:\"slug\";s:21:\"furniture-home-garden\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:5;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:6;s:9:\"parent_id\";N;s:4:\"name\";s:24:\"Furniture, Home & Garden\";s:4:\"slug\";s:21:\"furniture-home-garden\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:5;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:6;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:7;s:9:\"parent_id\";N;s:4:\"name\";s:22:\"Clothing & Accessories\";s:4:\"slug\";s:20:\"clothing-accessories\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:6;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:7;s:9:\"parent_id\";N;s:4:\"name\";s:22:\"Clothing & Accessories\";s:4:\"slug\";s:20:\"clothing-accessories\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:6;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:7;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:8;s:9:\"parent_id\";N;s:4:\"name\";s:17:\"Jewelry & Watches\";s:4:\"slug\";s:15:\"jewelry-watches\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:7;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:8;s:9:\"parent_id\";N;s:4:\"name\";s:17:\"Jewelry & Watches\";s:4:\"slug\";s:15:\"jewelry-watches\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:7;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:8;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:9;s:9:\"parent_id\";N;s:4:\"name\";s:17:\"Cameras & Imaging\";s:4:\"slug\";s:15:\"cameras-imaging\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:8;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:9;s:9:\"parent_id\";N;s:4:\"name\";s:17:\"Cameras & Imaging\";s:4:\"slug\";s:15:\"cameras-imaging\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:8;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:9;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:10;s:9:\"parent_id\";N;s:4:\"name\";s:22:\"Consoles & Video Games\";s:4:\"slug\";s:20:\"consoles-video-games\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:9;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:10;s:9:\"parent_id\";N;s:4:\"name\";s:22:\"Consoles & Video Games\";s:4:\"slug\";s:20:\"consoles-video-games\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:9;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:10;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:11;s:9:\"parent_id\";N;s:4:\"name\";s:19:\"Musical Instruments\";s:4:\"slug\";s:19:\"musical-instruments\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:10;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:11;s:9:\"parent_id\";N;s:4:\"name\";s:19:\"Musical Instruments\";s:4:\"slug\";s:19:\"musical-instruments\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:10;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:11;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:12;s:9:\"parent_id\";N;s:4:\"name\";s:16:\"Sports Equipment\";s:4:\"slug\";s:16:\"sports-equipment\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:11;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:12;s:9:\"parent_id\";N;s:4:\"name\";s:16:\"Sports Equipment\";s:4:\"slug\";s:16:\"sports-equipment\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:11;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:12;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:13;s:9:\"parent_id\";N;s:4:\"name\";s:4:\"Pets\";s:4:\"slug\";s:4:\"pets\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:12;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:13;s:9:\"parent_id\";N;s:4:\"name\";s:4:\"Pets\";s:4:\"slug\";s:4:\"pets\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:12;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:55\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:55\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:4:{i:0;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:26;s:9:\"parent_id\";i:13;s:4:\"name\";s:4:\"Dogs\";s:4:\"slug\";s:9:\"pets-dogs\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:26;s:9:\"parent_id\";i:13;s:4:\"name\";s:4:\"Dogs\";s:4:\"slug\";s:9:\"pets-dogs\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:0;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:27;s:9:\"parent_id\";i:13;s:4:\"name\";s:4:\"Cats\";s:4:\"slug\";s:9:\"pets-cats\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:27;s:9:\"parent_id\";i:13;s:4:\"name\";s:4:\"Cats\";s:4:\"slug\";s:9:\"pets-cats\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:1;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:28;s:9:\"parent_id\";i:13;s:4:\"name\";s:5:\"Birds\";s:4:\"slug\";s:10:\"pets-birds\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:57\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:57\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:28;s:9:\"parent_id\";i:13;s:4:\"name\";s:5:\"Birds\";s:4:\"slug\";s:10:\"pets-birds\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:2;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:57\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:57\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:3;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:29;s:9:\"parent_id\";i:13;s:4:\"name\";s:4:\"Fish\";s:4:\"slug\";s:9:\"pets-fish\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:57\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:57\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:29;s:9:\"parent_id\";i:13;s:4:\"name\";s:4:\"Fish\";s:4:\"slug\";s:9:\"pets-fish\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:8:\"standard\";s:10:\"sort_order\";i:3;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:57\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:57\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:13;O:19:\"App\\Models\\Category\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:10:\"categories\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:12:{s:2:\"id\";i:14;s:9:\"parent_id\";N;s:4:\"name\";s:4:\"Jobs\";s:4:\"slug\";s:4:\"jobs\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:3:\"job\";s:10:\"sort_order\";i:13;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:11:\"\0*\0original\";a:12:{s:2:\"id\";i:14;s:9:\"parent_id\";N;s:4:\"name\";s:4:\"Jobs\";s:4:\"slug\";s:4:\"jobs\";s:9:\"icon_path\";N;s:10:\"image_path\";N;s:4:\"type\";s:3:\"job\";s:10:\"sort_order\";i:13;s:9:\"is_active\";i:1;s:9:\"ads_count\";i:0;s:10:\"created_at\";s:19:\"2026-05-25 11:50:56\";s:10:\"updated_at\";s:19:\"2026-05-25 11:50:56\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:3:{s:9:\"is_active\";s:7:\"boolean\";s:10:\"sort_order\";s:7:\"integer\";s:9:\"ads_count\";s:7:\"integer\";}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:1:{s:8:\"children\";O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:0:{}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:9:{i:0;s:9:\"parent_id\";i:1;s:4:\"name\";i:2;s:4:\"slug\";i:3;s:9:\"icon_path\";i:4;s:10:\"image_path\";i:5;s:4:\"type\";i:6;s:10:\"sort_order\";i:7;s:9:\"is_active\";i:8;s:9:\"ads_count\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}',1781612212),('classiads-hub-cache-f1f70ec40aaa556905d4a030501c0ba4','i:1;',1781593977),('classiads-hub-cache-f1f70ec40aaa556905d4a030501c0ba4:timer','i:1781593977;',1781593977),('classiads-hub-cache-livewire-rate-limiter:16d36dff9abd246c67dfac3e63b993a169af77e6','i:1;',1780653449),('classiads-hub-cache-livewire-rate-limiter:16d36dff9abd246c67dfac3e63b993a169af77e6:timer','i:1780653449;',1780653449),('classiads-hub-cache-settings.all','O:39:\"Illuminate\\Database\\Eloquent\\Collection\":2:{s:8:\"\0*\0items\";a:25:{i:0;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:1;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:8:\"app_name\";s:5:\"value\";s:13:\"ClassiAds_Hub\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:1;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:8:\"app_name\";s:5:\"value\";s:13:\"ClassiAds_Hub\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:1;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:2;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:11:\"app_tagline\";s:5:\"value\";s:39:\"Buy and Sell Anything in Just One Click\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:2;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:11:\"app_tagline\";s:5:\"value\";s:39:\"Buy and Sell Anything in Just One Click\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:2;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:3;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:16:\"default_language\";s:5:\"value\";s:2:\"en\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:3;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:16:\"default_language\";s:5:\"value\";s:2:\"en\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:3;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:4;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:16:\"default_currency\";s:5:\"value\";s:3:\"USD\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:4;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:16:\"default_currency\";s:5:\"value\";s:3:\"USD\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:4;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:5;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:13:\"support_email\";s:5:\"value\";s:22:\"support@classiads.test\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:5;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:13:\"support_email\";s:5:\"value\";s:22:\"support@classiads.test\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:5;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:6;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:16:\"maintenance_mode\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:6;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:16:\"maintenance_mode\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:6;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:7;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:16:\"require_approval\";s:5:\"value\";s:1:\"1\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:7;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:16:\"require_approval\";s:5:\"value\";s:1:\"1\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:7;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:8;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:19:\"default_expiry_days\";s:5:\"value\";s:2:\"30\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:8;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:19:\"default_expiry_days\";s:5:\"value\";s:2:\"30\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:8;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:9;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:17:\"max_images_per_ad\";s:5:\"value\";s:2:\"10\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:9;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:17:\"max_images_per_ad\";s:5:\"value\";s:2:\"10\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:9;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:10;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:16:\"nearby_radius_km\";s:5:\"value\";s:2:\"25\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:10;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:16:\"nearby_radius_km\";s:5:\"value\";s:2:\"25\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:10;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:11;s:5:\"group\";s:5:\"media\";s:3:\"key\";s:17:\"watermark_enabled\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:11;s:5:\"group\";s:5:\"media\";s:3:\"key\";s:17:\"watermark_enabled\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:11;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:12;s:5:\"group\";s:5:\"media\";s:3:\"key\";s:14:\"watermark_text\";s:5:\"value\";s:13:\"ClassiAds_Hub\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:12;s:5:\"group\";s:5:\"media\";s:3:\"key\";s:14:\"watermark_text\";s:5:\"value\";s:13:\"ClassiAds_Hub\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:12;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:13;s:5:\"group\";s:5:\"media\";s:3:\"key\";s:12:\"storage_disk\";s:5:\"value\";s:5:\"local\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:13;s:5:\"group\";s:5:\"media\";s:3:\"key\";s:12:\"storage_disk\";s:5:\"value\";s:5:\"local\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:13;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:14;s:5:\"group\";s:3:\"otp\";s:3:\"key\";s:8:\"provider\";s:5:\"value\";s:3:\"log\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:14;s:5:\"group\";s:3:\"otp\";s:3:\"key\";s:8:\"provider\";s:5:\"value\";s:3:\"log\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:01\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:01\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:14;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:15;s:5:\"group\";s:3:\"otp\";s:3:\"key\";s:11:\"code_length\";s:5:\"value\";s:1:\"6\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:15;s:5:\"group\";s:3:\"otp\";s:3:\"key\";s:11:\"code_length\";s:5:\"value\";s:1:\"6\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:15;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:16;s:5:\"group\";s:3:\"otp\";s:3:\"key\";s:14:\"expiry_minutes\";s:5:\"value\";s:2:\"10\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:16;s:5:\"group\";s:3:\"otp\";s:3:\"key\";s:14:\"expiry_minutes\";s:5:\"value\";s:2:\"10\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:16;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:17;s:5:\"group\";s:8:\"payments\";s:3:\"key\";s:16:\"enabled_gateways\";s:5:\"value\";s:37:\"[\"stripe\",\"razorpay\",\"bank_transfer\"]\";s:4:\"type\";s:4:\"json\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:17;s:5:\"group\";s:8:\"payments\";s:3:\"key\";s:16:\"enabled_gateways\";s:5:\"value\";s:37:\"[\"stripe\",\"razorpay\",\"bank_transfer\"]\";s:4:\"type\";s:4:\"json\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:17;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:18;s:5:\"group\";s:5:\"admob\";s:3:\"key\";s:7:\"enabled\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:18;s:5:\"group\";s:5:\"admob\";s:3:\"key\";s:7:\"enabled\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:18;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:19;s:5:\"group\";s:5:\"admob\";s:3:\"key\";s:14:\"banner_unit_id\";s:5:\"value\";s:0:\"\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:19;s:5:\"group\";s:5:\"admob\";s:3:\"key\";s:14:\"banner_unit_id\";s:5:\"value\";s:0:\"\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:19;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:20;s:5:\"group\";s:5:\"admob\";s:3:\"key\";s:20:\"interstitial_unit_id\";s:5:\"value\";s:0:\"\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:20;s:5:\"group\";s:5:\"admob\";s:3:\"key\";s:20:\"interstitial_unit_id\";s:5:\"value\";s:0:\"\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:02\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:02\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:20;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:21;s:5:\"group\";s:8:\"commerce\";s:3:\"key\";s:11:\"tax_percent\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:08\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:08\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:21;s:5:\"group\";s:8:\"commerce\";s:3:\"key\";s:11:\"tax_percent\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:08\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:08\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:21;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:22;s:5:\"group\";s:8:\"commerce\";s:3:\"key\";s:18:\"commission_percent\";s:5:\"value\";s:1:\"5\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:08\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:08\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:22;s:5:\"group\";s:8:\"commerce\";s:3:\"key\";s:18:\"commission_percent\";s:5:\"value\";s:1:\"5\";s:4:\"type\";s:3:\"int\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:08\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:08\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:22;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:23;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:20:\"require_subscription\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:08\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:08\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:23;s:5:\"group\";s:3:\"ads\";s:3:\"key\";s:20:\"require_subscription\";s:5:\"value\";s:1:\"0\";s:4:\"type\";s:4:\"bool\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:08\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:08\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:23;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:24;s:5:\"group\";s:2:\"ai\";s:3:\"key\";s:8:\"provider\";s:5:\"value\";s:4:\"stub\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:11\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:11\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:24;s:5:\"group\";s:2:\"ai\";s:3:\"key\";s:8:\"provider\";s:5:\"value\";s:4:\"stub\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:11\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:11\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}i:24;O:18:\"App\\Models\\Setting\":33:{s:13:\"\0*\0connection\";s:5:\"mysql\";s:8:\"\0*\0table\";s:8:\"settings\";s:13:\"\0*\0primaryKey\";s:2:\"id\";s:10:\"\0*\0keyType\";s:3:\"int\";s:12:\"incrementing\";b:1;s:7:\"\0*\0with\";a:0:{}s:12:\"\0*\0withCount\";a:0:{}s:19:\"preventsLazyLoading\";b:0;s:10:\"\0*\0perPage\";i:15;s:6:\"exists\";b:1;s:18:\"wasRecentlyCreated\";b:0;s:28:\"\0*\0escapeWhenCastingToString\";b:0;s:13:\"\0*\0attributes\";a:7:{s:2:\"id\";i:25;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:12:\"frontend_url\";s:5:\"value\";s:21:\"http://localhost:3000\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:12\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:12\";}s:11:\"\0*\0original\";a:7:{s:2:\"id\";i:25;s:5:\"group\";s:7:\"general\";s:3:\"key\";s:12:\"frontend_url\";s:5:\"value\";s:21:\"http://localhost:3000\";s:4:\"type\";s:6:\"string\";s:10:\"created_at\";s:19:\"2026-05-25 11:51:12\";s:10:\"updated_at\";s:19:\"2026-05-25 11:51:12\";}s:10:\"\0*\0changes\";a:0:{}s:11:\"\0*\0previous\";a:0:{}s:8:\"\0*\0casts\";a:0:{}s:17:\"\0*\0classCastCache\";a:0:{}s:21:\"\0*\0attributeCastCache\";a:0:{}s:13:\"\0*\0dateFormat\";N;s:10:\"\0*\0appends\";a:0:{}s:19:\"\0*\0dispatchesEvents\";a:0:{}s:14:\"\0*\0observables\";a:0:{}s:12:\"\0*\0relations\";a:0:{}s:10:\"\0*\0touches\";a:0:{}s:27:\"\0*\0relationAutoloadCallback\";N;s:26:\"\0*\0relationAutoloadContext\";N;s:10:\"timestamps\";b:1;s:13:\"usesUniqueIds\";b:0;s:9:\"\0*\0hidden\";a:0:{}s:10:\"\0*\0visible\";a:0:{}s:11:\"\0*\0fillable\";a:4:{i:0;s:5:\"group\";i:1;s:3:\"key\";i:2;s:5:\"value\";i:3;s:4:\"type\";}s:10:\"\0*\0guarded\";a:1:{i:0;s:1:\"*\";}}}s:28:\"\0*\0escapeWhenCastingToString\";b:0;}',2096015132),('classiads-hub-cache-spatie.permission.cache','a:3:{s:5:\"alias\";a:4:{s:1:\"a\";s:2:\"id\";s:1:\"b\";s:4:\"name\";s:1:\"c\";s:10:\"guard_name\";s:1:\"r\";s:5:\"roles\";}s:11:\"permissions\";a:94:{i:0;a:4:{s:1:\"a\";i:1;s:1:\"b\";s:10:\"users.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:1;a:4:{s:1:\"a\";i:2;s:1:\"b\";s:12:\"users.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:2;a:4:{s:1:\"a\";i:3;s:1:\"b\";s:12:\"users.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:3;a:4:{s:1:\"a\";i:4;s:1:\"b\";s:12:\"users.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:4;a:4:{s:1:\"a\";i:5;s:1:\"b\";s:12:\"sellers.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:5;a:4:{s:1:\"a\";i:6;s:1:\"b\";s:14:\"sellers.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:6;a:4:{s:1:\"a\";i:7;s:1:\"b\";s:14:\"sellers.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:7;a:4:{s:1:\"a\";i:8;s:1:\"b\";s:14:\"sellers.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:8;a:4:{s:1:\"a\";i:9;s:1:\"b\";s:15:\"categories.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:9;a:4:{s:1:\"a\";i:10;s:1:\"b\";s:17:\"categories.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:10;a:4:{s:1:\"a\";i:11;s:1:\"b\";s:17:\"categories.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:11;a:4:{s:1:\"a\";i:12;s:1:\"b\";s:17:\"categories.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:12;a:4:{s:1:\"a\";i:13;s:1:\"b\";s:18:\"custom_fields.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:13;a:4:{s:1:\"a\";i:14;s:1:\"b\";s:20:\"custom_fields.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:14;a:4:{s:1:\"a\";i:15;s:1:\"b\";s:20:\"custom_fields.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:15;a:4:{s:1:\"a\";i:16;s:1:\"b\";s:20:\"custom_fields.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:16;a:4:{s:1:\"a\";i:17;s:1:\"b\";s:8:\"ads.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:17;a:4:{s:1:\"a\";i:18;s:1:\"b\";s:10:\"ads.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:18;a:4:{s:1:\"a\";i:19;s:1:\"b\";s:10:\"ads.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:19;a:4:{s:1:\"a\";i:20;s:1:\"b\";s:10:\"ads.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:20;a:4:{s:1:\"a\";i:21;s:1:\"b\";s:13:\"packages.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:21;a:4:{s:1:\"a\";i:22;s:1:\"b\";s:15:\"packages.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:22;a:4:{s:1:\"a\";i:23;s:1:\"b\";s:15:\"packages.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:23;a:4:{s:1:\"a\";i:24;s:1:\"b\";s:15:\"packages.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:24;a:4:{s:1:\"a\";i:25;s:1:\"b\";s:18:\"subscriptions.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:25;a:4:{s:1:\"a\";i:26;s:1:\"b\";s:20:\"subscriptions.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:26;a:4:{s:1:\"a\";i:27;s:1:\"b\";s:20:\"subscriptions.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:27;a:4:{s:1:\"a\";i:28;s:1:\"b\";s:20:\"subscriptions.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:28;a:4:{s:1:\"a\";i:29;s:1:\"b\";s:17:\"transactions.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:29;a:4:{s:1:\"a\";i:30;s:1:\"b\";s:19:\"transactions.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:30;a:4:{s:1:\"a\";i:31;s:1:\"b\";s:19:\"transactions.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:31;a:4:{s:1:\"a\";i:32;s:1:\"b\";s:19:\"transactions.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:32;a:4:{s:1:\"a\";i:33;s:1:\"b\";s:12:\"reports.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:33;a:4:{s:1:\"a\";i:34;s:1:\"b\";s:14:\"reports.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:34;a:4:{s:1:\"a\";i:35;s:1:\"b\";s:14:\"reports.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:35;a:4:{s:1:\"a\";i:36;s:1:\"b\";s:14:\"reports.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:36;a:4:{s:1:\"a\";i:37;s:1:\"b\";s:12:\"reviews.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:37;a:4:{s:1:\"a\";i:38;s:1:\"b\";s:14:\"reviews.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:38;a:4:{s:1:\"a\";i:39;s:1:\"b\";s:14:\"reviews.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:39;a:4:{s:1:\"a\";i:40;s:1:\"b\";s:14:\"reviews.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:40;a:4:{s:1:\"a\";i:41;s:1:\"b\";s:10:\"chats.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:41;a:4:{s:1:\"a\";i:42;s:1:\"b\";s:12:\"chats.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:42;a:4:{s:1:\"a\";i:43;s:1:\"b\";s:12:\"chats.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:43;a:4:{s:1:\"a\";i:44;s:1:\"b\";s:12:\"chats.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:44;a:4:{s:1:\"a\";i:45;s:1:\"b\";s:18:\"notifications.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:45;a:4:{s:1:\"a\";i:46;s:1:\"b\";s:20:\"notifications.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:46;a:4:{s:1:\"a\";i:47;s:1:\"b\";s:20:\"notifications.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:47;a:4:{s:1:\"a\";i:48;s:1:\"b\";s:20:\"notifications.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:48;a:4:{s:1:\"a\";i:49;s:1:\"b\";s:14:\"locations.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:49;a:4:{s:1:\"a\";i:50;s:1:\"b\";s:16:\"locations.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:50;a:4:{s:1:\"a\";i:51;s:1:\"b\";s:16:\"locations.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:51;a:4:{s:1:\"a\";i:52;s:1:\"b\";s:16:\"locations.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:52;a:4:{s:1:\"a\";i:53;s:1:\"b\";s:15:\"currencies.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:53;a:4:{s:1:\"a\";i:54;s:1:\"b\";s:17:\"currencies.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:54;a:4:{s:1:\"a\";i:55;s:1:\"b\";s:17:\"currencies.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:55;a:4:{s:1:\"a\";i:56;s:1:\"b\";s:17:\"currencies.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:56;a:4:{s:1:\"a\";i:57;s:1:\"b\";s:14:\"languages.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:57;a:4:{s:1:\"a\";i:58;s:1:\"b\";s:16:\"languages.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:58;a:4:{s:1:\"a\";i:59;s:1:\"b\";s:16:\"languages.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:59;a:4:{s:1:\"a\";i:60;s:1:\"b\";s:16:\"languages.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:60;a:4:{s:1:\"a\";i:61;s:1:\"b\";s:9:\"blog.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:61;a:4:{s:1:\"a\";i:62;s:1:\"b\";s:11:\"blog.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:62;a:4:{s:1:\"a\";i:63;s:1:\"b\";s:11:\"blog.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:63;a:4:{s:1:\"a\";i:64;s:1:\"b\";s:11:\"blog.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:64;a:4:{s:1:\"a\";i:65;s:1:\"b\";s:10:\"pages.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:65;a:4:{s:1:\"a\";i:66;s:1:\"b\";s:12:\"pages.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:66;a:4:{s:1:\"a\";i:67;s:1:\"b\";s:12:\"pages.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:67;a:4:{s:1:\"a\";i:68;s:1:\"b\";s:12:\"pages.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:68;a:4:{s:1:\"a\";i:69;s:1:\"b\";s:12:\"sliders.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:69;a:4:{s:1:\"a\";i:70;s:1:\"b\";s:14:\"sliders.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:70;a:4:{s:1:\"a\";i:71;s:1:\"b\";s:14:\"sliders.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:71;a:4:{s:1:\"a\";i:72;s:1:\"b\";s:14:\"sliders.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:72;a:4:{s:1:\"a\";i:73;s:1:\"b\";s:22:\"featured_sections.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:73;a:4:{s:1:\"a\";i:74;s:1:\"b\";s:24:\"featured_sections.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:74;a:4:{s:1:\"a\";i:75;s:1:\"b\";s:24:\"featured_sections.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:75;a:4:{s:1:\"a\";i:76;s:1:\"b\";s:24:\"featured_sections.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:76;a:4:{s:1:\"a\";i:77;s:1:\"b\";s:18:\"verifications.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:77;a:4:{s:1:\"a\";i:78;s:1:\"b\";s:20:\"verifications.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:78;a:4:{s:1:\"a\";i:79;s:1:\"b\";s:20:\"verifications.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:79;a:4:{s:1:\"a\";i:80;s:1:\"b\";s:20:\"verifications.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:80;a:4:{s:1:\"a\";i:81;s:1:\"b\";s:13:\"settings.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:81;a:4:{s:1:\"a\";i:82;s:1:\"b\";s:15:\"settings.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:82;a:4:{s:1:\"a\";i:83;s:1:\"b\";s:15:\"settings.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:83;a:4:{s:1:\"a\";i:84;s:1:\"b\";s:15:\"settings.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:84;a:4:{s:1:\"a\";i:85;s:1:\"b\";s:10:\"staff.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:85;a:4:{s:1:\"a\";i:86;s:1:\"b\";s:12:\"staff.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:86;a:4:{s:1:\"a\";i:87;s:1:\"b\";s:12:\"staff.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:87;a:4:{s:1:\"a\";i:88;s:1:\"b\";s:12:\"staff.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:88;a:4:{s:1:\"a\";i:89;s:1:\"b\";s:15:\"audit_logs.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:89;a:4:{s:1:\"a\";i:90;s:1:\"b\";s:17:\"audit_logs.create\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:90;a:4:{s:1:\"a\";i:91;s:1:\"b\";s:17:\"audit_logs.update\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:91;a:4:{s:1:\"a\";i:92;s:1:\"b\";s:17:\"audit_logs.delete\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:2:{i:0;i:1;i:1;i:2;}}i:92;a:4:{s:1:\"a\";i:93;s:1:\"b\";s:11:\"ads.approve\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}i:93;a:4:{s:1:\"a\";i:94;s:1:\"b\";s:14:\"dashboard.view\";s:1:\"c\";s:3:\"web\";s:1:\"r\";a:3:{i:0;i:1;i:1;i:2;i:2;i:3;}}}s:5:\"roles\";a:3:{i:0;a:3:{s:1:\"a\";i:1;s:1:\"b\";s:11:\"super-admin\";s:1:\"c\";s:3:\"web\";}i:1;a:3:{s:1:\"a\";i:2;s:1:\"b\";s:5:\"admin\";s:1:\"c\";s:3:\"web\";}i:2;a:3:{s:1:\"a\";i:3;s:1:\"b\";s:5:\"staff\";s:1:\"c\";s:3:\"web\";}}}',1780658667);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `icon_path` varchar(255) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `type` enum('standard','job','property') NOT NULL DEFAULT 'standard',
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `ads_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`),
  KEY `categories_parent_id_index` (`parent_id`),
  KEY `categories_sort_order_index` (`sort_order`),
  KEY `categories_is_active_index` (`is_active`),
  CONSTRAINT `categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,NULL,'Real Estate','real-estate',NULL,NULL,'property',0,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(2,NULL,'Cars & Vehicles','cars-vehicles',NULL,NULL,'standard',1,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(3,NULL,'Mobile Phones & Tablets','mobile-phones-tablets',NULL,NULL,'standard',2,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(4,NULL,'Electronics','electronics',NULL,NULL,'standard',3,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(5,NULL,'Home Appliances','home-appliances',NULL,NULL,'standard',4,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(6,NULL,'Furniture, Home & Garden','furniture-home-garden',NULL,NULL,'standard',5,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(7,NULL,'Clothing & Accessories','clothing-accessories',NULL,NULL,'standard',6,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(8,NULL,'Jewelry & Watches','jewelry-watches',NULL,NULL,'standard',7,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(9,NULL,'Cameras & Imaging','cameras-imaging',NULL,NULL,'standard',8,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(10,NULL,'Consoles & Video Games','consoles-video-games',NULL,NULL,'standard',9,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(11,NULL,'Musical Instruments','musical-instruments',NULL,NULL,'standard',10,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(12,NULL,'Sports Equipment','sports-equipment',NULL,NULL,'standard',11,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(13,NULL,'Pets','pets',NULL,NULL,'standard',12,1,0,'2026-05-25 06:20:55','2026-05-25 06:20:55'),(14,NULL,'Jobs','jobs',NULL,NULL,'job',13,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(15,2,'Cars','cars-vehicles-cars',NULL,NULL,'standard',0,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(16,2,'Motorcycles','cars-vehicles-motorcycles',NULL,NULL,'standard',1,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(17,2,'Trucks','cars-vehicles-trucks',NULL,NULL,'standard',2,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(18,2,'Auto Parts','cars-vehicles-auto-parts',NULL,NULL,'standard',3,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(19,1,'For Sale: Houses','real-estate-for-sale-houses',NULL,NULL,'standard',0,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(20,1,'For Rent: Apartments','real-estate-for-rent-apartments',NULL,NULL,'standard',1,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(21,1,'Commercial','real-estate-commercial',NULL,NULL,'standard',2,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(22,1,'Land','real-estate-land',NULL,NULL,'standard',3,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(23,4,'TV & Home Theater','electronics-tv-home-theater',NULL,NULL,'standard',0,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(24,4,'Computers & Networking','electronics-computers-networking',NULL,NULL,'standard',1,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(25,4,'Audio & Headphones','electronics-audio-headphones',NULL,NULL,'standard',2,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(26,13,'Dogs','pets-dogs',NULL,NULL,'standard',0,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(27,13,'Cats','pets-cats',NULL,NULL,'standard',1,1,0,'2026-05-25 06:20:56','2026-05-25 06:20:56'),(28,13,'Birds','pets-birds',NULL,NULL,'standard',2,1,0,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(29,13,'Fish','pets-fish',NULL,NULL,'standard',3,1,0,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(30,28,'app icons','classiadsMobile',NULL,'01KSMCJS6XAST0ANVER99X54RQ.png','standard',1,1,2,'2026-05-27 04:04:49','2026-05-27 04:04:49');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_custom_field`
--

DROP TABLE IF EXISTS `category_custom_field`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_custom_field` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `custom_field_id` bigint(20) unsigned NOT NULL,
  `is_required` tinyint(1) DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_custom_field_category_id_custom_field_id_unique` (`category_id`,`custom_field_id`),
  KEY `category_custom_field_custom_field_id_foreign` (`custom_field_id`),
  CONSTRAINT `category_custom_field_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `category_custom_field_custom_field_id_foreign` FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_custom_field`
--

LOCK TABLES `category_custom_field` WRITE;
/*!40000 ALTER TABLE `category_custom_field` DISABLE KEYS */;
INSERT INTO `category_custom_field` VALUES (1,2,1,1,1,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(2,2,2,1,2,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(3,2,3,0,3,'2026-05-25 06:20:58','2026-05-25 06:20:58'),(4,2,4,1,4,'2026-05-25 06:20:58','2026-05-25 06:20:58'),(5,2,5,0,5,'2026-05-25 06:20:58','2026-05-25 06:20:58'),(6,13,6,1,1,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(7,13,7,0,2,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(8,13,8,0,3,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(9,1,9,0,1,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(10,1,10,0,2,'2026-05-25 06:21:01','2026-05-25 06:21:01');
/*!40000 ALTER TABLE `category_custom_field` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cities` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `country_id` bigint(20) unsigned NOT NULL,
  `state_id` bigint(20) unsigned DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cities_state_id_foreign` (`state_id`),
  KEY `cities_country_id_state_id_index` (`country_id`,`state_id`),
  KEY `cities_is_active_index` (`is_active`),
  CONSTRAINT `cities_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cities_state_id_foreign` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cities`
--

LOCK TABLES `cities` WRITE;
/*!40000 ALTER TABLE `cities` DISABLE KEYS */;
INSERT INTO `cities` VALUES (1,1,1,'Bhuj',23.2419000,69.6669000,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(2,1,1,'Surat',21.1702000,72.8311000,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(3,1,1,'Ahmedabad',23.0225000,72.5714000,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(4,1,2,'Mumbai',19.0760000,72.8777000,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(5,1,2,'Pune',18.5204000,73.8567000,1,'2026-05-25 06:20:53','2026-05-25 06:20:53'),(6,2,3,'Dubai',25.2048000,55.2708000,1,'2026-05-25 06:20:53','2026-05-25 06:20:53'),(7,2,4,'Abu Dhabi',24.4539000,54.3773000,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(8,3,5,'Los Angeles',34.0522000,-118.2437000,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(9,3,5,'San Francisco',37.7749000,-122.4194000,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(10,3,6,'New York City',40.7128000,-74.0060000,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(11,4,7,'Toronto',43.6532000,-79.3832000,1,'2026-05-25 06:20:54','2026-05-25 06:20:54');
/*!40000 ALTER TABLE `cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ad_id` bigint(20) unsigned NOT NULL,
  `buyer_id` bigint(20) unsigned NOT NULL,
  `seller_id` bigint(20) unsigned NOT NULL,
  `last_message` text DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `buyer_unread` int(10) unsigned NOT NULL DEFAULT 0,
  `seller_unread` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversations_ad_id_buyer_id_seller_id_unique` (`ad_id`,`buyer_id`,`seller_id`),
  KEY `conversations_buyer_id_last_message_at_index` (`buyer_id`,`last_message_at`),
  KEY `conversations_seller_id_last_message_at_index` (`seller_id`,`last_message_at`),
  CONSTRAINT `conversations_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_buyer_id_foreign` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_seller_id_foreign` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,1,3,2,'fghjfgj','2026-05-27 03:47:38',1,0,'2026-05-25 22:20:35','2026-06-05 05:18:02'),(2,1,1,2,'abc','2026-06-04 04:04:18',0,0,'2026-06-04 04:04:06','2026-06-05 05:18:04');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `countries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `iso2` char(2) NOT NULL,
  `iso3` char(3) DEFAULT NULL,
  `phone_code` varchar(8) DEFAULT NULL,
  `currency_code` varchar(8) DEFAULT NULL,
  `flag_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `countries_iso2_unique` (`iso2`),
  KEY `countries_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES (1,'India','IN','IND','+91','INR',NULL,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(2,'United Arab Emirates','AE','ARE','+971','AED',NULL,1,'2026-05-25 06:20:53','2026-05-25 06:20:53'),(3,'United States','US','USA','+1','USD',NULL,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(4,'Canada','CA','CAN','+1','USD',NULL,1,'2026-05-25 06:20:54','2026-05-25 06:20:54');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currencies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `country_id` bigint(20) unsigned DEFAULT NULL,
  `code` varchar(8) NOT NULL,
  `symbol` varchar(8) NOT NULL,
  `symbol_position` enum('left','right') NOT NULL DEFAULT 'left',
  `name` varchar(100) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `decimal_digits` tinyint(3) unsigned NOT NULL DEFAULT 2,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currencies_code_unique` (`code`),
  KEY `currencies_is_active_index` (`is_active`),
  KEY `currencies_country_id_foreign` (`country_id`),
  CONSTRAINT `currencies_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES (1,NULL,'USD','$','left','US Dollar',1,2,1,'2026-05-25 06:20:51','2026-05-25 06:20:51'),(2,NULL,'EUR','€','left','Euro',0,2,1,'2026-05-25 06:20:51','2026-05-25 06:20:51'),(3,NULL,'INR','₹','left','Indian Rupee',0,2,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(4,NULL,'AED','د.إ','left','UAE Dirham',0,2,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(5,NULL,'GBP','£','left','British Pound',0,2,1,'2026-05-25 06:20:52','2026-05-25 06:20:52');
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currency_rates`
--

DROP TABLE IF EXISTS `currency_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `currency_rates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `base_code` varchar(8) NOT NULL,
  `quote_code` varchar(8) NOT NULL,
  `rate` decimal(18,8) NOT NULL,
  `fetched_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `currency_rates_base_code_quote_code_unique` (`base_code`,`quote_code`),
  KEY `currency_rates_base_code_index` (`base_code`),
  KEY `currency_rates_quote_code_index` (`quote_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency_rates`
--

LOCK TABLES `currency_rates` WRITE;
/*!40000 ALTER TABLE `currency_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `currency_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_field_options`
--

DROP TABLE IF EXISTS `custom_field_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `custom_field_options` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `custom_field_id` bigint(20) unsigned NOT NULL,
  `label` varchar(150) NOT NULL,
  `value` varchar(150) NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `custom_field_options_custom_field_id_index` (`custom_field_id`),
  CONSTRAINT `custom_field_options_custom_field_id_foreign` FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_field_options`
--

LOCK TABLES `custom_field_options` WRITE;
/*!40000 ALTER TABLE `custom_field_options` DISABLE KEYS */;
INSERT INTO `custom_field_options` VALUES (1,4,'Petrol','petrol',0,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(2,4,'Diesel','diesel',1,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(3,4,'Electric','electric',2,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(4,4,'Hybrid','hybrid',3,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(5,4,'CNG','cng',4,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(6,5,'Manual','manual',0,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(7,5,'Automatic','automatic',1,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(8,6,'Labrador','labrador',0,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(9,6,'Persian','persian',1,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(10,6,'Parrot','parrot',2,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(11,6,'Goldfish','goldfish',3,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(12,6,'Other','other',4,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(13,7,'Friendly','friendly',0,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(14,7,'Calm','calm',1,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(15,7,'Energetic','energetic',2,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(16,7,'Protective','protective',3,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(17,8,'Vaccinated','vaccinated',0,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(18,8,'Not Vaccinated','not-vaccinated',1,'2026-05-25 06:21:00','2026-05-25 06:21:00');
/*!40000 ALTER TABLE `custom_field_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_fields`
--

DROP TABLE IF EXISTS `custom_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `custom_fields` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `code` varchar(100) NOT NULL,
  `type` enum('text','number','dropdown','radio','checkbox','boolean','date') NOT NULL,
  `icon_path` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `is_filterable` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `custom_fields_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_fields`
--

LOCK TABLES `custom_fields` WRITE;
/*!40000 ALTER TABLE `custom_fields` DISABLE KEYS */;
INSERT INTO `custom_fields` VALUES (1,'Brand','vehicle_brand','text',NULL,0,1,1,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(2,'Model Year','model_year','number',NULL,0,1,2,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(3,'Kilometers','kilometers','number',NULL,0,1,3,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(4,'Fuel Type','fuel_type','dropdown',NULL,0,1,4,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(5,'Transmission','transmission','radio',NULL,0,1,5,'2026-05-25 06:20:57','2026-05-25 06:20:57'),(6,'Breed','pet_breed','dropdown',NULL,0,1,1,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(7,'Behavior/Temperament','pet_temperament','dropdown',NULL,0,0,2,'2026-05-25 06:20:59','2026-05-25 06:20:59'),(8,'Vaccination Status','pet_vaccination','radio',NULL,0,0,3,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(9,'Bedrooms','bedrooms','number',NULL,0,1,1,'2026-05-25 06:21:00','2026-05-25 06:21:00'),(10,'Area (sq ft)','area_sqft','number',NULL,0,1,2,'2026-05-25 06:21:00','2026-05-25 06:21:00');
/*!40000 ALTER TABLE `custom_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_templates` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `body_html` longtext NOT NULL,
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_templates_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES (1,'welcome','Welcome to {{ app_name }}!','<p>Hi {{ name }}, welcome aboard.</p>','[\"app_name\",\"name\"]',1,'2026-05-25 06:21:10','2026-05-25 06:21:10'),(2,'ad_approved','Your ad \"{{ title }}\" is live','<p>Your listing has been approved.</p>','[\"title\"]',1,'2026-05-25 06:21:10','2026-05-25 06:21:10'),(3,'payment_receipt','Receipt {{ invoice }}','<p>Thank you for your payment of {{ amount }}.</p>','[\"invoice\",\"amount\"]',1,'2026-05-25 06:21:10','2026-05-25 06:21:10');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faqs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `translations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`translations`)),
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `faqs_sort_order_index` (`sort_order`),
  KEY `faqs_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,'What is ClassiAds_Hub?','ClassiAds_Hub is a multi-vendor classifieds marketplace covering everything from real-estate to electronics.',NULL,1,1,'2026-06-05 01:25:36','2026-06-05 01:25:36'),(2,'What features does eClassify offer?','eClassify offers a wide range of features including post management, chat, offers, monetization packages, and more.',NULL,2,1,'2026-06-05 01:25:36','2026-06-05 01:25:36'),(3,'Does eClassify support multiple languages?','Yes, eClassify supports multiple languages. You can switch the active language from the language picker.',NULL,3,1,'2026-06-05 01:25:36','2026-06-05 01:25:36'),(4,'What is Gemini AI integration in eClassify?','Gemini AI helps sellers automatically generate item descriptions, titles, and tags from a photo.',NULL,4,1,'2026-06-05 01:25:36','2026-06-05 01:25:36'),(5,'How does the new SEO management system work?','It allows adding item-level meta tags, multilingual schema, automatic sitemap generation, and more.',NULL,5,1,'2026-06-05 01:25:36','2026-06-05 01:25:36'),(6,'Can I customize the home screen layout?','Yes. The modular home screen lets admins enable or disable each block and reorder Popular Categories.',NULL,6,1,'2026-06-05 01:25:36','2026-06-05 01:25:36'),(7,'Is there a way to search chats?','Yes. The chat search feature lets users quickly find conversations and messages by keyword.',NULL,7,1,'2026-06-05 01:25:36','2026-06-05 01:25:36');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favorites` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `ad_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_user_id_ad_id_unique` (`user_id`,`ad_id`),
  KEY `favorites_ad_id_index` (`ad_id`),
  CONSTRAINT `favorites_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (1,3,1,'2026-05-25 22:20:54','2026-05-25 22:20:54');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `featured_ad_plans`
--

DROP TABLE IF EXISTS `featured_ad_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `featured_ad_plans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` bigint(20) unsigned NOT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `duration_days` smallint(5) unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `featured_ad_plans_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `featured_ad_plans`
--

LOCK TABLES `featured_ad_plans` WRITE;
/*!40000 ALTER TABLE `featured_ad_plans` DISABLE KEYS */;
INSERT INTO `featured_ad_plans` VALUES (1,'Featured 7 days',NULL,499,'USD',7,1,1,'2026-05-25 06:21:08','2026-05-25 06:21:08'),(2,'Featured 30 days',NULL,1499,'USD',30,1,2,'2026-05-25 06:21:08','2026-05-25 06:21:08');
/*!40000 ALTER TABLE `featured_ad_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `featured_sections`
--

DROP TABLE IF EXISTS `featured_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `featured_sections` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `filter_type` enum('latest','most_viewed','most_liked','featured','category') NOT NULL DEFAULT 'latest',
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `style` varchar(50) NOT NULL DEFAULT 'card',
  `item_limit` smallint(5) unsigned NOT NULL DEFAULT 10,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `featured_sections_category_id_foreign` (`category_id`),
  KEY `featured_sections_sort_order_index` (`sort_order`),
  KEY `featured_sections_is_active_index` (`is_active`),
  CONSTRAINT `featured_sections_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `featured_sections`
--

LOCK TABLES `featured_sections` WRITE;
/*!40000 ALTER TABLE `featured_sections` DISABLE KEYS */;
INSERT INTO `featured_sections` VALUES (1,'Featured Listings','featured',NULL,'card',10,1,1,'2026-05-25 06:21:05','2026-05-25 06:21:05'),(2,'Most Viewed','most_viewed',NULL,'card',10,2,1,'2026-05-25 06:21:05','2026-05-25 06:21:05'),(3,'Popular Properties','category',1,'card',10,3,1,'2026-05-25 06:21:05','2026-05-25 06:21:05'),(4,'Top Cars Near You','category',2,'card',10,4,1,'2026-05-25 06:21:05','2026-05-25 06:21:05');
/*!40000 ALTER TABLE `featured_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `follows` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `follower_id` bigint(20) unsigned NOT NULL,
  `following_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `follows_follower_id_following_id_unique` (`follower_id`,`following_id`),
  KEY `follows_following_id_index` (`following_id`),
  CONSTRAINT `follows_follower_id_foreign` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_following_id_foreign` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `number` varchar(50) NOT NULL,
  `subtotal` bigint(20) unsigned NOT NULL,
  `tax_amount` bigint(20) unsigned NOT NULL DEFAULT 0,
  `total` bigint(20) unsigned NOT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `status` enum('paid','unpaid','refunded') NOT NULL DEFAULT 'paid',
  `issued_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_number_unique` (`number`),
  KEY `invoices_transaction_id_foreign` (`transaction_id`),
  KEY `invoices_user_id_foreign` (`user_id`),
  CONSTRAINT `invoices_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,1,2,'INV-20260527-000001',999,0,999,'USD','paid','2026-05-27 03:48:11','2026-05-27 03:48:11','2026-05-27 03:48:11');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_applications`
--

DROP TABLE IF EXISTS `job_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_applications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `job_listing_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `cover_letter` text DEFAULT NULL,
  `resume_path` varchar(255) DEFAULT NULL,
  `status` enum('submitted','reviewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'submitted',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_applications_job_listing_id_user_id_unique` (`job_listing_id`,`user_id`),
  KEY `job_applications_user_id_index` (`user_id`),
  KEY `job_applications_status_index` (`status`),
  CONSTRAINT `job_applications_job_listing_id_foreign` FOREIGN KEY (`job_listing_id`) REFERENCES `job_listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `job_applications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_applications`
--

LOCK TABLES `job_applications` WRITE;
/*!40000 ALTER TABLE `job_applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_listings`
--

DROP TABLE IF EXISTS `job_listings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_listings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `city_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `company_name` varchar(191) DEFAULT NULL,
  `description` longtext NOT NULL,
  `employment_type` enum('full_time','part_time','contract','internship','remote') NOT NULL DEFAULT 'full_time',
  `salary_min` bigint(20) unsigned DEFAULT NULL,
  `salary_max` bigint(20) unsigned DEFAULT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `status` enum('draft','open','closed') NOT NULL DEFAULT 'open',
  `expires_at` timestamp NULL DEFAULT NULL,
  `applications_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_listings_slug_unique` (`slug`),
  KEY `job_listings_user_id_foreign` (`user_id`),
  KEY `job_listings_category_id_foreign` (`category_id`),
  KEY `job_listings_city_id_foreign` (`city_id`),
  KEY `job_listings_status_category_id_index` (`status`,`category_id`),
  KEY `job_listings_status_index` (`status`),
  CONSTRAINT `job_listings_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `job_listings_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE SET NULL,
  CONSTRAINT `job_listings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_listings`
--

LOCK TABLES `job_listings` WRITE;
/*!40000 ALTER TABLE `job_listings` DISABLE KEYS */;
INSERT INTO `job_listings` VALUES (1,2,14,1,'Senior Laravel Developer','senior-laravel-developer-demo','ClassiAds Tech','We are hiring an experienced Laravel developer to join our marketplace team.','full_time',600000,1000000,'USD','open',NULL,0,'2026-05-25 06:21:11','2026-05-25 06:21:11');
/*!40000 ALTER TABLE `job_listings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'default','{\"uuid\":\"c6e059c5-776b-4e52-923b-3b3ba324f266\",\"displayName\":\"App\\\\Events\\\\MessageSent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:22:\\\"App\\\\Events\\\\MessageSent\\\":1:{s:7:\\\"message\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Message\\\";s:2:\\\"id\\\";i:1;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1779767444,\"delay\":null}',0,NULL,1779767444,1779767444),(2,'default','{\"uuid\":\"e7f9fc95-aec8-4dc4-89a1-e1d025e30832\",\"displayName\":\"App\\\\Events\\\\MessageSent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:22:\\\"App\\\\Events\\\\MessageSent\\\":1:{s:7:\\\"message\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Message\\\";s:2:\\\"id\\\";i:2;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1779873461,\"delay\":null}',0,NULL,1779873461,1779873461),(3,'default','{\"uuid\":\"d05b184b-40f6-4380-8ec4-9dae815befbf\",\"displayName\":\"App\\\\Events\\\\MessageSent\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\",\"command\":\"O:38:\\\"Illuminate\\\\Broadcasting\\\\BroadcastEvent\\\":17:{s:5:\\\"event\\\";O:22:\\\"App\\\\Events\\\\MessageSent\\\":1:{s:7:\\\"message\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:18:\\\"App\\\\Models\\\\Message\\\";s:2:\\\"id\\\";i:4;s:9:\\\"relations\\\";a:0:{}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:7:\\\"backoff\\\";N;s:13:\\\"maxExceptions\\\";N;s:23:\\\"deleteWhenMissingModels\\\";b:1;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:12:\\\"messageGroup\\\";N;s:12:\\\"deduplicator\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;}\",\"batchId\":null},\"createdAt\":1780565659,\"delay\":null}',0,NULL,1780565659,1780565659);
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `languages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(8) NOT NULL,
  `flag_path` varchar(255) DEFAULT NULL,
  `is_rtl` tinyint(1) NOT NULL DEFAULT 0,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `languages_code_unique` (`code`),
  KEY `languages_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES (1,'English','en',NULL,0,1,1,'2026-05-25 06:20:51','2026-05-25 06:20:51'),(2,'Arabic','ar',NULL,1,0,1,'2026-05-25 06:20:51','2026-05-25 06:20:51'),(3,'Hindi','hi',NULL,0,0,1,'2026-05-25 06:20:51','2026-05-25 06:20:51'),(4,'Spanish','es',NULL,0,0,1,'2026-05-25 06:20:51','2026-05-25 06:20:51');
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint(20) unsigned NOT NULL,
  `sender_id` bigint(20) unsigned NOT NULL,
  `body` text DEFAULT NULL,
  `type` enum('text','offer','system') NOT NULL DEFAULT 'text',
  `offer_id` bigint(20) unsigned DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_sender_id_foreign` (`sender_id`),
  KEY `messages_offer_id_foreign` (`offer_id`),
  KEY `messages_conversation_id_id_index` (`conversation_id`,`id`),
  CONSTRAINT `messages_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_offer_id_foreign` FOREIGN KEY (`offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,3,'hoiii','text',NULL,'2026-05-27 03:47:34','2026-05-25 22:20:41','2026-05-27 03:47:34'),(2,1,2,'fghjfgj','text',NULL,NULL,'2026-05-27 03:47:38','2026-05-27 03:47:38'),(3,2,1,'USD 2,000.00 offered','offer',1,NULL,'2026-06-04 04:04:06','2026-06-04 04:04:06'),(4,2,1,'abc','text',NULL,NULL,'2026-06-04 04:04:18','2026-06-04 04:04:18');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_05_25_095032_create_personal_access_tokens_table',1),(5,'2026_05_25_095652_create_permission_tables',1),(6,'2026_05_25_100001_create_seller_profiles_table',1),(7,'2026_05_25_100002_create_social_accounts_table',1),(8,'2026_05_25_100003_create_user_devices_table',1),(9,'2026_05_25_100004_create_otp_verifications_table',1),(10,'2026_05_25_100010_create_countries_table',1),(11,'2026_05_25_100011_create_states_table',1),(12,'2026_05_25_100012_create_cities_table',1),(13,'2026_05_25_100013_create_languages_table',1),(14,'2026_05_25_100014_create_currencies_table',1),(15,'2026_05_25_100015_create_currency_rates_table',1),(16,'2026_05_25_100020_create_categories_table',1),(17,'2026_05_25_100021_create_custom_fields_table',1),(18,'2026_05_25_100022_create_custom_field_options_table',1),(19,'2026_05_25_100023_create_category_custom_field_table',1),(20,'2026_05_25_100030_create_settings_table',1),(21,'2026_05_25_100031_create_email_templates_table',1),(22,'2026_05_25_100032_create_audit_logs_table',1),(23,'2026_05_25_101001_create_ads_table',1),(24,'2026_05_25_101002_create_ad_images_table',1),(25,'2026_05_25_101003_create_ad_custom_field_values_table',1),(26,'2026_05_25_101004_create_favorites_table',1),(27,'2026_05_25_101005_create_saved_searches_table',1),(28,'2026_05_25_101006_create_featured_sections_table',1),(29,'2026_05_25_101007_create_sliders_table',1),(30,'2026_05_25_102001_create_follows_table',1),(31,'2026_05_25_102002_create_conversations_table',1),(32,'2026_05_25_102003_create_offers_table',1),(33,'2026_05_25_102004_create_messages_table',1),(34,'2026_05_25_102005_create_ad_sales_table',1),(35,'2026_05_25_102006_create_reviews_table',1),(36,'2026_05_25_102007_create_reports_table',1),(37,'2026_05_25_102008_create_notifications_table',1),(38,'2026_05_25_102009_create_push_notifications_table',1),(39,'2026_05_25_103001_create_packages_table',1),(40,'2026_05_25_103002_create_package_category_table',1),(41,'2026_05_25_103003_create_featured_ad_plans_table',1),(42,'2026_05_25_103004_create_payment_gateways_table',1),(43,'2026_05_25_103005_create_transactions_table',1),(44,'2026_05_25_103006_create_subscriptions_table',1),(45,'2026_05_25_103007_create_invoices_table',1),(46,'2026_05_25_104001_create_blog_categories_table',1),(47,'2026_05_25_104002_create_blog_posts_table',1),(48,'2026_05_25_104003_create_pages_table',1),(49,'2026_05_25_104004_create_seo_meta_table',1),(50,'2026_05_25_104005_create_verification_requests_table',1),(51,'2026_05_25_104006_create_job_listings_table',1),(52,'2026_05_25_104007_create_job_applications_table',1),(53,'2026_05_26_000001_add_app_authentication_columns_to_users_table',2),(54,'2026_05_26_000002_widen_social_accounts_provider',3),(55,'2026_05_26_000003_create_translations_table',4),(56,'2026_06_05_120000_create_verification_fields_table',5),(57,'2026_06_05_130000_add_tags_to_blog_posts_table',6),(58,'2026_06_05_130100_create_faqs_table',6),(59,'2026_06_05_140000_add_address_auto_approve_to_users_table',7),(60,'2026_06_05_140100_create_user_queries_table',7),(61,'2026_06_05_150000_extend_currencies_table',8),(62,'2026_06_05_150100_create_areas_table',8),(63,'2026_06_05_160000_add_target_user_ids_to_push_notifications_table',9);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_permissions`
--

DROP TABLE IF EXISTS `model_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_permissions`
--

LOCK TABLES `model_has_permissions` WRITE;
/*!40000 ALTER TABLE `model_has_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
INSERT INTO `model_has_roles` VALUES (1,'App\\Models\\User',1),(4,'App\\Models\\User',2),(5,'App\\Models\\User',3),(5,'App\\Models\\User',4),(5,'App\\Models\\User',5),(5,'App\\Models\\User',6),(5,'App\\Models\\User',7),(5,'App\\Models\\User',8),(5,'App\\Models\\User',9),(5,'App\\Models\\User',10),(5,'App\\Models\\User',11),(5,'App\\Models\\User',12),(5,'App\\Models\\User',13),(5,'App\\Models\\User',14),(5,'App\\Models\\User',15),(5,'App\\Models\\User',16),(5,'App\\Models\\User',17);
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(255) NOT NULL,
  `notifiable_type` varchar(255) NOT NULL,
  `notifiable_id` bigint(20) unsigned NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('3893072e-4187-455a-90af-3475d1b18cd0','chat.message','App\\Models\\User',2,'{\"type\":\"chat.message\",\"title\":\"New message\",\"body\":\"hoiii\",\"conversation_id\":1,\"ad_id\":1}',NULL,'2026-05-25 22:20:45','2026-05-25 22:20:45'),('d2bb7d79-0f22-4f95-bfe8-664905104c50','offer.received','App\\Models\\User',2,'{\"type\":\"offer.received\",\"title\":\"New offer\",\"body\":\"USD 2,000.00 on Ford Mustang EcoBoost Fastback\",\"offer_id\":1,\"ad_id\":1}',NULL,'2026-06-04 04:04:07','2026-06-04 04:04:07'),('f44a296b-07d3-4289-b65c-a77612b929e5','chat.message','App\\Models\\User',2,'{\"type\":\"chat.message\",\"title\":\"New message\",\"body\":\"abc\",\"conversation_id\":2,\"ad_id\":1}',NULL,'2026-06-04 04:04:19','2026-06-04 04:04:19'),('fc8fb2f9-f30d-43ee-8083-4d0340679f08','payment.completed','App\\Models\\User',2,'{\"type\":\"payment.completed\",\"title\":\"Payment successful\",\"body\":\"USD 9.99 \\u2014 subscription\",\"transaction_id\":1,\"invoice_number\":\"INV-20260527-000001\"}',NULL,'2026-05-27 03:48:11','2026-05-27 03:48:11'),('fe5353f6-05ab-496d-99db-657332914b31','chat.message','App\\Models\\User',3,'{\"type\":\"chat.message\",\"title\":\"New message\",\"body\":\"fghjfgj\",\"conversation_id\":1,\"ad_id\":1}',NULL,'2026-05-27 03:47:41','2026-05-27 03:47:41');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `offers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ad_id` bigint(20) unsigned NOT NULL,
  `conversation_id` bigint(20) unsigned DEFAULT NULL,
  `buyer_id` bigint(20) unsigned NOT NULL,
  `seller_id` bigint(20) unsigned NOT NULL,
  `parent_offer_id` bigint(20) unsigned DEFAULT NULL,
  `amount` bigint(20) unsigned NOT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `status` enum('pending','accepted','rejected','countered','withdrawn') NOT NULL DEFAULT 'pending',
  `message` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offers_conversation_id_foreign` (`conversation_id`),
  KEY `offers_buyer_id_foreign` (`buyer_id`),
  KEY `offers_seller_id_foreign` (`seller_id`),
  KEY `offers_parent_offer_id_foreign` (`parent_offer_id`),
  KEY `offers_ad_id_buyer_id_index` (`ad_id`,`buyer_id`),
  KEY `offers_status_index` (`status`),
  CONSTRAINT `offers_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offers_buyer_id_foreign` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `offers_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `offers_parent_offer_id_foreign` FOREIGN KEY (`parent_offer_id`) REFERENCES `offers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `offers_seller_id_foreign` FOREIGN KEY (`seller_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
INSERT INTO `offers` VALUES (1,1,2,1,2,NULL,200000,'USD','pending',NULL,'2026-06-04 04:04:06','2026-06-04 04:04:06');
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otp_verifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `identifier` varchar(191) NOT NULL,
  `channel` enum('sms','email') NOT NULL,
  `provider` enum('firebase','twilio','twofactor','log') NOT NULL DEFAULT 'log',
  `purpose` enum('register','login','reset','verify') NOT NULL DEFAULT 'verify',
  `code_hash` varchar(255) NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `consumed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `otp_verifications_identifier_index` (`identifier`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES (1,'flow-6a147dccb6486@example.com','email','log','register','$2y$04$pzGZPouqPAjiVLLdCZ5ghuXtMaqHIiXWbfQlOkWdY4coamBd1x/A6',0,'2026-05-25 11:30:21',NULL,'2026-05-25 11:20:21','2026-05-25 11:20:21'),(2,'flow-6a147e05ba765@example.com','email','log','register','$2y$04$SWgraJm6j7bP8WeitKKHK.Jbk8fhOLHXX5YZHpCuABERQB5ey6X4m',0,'2026-05-25 11:31:18',NULL,'2026-05-25 11:21:18','2026-05-25 11:21:18');
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_category`
--

DROP TABLE IF EXISTS `package_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_category` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `package_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_category_package_id_category_id_unique` (`package_id`,`category_id`),
  KEY `package_category_category_id_foreign` (`category_id`),
  CONSTRAINT `package_category_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `package_category_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_category`
--

LOCK TABLES `package_category` WRITE;
/*!40000 ALTER TABLE `package_category` DISABLE KEYS */;
INSERT INTO `package_category` VALUES (1,1,2,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(2,1,1,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(3,2,2,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(4,2,1,'2026-05-25 06:21:08','2026-05-25 06:21:08'),(5,3,2,'2026-05-25 06:21:08','2026-05-25 06:21:08'),(6,3,1,'2026-05-25 06:21:08','2026-05-25 06:21:08');
/*!40000 ALTER TABLE `package_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `packages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `ios_product_id` varchar(191) DEFAULT NULL,
  `android_product_id` varchar(191) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` bigint(20) unsigned NOT NULL,
  `discount_percent` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `final_price` bigint(20) unsigned NOT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `duration_days` smallint(5) unsigned NOT NULL,
  `ad_limit` int(10) unsigned DEFAULT NULL,
  `is_unlimited` tinyint(1) NOT NULL DEFAULT 0,
  `icon_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `packages_is_active_index` (`is_active`),
  KEY `packages_sort_order_index` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` VALUES (1,'Monthly Pack',NULL,NULL,NULL,999,0,999,'USD',30,10,0,NULL,1,1,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(2,'3 Month Pack',NULL,NULL,NULL,2499,10,2249,'USD',90,50,0,NULL,1,2,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(3,'Yearly Pack',NULL,NULL,NULL,8999,20,7199,'USD',365,NULL,1,NULL,1,3,'2026-05-25 06:21:08','2026-05-25 06:21:08');
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pages`
--

DROP TABLE IF EXISTS `pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pages` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL,
  `title` varchar(191) NOT NULL,
  `body` longtext DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pages_key_unique` (`key`),
  KEY `pages_is_published_index` (`is_published`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pages`
--

LOCK TABLES `pages` WRITE;
/*!40000 ALTER TABLE `pages` DISABLE KEYS */;
INSERT INTO `pages` VALUES (1,'about','About Us','<p class=\"lead\">ClassiAds_Hub is a modern multi-vendor marketplace where buyers and sellers meet to trade anything — from cars and real estate to electronics, fashion, and services. We connect millions of local listings with safer, faster, and smarter discovery.</p>\n\n<h2>Our Mission</h2>\n<p>We make peer-to-peer commerce effortless. Whether you are selling a used phone or running a vehicle dealership, ClassiAds_Hub gives you the reach, tools, and trust signals you need to close more deals — without paying a premium.</p>\n\n<h2>What we offer</h2>\n<ul>\n    <li><strong>Free unlimited listings</strong> on most categories, with paid boost options when you want more visibility.</li>\n    <li><strong>Smart search &amp; nearby radius</strong> so buyers find exactly what they need, where they are.</li>\n    <li><strong>In-app chat &amp; offers</strong> to negotiate and close deals safely.</li>\n    <li><strong>Verified profiles &amp; reviews</strong> to build trust between buyers and sellers.</li>\n    <li><strong>Subscription plans</strong> for sellers who need higher quotas, featured spots, and analytics.</li>\n    <li><strong>Multi-language &amp; multi-currency</strong> support for a truly global audience.</li>\n</ul>\n\n<h2>Why choose us</h2>\n<p>We are built mobile-first, search-engine-first, and trust-first. Every listing is moderated, every transaction is auditable, and every user owns their data. Reach more buyers with SEO-friendly pages, get paid faster with multiple payment gateways, and grow your business with our seller analytics.</p>\n\n<h2>Get involved</h2>\n<p>Post your first ad in under a minute, follow your favorite sellers, save searches you care about, and never miss a great deal. Welcome to the new way to buy and sell.</p>',1,'2026-05-25 06:21:10','2026-05-27 05:23:35'),(2,'terms','Terms & Conditions','<p class=\"lead\">By using ClassiAds_Hub you agree to the following Terms of Service. Please read them carefully — they govern your rights and obligations when posting ads, contacting users, and making purchases on our platform.</p>\n\n<h2>1. Acceptance</h2>\n<p>By creating an account or using any part of the platform, you accept these terms in full. If you do not agree, you must stop using the service.</p>\n\n<h2>2. Eligibility</h2>\n<p>You must be at least 18 years old (or the age of majority in your jurisdiction) to register and post listings on ClassiAds_Hub.</p>\n\n<h2>3. Listings &amp; conduct</h2>\n<p>You are solely responsible for the content of your listings. Prohibited items include illegal goods, counterfeits, regulated substances, and anything that infringes intellectual-property rights. We may remove any listing at our discretion.</p>\n\n<h2>4. Payments &amp; subscriptions</h2>\n<p>Paid plans and featured-ad purchases are billed in advance and are non-refundable except where required by law. Refunds for individual transactions follow our refund policy below.</p>\n\n<h2>5. Limitation of liability</h2>\n<p>ClassiAds_Hub is a marketplace platform. We are not a party to any transaction between users and we accept no liability for the quality, safety, or legality of items listed.</p>\n\n<h2>6. Changes</h2>\n<p>We may update these terms from time to time. Material changes will be announced via in-app notification or email. Continued use of the platform constitutes acceptance of the revised terms.</p>',1,'2026-05-25 06:21:10','2026-05-27 05:23:35'),(3,'privacy','Privacy Policy','<p class=\"lead\">This Privacy Policy explains what personal data we collect, how we use it, and the controls you have over it. We follow GDPR principles and apply them globally.</p>\n\n<h2>Information we collect</h2>\n<ul>\n    <li><strong>Account data:</strong> name, email, phone number, password (hashed), and language/currency preferences.</li>\n    <li><strong>Listing data:</strong> ad titles, descriptions, photos, locations, and prices you publish.</li>\n    <li><strong>Activity data:</strong> messages you send, ads you favorite, searches you save, and interactions with sellers.</li>\n    <li><strong>Device data:</strong> IP address, browser/app identifiers, and crash diagnostics.</li>\n</ul>\n\n<h2>How we use it</h2>\n<p>To deliver the marketplace experience: showing relevant listings, enabling chat, processing payments, sending receipts, and improving our service. We never sell your personal data to third parties.</p>\n\n<h2>Your rights</h2>\n<p>You can access, correct, export, or delete your data at any time from <em>Dashboard &rarr; Profile</em>. Deleting your account anonymizes personal data and revokes all access tokens.</p>\n\n<h2>Cookies</h2>\n<p>We use a small set of cookies for authentication, locale preference, and analytics. You can disable analytics cookies in your browser settings without affecting core functionality.</p>\n\n<h2>Contact</h2>\n<p>Questions about this policy? Email <a href=\"mailto:privacy@classiads.test\">privacy@classiads.test</a>.</p>',1,'2026-05-25 06:21:10','2026-05-27 05:23:35'),(4,'contact','Contact Us','<p class=\"lead\">We&rsquo;d love to hear from you. Whether you have a question about a listing, need help with your account, want to report an issue, or have feedback to share — our team is here for you.</p>\n\n<h2>Reach us</h2>\n<ul>\n    <li><strong>Email:</strong> <a href=\"mailto:support@classiads.test\">support@classiads.test</a></li>\n    <li><strong>Phone:</strong> +1 (555) 123-4567</li>\n    <li><strong>Business hours:</strong> Monday – Saturday, 09:00 – 19:00 (local time)</li>\n    <li><strong>Address:</strong> ClassiAds_Hub, 100 Marketplace Avenue, Bhuj, Gujarat 370001, India</li>\n</ul>\n\n<h2>Customer support</h2>\n<p>For listing problems, payment questions, or account access, please email <a href=\"mailto:support@classiads.test\">support@classiads.test</a> with your registered email and a short description of the issue. We typically respond within one business day.</p>\n\n<h2>Report abuse</h2>\n<p>If you spot a fraudulent listing, harassment, or any policy violation, use the <strong>Report</strong> button on the ad itself or the seller&rsquo;s profile. Our moderation team reviews every report and takes action quickly.</p>\n\n<h2>Press &amp; partnerships</h2>\n<p>For business partnerships, press inquiries, or bulk listing integrations, write to <a href=\"mailto:partnerships@classiads.test\">partnerships@classiads.test</a>.</p>',1,'2026-05-25 06:21:10','2026-05-27 05:23:35'),(5,'faq','Frequently Asked Questions','<p class=\"lead\">Quick answers to the most common questions about using ClassiAds_Hub. Can&rsquo;t find what you&rsquo;re looking for? Reach us via the <a href=\"/page/contact\">Contact</a> page.</p>\n\n<h2>Getting started</h2>\n\n<h3>How do I create an account?</h3>\n<p>Click <strong>Register</strong> in the top-right of the website (or the Sign Up screen in the mobile app). You can register with an email or a phone number; you&rsquo;ll receive a one-time code to verify your account.</p>\n\n<h3>Is it free to post an ad?</h3>\n<p>Yes — basic listings are free in most categories. Paid plans add things like more active listings, featured placement, and analytics.</p>\n\n<h2>Buying</h2>\n\n<h3>How do I contact a seller?</h3>\n<p>Open the ad and tap <strong>Chat</strong> to start an in-app conversation, or <strong>Make Offer</strong> to negotiate a price. You can also save the ad to <strong>Favorites</strong> for later.</p>\n\n<h3>Is it safe to buy on ClassiAds_Hub?</h3>\n<p>Every seller has a verified profile, and reviews from past buyers help you judge trustworthiness. For high-value items, we recommend meeting in a public place and inspecting goods before payment. Use the platform&rsquo;s chat — never share your bank details outside our secure flows.</p>\n\n<h2>Selling</h2>\n\n<h3>How do I post an ad?</h3>\n<p>Click the <strong>+ Ad Listing</strong> button, pick a category, fill in the multi-step form (details, custom fields, location, photos) and submit. Your listing goes live after a quick moderation check, usually within minutes.</p>\n\n<h3>How do I boost an ad?</h3>\n<p>On <em>My Ads</em>, hit the <strong>★ Boost</strong> button next to any approved listing. Pick a feature plan, complete checkout, and your ad gets premium placement instantly.</p>\n\n<h3>Can I edit or delete my listing?</h3>\n<p>Yes — go to <em>My Ads</em>, then use the Edit or Delete actions. You can also mark a listing as <em>Sold</em> when the deal closes.</p>\n\n<h2>Payments &amp; subscriptions</h2>\n\n<h3>What payment methods are supported?</h3>\n<p>We support major cards via Stripe, PayPal, Razorpay, Paystack, Flutterwave, PhonePe, PayTabs, DPO, and direct bank transfer. Available methods depend on your region.</p>\n\n<h3>How do I cancel a subscription?</h3>\n<p>Open <em>Dashboard &rarr; Subscriptions</em> and click <strong>Cancel</strong> next to the active plan. You keep access until the end of the current billing period.</p>\n\n<h2>Account &amp; privacy</h2>\n\n<h3>How do I change my password?</h3>\n<p>From your profile, open <em>Settings</em> and use the change-password form. You can also use the <a href=\"/forgot-password\">Forgot Password</a> flow if you can&rsquo;t sign in.</p>\n\n<h3>How do I delete my account?</h3>\n<p>Open <em>Dashboard &rarr; Profile</em> and click <strong>Delete Account</strong>. We anonymize your personal data and revoke all access tokens immediately — your account cannot be recovered after that.</p>\n\n<h3>Where can I read your privacy policy?</h3>\n<p>You can find our full <a href=\"/page/privacy\">Privacy Policy</a> and <a href=\"/page/terms\">Terms &amp; Conditions</a> in the footer of every page.</p>',1,'2026-05-25 06:21:10','2026-05-27 05:23:35'),(6,'refund','Refund Policy','<p class=\"lead\">ClassiAds_Hub charges for paid plans &amp; featured-ad boosts. This policy explains when refunds are available and how to request one.</p>\n\n<h2>Eligibility</h2>\n<ul>\n    <li><strong>Subscriptions:</strong> billed in advance, non-refundable once activated. You keep access until the end of the billing period after cancellation.</li>\n    <li><strong>Featured ad boosts:</strong> non-refundable once the listing receives its first impression on a featured surface.</li>\n    <li><strong>Duplicate charges or failed activations:</strong> fully refundable when reported within 14 days.</li>\n</ul>\n\n<h2>How to request a refund</h2>\n<p>Email <a href=\"mailto:refunds@classiads.test\">refunds@classiads.test</a> with your account email and the invoice ID (visible under <em>Transaction History</em>). Most refunds are reviewed within 3 business days and credited back to the original payment method.</p>\n\n<h2>Exceptions</h2>\n<p>We do not refund purchases on policy-violating accounts, or charges incurred from third-party gateways once their settlement window has closed.</p>\n\n<h2>Contact</h2>\n<p>Questions about a charge? Reach <a href=\"mailto:support@classiads.test\">support@classiads.test</a>.</p>',1,'2026-06-04 01:41:26','2026-06-04 01:41:26');
/*!40000 ALTER TABLE `pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_gateways`
--

DROP TABLE IF EXISTS `payment_gateways`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_gateways` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `mode` enum('sandbox','live') NOT NULL DEFAULT 'sandbox',
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `supported_currencies` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`supported_currencies`)),
  `is_manual` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_gateways_code_unique` (`code`),
  KEY `payment_gateways_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_gateways`
--

LOCK TABLES `payment_gateways` WRITE;
/*!40000 ALTER TABLE `payment_gateways` DISABLE KEYS */;
INSERT INTO `payment_gateways` VALUES (1,'sandbox','Sandbox (Test)',1,'sandbox',NULL,NULL,0,0,'2026-05-25 06:21:06','2026-05-25 06:21:06'),(2,'bank_transfer','Bank Transfer',1,'live','{\"instructions\":\"Transfer to ClassiAds Bank, A\\/C 0001234567, IFSC CLAS0001.\"}',NULL,1,1,'2026-05-25 06:21:06','2026-05-25 06:21:06'),(3,'stripe','Stripe',0,'sandbox',NULL,NULL,0,2,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(4,'razorpay','Razorpay',0,'sandbox',NULL,NULL,0,3,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(5,'paypal','PayPal',0,'sandbox',NULL,NULL,0,4,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(6,'paystack','Paystack',0,'sandbox',NULL,NULL,0,5,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(7,'phonepe','PhonePe',0,'sandbox',NULL,NULL,0,6,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(8,'flutterwave','Flutterwave',0,'sandbox',NULL,NULL,0,7,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(9,'paytabs','PayTabs',0,'sandbox',NULL,NULL,0,8,'2026-05-25 06:21:07','2026-05-25 06:21:07'),(10,'dpo','DPO',0,'sandbox',NULL,NULL,0,9,'2026-05-25 06:21:07','2026-05-25 06:21:07');
/*!40000 ALTER TABLE `payment_gateways` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'users.view','web','2026-05-25 06:20:26','2026-05-25 06:20:26'),(2,'users.create','web','2026-05-25 06:20:26','2026-05-25 06:20:26'),(3,'users.update','web','2026-05-25 06:20:27','2026-05-25 06:20:27'),(4,'users.delete','web','2026-05-25 06:20:27','2026-05-25 06:20:27'),(5,'sellers.view','web','2026-05-25 06:20:27','2026-05-25 06:20:27'),(6,'sellers.create','web','2026-05-25 06:20:28','2026-05-25 06:20:28'),(7,'sellers.update','web','2026-05-25 06:20:28','2026-05-25 06:20:28'),(8,'sellers.delete','web','2026-05-25 06:20:28','2026-05-25 06:20:28'),(9,'categories.view','web','2026-05-25 06:20:28','2026-05-25 06:20:28'),(10,'categories.create','web','2026-05-25 06:20:29','2026-05-25 06:20:29'),(11,'categories.update','web','2026-05-25 06:20:29','2026-05-25 06:20:29'),(12,'categories.delete','web','2026-05-25 06:20:29','2026-05-25 06:20:29'),(13,'custom_fields.view','web','2026-05-25 06:20:29','2026-05-25 06:20:29'),(14,'custom_fields.create','web','2026-05-25 06:20:30','2026-05-25 06:20:30'),(15,'custom_fields.update','web','2026-05-25 06:20:30','2026-05-25 06:20:30'),(16,'custom_fields.delete','web','2026-05-25 06:20:31','2026-05-25 06:20:31'),(17,'ads.view','web','2026-05-25 06:20:31','2026-05-25 06:20:31'),(18,'ads.create','web','2026-05-25 06:20:31','2026-05-25 06:20:31'),(19,'ads.update','web','2026-05-25 06:20:31','2026-05-25 06:20:31'),(20,'ads.delete','web','2026-05-25 06:20:32','2026-05-25 06:20:32'),(21,'packages.view','web','2026-05-25 06:20:32','2026-05-25 06:20:32'),(22,'packages.create','web','2026-05-25 06:20:32','2026-05-25 06:20:32'),(23,'packages.update','web','2026-05-25 06:20:33','2026-05-25 06:20:33'),(24,'packages.delete','web','2026-05-25 06:20:33','2026-05-25 06:20:33'),(25,'subscriptions.view','web','2026-05-25 06:20:33','2026-05-25 06:20:33'),(26,'subscriptions.create','web','2026-05-25 06:20:33','2026-05-25 06:20:33'),(27,'subscriptions.update','web','2026-05-25 06:20:33','2026-05-25 06:20:33'),(28,'subscriptions.delete','web','2026-05-25 06:20:34','2026-05-25 06:20:34'),(29,'transactions.view','web','2026-05-25 06:20:34','2026-05-25 06:20:34'),(30,'transactions.create','web','2026-05-25 06:20:34','2026-05-25 06:20:34'),(31,'transactions.update','web','2026-05-25 06:20:34','2026-05-25 06:20:34'),(32,'transactions.delete','web','2026-05-25 06:20:34','2026-05-25 06:20:34'),(33,'reports.view','web','2026-05-25 06:20:34','2026-05-25 06:20:34'),(34,'reports.create','web','2026-05-25 06:20:35','2026-05-25 06:20:35'),(35,'reports.update','web','2026-05-25 06:20:35','2026-05-25 06:20:35'),(36,'reports.delete','web','2026-05-25 06:20:35','2026-05-25 06:20:35'),(37,'reviews.view','web','2026-05-25 06:20:35','2026-05-25 06:20:35'),(38,'reviews.create','web','2026-05-25 06:20:35','2026-05-25 06:20:35'),(39,'reviews.update','web','2026-05-25 06:20:36','2026-05-25 06:20:36'),(40,'reviews.delete','web','2026-05-25 06:20:36','2026-05-25 06:20:36'),(41,'chats.view','web','2026-05-25 06:20:36','2026-05-25 06:20:36'),(42,'chats.create','web','2026-05-25 06:20:36','2026-05-25 06:20:36'),(43,'chats.update','web','2026-05-25 06:20:37','2026-05-25 06:20:37'),(44,'chats.delete','web','2026-05-25 06:20:37','2026-05-25 06:20:37'),(45,'notifications.view','web','2026-05-25 06:20:37','2026-05-25 06:20:37'),(46,'notifications.create','web','2026-05-25 06:20:37','2026-05-25 06:20:37'),(47,'notifications.update','web','2026-05-25 06:20:38','2026-05-25 06:20:38'),(48,'notifications.delete','web','2026-05-25 06:20:38','2026-05-25 06:20:38'),(49,'locations.view','web','2026-05-25 06:20:38','2026-05-25 06:20:38'),(50,'locations.create','web','2026-05-25 06:20:38','2026-05-25 06:20:38'),(51,'locations.update','web','2026-05-25 06:20:39','2026-05-25 06:20:39'),(52,'locations.delete','web','2026-05-25 06:20:39','2026-05-25 06:20:39'),(53,'currencies.view','web','2026-05-25 06:20:39','2026-05-25 06:20:39'),(54,'currencies.create','web','2026-05-25 06:20:40','2026-05-25 06:20:40'),(55,'currencies.update','web','2026-05-25 06:20:40','2026-05-25 06:20:40'),(56,'currencies.delete','web','2026-05-25 06:20:40','2026-05-25 06:20:40'),(57,'languages.view','web','2026-05-25 06:20:40','2026-05-25 06:20:40'),(58,'languages.create','web','2026-05-25 06:20:40','2026-05-25 06:20:40'),(59,'languages.update','web','2026-05-25 06:20:40','2026-05-25 06:20:40'),(60,'languages.delete','web','2026-05-25 06:20:41','2026-05-25 06:20:41'),(61,'blog.view','web','2026-05-25 06:20:41','2026-05-25 06:20:41'),(62,'blog.create','web','2026-05-25 06:20:41','2026-05-25 06:20:41'),(63,'blog.update','web','2026-05-25 06:20:41','2026-05-25 06:20:41'),(64,'blog.delete','web','2026-05-25 06:20:41','2026-05-25 06:20:41'),(65,'pages.view','web','2026-05-25 06:20:42','2026-05-25 06:20:42'),(66,'pages.create','web','2026-05-25 06:20:42','2026-05-25 06:20:42'),(67,'pages.update','web','2026-05-25 06:20:42','2026-05-25 06:20:42'),(68,'pages.delete','web','2026-05-25 06:20:42','2026-05-25 06:20:42'),(69,'sliders.view','web','2026-05-25 06:20:42','2026-05-25 06:20:42'),(70,'sliders.create','web','2026-05-25 06:20:43','2026-05-25 06:20:43'),(71,'sliders.update','web','2026-05-25 06:20:43','2026-05-25 06:20:43'),(72,'sliders.delete','web','2026-05-25 06:20:43','2026-05-25 06:20:43'),(73,'featured_sections.view','web','2026-05-25 06:20:43','2026-05-25 06:20:43'),(74,'featured_sections.create','web','2026-05-25 06:20:43','2026-05-25 06:20:43'),(75,'featured_sections.update','web','2026-05-25 06:20:44','2026-05-25 06:20:44'),(76,'featured_sections.delete','web','2026-05-25 06:20:44','2026-05-25 06:20:44'),(77,'verifications.view','web','2026-05-25 06:20:44','2026-05-25 06:20:44'),(78,'verifications.create','web','2026-05-25 06:20:44','2026-05-25 06:20:44'),(79,'verifications.update','web','2026-05-25 06:20:44','2026-05-25 06:20:44'),(80,'verifications.delete','web','2026-05-25 06:20:45','2026-05-25 06:20:45'),(81,'settings.view','web','2026-05-25 06:20:45','2026-05-25 06:20:45'),(82,'settings.create','web','2026-05-25 06:20:45','2026-05-25 06:20:45'),(83,'settings.update','web','2026-05-25 06:20:45','2026-05-25 06:20:45'),(84,'settings.delete','web','2026-05-25 06:20:46','2026-05-25 06:20:46'),(85,'staff.view','web','2026-05-25 06:20:46','2026-05-25 06:20:46'),(86,'staff.create','web','2026-05-25 06:20:46','2026-05-25 06:20:46'),(87,'staff.update','web','2026-05-25 06:20:46','2026-05-25 06:20:46'),(88,'staff.delete','web','2026-05-25 06:20:47','2026-05-25 06:20:47'),(89,'audit_logs.view','web','2026-05-25 06:20:47','2026-05-25 06:20:47'),(90,'audit_logs.create','web','2026-05-25 06:20:47','2026-05-25 06:20:47'),(91,'audit_logs.update','web','2026-05-25 06:20:48','2026-05-25 06:20:48'),(92,'audit_logs.delete','web','2026-05-25 06:20:48','2026-05-25 06:20:48'),(93,'ads.approve','web','2026-05-25 06:20:48','2026-05-25 06:20:48'),(94,'dashboard.view','web','2026-05-25 06:20:49','2026-05-25 06:20:49');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',4,'social','ad1f6342de0f2bd44a4e37af7a982ec6b914d33acda06c3a2b568ac56f0a94b5','[\"*\"]',NULL,NULL,'2026-05-25 11:07:02','2026-05-25 11:07:02'),(2,'App\\Models\\User',5,'social','2538eafcc6cc38e10c50656095fe5a81b28d694221f6dd3a3680a4b2449eb2a5','[\"*\"]',NULL,NULL,'2026-05-25 11:07:03','2026-05-25 11:07:03'),(3,'App\\Models\\User',6,'social','551d906b841a3fe47bae6402d738ed678fb6feca9ebd148f7f9247098e9f2c1b','[\"*\"]',NULL,NULL,'2026-05-25 11:10:34','2026-05-25 11:10:34'),(4,'App\\Models\\User',7,'social','998875895e13bcc65f849bf27440348a983345d77e8fc80c64289f88a2dd3c1b','[\"*\"]',NULL,NULL,'2026-05-25 11:10:35','2026-05-25 11:10:35'),(5,'App\\Models\\User',8,'social','2eea602e2a4a7bc85a4215c20451edbae58ad4f1721b72d350df7ca47d2f77c7','[\"*\"]',NULL,NULL,'2026-05-25 11:10:56','2026-05-25 11:10:56'),(6,'App\\Models\\User',9,'social','419b75239c2b9aa04b2f37fb3f1966b5ef3b2c3d363747e8162fc58d29504905','[\"*\"]',NULL,NULL,'2026-05-25 11:10:56','2026-05-25 11:10:56'),(7,'App\\Models\\User',10,'api','9850a758c573de3d566b6605ae9441bff8af500723407956a9c9a2c7fc51c457','[\"*\"]',NULL,NULL,'2026-05-25 11:20:21','2026-05-25 11:20:21'),(8,'App\\Models\\User',12,'api','75c736c4de81dadb7eef61a42076838a2bb0609e5ab37ac9935df5acb62d1640','[\"*\"]','2026-05-25 11:20:21',NULL,'2026-05-25 11:20:21','2026-05-25 11:20:21'),(9,'App\\Models\\User',13,'api','b9e574d6e80cfc07c4a66af31c36d8312943ab6b4648d14ae0160b9f1f9c159b','[\"*\"]',NULL,NULL,'2026-05-25 11:21:18','2026-05-25 11:21:18'),(10,'App\\Models\\User',15,'api','4463793ce5b0769d54af4ece007ca0982231293e34a4895e1f77294f49ede070','[\"*\"]','2026-05-25 11:21:18',NULL,'2026-05-25 11:21:18','2026-05-25 11:21:18'),(11,'App\\Models\\User',16,'social','e3310f1731fd2f516f2f5eed2e5d53e580aacde3564da2b7b1363ae2bf3a16c2','[\"*\"]',NULL,NULL,'2026-05-25 11:21:19','2026-05-25 11:21:19'),(12,'App\\Models\\User',17,'social','c72bc3cd57275fdbc6fb2570f53aa232e8015e1cdbb7dfc9eaa851ff9395b0b6','[\"*\"]',NULL,NULL,'2026-05-25 11:21:19','2026-05-25 11:21:19'),(17,'App\\Models\\User',1,'api','d909b14230d19cc50b8fafd0536a1d8e6262baa175a311b5138bf5655c713aa2','[\"*\"]','2026-06-16 00:46:47',NULL,'2026-05-27 04:27:02','2026-06-16 00:46:47'),(18,'App\\Models\\User',1,'api','d93097d67f212c6266ebb7b186c9775c519c1cd3e36bd4078e4edbcc346c6a3e','[\"*\"]','2026-05-27 04:43:37',NULL,'2026-05-27 04:34:48','2026-05-27 04:43:37'),(20,'App\\Models\\User',1,'api','3a87327d31385cee1f42af8f0039d8c3d8791dc6ca65779351631bc79f65e076','[\"*\"]','2026-06-16 01:41:56',NULL,'2026-06-04 04:03:02','2026-06-16 01:41:56');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `push_notifications`
--

DROP TABLE IF EXISTS `push_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `push_notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `body` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `target` enum('all','role','user') NOT NULL DEFAULT 'all',
  `target_role` varchar(50) DEFAULT NULL,
  `target_user_id` bigint(20) unsigned DEFAULT NULL,
  `target_user_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_user_ids`)),
  `item_type` varchar(100) DEFAULT NULL,
  `item_id` bigint(20) unsigned DEFAULT NULL,
  `sent_by` bigint(20) unsigned DEFAULT NULL,
  `recipients_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `push_notifications_target_user_id_foreign` (`target_user_id`),
  KEY `push_notifications_sent_by_foreign` (`sent_by`),
  CONSTRAINT `push_notifications_sent_by_foreign` FOREIGN KEY (`sent_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `push_notifications_target_user_id_foreign` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `push_notifications`
--

LOCK TABLES `push_notifications` WRITE;
/*!40000 ALTER TABLE `push_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `push_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reporter_id` bigint(20) unsigned NOT NULL,
  `reportable_type` varchar(191) NOT NULL,
  `reportable_id` bigint(20) unsigned NOT NULL,
  `reason` varchar(150) NOT NULL,
  `details` text DEFAULT NULL,
  `status` enum('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
  `resolved_by` bigint(20) unsigned DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reports_reporter_id_foreign` (`reporter_id`),
  KEY `reports_resolved_by_foreign` (`resolved_by`),
  KEY `reports_reportable_type_reportable_id_index` (`reportable_type`,`reportable_id`),
  KEY `reports_status_index` (`status`),
  CONSTRAINT `reports_reporter_id_foreign` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reports_resolved_by_foreign` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `ad_id` bigint(20) unsigned DEFAULT NULL,
  `reviewer_id` bigint(20) unsigned NOT NULL,
  `reviewee_id` bigint(20) unsigned NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `comment` text DEFAULT NULL,
  `type` enum('seller_review','buyer_review') NOT NULL DEFAULT 'seller_review',
  `is_approved` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_reviewer_id_reviewee_id_ad_id_unique` (`reviewer_id`,`reviewee_id`,`ad_id`),
  KEY `reviews_ad_id_foreign` (`ad_id`),
  KEY `reviews_reviewee_id_is_approved_index` (`reviewee_id`,`is_approved`),
  KEY `reviews_is_approved_index` (`is_approved`),
  CONSTRAINT `reviews_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_reviewee_id_foreign` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_reviewer_id_foreign` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(1,2),(1,3),(2,1),(2,2),(3,1),(3,2),(4,1),(4,2),(5,1),(5,2),(5,3),(6,1),(6,2),(7,1),(7,2),(8,1),(8,2),(9,1),(9,2),(10,1),(10,2),(11,1),(11,2),(12,1),(12,2),(13,1),(13,2),(14,1),(14,2),(15,1),(15,2),(16,1),(16,2),(17,1),(17,2),(17,3),(18,1),(18,2),(19,1),(19,2),(19,3),(20,1),(20,2),(21,1),(21,2),(22,1),(22,2),(23,1),(23,2),(24,1),(24,2),(25,1),(25,2),(26,1),(26,2),(27,1),(27,2),(28,1),(28,2),(29,1),(29,2),(30,1),(30,2),(31,1),(31,2),(32,1),(32,2),(33,1),(33,2),(33,3),(34,1),(34,2),(35,1),(35,2),(35,3),(36,1),(36,2),(37,1),(37,2),(37,3),(38,1),(38,2),(39,1),(39,2),(40,1),(40,2),(40,3),(41,1),(41,2),(41,3),(42,1),(42,2),(43,1),(43,2),(44,1),(44,2),(45,1),(45,2),(46,1),(46,2),(47,1),(47,2),(48,1),(48,2),(49,1),(49,2),(50,1),(50,2),(51,1),(51,2),(52,1),(52,2),(53,1),(53,2),(54,1),(54,2),(55,1),(55,2),(56,1),(56,2),(57,1),(57,2),(58,1),(58,2),(59,1),(59,2),(60,1),(60,2),(61,1),(61,2),(62,1),(62,2),(63,1),(63,2),(64,1),(64,2),(65,1),(65,2),(66,1),(66,2),(67,1),(67,2),(68,1),(68,2),(69,1),(69,2),(70,1),(70,2),(71,1),(71,2),(72,1),(72,2),(73,1),(73,2),(74,1),(74,2),(75,1),(75,2),(76,1),(76,2),(77,1),(77,2),(78,1),(78,2),(79,1),(79,2),(80,1),(80,2),(81,1),(81,2),(82,1),(82,2),(83,1),(83,2),(84,1),(84,2),(85,1),(85,2),(86,1),(86,2),(87,1),(87,2),(88,1),(88,2),(89,1),(89,2),(90,1),(90,2),(91,1),(91,2),(92,1),(92,2),(93,1),(93,2),(93,3),(94,1),(94,2),(94,3);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'super-admin','web','2026-05-25 06:20:50','2026-05-25 06:20:50'),(2,'admin','web','2026-05-25 06:20:50','2026-05-25 06:20:50'),(3,'staff','web','2026-05-25 06:20:50','2026-05-25 06:20:50'),(4,'seller','web','2026-05-25 06:20:50','2026-05-25 06:20:50'),(5,'customer','web','2026-05-25 06:20:50','2026-05-25 06:20:50');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_searches`
--

DROP TABLE IF EXISTS `saved_searches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `saved_searches` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `query` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`query`)),
  `notify` tinyint(1) NOT NULL DEFAULT 0,
  `last_run_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `saved_searches_user_id_index` (`user_id`),
  CONSTRAINT `saved_searches_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_searches`
--

LOCK TABLES `saved_searches` WRITE;
/*!40000 ALTER TABLE `saved_searches` DISABLE KEYS */;
/*!40000 ALTER TABLE `saved_searches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seller_profiles`
--

DROP TABLE IF EXISTS `seller_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seller_profiles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `business_name` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `rating_avg` decimal(3,2) NOT NULL DEFAULT 0.00,
  `rating_count` int(10) unsigned NOT NULL DEFAULT 0,
  `member_since` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seller_profiles_user_id_unique` (`user_id`),
  CONSTRAINT `seller_profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seller_profiles`
--

LOCK TABLES `seller_profiles` WRITE;
/*!40000 ALTER TABLE `seller_profiles` DISABLE KEYS */;
INSERT INTO `seller_profiles` VALUES (1,2,'Emma Williams',NULL,'Emma Motors',NULL,0.00,0,'2025-05-25','2026-05-25 06:21:03','2026-05-25 06:21:03');
/*!40000 ALTER TABLE `seller_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seo_meta`
--

DROP TABLE IF EXISTS `seo_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `seo_meta` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `seoable_type` varchar(191) DEFAULT NULL,
  `seoable_id` bigint(20) unsigned DEFAULT NULL,
  `route_key` varchar(100) DEFAULT NULL,
  `title` varchar(191) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `keywords` varchar(500) DEFAULT NULL,
  `og_image` varchar(255) DEFAULT NULL,
  `json_ld` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`json_ld`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `seo_meta_seoable_type_seoable_id_unique` (`seoable_type`,`seoable_id`),
  UNIQUE KEY `seo_meta_route_key_unique` (`route_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seo_meta`
--

LOCK TABLES `seo_meta` WRITE;
/*!40000 ALTER TABLE `seo_meta` DISABLE KEYS */;
INSERT INTO `seo_meta` VALUES (1,NULL,NULL,'home','ClassiAds_Hub — Buy & Sell Anything','A multi-vendor classifieds marketplace for buying and selling locally and globally.','classifieds, marketplace, buy, sell, ads',NULL,NULL,'2026-05-25 06:21:11','2026-05-25 06:21:11');
/*!40000 ALTER TABLE `seo_meta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('0uTKPYwW37RxHiOiOQ309MsU7Qk5z8Br5gUB8qxQ',NULL,'127.0.0.1','curl/8.6.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWTFWb3BhS1YwYjBwVVY0V0RQYU5EZnFqeU44aVJZb2pHeTJhaGpNZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoyNToiZmlsYW1lbnQuYWRtaW4uYXV0aC5sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1781590431),('19Mm9r3MtTznVTUQVhCQ17LY3yJLAAsYGTopRv9t',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiV3M0MVptZWtoRGlvTndMOWdFdzBINkNXTEh1M01FRVo0V3JqazREQSI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozODoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2NhdGVnb3JpZXMiO31zOjk6Il9wcmV2aW91cyI7YToyOntzOjM6InVybCI7czozODoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2NhdGVnb3JpZXMiO3M6NToicm91dGUiO3M6NDE6ImZpbGFtZW50LmFkbWluLnJlc291cmNlcy5jYXRlZ29yaWVzLmluZGV4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1780656315),('8jBHEAhtS291XtXZOfzlrEYDrUjVSvLketOTwfKJ',NULL,'127.0.0.1','curl/8.6.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiZUUzb0t0MGpVWjRJSkYzZllpVVRyT3lwN0dROFhCdm8xSllUOEpuRiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoyNToiZmlsYW1lbnQuYWRtaW4uYXV0aC5sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1781589294),('cdotWPKx9luYTZHPGh7MreZZeoFg0Wj00M17Fuv7',NULL,'127.0.0.1','curl/8.6.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiYlZQMjNEYUE5NWpUb25PWFdoYWRRSlQ5TWtqRld6Q09sMnROSE1MZyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoyNToiZmlsYW1lbnQuYWRtaW4uYXV0aC5sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1780565527),('dVrImv7QcvmzSiZSI7lpBADuAbr5lm8sohif15Ab',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiYUNrUEhYdzVFWWxWNHNQQTltRXRKSzk1clZNSnpISzk0ZDgySkRaUSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzk6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9ob21lLXNjcmVlbiI7czo1OiJyb3V0ZSI7czozMjoiZmlsYW1lbnQuYWRtaW4ucGFnZXMuaG9tZS1zY3JlZW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjM6InVybCI7YToxOntzOjg6ImludGVuZGVkIjtzOjM5OiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYWRtaW4vaG9tZS1zY3JlZW4iO319',1780655228),('Jsafi4kekBnc9GbBb6B3xwlUGOvCbjVyR4xw5RSL',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiRGRWTGVoU3F1aEh5WXJYOEJiMGpJbEdNckpwb2F1TUIxdWJFRk90SCI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czo0MToiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2N1c3RvbS1maWVsZHMiO31zOjk6Il9wcmV2aW91cyI7YToyOntzOjM6InVybCI7czo0MToiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2N1c3RvbS1maWVsZHMiO3M6NToicm91dGUiO3M6NDQ6ImZpbGFtZW50LmFkbWluLnJlc291cmNlcy5jdXN0b20tZmllbGRzLmluZGV4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1780656315),('jZFw74ce1KFwgtsBSdk2NbIxj9P7TBlEVubQLIAH',NULL,'127.0.0.1','curl/8.6.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiMVdzZ2syWTREWEhRbzVQNnE1R3JmUmNhYjFseW9mUU11YTUyWTZuQSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoyNToiZmlsYW1lbnQuYWRtaW4uYXV0aC5sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1780652797),('kXOO5ABx0YsqJOeO0dqZufKMSIJ1ufEnrefBGJkS',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiamx5dks5Rm82cWRxZlRBak15c2dHWXpmVVpTZnV1NndDNUlsZ0NkWSI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozMzoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2NoYXRzIjt9czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9jaGF0cyI7czo1OiJyb3V0ZSI7czoyNjoiZmlsYW1lbnQuYWRtaW4ucGFnZXMuY2hhdHMiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1780656316),('l1oEpqP7bOnGm8XNDOQHFdaJk39Xbuy39FtWF8wJ',NULL,'127.0.0.1','curl/8.6.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiNTNreWkzcjJTdkpzd3JScXk1eWNZcUU0M1Z2OVMwYjVnbDBBOW9EbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoyNToiZmlsYW1lbnQuYWRtaW4uYXV0aC5sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1781589259),('LEODn7CsvSN6XPdQGH6msyrjsBdB9Z0SDOJrDHH4',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiMEpleWN6alFUOFdsUDYxR0pVQkNPRU1YclJWOFgwOEdaTVJzVkpubiI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozNToiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL3NsaWRlcnMiO31zOjk6Il9wcmV2aW91cyI7YToyOntzOjM6InVybCI7czozNToiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL3NsaWRlcnMiO3M6NToicm91dGUiO3M6Mzg6ImZpbGFtZW50LmFkbWluLnJlc291cmNlcy5zbGlkZXJzLmluZGV4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1780656316),('M759tnxZlHQGBDbETL1dKD3tyyS83TzRAH3JUvJG',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','YTo3OntzOjY6Il90b2tlbiI7czo0MDoid1J2c0k2QmZZeEM1WXN1MzUwWEMwaWlhQzNvM0Z5N004bXM0dzd2YiI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjI3OiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYWRtaW4iO3M6NToicm91dGUiO3M6MzA6ImZpbGFtZW50LmFkbWluLnBhZ2VzLmRhc2hib2FyZCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjE7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjQ6IjNmOTFmZDU1OGNlYzNhZDEyOGIzOTBiMDAxOWM4Mzg3OGY3NGYyMzRjZGJiZmRkNDQwYjQ4YTJkZjVlNWM1ZWYiO3M6NjoidGFibGVzIjthOjE6e3M6NDA6ImJjNzRkM2Q1ODdiNGQyZTg3YWEwNDk1YmViODQ2NTZmX2NvbHVtbnMiO2E6NTp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InRpdGxlIjtzOjU6ImxhYmVsIjtzOjU6IlRpdGxlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJ1c2VyLm5hbWUiO3M6NToibGFiZWwiO3M6NjoiU2VsbGVyIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoiY2F0ZWdvcnkubmFtZSI7czo1OiJsYWJlbCI7czo4OiJDYXRlZ29yeSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjA7fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo1OiJwcmljZSI7czo1OiJsYWJlbCI7czo1OiJQcmljZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6ImNyZWF0ZWRfYXQiO3M6NToibGFiZWwiO3M6OToiU3VibWl0dGVkIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fX19fQ==',1780571732),('NpP6hyob2jWM3mcX4RL8ghZjMyJyx9Waug8ZVtWA',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','YTo4OntzOjY6Il90b2tlbiI7czo0MDoiU2dJUEpEMFVnSXc1dmlrOUx3dEZSRFRDRXZIN1REOTRqeXMweEZEcyI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjI3OiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYWRtaW4iO3M6NToicm91dGUiO3M6MzA6ImZpbGFtZW50LmFkbWluLnBhZ2VzLmRhc2hib2FyZCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjE7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjQ6IjNmOTFmZDU1OGNlYzNhZDEyOGIzOTBiMDAxOWM4Mzg3OGY3NGYyMzRjZGJiZmRkNDQwYjQ4YTJkZjVlNWM1ZWYiO3M6NjoidGFibGVzIjthOjg6e3M6NDA6ImJjNzRkM2Q1ODdiNGQyZTg3YWEwNDk1YmViODQ2NTZmX2NvbHVtbnMiO2E6NTp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InRpdGxlIjtzOjU6ImxhYmVsIjtzOjU6IlRpdGxlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJ1c2VyLm5hbWUiO3M6NToibGFiZWwiO3M6NjoiU2VsbGVyIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoiY2F0ZWdvcnkubmFtZSI7czo1OiJsYWJlbCI7czo4OiJDYXRlZ29yeSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjA7fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo1OiJwcmljZSI7czo1OiJsYWJlbCI7czo1OiJQcmljZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6ImNyZWF0ZWRfYXQiO3M6NToibGFiZWwiO3M6OToiU3VibWl0dGVkIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fX1zOjQwOiJiYTc0NmZmNWJkYWQ3MTJhYjZhYmIzNDIwNDRmZTAxN19jb2x1bW5zIjthOjk6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo1OiJ0aXRsZSI7czo1OiJsYWJlbCI7czo1OiJUaXRsZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6OToidXNlci5uYW1lIjtzOjU6ImxhYmVsIjtzOjY6IlNlbGxlciI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTM6ImNhdGVnb3J5Lm5hbWUiO3M6NToibGFiZWwiO3M6ODoiQ2F0ZWdvcnkiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjoxO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7YjowO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NToicHJpY2UiO3M6NToibGFiZWwiO3M6NToiUHJpY2UiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjY6InN0YXR1cyI7czo1OiJsYWJlbCI7czo2OiJTdGF0dXMiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjExOiJpc19mZWF0dXJlZCI7czo1OiJsYWJlbCI7czo4OiJGZWF0dXJlZCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjY7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6OToiY2l0eS5uYW1lIjtzOjU6ImxhYmVsIjtzOjQ6IkNpdHkiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjoxO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7YjowO31pOjc7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTE6InZpZXdzX2NvdW50IjtzOjU6ImxhYmVsIjtzOjU6IlZpZXdzIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MDt9aTo4O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fXM6NDA6ImRlMWE5MDc2ZWM2MDNjMjY0ZGIyNzhkZWUwMmRkZDU4X2NvbHVtbnMiO2E6Njp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjE2OiJjdXN0b21GaWVsZC5uYW1lIjtzOjU6ImxhYmVsIjtzOjEyOiJDdXN0b20gZmllbGQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6ImxhYmVsIjtzOjU6ImxhYmVsIjtzOjU6IkxhYmVsIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo1OiJ2YWx1ZSI7czo1OiJsYWJlbCI7czo1OiJWYWx1ZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InNvcnRfb3JkZXIiO3M6NToibGFiZWwiO3M6MTA6IlNvcnQgb3JkZXIiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJ1cGRhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJVcGRhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fXM6NDA6ImRkYzFkMDhlYmVmYTY1MjI5MDNhYjFmMzdjM2NiOGFjX2NvbHVtbnMiO2E6MTE6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMToicGFyZW50Lm5hbWUiO3M6NToibGFiZWwiO3M6NjoiUGFyZW50IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJuYW1lIjtzOjU6ImxhYmVsIjtzOjQ6Ik5hbWUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6InNsdWciO3M6NToibGFiZWwiO3M6NDoiU2x1ZyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6OToiaWNvbl9wYXRoIjtzOjU6ImxhYmVsIjtzOjk6Ikljb24gcGF0aCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6ImltYWdlX3BhdGgiO3M6NToibGFiZWwiO3M6MTA6IkltYWdlIHBhdGgiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6InR5cGUiO3M6NToibGFiZWwiO3M6NDoiVHlwZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjY7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InNvcnRfb3JkZXIiO3M6NToibGFiZWwiO3M6MTA6IlNvcnQgb3JkZXIiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo3O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6ImlzX2FjdGl2ZSI7czo1OiJsYWJlbCI7czo5OiJJcyBhY3RpdmUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo4O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6ImFkc19jb3VudCI7czo1OiJsYWJlbCI7czo5OiJBZHMgY291bnQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo5O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aToxMDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoidXBkYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiVXBkYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fX1zOjQwOiJhNjc3YTM4YWY5YTk1NjdlYWMwYjFkY2EyZjIxNjQ2Ml9jb2x1bW5zIjthOjk6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJuYW1lIjtzOjU6ImxhYmVsIjtzOjQ6Ik5hbWUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6ImNvZGUiO3M6NToibGFiZWwiO3M6NDoiQ29kZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoidHlwZSI7czo1OiJsYWJlbCI7czo0OiJUeXBlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJpY29uX3BhdGgiO3M6NToibGFiZWwiO3M6OToiSWNvbiBwYXRoIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMToiaXNfcmVxdWlyZWQiO3M6NToibGFiZWwiO3M6MTE6IklzIHJlcXVpcmVkIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoiaXNfZmlsdGVyYWJsZSI7czo1OiJsYWJlbCI7czoxMzoiSXMgZmlsdGVyYWJsZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjY7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InNvcnRfb3JkZXIiO3M6NToibGFiZWwiO3M6MTA6IlNvcnQgb3JkZXIiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo3O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aTo4O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJ1cGRhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJVcGRhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fXM6NDA6ImJlNDhiMTEwZjkzZjQ2OTRmYmE2MWE3MzExYTc4NTFkX2NvbHVtbnMiO2E6Njp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6InVzZXIubmFtZSI7czo1OiJsYWJlbCI7czo0OiJVc2VyIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo2OiJhY3Rpb24iO3M6NToibGFiZWwiO3M6NjoiQWN0aW9uIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxNDoiYXVkaXRhYmxlX3R5cGUiO3M6NToibGFiZWwiO3M6MTQ6IkF1ZGl0YWJsZSB0eXBlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMjoiYXVkaXRhYmxlX2lkIjtzOjU6ImxhYmVsIjtzOjEyOiJBdWRpdGFibGUgaWQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjI6ImlwIjtzOjU6ImxhYmVsIjtzOjI6IklwIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoiY3JlYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiQ3JlYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fX1zOjQwOiIzNTdmNjQ1N2YyYmY4ZGVkNzZjY2UzZGVlMDI1ZjkxOV9jb2x1bW5zIjthOjY6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJuYW1lIjtzOjU6ImxhYmVsIjtzOjQ6Ik5hbWUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6InNsdWciO3M6NToibGFiZWwiO3M6NDoiU2x1ZyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6OToiaXNfYWN0aXZlIjtzOjU6ImxhYmVsIjtzOjk6IklzIGFjdGl2ZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InNvcnRfb3JkZXIiO3M6NToibGFiZWwiO3M6MTA6IlNvcnQgb3JkZXIiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJ1cGRhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJVcGRhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fXM6NDA6ImI4NGYyNTk5NmRiY2NjZmU4NWZiNDU0ZDU4MzZjN2E5X2NvbHVtbnMiO2E6OTp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEyOiJzZW9hYmxlX3R5cGUiO3M6NToibGFiZWwiO3M6MTI6IlNlb2FibGUgdHlwZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InNlb2FibGVfaWQiO3M6NToibGFiZWwiO3M6MTA6IlNlb2FibGUgaWQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6InJvdXRlX2tleSI7czo1OiJsYWJlbCI7czo5OiJSb3V0ZSBrZXkiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InRpdGxlIjtzOjU6ImxhYmVsIjtzOjU6IlRpdGxlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMToiZGVzY3JpcHRpb24iO3M6NToibGFiZWwiO3M6MTE6IkRlc2NyaXB0aW9uIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo4OiJrZXl3b3JkcyI7czo1OiJsYWJlbCI7czo4OiJLZXl3b3JkcyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjY7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6ODoib2dfaW1hZ2UiO3M6NToibGFiZWwiO3M6ODoiT2cgaW1hZ2UiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo3O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aTo4O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJ1cGRhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJVcGRhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fX1zOjg6ImZpbGFtZW50IjthOjA6e319',1780571970),('PNlGqO6FDyKweoeCvDVvSVhkrVIz4u1eRCEDzO4s',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoicXB5ZnppTDd3TDc5ZzhYREsxZUI5ZUl2TFZ6R0FTZnFSOHFCVml6cyI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozMzoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2NoYXRzIjt9czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9jaGF0cyI7czo1OiJyb3V0ZSI7czoyNjoiZmlsYW1lbnQuYWRtaW4ucGFnZXMuY2hhdHMiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1780635226),('T083DbX1t6D6vZUZ6k4cFNn7GxQPcLjFfb6HX91B',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiRG1QSzFtOWtFWWthRG9zNHlBSUJmdWVBNVlQUkhhNWV4ckpYV25MNyI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozMToiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2FkcyI7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjMxOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYWRtaW4vYWRzIjtzOjU6InJvdXRlIjtzOjM0OiJmaWxhbWVudC5hZG1pbi5yZXNvdXJjZXMuYWRzLmluZGV4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1780656314),('tB71OGC5QnVLYx5rjzkPT221rx7162tucqgOOVJf',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','YTo3OntzOjY6Il90b2tlbiI7czo0MDoiOFhyUXd2MDE5UU13UTNhTDJEN0pLbmtzemJubXcyaHMyOEFHMWxhZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9hZHMiO3M6NToicm91dGUiO3M6MzQ6ImZpbGFtZW50LmFkbWluLnJlc291cmNlcy5hZHMuaW5kZXgiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjM6InVybCI7YTowOnt9czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTtzOjE3OiJwYXNzd29yZF9oYXNoX3dlYiI7czo2NDoiM2Y5MWZkNTU4Y2VjM2FkMTI4YjM5MGIwMDE5YzgzODc4Zjc0ZjIzNGNkYmJmZGQ0NDBiNDhhMmRmNWU1YzVlZiI7czo2OiJ0YWJsZXMiO2E6MjA6e3M6NDA6ImJhYzA0ODFiN2M2MzlhNWRkM2ExMjlkZTNjNTljMTYyX2NvbHVtbnMiO2E6NDp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjI6ImlkIjtzOjU6ImxhYmVsIjtzOjI6IklEIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoic3R5bGVfcHJldmlldyI7czo1OiJsYWJlbCI7czo1OiJTdHlsZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NToidGl0bGUiO3M6NToibGFiZWwiO3M6NToiVGl0bGUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjExOiJmaWx0ZXJfdHlwZSI7czo1OiJsYWJlbCI7czo3OiJGaWx0ZXJzIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fX1zOjQwOiJiZTQ4YjExMGY5M2Y0Njk0ZmJhNjFhNzMxMWE3ODUxZF9jb2x1bW5zIjthOjY6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJ1c2VyLm5hbWUiO3M6NToibGFiZWwiO3M6NDoiVXNlciI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NjoiYWN0aW9uIjtzOjU6ImxhYmVsIjtzOjY6IkFjdGlvbiI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTQ6ImF1ZGl0YWJsZV90eXBlIjtzOjU6ImxhYmVsIjtzOjE0OiJBdWRpdGFibGUgdHlwZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTI6ImF1ZGl0YWJsZV9pZCI7czo1OiJsYWJlbCI7czoxMjoiQXVkaXRhYmxlIGlkIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoyOiJpcCI7czo1OiJsYWJlbCI7czoyOiJJcCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjU7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6ImNyZWF0ZWRfYXQiO3M6NToibGFiZWwiO3M6MTA6IkNyZWF0ZWQgYXQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjowO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjoxO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7YjoxO319czo0MDoiYjA5MjQ0NjRiMjc5OGEwYzYzZGU1NTAwZGJlYmYwOThfY29sdW1ucyI7YTozOntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoibmFtZSI7czo1OiJsYWJlbCI7czo0OiJOYW1lIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMToicm9sZXNfY291bnQiO3M6NToibGFiZWwiO3M6NToiUm9sZXMiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fXM6NDA6IjM1MzM2YTgwODc3ODgzNGY4OTQxNzQ3MTEyYzI2NDNlX2NvbHVtbnMiO2E6NTp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6Im5hbWUiO3M6NToibGFiZWwiO3M6NDoiTmFtZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6Imd1YXJkX25hbWUiO3M6NToibGFiZWwiO3M6MTA6Ikd1YXJkIG5hbWUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjE3OiJwZXJtaXNzaW9uc19jb3VudCI7czo1OiJsYWJlbCI7czoxMToiUGVybWlzc2lvbnMiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjExOiJ1c2Vyc19jb3VudCI7czo1OiJsYWJlbCI7czo1OiJVc2VycyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6ImNyZWF0ZWRfYXQiO3M6NToibGFiZWwiO3M6MTA6IkNyZWF0ZWQgYXQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjowO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjoxO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7YjoxO319czo0MDoiNGI2ZmEzZTIxMDVmNTM3YTFlMjBjMDU5OGI2ZWE1NGJfY29sdW1ucyI7YTo0OntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MjoiaWQiO3M6NToibGFiZWwiO3M6MjoiSUQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6Im5hbWUiO3M6NToibGFiZWwiO3M6NDoiTmFtZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NToiZW1haWwiO3M6NToibGFiZWwiO3M6NToiRW1haWwiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjE2OiJpc19hY3RpdmVfdG9nZ2xlIjtzOjU6ImxhYmVsIjtzOjY6IlN0YXR1cyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiZGI3MDJlZjhkYjA3YjNkN2U4Nzc5YzljMjA1MzM3YWVfY29sdW1ucyI7YTo1OntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MjoiaWQiO3M6NToibGFiZWwiO3M6MjoiSUQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6Im5hbWUiO3M6NToibGFiZWwiO3M6NDoiTmFtZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NToiZW1haWwiO3M6NToibGFiZWwiO3M6NToiRW1haWwiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjc6InN1YmplY3QiO3M6NToibGFiZWwiO3M6NzoiU3ViamVjdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NzoibWVzc2FnZSI7czo1OiJsYWJlbCI7czo3OiJNZXNzYWdlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fX1zOjQwOiI1YzUzZWRhYTE5NDZhYzIzZjUyZjE5ODZiYWU5YTM5OF9jb2x1bW5zIjthOjg6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJuYW1lIjtzOjU6ImxhYmVsIjtzOjQ6Ik5hbWUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InByaWNlIjtzOjU6ImxhYmVsIjtzOjU6IlByaWNlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoiY3VycmVuY3lfY29kZSI7czo1OiJsYWJlbCI7czoxMzoiQ3VycmVuY3kgY29kZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTM6ImR1cmF0aW9uX2RheXMiO3M6NToibGFiZWwiO3M6MTM6IkR1cmF0aW9uIGRheXMiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6ImlzX2FjdGl2ZSI7czo1OiJsYWJlbCI7czo5OiJJcyBhY3RpdmUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJzb3J0X29yZGVyIjtzOjU6ImxhYmVsIjtzOjEwOiJTb3J0IG9yZGVyIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoiY3JlYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiQ3JlYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fWk6NzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoidXBkYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiVXBkYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fX1zOjQwOiJmN2VmOGMwMWNiYWViNmEyZGYzM2Q4ZjBiMGI4MTUzN19jb2x1bW5zIjthOjU6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoyOiJpZCI7czo1OiJsYWJlbCI7czoyOiJJRCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTM6InN0eWxlX3ByZXZpZXciO3M6NToibGFiZWwiO3M6NToiU3R5bGUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InRpdGxlIjtzOjU6ImxhYmVsIjtzOjU6IlRpdGxlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMToiZmlsdGVyX3R5cGUiO3M6NToibGFiZWwiO3M6NzoiRmlsdGVycyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InNvcnRfb3JkZXIiO3M6NToibGFiZWwiO3M6ODoiU2VxdWVuY2UiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9fXM6NDA6ImJhNzQ2ZmY1YmRhZDcxMmFiNmFiYjM0MjA0NGZlMDE3X2NvbHVtbnMiO2E6MTE6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoyOiJpZCI7czo1OiJsYWJlbCI7czoyOiJJRCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NToidGl0bGUiO3M6NToibGFiZWwiO3M6NDoiTmFtZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTE6ImRlc2NyaXB0aW9uIjtzOjU6ImxhYmVsIjtzOjExOiJEZXNjcmlwdGlvbiI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6OToidXNlci5uYW1lIjtzOjU6ImxhYmVsIjtzOjQ6IlVzZXIiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InByaWNlIjtzOjU6ImxhYmVsIjtzOjU6IlByaWNlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoiY2F0ZWdvcnkubmFtZSI7czo1OiJsYWJlbCI7czo4OiJDYXRlZ29yeSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjY7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTM6InByaW1hcnlfaW1hZ2UiO3M6NToibGFiZWwiO3M6NToiSW1hZ2UiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo3O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEyOiJvdGhlcl9pbWFnZXMiO3M6NToibGFiZWwiO3M6MTI6Ik90aGVyIEltYWdlcyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjg7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTI6ImFkZHJlc3NfZnVsbCI7czo1OiJsYWJlbCI7czo3OiJBZGRyZXNzIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6OTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMToiaXNfZmVhdHVyZWQiO3M6NToibGFiZWwiO3M6MTU6IkZlYXR1cmVkIG9yIE5vdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjEwO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjY6InN0YXR1cyI7czo1OiJsYWJlbCI7czo2OiJTdGF0dXMiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9fXM6NDA6ImE2NzdhMzhhZjlhOTU2N2VhYzBiMWRjYTJmMjE2NDYyX2NvbHVtbnMiO2E6NTp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjI6ImlkIjtzOjU6ImxhYmVsIjtzOjI6IklEIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJpY29uX3BhdGgiO3M6NToibGFiZWwiO3M6NToiSW1hZ2UiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6Im5hbWUiO3M6NToibGFiZWwiO3M6NDoiTmFtZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTM6ImNhdGVnb3J5X3BhdGgiO3M6NToibGFiZWwiO3M6ODoiQ2F0ZWdvcnkiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6InR5cGUiO3M6NToibGFiZWwiO3M6NDoiVHlwZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiODJiYTcxNDgwMzdlNzljMzk0OGIyMTQzOGY1NzJhYjBfY29sdW1ucyI7YTo4OntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MjoiaWQiO3M6NToibGFiZWwiO3M6MjoiSUQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJpbWFnZV9wYXRoIjtzOjU6ImxhYmVsIjtzOjU6IkltYWdlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJsaW5rX3R5cGUiO3M6NToibGFiZWwiO3M6NDoiVHlwZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjM7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTI6ImRpc3BsYXlfbmFtZSI7czo1OiJsYWJlbCI7czo0OiJOYW1lIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMjoiY291bnRyeV9uYW1lIjtzOjU6ImxhYmVsIjtzOjc6IkNvdW50cnkiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJzdGF0ZV9uYW1lIjtzOjU6ImxhYmVsIjtzOjU6IlN0YXRlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJjaXR5X25hbWUiO3M6NToibGFiZWwiO3M6NDoiQ2l0eSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjc7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTI6ImV4dGVybmFsX3VybCI7czo1OiJsYWJlbCI7czoxNjoiVGhpcmQgUGFydHkgTGluayI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiNDM2ZDhkZGY1NDRlZTQ1YzRiNzM4ZGNmZDIyOTNmMDFfY29sdW1ucyI7YTo4OntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoibmFtZSI7czo1OiJsYWJlbCI7czo0OiJOYW1lIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJjb2RlIjtzOjU6ImxhYmVsIjtzOjQ6IkNvZGUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6ImZsYWdfcGF0aCI7czo1OiJsYWJlbCI7czo5OiJGbGFnIHBhdGgiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjY6ImlzX3J0bCI7czo1OiJsYWJlbCI7czo2OiJJcyBydGwiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo0O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJpc19kZWZhdWx0IjtzOjU6ImxhYmVsIjtzOjEwOiJJcyBkZWZhdWx0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo5OiJpc19hY3RpdmUiO3M6NToibGFiZWwiO3M6OToiSXMgYWN0aXZlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoiY3JlYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiQ3JlYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fWk6NzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoidXBkYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiVXBkYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fX1zOjQwOiIxZTEwOGQ2YzA5MGIxYWRiZDUzNDA5MjJjN2Y5Mjc4N19jb2x1bW5zIjthOjY6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoyOiJpZCI7czo1OiJsYWJlbCI7czoyOiJJRCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoiY29kZSI7czo1OiJsYWJlbCI7czo4OiJJU08gQ29kZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoibmFtZSI7czo1OiJsYWJlbCI7czo0OiJOYW1lIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo2OiJzeW1ib2wiO3M6NToibGFiZWwiO3M6NjoiU3ltYm9sIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxNToic3ltYm9sX3Bvc2l0aW9uIjtzOjU6ImxhYmVsIjtzOjE1OiJTeW1ib2wgUG9zaXRpb24iO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEyOiJjb3VudHJ5Lm5hbWUiO3M6NToibGFiZWwiO3M6NzoiQ291bnRyeSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiOGNiZGEyMzgzYmNjNTA5YzJjODFmZDIzMjUyOTE2YzNfY29sdW1ucyI7YTozOntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MjoiaWQiO3M6NToibGFiZWwiO3M6MjoiSUQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjQ6Im5hbWUiO3M6NToibGFiZWwiO3M6NDoiTmFtZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoiaXNvMiI7czo1OiJsYWJlbCI7czo0OiJGbGFnIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fX1zOjQwOiI0YjRjNzA2OWNiYzA1NjVkYTNmOTY1NzQxMzc4YTkzMl9jb2x1bW5zIjthOjQ6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoyOiJpZCI7czo1OiJsYWJlbCI7czoyOiJJRCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NDoibmFtZSI7czo1OiJsYWJlbCI7czo0OiJOYW1lIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMjoiY291bnRyeS5uYW1lIjtzOjU6ImxhYmVsIjtzOjc6IkNvdW50cnkiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEyOiJjb3VudHJ5LmlzbzIiO3M6NToibGFiZWwiO3M6NDoiRmxhZyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiNjk4ZWZjYmQyMjIzNjYzMzIzNWMxN2ZkYmJlMmQyZGVfY29sdW1ucyI7YTo3OntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MjoiaWQiO3M6NToibGFiZWwiO3M6MjoiSUQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjU6InRpdGxlIjtzOjU6ImxhYmVsIjtzOjU6IlRpdGxlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJzbHVnIjtzOjU6ImxhYmVsIjtzOjQ6IlNsdWciO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTozO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjc6ImV4Y2VycHQiO3M6NToibGFiZWwiO3M6MTE6IkRlc2NyaXB0aW9uIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxNjoiY292ZXJfaW1hZ2VfcGF0aCI7czo1OiJsYWJlbCI7czo1OiJJbWFnZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjU7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6ODoidGFnc19jc3YiO3M6NToibGFiZWwiO3M6NDoiVGFncyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjY7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTA6InVwZGF0ZWRfYXQiO3M6NToibGFiZWwiO3M6NDoiRGF0ZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiY2ExZTZjODFlM2EzMmY0NWI2ZjliOGMwNmQwZjMzZTJfY29sdW1ucyI7YTozOntpOjA7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MjoiaWQiO3M6NToibGFiZWwiO3M6MjoiSUQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToxO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjg6InF1ZXN0aW9uIjtzOjU6ImxhYmVsIjtzOjk6IlF1ZXN0aW9ucyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6NjoiYW5zd2VyIjtzOjU6ImxhYmVsIjtzOjc6IkFuc3dlcnMiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9fXM6NDA6IjRjOGNjMTgwMjQyYTAyYTFiNzEyZjQ5NjcyZmEzYzQxX2NvbHVtbnMiO2E6NTp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjI6ImlkIjtzOjU6ImxhYmVsIjtzOjI6IklEIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJuYW1lIjtzOjU6ImxhYmVsIjtzOjQ6Ik5hbWUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJtaW5fbGVuZ3RoIjtzOjU6ImxhYmVsIjtzOjEwOiJNaW4gTGVuZ3RoIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoibWF4X2xlbmd0aCI7czo1OiJsYWJlbCI7czoxMDoiTWF4IExlbmd0aCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTE6InZhbHVlc19saXN0IjtzOjU6ImxhYmVsIjtzOjY6IlZhbHVlcyI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO319czo0MDoiYzdjNjY4M2M4NTVhYWViZDZmYzJjN2E5Zjc4MGMyMDFfY29sdW1ucyI7YToxMjp7aTowO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjk6InVzZXIubmFtZSI7czo1OiJsYWJlbCI7czo0OiJVc2VyIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMzoiZG9jdW1lbnRfdHlwZSI7czo1OiJsYWJlbCI7czoxMzoiRG9jdW1lbnQgdHlwZSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjI7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTU6ImRvY3VtZW50X251bWJlciI7czo1OiJsYWJlbCI7czoxNToiRG9jdW1lbnQgbnVtYmVyIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxNjoiZnJvbnRfaW1hZ2VfcGF0aCI7czo1OiJsYWJlbCI7czoxNjoiRnJvbnQgaW1hZ2UgcGF0aCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjQ7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTU6ImJhY2tfaW1hZ2VfcGF0aCI7czo1OiJsYWJlbCI7czoxNToiQmFjayBpbWFnZSBwYXRoIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxNzoic2VsZmllX2ltYWdlX3BhdGgiO3M6NToibGFiZWwiO3M6MTc6IlNlbGZpZSBpbWFnZSBwYXRoIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NjthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo2OiJzdGF0dXMiO3M6NToibGFiZWwiO3M6NjoiU3RhdHVzIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxNjoicmVqZWN0aW9uX3JlYXNvbiI7czo1OiJsYWJlbCI7czoxNjoiUmVqZWN0aW9uIHJlYXNvbiI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjg7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTE6InJldmlld2VkX2J5IjtzOjU6ImxhYmVsIjtzOjExOiJSZXZpZXdlZCBieSI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjk7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTE6InJldmlld2VkX2F0IjtzOjU6ImxhYmVsIjtzOjExOiJSZXZpZXdlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjEwO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aToxMTthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czoxMDoidXBkYXRlZF9hdCI7czo1OiJsYWJlbCI7czoxMDoiVXBkYXRlZCBhdCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjA7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjE7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtiOjE7fX1zOjQwOiI2ZmM2NTUwMjFiYzFiNWZkYWY0Y2NlMjY2YzU1NWMxNV9jb2x1bW5zIjthOjg6e2k6MDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo4OiJhZC50aXRsZSI7czo1OiJsYWJlbCI7czoyOiJBZCI7czo4OiJpc0hpZGRlbiI7YjowO3M6OToiaXNUb2dnbGVkIjtiOjE7czoxMjoiaXNUb2dnbGVhYmxlIjtiOjA7czoyNDoiaXNUb2dnbGVkSGlkZGVuQnlEZWZhdWx0IjtOO31pOjE7YTo3OntzOjQ6InR5cGUiO3M6NjoiY29sdW1uIjtzOjQ6Im5hbWUiO3M6MTM6InJldmlld2VyLm5hbWUiO3M6NToibGFiZWwiO3M6ODoiUmV2aWV3ZXIiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aToyO2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEzOiJyZXZpZXdlZS5uYW1lIjtzOjU6ImxhYmVsIjtzOjg6IlJldmlld2VlIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6MzthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo2OiJyYXRpbmciO3M6NToibGFiZWwiO3M6NjoiUmF0aW5nIjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MTtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MDtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO047fWk6NDthOjc6e3M6NDoidHlwZSI7czo2OiJjb2x1bW4iO3M6NDoibmFtZSI7czo0OiJ0eXBlIjtzOjU6ImxhYmVsIjtzOjQ6IlR5cGUiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo1O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjExOiJpc19hcHByb3ZlZCI7czo1OiJsYWJlbCI7czoxMToiSXMgYXBwcm92ZWQiO3M6ODoiaXNIaWRkZW4iO2I6MDtzOjk6ImlzVG9nZ2xlZCI7YjoxO3M6MTI6ImlzVG9nZ2xlYWJsZSI7YjowO3M6MjQ6ImlzVG9nZ2xlZEhpZGRlbkJ5RGVmYXVsdCI7Tjt9aTo2O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJjcmVhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJDcmVhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9aTo3O2E6Nzp7czo0OiJ0eXBlIjtzOjY6ImNvbHVtbiI7czo0OiJuYW1lIjtzOjEwOiJ1cGRhdGVkX2F0IjtzOjU6ImxhYmVsIjtzOjEwOiJVcGRhdGVkIGF0IjtzOjg6ImlzSGlkZGVuIjtiOjA7czo5OiJpc1RvZ2dsZWQiO2I6MDtzOjEyOiJpc1RvZ2dsZWFibGUiO2I6MTtzOjI0OiJpc1RvZ2dsZWRIaWRkZW5CeURlZmF1bHQiO2I6MTt9fX19',1780656592),('Vc1DqCwQqrBzSdol5jqJhFhJbtbjvlALDngGkOi8',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','YTo2OntzOjY6Il90b2tlbiI7czo0MDoib05zRkdyVGh1WG9PSUhXR09oT25zU2xPTHB1YTNzTE5idHRXdjJZMyI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjI6e3M6MzoidXJsIjtzOjI3OiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYWRtaW4iO3M6NToicm91dGUiO3M6MzA6ImZpbGFtZW50LmFkbWluLnBhZ2VzLmRhc2hib2FyZCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjE7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjQ6IjNmOTFmZDU1OGNlYzNhZDEyOGIzOTBiMDAxOWM4Mzg3OGY3NGYyMzRjZGJiZmRkNDQwYjQ4YTJkZjVlNWM1ZWYiO30=',1780577042),('Vcz1mK7XCaOEzRAzt848KOKzRAhhJtIuanFcO7F0',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoiaWRmZzlXSzBPZ1NLUEFUNXdPQllLSUd5NWZqUEo3SXRPOFR5dzNwMiI7czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czozOToiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluL2hvbWUtc2NyZWVuIjt9czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mzk6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9ob21lLXNjcmVlbiI7czo1OiJyb3V0ZSI7czozMjoiZmlsYW1lbnQuYWRtaW4ucGFnZXMuaG9tZS1zY3JlZW4iO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19',1780656317),('XPuTilR3VCWJqrCGfSOWB1Ifgob3tQCgvzlyjTlL',NULL,'127.0.0.1','curl/8.6.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWWRrRjZZajFtd3BRb0xrYXd4cGRJeUNmZ1RFZFQ5WThyQUlrRldqOSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzM6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9sb2dpbiI7czo1OiJyb3V0ZSI7czoyNToiZmlsYW1lbnQuYWRtaW4uYXV0aC5sb2dpbiI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=',1780654742),('zdfTg1CaC7u7x7d81nnv0hjxqQhLhnaPM4zSxB5U',NULL,'127.0.0.1','curl/8.6.0','YTo0OntzOjY6Il90b2tlbiI7czo0MDoieTNLbnNOQjNZUmJaYVhQWHVDS2FMMnVxRklyVHRKemk0RzAzdTVYWCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6Mjc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbiI7czo1OiJyb3V0ZSI7czozMDoiZmlsYW1lbnQuYWRtaW4ucGFnZXMuZGFzaGJvYXJkIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czozOiJ1cmwiO2E6MTp7czo4OiJpbnRlbmRlZCI7czoyNzoiaHR0cDovLzEyNy4wLjAuMTo4MDAwL2FkbWluIjt9fQ==',1780572138);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `group` varchar(64) NOT NULL,
  `key` varchar(128) NOT NULL,
  `value` longtext DEFAULT NULL,
  `type` enum('string','int','bool','json','secret') NOT NULL DEFAULT 'string',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_group_key_unique` (`group`,`key`),
  KEY `settings_group_index` (`group`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'general','app_name','ClassiAds_Hub','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(2,'general','app_tagline','Buy and Sell Anything in Just One Click','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(3,'general','default_language','en','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(4,'general','default_currency','USD','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(5,'general','support_email','support@classiads.test','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(6,'general','maintenance_mode','0','bool','2026-05-25 06:21:01','2026-05-25 06:21:01'),(7,'ads','require_approval','1','bool','2026-05-25 06:21:01','2026-05-25 06:21:01'),(8,'ads','default_expiry_days','30','int','2026-05-25 06:21:01','2026-05-25 06:21:01'),(9,'ads','max_images_per_ad','10','int','2026-05-25 06:21:01','2026-05-25 06:21:01'),(10,'ads','nearby_radius_km','25','int','2026-05-25 06:21:01','2026-05-25 06:21:01'),(11,'media','watermark_enabled','0','bool','2026-05-25 06:21:01','2026-05-25 06:21:01'),(12,'media','watermark_text','ClassiAds_Hub','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(13,'media','storage_disk','local','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(14,'otp','provider','log','string','2026-05-25 06:21:01','2026-05-25 06:21:01'),(15,'otp','code_length','6','int','2026-05-25 06:21:02','2026-05-25 06:21:02'),(16,'otp','expiry_minutes','10','int','2026-05-25 06:21:02','2026-05-25 06:21:02'),(17,'payments','enabled_gateways','[\"stripe\",\"razorpay\",\"bank_transfer\"]','json','2026-05-25 06:21:02','2026-05-25 06:21:02'),(18,'admob','enabled','0','bool','2026-05-25 06:21:02','2026-05-25 06:21:02'),(19,'admob','banner_unit_id','','string','2026-05-25 06:21:02','2026-05-25 06:21:02'),(20,'admob','interstitial_unit_id','','string','2026-05-25 06:21:02','2026-05-25 06:21:02'),(21,'commerce','tax_percent','0','int','2026-05-25 06:21:08','2026-05-25 06:21:08'),(22,'commerce','commission_percent','5','int','2026-05-25 06:21:08','2026-05-25 06:21:08'),(23,'ads','require_subscription','0','bool','2026-05-25 06:21:08','2026-05-25 06:21:08'),(24,'ai','provider','stub','string','2026-05-25 06:21:11','2026-05-25 06:21:11'),(25,'general','frontend_url','http://localhost:3000','string','2026-05-25 06:21:12','2026-05-25 06:21:12');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sliders`
--

DROP TABLE IF EXISTS `sliders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sliders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `link_type` enum('none','ad','category','external') NOT NULL DEFAULT 'none',
  `ad_id` bigint(20) unsigned DEFAULT NULL,
  `category_id` bigint(20) unsigned DEFAULT NULL,
  `external_url` varchar(255) DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sliders_ad_id_foreign` (`ad_id`),
  KEY `sliders_category_id_foreign` (`category_id`),
  KEY `sliders_sort_order_index` (`sort_order`),
  KEY `sliders_is_active_index` (`is_active`),
  CONSTRAINT `sliders_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sliders_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sliders`
--

LOCK TABLES `sliders` WRITE;
/*!40000 ALTER TABLE `sliders` DISABLE KEYS */;
INSERT INTO `sliders` VALUES (1,'sliders/banner-1.jpg','none',NULL,NULL,NULL,'Buy and Sell Anything in Just One Click',1,1,'2026-05-25 06:21:05','2026-05-25 06:21:05'),(2,'sliders/banner-2.jpg','category',NULL,NULL,NULL,'Looking for Your Smartphone?',2,1,'2026-05-25 06:21:05','2026-05-25 06:21:05');
/*!40000 ALTER TABLE `sliders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_accounts`
--

DROP TABLE IF EXISTS `social_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `social_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `provider` varchar(20) NOT NULL,
  `provider_user_id` varchar(191) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_accounts_provider_provider_user_id_unique` (`provider`,`provider_user_id`),
  KEY `social_accounts_user_id_index` (`user_id`),
  CONSTRAINT `social_accounts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_accounts`
--

LOCK TABLES `social_accounts` WRITE;
/*!40000 ALTER TABLE `social_accounts` DISABLE KEYS */;
INSERT INTO `social_accounts` VALUES (1,4,'google','g-6a147aae9744c','https://cdn.example.com/a.png','2026-05-25 11:07:02','2026-05-25 11:07:02'),(2,5,'google','g-6a147aaf611e2','https://cdn.example.com/a.png','2026-05-25 11:07:03','2026-05-25 11:07:03'),(3,6,'google','g-6a147b8293cf9','https://cdn.example.com/a.png','2026-05-25 11:10:34','2026-05-25 11:10:34'),(4,7,'google','g-6a147b830b1f8','https://cdn.example.com/a.png','2026-05-25 11:10:35','2026-05-25 11:10:35'),(5,8,'google','g-6a147b97ec674','https://cdn.example.com/a.png','2026-05-25 11:10:55','2026-05-25 11:10:55'),(6,9,'google','g-6a147b9850242','https://cdn.example.com/a.png','2026-05-25 11:10:56','2026-05-25 11:10:56'),(7,16,'google','g-6a147e07512fb','https://cdn.example.com/a.png','2026-05-25 11:21:19','2026-05-25 11:21:19'),(8,17,'google','g-6a147e07aa7f7','https://cdn.example.com/a.png','2026-05-25 11:21:19','2026-05-25 11:21:19');
/*!40000 ALTER TABLE `social_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `states`
--

DROP TABLE IF EXISTS `states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `states` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `country_id` bigint(20) unsigned NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(16) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `states_country_id_index` (`country_id`),
  KEY `states_is_active_index` (`is_active`),
  CONSTRAINT `states_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `states`
--

LOCK TABLES `states` WRITE;
/*!40000 ALTER TABLE `states` DISABLE KEYS */;
INSERT INTO `states` VALUES (1,1,'Gujarat',NULL,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(2,1,'Maharashtra',NULL,1,'2026-05-25 06:20:52','2026-05-25 06:20:52'),(3,2,'Dubai',NULL,1,'2026-05-25 06:20:53','2026-05-25 06:20:53'),(4,2,'Abu Dhabi',NULL,1,'2026-05-25 06:20:53','2026-05-25 06:20:53'),(5,3,'California',NULL,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(6,3,'New York',NULL,1,'2026-05-25 06:20:54','2026-05-25 06:20:54'),(7,4,'Ontario',NULL,1,'2026-05-25 06:20:54','2026-05-25 06:20:54');
/*!40000 ALTER TABLE `states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `package_id` bigint(20) unsigned NOT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `ad_limit` int(10) unsigned DEFAULT NULL,
  `is_unlimited` tinyint(1) NOT NULL DEFAULT 0,
  `ads_used` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_package_id_foreign` (`package_id`),
  KEY `subscriptions_transaction_id_foreign` (`transaction_id`),
  KEY `subscriptions_user_id_status_index` (`user_id`,`status`),
  KEY `subscriptions_status_index` (`status`),
  CONSTRAINT `subscriptions_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`),
  CONSTRAINT `subscriptions_transaction_id_foreign` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
INSERT INTO `subscriptions` VALUES (1,2,1,1,'active','2026-05-27 03:48:10','2026-06-26 03:48:10',10,0,0,'2026-05-27 03:48:09','2026-05-27 03:48:10');
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `type` enum('subscription','featured_ad') NOT NULL,
  `package_id` bigint(20) unsigned DEFAULT NULL,
  `featured_ad_plan_id` bigint(20) unsigned DEFAULT NULL,
  `ad_id` bigint(20) unsigned DEFAULT NULL,
  `gateway` varchar(50) NOT NULL,
  `gateway_reference` varchar(191) DEFAULT NULL,
  `amount` bigint(20) unsigned NOT NULL,
  `tax_amount` bigint(20) unsigned NOT NULL DEFAULT 0,
  `total` bigint(20) unsigned NOT NULL,
  `currency_code` varchar(8) NOT NULL DEFAULT 'USD',
  `status` enum('pending','processing','completed','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transactions_package_id_foreign` (`package_id`),
  KEY `transactions_featured_ad_plan_id_foreign` (`featured_ad_plan_id`),
  KEY `transactions_ad_id_foreign` (`ad_id`),
  KEY `transactions_user_id_status_index` (`user_id`,`status`),
  KEY `transactions_gateway_reference_index` (`gateway_reference`),
  KEY `transactions_status_index` (`status`),
  CONSTRAINT `transactions_ad_id_foreign` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_featured_ad_plan_id_foreign` FOREIGN KEY (`featured_ad_plan_id`) REFERENCES `featured_ad_plans` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,2,'subscription',1,NULL,NULL,'sandbox','sbx_c3un5qj1klmuugxaa5hq',999,0,999,'USD','completed',NULL,'2026-05-27 03:48:10','2026-05-27 03:48:08','2026-05-27 03:48:10');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `translations`
--

DROP TABLE IF EXISTS `translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `translations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `locale` varchar(8) NOT NULL,
  `group` varchar(60) NOT NULL DEFAULT 'common',
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `translations_locale_key_unique` (`locale`,`key`),
  KEY `translations_locale_index` (`locale`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `translations`
--

LOCK TABLES `translations` WRITE;
/*!40000 ALTER TABLE `translations` DISABLE KEYS */;
INSERT INTO `translations` VALUES (1,'en','common','common.search','Search','2026-05-25 11:09:50','2026-05-25 11:09:50'),(2,'en','common','common.login','Log in','2026-05-25 11:09:50','2026-05-25 11:09:50'),(3,'en','common','common.register','Register','2026-05-25 11:09:50','2026-05-25 11:09:50'),(4,'en','common','common.logout','Log out','2026-05-25 11:09:50','2026-05-25 11:09:50'),(5,'en','common','common.home','Home','2026-05-25 11:09:50','2026-05-25 11:09:50'),(6,'en','common','common.categories','Categories','2026-05-25 11:09:50','2026-05-25 11:09:50'),(7,'en','common','common.favorites','Favorites','2026-05-25 11:09:51','2026-05-25 11:09:51'),(8,'en','common','common.chat','Chat','2026-05-25 11:09:51','2026-05-25 11:09:51'),(9,'en','common','common.profile','Profile','2026-05-25 11:09:51','2026-05-25 11:09:51'),(10,'en','common','common.post_ad','Post Ad','2026-05-25 11:09:51','2026-05-25 11:09:51'),(11,'en','common','common.save','Save','2026-05-25 11:09:51','2026-05-25 11:09:51'),(12,'en','common','common.cancel','Cancel','2026-05-25 11:09:51','2026-05-25 11:09:51'),(13,'en','common','common.delete','Delete','2026-05-25 11:09:51','2026-05-25 11:09:51'),(14,'en','common','common.loading','Loading…','2026-05-25 11:09:51','2026-05-25 11:09:51'),(15,'en','ad','ad.featured','Featured','2026-05-25 11:09:51','2026-05-25 11:09:51'),(16,'en','ad','ad.contact_seller','Contact Seller','2026-05-25 11:09:51','2026-05-25 11:09:51'),(17,'en','ad','ad.make_offer','Make Offer','2026-05-25 11:09:51','2026-05-25 11:09:51'),(18,'en','ad','ad.report','Report','2026-05-25 11:09:51','2026-05-25 11:09:51'),(19,'en','auth','auth.welcome_back','Welcome back','2026-05-25 11:09:51','2026-05-25 11:09:51'),(20,'en','auth','auth.create_account','Create your account','2026-05-25 11:09:51','2026-05-25 11:09:51'),(21,'en','empty','empty.no_results','No results found','2026-05-25 11:09:51','2026-05-25 11:09:51'),(22,'ar','common','common.search','بحث','2026-05-25 11:09:51','2026-05-25 11:09:51'),(23,'ar','common','common.login','تسجيل الدخول','2026-05-25 11:09:52','2026-05-25 11:09:52'),(24,'ar','common','common.register','إنشاء حساب','2026-05-25 11:09:52','2026-05-25 11:09:52'),(25,'ar','common','common.home','الرئيسية','2026-05-25 11:09:52','2026-05-25 11:09:52'),(26,'ar','common','common.categories','الفئات','2026-05-25 11:09:52','2026-05-25 11:09:52'),(27,'ar','common','common.favorites','المفضلة','2026-05-25 11:09:52','2026-05-25 11:09:52'),(28,'ar','common','common.post_ad','أضف إعلان','2026-05-25 11:09:52','2026-05-25 11:09:52'),(29,'ar','ad','ad.contact_seller','تواصل مع البائع','2026-05-25 11:09:52','2026-05-25 11:09:52');
/*!40000 ALTER TABLE `translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_devices`
--

DROP TABLE IF EXISTS `user_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_devices` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `fcm_token` varchar(255) NOT NULL,
  `platform` enum('android','ios','web') NOT NULL,
  `device_name` varchar(191) DEFAULT NULL,
  `last_active_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_devices_user_id_fcm_token_unique` (`user_id`,`fcm_token`),
  KEY `user_devices_fcm_token_index` (`fcm_token`),
  CONSTRAINT `user_devices_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_devices`
--

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_queries`
--

DROP TABLE IF EXISTS `user_queries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_queries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `status` enum('open','replied','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_queries_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_queries`
--

LOCK TABLES `user_queries` WRITE;
/*!40000 ALTER TABLE `user_queries` DISABLE KEYS */;
INSERT INTO `user_queries` VALUES (1,'Subhankar Basak','subhankarbasakmail@gmail.com','tthh','message','open','2026-06-05 01:45:16','2026-06-05 01:45:16'),(2,'test','wrteam.bhumi@gmail.com','65323','ascf','open','2026-06-05 01:45:16','2026-06-05 01:45:16'),(3,'Shyam','kpshyam@rediffmail.com','Test Msg','Test Message','open','2026-06-05 01:45:16','2026-06-05 01:45:16'),(4,'Dan','danperrine5@gmail.com','Mobile money','Can users pay for ads or subscriptions using mobile money? If so, which providers are supported?','open','2026-06-05 01:45:16','2026-06-05 01:45:16');
/*!40000 ALTER TABLE `user_queries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `app_authentication_secret` text DEFAULT NULL,
  `app_authentication_recovery_codes` text DEFAULT NULL,
  `avatar_path` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('active','suspended','banned') NOT NULL DEFAULT 'active',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `auto_approve_advertisement` tinyint(1) NOT NULL DEFAULT 0,
  `preferred_language` varchar(8) DEFAULT NULL,
  `preferred_currency` varchar(8) DEFAULT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`),
  KEY `users_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin','admin@classiads.test','+10000000000','2026-05-25 06:21:02',NULL,'$2y$12$C6itpZXzdoiuqxZsTaHRD.nuPYdW.y1iuaI86w78258mdWTd3Gbi2',NULL,NULL,NULL,NULL,'active',1,0,NULL,NULL,'2026-06-04 04:03:02',NULL,'2026-05-25 06:21:02','2026-06-04 04:03:02',NULL),(2,'Emma Williams','seller@classiads.test','+10000000001','2026-05-25 06:21:03',NULL,'$2y$12$gogRd9iyIdIl2mh3GvX2DumWbXoEQf1N8ZXOzSp4ZoIVpVwS7rgIm',NULL,NULL,NULL,NULL,'active',1,0,NULL,NULL,'2026-05-27 03:49:17',NULL,'2026-05-25 06:21:03','2026-05-27 03:49:17',NULL),(3,'John Buyer','customer@classiads.test','+10000000002','2026-05-25 06:21:04',NULL,'$2y$12$VhnUBvuqhs.b/7XaBjjgtOPjb3jrPqo/0408h5dMqwKmZwC12I1m6',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 22:19:45',NULL,'2026-05-25 06:21:04','2026-05-25 22:19:45',NULL),(4,'Jane Doe','social-new-6a147aae9744b@example.com',NULL,'2026-05-25 11:07:02',NULL,NULL,NULL,NULL,'https://cdn.example.com/a.png',NULL,'active',0,0,NULL,NULL,'2026-05-25 11:07:02',NULL,'2026-05-25 11:07:02','2026-05-25 11:07:02',NULL),(5,'Existing','social-existing-6a147aaf31a3a@example.com',NULL,NULL,NULL,'$2y$04$VhaDJMqHorxP5DGeITGNJOIk0tuKcd2Onv6c9K.vTRAzW6apxCrJG',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 11:07:03',NULL,'2026-05-25 11:07:03','2026-05-25 11:07:03',NULL),(6,'Jane Doe','social-new-6a147b8293cf7@example.com',NULL,'2026-05-25 11:10:34',NULL,NULL,NULL,NULL,'https://cdn.example.com/a.png',NULL,'active',0,0,NULL,NULL,'2026-05-25 11:10:34',NULL,'2026-05-25 11:10:34','2026-05-25 11:10:34',NULL),(7,'Existing','social-existing-6a147b82e3c99@example.com',NULL,NULL,NULL,'$2y$04$lxFXLyvtvgC45PHpy.jzbOFyRYlybEoGNXi0jrZaU4JoNxXOcWPGm',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 11:10:35',NULL,'2026-05-25 11:10:34','2026-05-25 11:10:35',NULL),(8,'Jane Doe','social-new-6a147b97ec672@example.com',NULL,'2026-05-25 11:10:55',NULL,NULL,NULL,NULL,'https://cdn.example.com/a.png',NULL,'active',0,0,NULL,NULL,'2026-05-25 11:10:56',NULL,'2026-05-25 11:10:55','2026-05-25 11:10:56',NULL),(9,'Existing','social-existing-6a147b9837c2c@example.com',NULL,NULL,NULL,'$2y$04$aJpUg0Er5NR.PQCVtkQcbuqzDaYFT7YAnj19UOYqQjN3hFBdlzZHe',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 11:10:56',NULL,'2026-05-25 11:10:56','2026-05-25 11:10:56',NULL),(10,'Flow User','flow-6a147dccb6486@example.com',NULL,NULL,NULL,'$2y$04$Fjxh.GymeWeMk5XviJf7JuSXCA/VRIOXiaahedyCNcOPhAyKjw7mO',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,NULL,NULL,'2026-05-25 11:20:20','2026-05-25 11:20:20',NULL),(11,'Flow','flow-6a147dcd35753@example.com',NULL,NULL,NULL,'$2y$04$PdNdK4oiKNkh9ifJY40QGuhPSmZ3.rhPKHrU7e17i9YStNm7od0q2',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,NULL,NULL,'2026-05-25 11:20:21','2026-05-25 11:20:21',NULL),(12,'Flow','flow-6a147dcd78325@example.com',NULL,NULL,NULL,'$2y$04$lGnR9JYFrI4/vW0pnm7ENuJphrjv3gjRRUJ2heGkXj8b3Of0rWFAW',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 11:20:21',NULL,'2026-05-25 11:20:21','2026-05-25 11:20:21',NULL),(13,'Flow User','flow-6a147e05ba765@example.com',NULL,NULL,NULL,'$2y$04$5yYp08qhFnSG5xIU9skLl.q1BlJ42v3V2ek5m8Me3x3MS4uz3vvy6',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,NULL,NULL,'2026-05-25 11:21:17','2026-05-25 11:21:17',NULL),(14,'Flow','flow-6a147e0649c6d@example.com',NULL,NULL,NULL,'$2y$04$BkzPMG0xLaXg2Yc0Yg7SeesiVM3oLujWPhcjyE/LtYKXMhePO3K2a',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,NULL,NULL,'2026-05-25 11:21:18','2026-05-25 11:21:18',NULL),(15,'Flow','flow-6a147e0671dc2@example.com',NULL,NULL,NULL,'$2y$04$VRJx/zTG2b19ct.BP11NFuldOxDGtcztN7XtTk/cbqGRe61TQ2tp2',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 11:21:18',NULL,'2026-05-25 11:21:18','2026-05-25 11:21:18',NULL),(16,'Jane Doe','social-new-6a147e07512f9@example.com',NULL,'2026-05-25 11:21:19',NULL,NULL,NULL,NULL,'https://cdn.example.com/a.png',NULL,'active',0,0,NULL,NULL,'2026-05-25 11:21:19',NULL,'2026-05-25 11:21:19','2026-05-25 11:21:19',NULL),(17,'Existing','social-existing-6a147e079438a@example.com',NULL,NULL,NULL,'$2y$04$n3UVByOrt9oVO0akcEf6wORHR4LItlYxVuA7HsjgUeCmYiEDt50IK',NULL,NULL,NULL,NULL,'active',0,0,NULL,NULL,'2026-05-25 11:21:19',NULL,'2026-05-25 11:21:19','2026-05-25 11:21:19',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification_fields`
--

DROP TABLE IF EXISTS `verification_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verification_fields` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `field_type` enum('text','number','file','select') NOT NULL DEFAULT 'text',
  `min_length` int(10) unsigned DEFAULT NULL,
  `max_length` int(10) unsigned DEFAULT NULL,
  `values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`values`)),
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `verification_fields_is_active_index` (`is_active`),
  KEY `verification_fields_sort_order_index` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification_fields`
--

LOCK TABLES `verification_fields` WRITE;
/*!40000 ALTER TABLE `verification_fields` DISABLE KEYS */;
INSERT INTO `verification_fields` VALUES (1,'ID Proof (Front)','file',NULL,NULL,NULL,1,1,1,'2026-06-05 00:02:39','2026-06-05 00:02:39'),(2,'ID Proff (Back)','file',NULL,NULL,NULL,0,1,2,'2026-06-05 00:02:39','2026-06-05 00:02:39'),(3,'National ID No','text',5,20,NULL,1,1,3,'2026-06-05 00:02:39','2026-06-05 00:02:39');
/*!40000 ALTER TABLE `verification_fields` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verification_requests`
--

DROP TABLE IF EXISTS `verification_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verification_requests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `document_type` enum('id_card','passport','driving_license','other') NOT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `front_image_path` varchar(255) NOT NULL,
  `back_image_path` varchar(255) DEFAULT NULL,
  `selfie_image_path` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` varchar(255) DEFAULT NULL,
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `verification_requests_reviewed_by_foreign` (`reviewed_by`),
  KEY `verification_requests_user_id_index` (`user_id`),
  KEY `verification_requests_status_index` (`status`),
  CONSTRAINT `verification_requests_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `verification_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification_requests`
--

LOCK TABLES `verification_requests` WRITE;
/*!40000 ALTER TABLE `verification_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `verification_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'classiads'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27  1:44:25
