/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: cloudhost
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0+deb12u2

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
-- Table structure for table `admin_backups`
--

DROP TABLE IF EXISTS `admin_backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_backups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `path` varchar(500) DEFAULT NULL,
  `status` enum('completed','failed','running') DEFAULT 'completed',
  `message` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_backups`
--

LOCK TABLES `admin_backups` WRITE;
/*!40000 ALTER TABLE `admin_backups` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `is_top` tinyint(1) DEFAULT 0,
  `is_important` tinyint(1) DEFAULT 0,
  `views` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES
(1,'欢迎使用 CloudHost 云主机管理平台','<p>欢迎使用CloudHost云主机管理平台！我们提供多种虚拟化解决方案，包括KVM、LXD、Incus等。</p><p>平台特点：</p><ul><li>秒级开通</li><li>灵活计费</li><li>便捷管理</li><li>安全可靠</li></ul>','欢迎使用CloudHost云主机管理平台',1,1,6,'2026-06-06 11:22:52','2026-06-10 07:14:02'),
(2,'关于实名认证','<p>根据相关法规要求，用户需完成实名认证后方可使用部分服务。</p><p>实名认证完全免费，审核通常在1-2个工作日内完成。</p>','提醒用户完成实名认证',0,0,1,'2026-06-06 11:22:52','2026-06-07 03:05:50'),
(3,'新增支付方式','<p>平台已支持支付宝、微信支付、QQ钱包等多种支付方式，充值更加便捷。</p>','新增多种支付方式',0,0,3,'2026-06-06 11:22:52','2026-06-08 01:17:15'),
(4,'使用说明书','如何使用我们的产品',NULL,0,0,1,'2026-06-07 07:14:33','2026-06-08 01:36:02');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_requests`
--

DROP TABLE IF EXISTS `auth_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `real_name` varchar(50) DEFAULT NULL,
  `id_card` varchar(18) DEFAULT NULL,
  `id_card_front` varchar(255) DEFAULT NULL,
  `id_card_back` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reject_reason` varchar(255) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `type` varchar(30) DEFAULT NULL,
  `token` text DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_requests`
--

LOCK TABLES `auth_requests` WRITE;
/*!40000 ALTER TABLE `auth_requests` DISABLE KEYS */;
INSERT INTO `auth_requests` VALUES
(1,1,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,'2026-06-07 05:28:44','2026-06-07 05:28:44','password_reset','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc4MDgxMDEyNCwiZXhwIjoxNzgwODEzNzI0fQ.eR9yVTNBEza3UJffj53xeLENcUcTRaiP97xgQmfUdDE','2026-06-07 06:28:44'),
(2,1,NULL,NULL,NULL,NULL,'pending',NULL,NULL,NULL,'2026-06-08 01:22:15','2026-06-08 01:22:15','password_reset','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc4MDg4MTczNSwiZXhwIjoxNzgwODg1MzM1fQ.N8zlhN24TEI-ZXRcV9UNuhC8vxdj0irgqWL7hckYS3Y','2026-06-08 02:22:15');
/*!40000 ALTER TABLE `auth_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `balance_logs`
--

DROP TABLE IF EXISTS `balance_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `balance_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('recharge','consume','refund','adjust') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) DEFAULT NULL,
  `balance_after` decimal(10,2) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `related_id` int(11) DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `balance_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `balance_logs`
--

LOCK TABLES `balance_logs` WRITE;
/*!40000 ALTER TABLE `balance_logs` DISABLE KEYS */;
INSERT INTO `balance_logs` VALUES
(1,1,'consume',0.00,1000.00,1000.00,'续费服务 VM-111',2,'service','2026-06-07 01:57:06','2026-06-07 01:57:06'),
(2,1,'consume',0.00,1000.00,1000.00,'续费服务 VM-111',2,'service','2026-06-07 01:57:19','2026-06-07 01:57:19'),
(3,1,'consume',0.00,1000.00,1000.00,'续费服务 VM-111',2,'service','2026-06-07 02:04:01','2026-06-07 02:04:01'),
(4,1,'recharge',10.00,1000.00,1010.00,'代金券兑换: V58D5C38B95064F3E',1,'voucher','2026-06-07 03:55:24','2026-06-07 03:55:24'),
(5,1,'consume',-10.00,1010.00,1000.00,'订单支付: ORD1780805168550B57F4080',3,'order','2026-06-07 04:06:33','2026-06-07 04:06:33'),
(6,1,'consume',-20.00,1000.00,980.00,'订单支付: ORD1780805665223F2417E1C',4,'order','2026-06-07 04:14:37','2026-06-07 04:14:37'),
(7,1,'consume',-10.00,980.00,970.00,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 04:15:15','2026-06-07 04:15:15'),
(8,1,'consume',-10.00,970.00,960.00,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 04:15:26','2026-06-07 04:15:26'),
(9,1,'consume',-10.00,960.00,950.00,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 04:15:37','2026-06-07 04:15:37'),
(10,1,'consume',-10.00,950.00,940.00,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 04:15:50','2026-06-07 04:15:50'),
(11,1,'consume',-10.00,940.00,930.00,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 06:31:32','2026-06-07 06:31:32'),
(12,1,'consume',-28.50,930.00,901.50,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 06:31:51','2026-06-07 06:31:51'),
(13,1,'consume',-10.00,901.50,891.50,'续费服务 VPS-ORD1780805168550B57F4080',8,'service','2026-06-07 06:34:34','2026-06-07 06:34:34'),
(14,3,'adjust',100.00,0.00,100.00,'管理员调整',NULL,NULL,'2026-06-07 06:55:40','2026-06-07 06:55:40'),
(15,3,'consume',-9.90,100.00,90.10,'续费服务 vps99',11,'service','2026-06-07 09:02:52','2026-06-07 09:02:52'),
(16,1,'consume',-1.00,891.50,890.50,'订单支付: ORD1780826149507AACE1260',12,'order','2026-06-07 09:56:30','2026-06-07 09:56:30'),
(17,1,'consume',-1.00,890.50,889.50,'续费服务 VPS-ORD1780826149507AACE1260',16,'service','2026-06-07 09:57:33','2026-06-07 09:57:33'),
(18,3,'consume',-20.00,90.10,70.10,'续费服务 vps201',17,'service','2026-06-07 11:52:08','2026-06-07 11:52:08'),
(19,4,'recharge',100.00,0.00,100.00,'代金券兑换: VD4651AEDD49F416A',11,'voucher','2026-06-08 02:13:07','2026-06-08 02:13:07'),
(20,4,'consume',-1.00,100.00,99.00,'订单支付: ORD1780882238051DD3D5A90',20,'order','2026-06-08 02:13:21','2026-06-08 02:13:21'),
(21,4,'consume',-1.00,99.00,98.00,'续费服务 VPS-ORD1780882238051DD3D5A90',19,'service','2026-06-08 02:14:38','2026-06-08 02:14:38'),
(22,5,'recharge',10.00,0.00,10.00,'代金券兑换: VD37EDF8EF8F248DC',12,'voucher','2026-06-08 07:13:38','2026-06-08 07:13:38'),
(23,5,'consume',-1.00,10.00,9.00,'订单支付: ORD1780902786485C17E2993',21,'order','2026-06-08 07:13:49','2026-06-08 07:13:49'),
(24,1,'recharge',100.00,889.50,989.50,'代金券兑换: V83C1E8F1B64848B7',10,'voucher','2026-06-10 07:16:44','2026-06-10 07:16:44'),
(25,1,'recharge',100.00,989.50,1089.50,'代金券兑换: V81D0C1D184A545B3',9,'voucher','2026-06-10 07:17:10','2026-06-10 07:17:10'),
(26,4,'adjust',0.00,98.00,98.00,'管理员调整',NULL,NULL,'2026-06-10 07:20:12','2026-06-10 07:20:12'),
(27,4,'adjust',-5.00,98.00,93.00,'管理员调整',NULL,NULL,'2026-06-10 07:20:25','2026-06-10 07:20:25'),
(28,4,'adjust',0.00,93.00,93.00,'管理员调整',NULL,NULL,'2026-06-10 07:21:10','2026-06-10 07:21:10'),
(29,4,'adjust',0.00,93.00,93.00,'管理员调整',NULL,NULL,'2026-06-10 07:21:27','2026-06-10 07:21:27'),
(30,1,'consume',-1.00,1089.50,1088.50,'订单支付: ORD1781104725288BFAA10F9',24,'order','2026-06-10 15:18:51','2026-06-10 15:18:51'),
(31,1,'consume',-10.00,1088.50,1078.50,'订单支付: ORD17811404849185FC4D2DA',25,'order','2026-06-11 01:15:23','2026-06-11 01:15:23'),
(32,4,'adjust',0.00,93.00,93.01,'管理员调整',NULL,NULL,'2026-06-11 01:24:00','2026-06-11 01:24:00'),
(33,1,'consume',-1.00,1078.50,1077.50,'订单支付: ORD1781158336239B80DBDFE',26,'order','2026-06-11 06:12:22','2026-06-11 06:12:22');
/*!40000 ALTER TABLE `balance_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configs`
--

DROP TABLE IF EXISTS `configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `type` enum('string','number','boolean','json') DEFAULT 'string',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configs`
--

LOCK TABLES `configs` WRITE;
/*!40000 ALTER TABLE `configs` DISABLE KEYS */;
INSERT INTO `configs` VALUES
(1,'site_name','CloudHost','string','2026-06-06 11:26:41','2026-06-06 11:26:41'),
(2,'site_title','云主机管理平台','string','2026-06-06 11:26:41','2026-06-06 11:26:41'),
(3,'site_description','','string','2026-06-06 11:26:41','2026-06-06 11:26:41'),
(4,'site_keywords','','string','2026-06-06 11:26:41','2026-06-06 11:26:41'),
(5,'site_logo','','string','2026-06-06 11:26:41','2026-06-06 11:26:41'),
(6,'site_url','https://pveusa.ypvps.com','string','2026-06-06 11:26:41','2026-06-06 11:26:41'),
(7,'smtp_host','smtp.qq.com','string','2026-06-06 11:27:39','2026-06-06 11:27:39'),
(8,'smtp_port','465','string','2026-06-06 11:27:39','2026-06-06 11:27:39'),
(9,'smtp_user','qdmz@vip.qq.com','string','2026-06-06 11:27:39','2026-06-06 11:27:39'),
(10,'smtp_pass','lrjwkwcawgambibb','string','2026-06-06 11:27:39','2026-06-06 11:46:59'),
(11,'smtp_from','qdmz@vip.qq.com','string','2026-06-06 11:27:39','2026-06-06 11:27:39'),
(12,'smtp_secure','true','string','2026-06-06 11:27:39','2026-06-06 11:27:39'),
(13,'epay_url','https://pay.wanjuanxueyi.com/submit.php','string','2026-06-06 11:31:21','2026-06-06 11:31:21'),
(14,'epay_pid','2093','string','2026-06-06 11:31:21','2026-06-06 11:31:21'),
(15,'epay_key','7o6IxRTgt67ntX9nIZRx2koiPX9X2ix2','string','2026-06-06 11:31:21','2026-06-06 11:31:21'),
(16,'epay_sign_type','MD5','string','2026-06-06 11:31:21','2026-06-06 11:31:21'),
(17,'epay_private_key','','string','2026-06-06 11:31:21','2026-06-06 11:31:21'),
(18,'epay_public_key','','string','2026-06-06 11:31:21','2026-06-06 11:31:21'),
(19,'auth_enabled','true','string','2026-06-06 11:44:52','2026-06-06 11:44:52'),
(20,'auth_api','https://api.byxy.vip/v2/idcard/','string','2026-06-06 11:44:52','2026-06-06 11:44:52'),
(21,'auth_key','7o6IxRTgt67ntX9nIZRx2koiPX9X2ix2','string','2026-06-06 11:44:52','2026-06-06 11:44:52');
/*!40000 ALTER TABLE `configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `domain_bindings`
--

DROP TABLE IF EXISTS `domain_bindings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `domain_bindings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `protocol` enum('http','https','tcp','udp') DEFAULT 'http',
  `external_port` int(11) NOT NULL,
  `internal_ip` varchar(50) DEFAULT NULL,
  `internal_port` int(11) NOT NULL,
  `status` enum('active','inactive','pending') DEFAULT 'pending',
  `ssl_enabled` tinyint(1) DEFAULT 0,
  `ssl_cert` text DEFAULT NULL,
  `ssl_key` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `domain_bindings_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `domain_bindings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domain_bindings`
--

LOCK TABLES `domain_bindings` WRITE;
/*!40000 ALTER TABLE `domain_bindings` DISABLE KEYS */;
/*!40000 ALTER TABLE `domain_bindings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `os` varchar(50) NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `arch` varchar(20) DEFAULT 'amd64',
  `template` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `images_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
INSERT INTO `images` VALUES
(1,1,'debian-12-standard_12.12-1_amd64.tar.zst','Debian','12standard12.121amd64.tar.zst','amd64','local:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst','active','2026-06-07 01:55:03','2026-06-07 01:55:03'),
(2,1,'debian-14-64_cloud_c5c08d1c.tar.xz','Debian','1464cloudc5c08d1c.tar.xz','amd64','local:vztmpl/debian-14-64_cloud_c5c08d1c.tar.xz','active','2026-06-07 01:55:03','2026-06-07 01:55:03'),
(3,1,'debian_11_bullseye_x86_64_default.tar.xz','Debian','11bullseyex8664default.tar.xz','amd64','local:vztmpl/debian_11_bullseye_x86_64_default.tar.xz','active','2026-06-07 01:55:03','2026-06-07 01:55:03'),
(4,1,'debian_12_bookworm_x86_64_default.tar.xz','Debian','12bookwormx8664default.tar.xz','amd64','local:vztmpl/debian_12_bookworm_x86_64_default.tar.xz','active','2026-06-07 01:55:03','2026-06-07 01:55:03');
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nodes`
--

DROP TABLE IF EXISTS `nodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `nodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('pve','incus','lxd','kvm') NOT NULL,
  `host` varchar(255) NOT NULL,
  `api_user` varchar(100) DEFAULT NULL,
  `api_token` varchar(255) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `server_ip` varchar(255) DEFAULT NULL COMMENT '服务器IP地址',
  `virtualization_types` text DEFAULT NULL COMMENT '可用的虚拟化类型 (vm,ct)',
  `nat_bridge` varchar(50) DEFAULT NULL,
  `ipv6_bridge` varchar(50) DEFAULT NULL,
  `nat_subnet` varchar(50) DEFAULT NULL,
  `ipv6_subnet` varchar(100) DEFAULT NULL,
  `status` enum('online','offline') DEFAULT 'online',
  `cpu_usage` int(11) DEFAULT 0,
  `memory_usage` int(11) DEFAULT 0,
  `memory_total` int(11) DEFAULT 0,
  `note` text DEFAULT NULL,
  `ssh_enabled` tinyint(1) DEFAULT 0,
  `ssh_host` varchar(255) DEFAULT NULL,
  `ssh_port` int(11) DEFAULT 22,
  `ssh_username` varchar(100) DEFAULT 'root',
  `ssh_password` varchar(255) DEFAULT NULL,
  `ssh_key` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `port_range_start` int(11) DEFAULT NULL,
  `port_range_end` int(11) DEFAULT NULL,
  `max_ports_per_vm` int(11) DEFAULT 5,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nodes`
--

LOCK TABLES `nodes` WRITE;
/*!40000 ALTER TABLE `nodes` DISABLE KEYS */;
INSERT INTO `nodes` VALUES
(1,'pve','pve','https://pve.ypvps.com:8006','root@pam!pve','thanks123A#','洛杉矶',NULL,NULL,'vmbr1','vmbr2','172.16.1.0/24','2001:470:1f06:15d:100::/64','online',0,0,0,NULL,1,'pve.ypvps.com',22,'root','thanks123',NULL,'2026-06-06 11:22:52','2026-06-08 07:29:44',30001,31000,5);
/*!40000 ALTER TABLE `nodes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_no` varchar(32) NOT NULL,
  `type` varchar(20) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `node_id` int(11) NOT NULL,
  `cycle` enum('monthly','quarterly','yearly') NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','completed','cancelled','refunded') DEFAULT 'pending',
  `payment_method` varchar(20) DEFAULT NULL,
  `expire_time2` datetime DEFAULT NULL,
  `related_service_id` int(11) DEFAULT NULL,
  `expire_time` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_no` (`order_no`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  KEY `plan_id` (`plan_id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `orders_ibfk_4` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(26,1,'ORD1781158336239B80DBDFE',NULL,4,9,1,'monthly',1,1.00,'paid','balance',NULL,NULL,NULL,'2026-06-11 06:12:22','2026-06-11 06:12:16','2026-06-11 06:12:22');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `cpu` int(11) NOT NULL,
  `memory` int(11) NOT NULL,
  `disk` int(11) NOT NULL,
  `bandwidth` int(11) DEFAULT NULL,
  `traffic_limit` int(11) DEFAULT NULL,
  `price_monthly` decimal(10,2) NOT NULL,
  `price_quarterly` decimal(10,2) DEFAULT NULL,
  `price_yearly` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `traffic` decimal(10,2) DEFAULT NULL COMMENT '流量限制(GB)',
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `plans_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES
(1,1,'入门型',1,1024,20,10,1000,20.00,55.00,199.00,'2026-06-06 11:22:52','2026-06-06 11:22:52',NULL),
(2,1,'标准型',2,2048,40,20,2000,45.00,120.00,399.00,'2026-06-06 11:22:52','2026-06-06 11:22:52',NULL),
(3,1,'高级型',4,4096,80,50,5000,89.00,240.00,799.00,'2026-06-06 11:22:52','2026-06-06 11:22:52',NULL),
(4,2,'轻量型',1,512,10,5,500,10.00,27.00,99.00,'2026-06-06 11:22:52','2026-06-06 11:22:52',NULL),
(5,2,'专业型',2,2048,30,10,1000,30.00,80.00,299.00,'2026-06-06 11:22:52','2026-06-06 11:22:52',NULL),
(6,3,'1',1,512,5,100,NULL,1.00,3.00,10.00,'2026-06-07 06:11:34','2026-06-07 06:11:34',NULL),
(7,3,'2',2,1024,5,100,NULL,2.00,6.00,20.00,'2026-06-07 06:12:33','2026-06-07 06:12:33',NULL),
(8,3,'4',4,4096,8,100,NULL,5.00,15.00,50.00,'2026-06-07 06:13:49','2026-06-07 06:13:49',NULL),
(9,4,'usa1',1,512,5,100,NULL,1.00,3.00,10.00,'2026-06-07 12:52:40','2026-06-07 12:52:40',NULL),
(10,5,'aaa',1,1024,5,100,NULL,2.00,5.00,20.00,'2026-06-08 05:57:09','2026-06-08 05:57:09',NULL),
(11,6,'666',1,1024,5,100,NULL,10.00,27.00,100.00,'2026-06-08 06:06:24','2026-06-08 06:06:24',NULL),
(12,7,'8',1,1024,20,100,NULL,10.00,27.00,100.00,'2026-06-11 01:27:54','2026-06-11 01:27:54',NULL);
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `port_forwards`
--

DROP TABLE IF EXISTS `port_forwards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `port_forwards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `service_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `protocol` enum('tcp','udp') DEFAULT 'tcp',
  `external_port` int(11) NOT NULL,
  `internal_ip` varchar(50) DEFAULT NULL,
  `internal_port` int(11) NOT NULL,
  `status` enum('active','inactive','pending') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `fwd_type` varchar(20) DEFAULT 'custom',
  `port_range_end` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `port_forwards_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `port_forwards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `port_forwards`
--

LOCK TABLES `port_forwards` WRITE;
/*!40000 ALTER TABLE `port_forwards` DISABLE KEYS */;
INSERT INTO `port_forwards` VALUES
(95,32,6,'tcp',30081,'',22,'active',NULL,'2026-06-10 12:27:47','2026-06-10 12:27:47','ssh',NULL),
(96,32,6,'tcp',30082,'',80,'active',NULL,'2026-06-10 12:27:47','2026-06-10 12:27:47','http',NULL),
(97,32,6,'tcp',30083,'',443,'active',NULL,'2026-06-10 12:27:47','2026-06-10 12:27:47','https',NULL),
(98,32,6,'tcp',30084,'',5900,'active',NULL,'2026-06-10 12:27:47','2026-06-10 12:27:47','vnc',NULL),
(99,32,6,'tcp',30085,'',30085,'active',NULL,'2026-06-10 12:27:47','2026-06-10 12:27:47','custom',NULL);
/*!40000 ALTER TABLE `port_forwards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('kvm','lxc','lxd','incus') NOT NULL,
  `description` text DEFAULT NULL,
  `features` text DEFAULT NULL,
  `cpu_range` varchar(20) DEFAULT NULL,
  `memory_range` varchar(20) DEFAULT NULL,
  `disk_range` varchar(20) DEFAULT NULL,
  `min_price` decimal(10,2) DEFAULT NULL,
  `max_price` decimal(10,2) DEFAULT NULL,
  `status` enum('online','offline') DEFAULT 'online',
  `sort` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `node_id` int(10) unsigned DEFAULT NULL,
  `default_type` enum('kvm','lxc','lxd','incus') DEFAULT 'kvm',
  `default_os` varchar(50) DEFAULT NULL,
  `custom_ports` text DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(1,'KVM云主机','kvm','KVM完全虚拟化，性能强劲，支持Windows和Linux全系列系统','完全虚拟化\n性能强劲\n支持Windows\n支持Linux\n独立IP\nIPv6支持\nDDoS防护','1-16','512-32768','10-500',20.00,500.00,'online',1,'2026-06-06 11:22:52','2026-06-07 12:49:36',NULL,'kvm',NULL,NULL,0),
(2,'LXD容器','lxc','LXD容器化技术，轻量高效，适合开发测试环境','容器化技术\n轻量高效\n秒级启动\n低资源占用\n适合开发测试\n支持快照','1-8','256-16384','5-200',10.00,200.00,'online',2,'2026-06-06 11:22:52','2026-06-07 12:49:47',NULL,'kvm',NULL,NULL,0),
(3,'测试产品','lxc','这是一个测试产品','测试测试','1-8','512-16384','1-50',NULL,NULL,'online',0,'2026-06-07 06:10:22','2026-06-10 15:04:30',NULL,'kvm',NULL,NULL,0),
(4,'USA','lxc','nat4+ipv6','4+6','1-8','512-16384','10-500',NULL,NULL,'online',0,'2026-06-07 12:51:23','2026-06-08 05:55:39',NULL,'kvm',NULL,NULL,0),
(5,'aaaaaa','lxc','aaaaaaaaaaaaaaaaa','aaaaaaaaaaaaaaaaa\nbbbbbbbbbbbbbb\ncccccccccccccccc\ndddddddddddddd\neeeeeeeeeeeeeeeeee','1-8','512-16384','10-500',NULL,NULL,'online',0,'2026-06-08 05:56:19','2026-06-08 06:05:15',NULL,'kvm',NULL,NULL,0),
(6,'6666666666','lxc','66666666666666','66666666666666666666666666','1-8','512-16384','10-500',NULL,NULL,'online',0,'2026-06-08 06:06:01','2026-06-11 06:15:29',NULL,'kvm',NULL,NULL,0),
(7,'333','kvm','33333','3333333333','1-8','512-16384','10-500',NULL,NULL,'online',0,'2026-06-10 07:23:51','2026-06-10 07:24:05',NULL,'kvm',NULL,NULL,0);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recharges`
--

DROP TABLE IF EXISTS `recharges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `recharges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(20) DEFAULT NULL,
  `trade_no` varchar(64) DEFAULT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `recharges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recharges`
--

LOCK TABLES `recharges` WRITE;
/*!40000 ALTER TABLE `recharges` DISABLE KEYS */;
INSERT INTO `recharges` VALUES
(1,1,1.00,'wechat','RCH17807465334013E3D5C08','pending','2026-06-06 11:48:53','2026-06-06 11:48:53'),
(2,1,1.00,'qqpay','RCH1780746543012DB6F0920','pending','2026-06-06 11:49:03','2026-06-06 11:49:03'),
(3,1,1.00,'alipay','RCH178079569873161C8AC5D','pending','2026-06-07 01:28:18','2026-06-07 01:28:18'),
(4,1,1.00,'wechat','RCH17807957093240BB4BF2C','pending','2026-06-07 01:28:29','2026-06-07 01:28:29'),
(5,1,1.00,'qqpay','RCH17807957159919C6AFE15','pending','2026-06-07 01:28:35','2026-06-07 01:28:35'),
(6,3,100.00,'wechat','RCH178081551861654B0A650','pending','2026-06-07 06:58:38','2026-06-07 06:58:38'),
(7,3,100.00,'qqpay','RCH1780815532397962D904D','pending','2026-06-07 06:58:52','2026-06-07 06:58:52'),
(8,3,100.00,'alipay','RCH1780815541888396CA730','pending','2026-06-07 06:59:01','2026-06-07 06:59:01'),
(9,4,1.00,'wechat','RCH1780882214097E28F6F0B','pending','2026-06-08 01:30:14','2026-06-08 01:30:14'),
(10,4,1.00,'alipay','RCH1780882220433DC1A3E13','pending','2026-06-08 01:30:20','2026-06-08 01:30:20'),
(11,4,1.00,'qqpay','RCH178088222545034A076DD','pending','2026-06-08 01:30:25','2026-06-08 01:30:25'),
(12,1,10.00,'alipay','RCH17810754966491B16718E','pending','2026-06-10 07:11:36','2026-06-10 07:11:36'),
(13,1,10.00,'wechat','RCH1781075502628EEF63E00','pending','2026-06-10 07:11:42','2026-06-10 07:11:42'),
(14,1,10.00,'qqpay','RCH17810755068570C812F1F','pending','2026-06-10 07:11:46','2026-06-10 07:11:46');
/*!40000 ALTER TABLE `recharges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `node_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('kvm','lxc','lxd','incus') NOT NULL,
  `status` enum('pending','running','stopped','suspended') DEFAULT 'pending',
  `cpu` int(11) DEFAULT 1,
  `memory` int(11) DEFAULT 1024,
  `disk` int(11) DEFAULT 20,
  `bandwidth` int(11) DEFAULT NULL,
  `traffic_limit` int(11) DEFAULT NULL,
  `ipv4` varchar(50) DEFAULT NULL,
  `ssh_port` int(11) DEFAULT NULL,
  `vnc_port` int(11) DEFAULT NULL,
  `ipv6` varchar(100) DEFAULT NULL,
  `mac` varchar(50) DEFAULT NULL,
  `vmid` varchar(50) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT 0.00,
  `expire_time` datetime NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `custom_ports` text DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT 0,
  `network_usage` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `services_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES
(31,6,1,1,1,'KVM-1','kvm','running',1,1024,20,10,NULL,NULL,NULL,NULL,NULL,NULL,'102',NULL,NULL,20.00,'2026-07-10 10:41:12',NULL,'2026-06-10 10:41:14','2026-06-10 10:41:14',NULL,0,0.00),
(32,6,1,1,1,'VPS-103','lxc','running',1,1024,20,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'103',NULL,NULL,20.00,'2026-07-10 12:27:47',NULL,'2026-06-10 12:27:47','2026-06-10 12:27:47',NULL,0,0.00),
(35,1,1,4,9,'USA-1','lxc','running',1,512,5,100,NULL,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,1.00,'2026-07-11 06:12:22',NULL,'2026-06-11 06:12:22','2026-06-11 06:12:22',NULL,0,0.00);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `attachments` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ticket_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
INSERT INTO `ticket_messages` VALUES
(1,1,1,'火锅相关法律宝宝与',0,NULL,'2026-06-06 11:50:29','2026-06-06 11:50:29'),
(2,1,1,'局VB那你',0,NULL,'2026-06-06 11:50:42','2026-06-06 11:50:42'),
(3,1,1,'几句话就',0,NULL,'2026-06-06 11:50:50','2026-06-06 11:50:50'),
(4,1,1,'kvvvbnnn',1,NULL,'2026-06-06 11:54:07','2026-06-06 11:54:07'),
(5,1,1,'jhvhjk',1,NULL,'2026-06-06 11:54:21','2026-06-06 11:54:21'),
(6,2,1,'nbvbbcbnn',0,NULL,'2026-06-07 01:26:59','2026-06-07 01:26:59'),
(7,2,1,'hgfgjj',0,NULL,'2026-06-07 01:27:13','2026-06-07 01:27:13'),
(8,2,1,'hgfhjjjh',1,NULL,'2026-06-07 01:31:23','2026-06-07 01:31:23'),
(9,2,1,'聚餐给你了吗兄弟',0,NULL,'2026-06-07 03:54:15','2026-06-07 03:54:15'),
(10,2,1,'好好好',1,NULL,'2026-06-07 03:56:01','2026-06-07 03:56:01'),
(11,3,3,'会发光哈哈哈看过',0,NULL,'2026-06-07 06:57:30','2026-06-07 06:57:30'),
(12,3,3,'凤凰火',0,NULL,'2026-06-07 06:58:05','2026-06-07 06:58:05'),
(13,3,1,'花费多少时间间隔',1,NULL,'2026-06-07 07:13:07','2026-06-07 07:13:07'),
(14,3,1,'就很尴尬',1,NULL,'2026-06-07 07:13:24','2026-06-07 07:13:24'),
(15,2,1,'👌👌不犯法个',1,NULL,'2026-06-07 07:13:39','2026-06-07 07:13:39'),
(16,4,4,'fdgfdgfd',0,NULL,'2026-06-08 01:26:01','2026-06-08 01:26:01'),
(17,4,4,'fdgfdgf g',0,NULL,'2026-06-08 01:26:07','2026-06-08 01:26:07'),
(18,4,1,'dsfds ',1,NULL,'2026-06-08 04:19:11','2026-06-08 04:19:11'),
(19,2,1,'klljkl',1,NULL,'2026-06-10 07:26:57','2026-06-10 07:26:57');
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `category` enum('pre_sales','after_sales','technical','billing','suggestion','other') NOT NULL,
  `title` varchar(200) NOT NULL,
  `status` enum('open','pending','answered','closed') DEFAULT 'open',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES
(1,1,'technical','就尽管吩咐哈哈','closed','normal','2026-06-06 11:50:29','2026-06-06 11:54:24'),
(2,1,'billing','khbbnnn','closed','normal','2026-06-07 01:26:59','2026-06-10 07:27:02'),
(3,3,'billing','客户广告效果','answered','normal','2026-06-07 06:57:30','2026-06-07 07:13:07'),
(4,4,'pre_sales','fdgdgfd','answered','normal','2026-06-08 01:26:01','2026-06-08 04:19:11');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `qq` varchar(20) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `balance` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','disabled') DEFAULT 'active',
  `email_verified` tinyint(1) DEFAULT 0,
  `idcard_verified` tinyint(1) DEFAULT 0 COMMENT '身份证验证状态',
  `identity_verified` tinyint(1) DEFAULT 0,
  `real_name` varchar(50) DEFAULT NULL,
  `id_card` varchar(18) DEFAULT NULL,
  `auth_status` enum('none','pending','approved','rejected') DEFAULT 'none',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `phone_verified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','admin@ypvps.com','$2a$10$7vOLyhozJ5W8Y9kfQpwe6u8dDxGUEXE22FUOuz9Qt1e/d6G6mb4tK',NULL,'12345675','admin',1077.50,'active',1,0,1,NULL,NULL,'none','2026-06-06 11:22:52','2026-06-11 06:13:42',0),
(2,'testuser','qdmz@vip.qq.com','$2a$10$3uKD9t.j8K.TyRR3gr7K3uumM.2BZo6dPDuY94RU0K5Us6DXJ5N96',NULL,NULL,'admin',100.00,'active',1,0,0,NULL,NULL,'none','2026-06-06 11:22:52','2026-06-07 01:22:59',0),
(3,'qdmz','qdmzhost@qq.com','$2a$10$7rQJowsEPjt0qJdpxwkVJOU9RBA1MNCFVJ9U2MiXfOmwvqfh60h/m',NULL,NULL,'user',70.10,'active',0,0,0,NULL,NULL,'none','2026-06-07 05:11:09','2026-06-07 11:52:08',0),
(4,'root','root@guiz.edu.com','$2a$10$QdrmM7u919xo.mEt9yH7H.mE/7SS7/2rBGrGgLp4V6MutFPcnXrbq',NULL,NULL,'user',93.01,'active',0,0,0,NULL,NULL,'none','2026-06-08 01:25:30','2026-06-11 01:24:00',0),
(5,'1234560','1234560@qq.com','$2a$10$gpYPV9B4i8eqkr/0d6xaduVGwXXxHoTkssNJCBy3lquIf5oKizOsm',NULL,NULL,'user',9.00,'active',0,0,0,NULL,NULL,'none','2026-06-08 01:40:46','2026-06-10 07:18:49',0),
(6,'testuser_api_1781081681','test_api_1781081681@test.com','$2a$10$UwpatJHL.KdTY13ktPcAAe7678Cyy17raBUDbYyNPQj4Sb7lEAUmO',NULL,NULL,'user',100.00,'active',0,0,0,NULL,NULL,'none','2026-06-10 16:54:43','2026-06-10 16:54:43',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `used_by` int(11) DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `expire_time` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES
(1,'V58D5C38B95064F3E',10.00,1,1,'2026-06-07 03:55:24','2026-07-06 11:25:55','2026-06-06 11:25:55','2026-06-07 03:55:24'),
(2,'V12CED84C926B4995',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(3,'VE1FA8F12D2394D4F',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(4,'V0F06C788573F4FB9',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(5,'V9E6487A414EA47B3',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(6,'V0598A030F3204938',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(7,'V06D266DB415A448C',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(8,'V284CDF968A9746C4',100.00,0,NULL,NULL,'2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:12:46'),
(9,'V81D0C1D184A545B3',100.00,1,1,'2026-06-10 07:17:10','2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-10 07:17:10'),
(10,'V83C1E8F1B64848B7',100.00,1,1,'2026-06-10 07:16:44','2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-10 07:16:44'),
(11,'VD4651AEDD49F416A',100.00,1,4,'2026-06-08 02:13:07','2026-07-08 02:12:46','2026-06-08 02:12:46','2026-06-08 02:13:07'),
(12,'VD37EDF8EF8F248DC',10.00,1,5,'2026-06-08 07:13:38','2026-07-08 06:30:52','2026-06-08 06:30:52','2026-06-08 07:13:38');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 14:17:15
