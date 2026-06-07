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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES
(1,'欢迎使用 CloudHost 云主机管理平台','<p>欢迎使用CloudHost云主机管理平台！我们提供多种虚拟化解决方案，包括KVM、LXD、Incus等。</p><p>平台特点：</p><ul><li>秒级开通</li><li>灵活计费</li><li>便捷管理</li><li>安全可靠</li></ul>','欢迎使用CloudHost云主机管理平台',1,1,1,'2026-06-06 11:22:52','2026-06-06 11:25:10'),
(2,'关于实名认证','<p>根据相关法规要求，用户需完成实名认证后方可使用部分服务。</p><p>实名认证完全免费，审核通常在1-2个工作日内完成。</p>','提醒用户完成实名认证',0,0,0,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(3,'新增支付方式','<p>平台已支持支付宝、微信支付、QQ钱包等多种支付方式，充值更加便捷。</p>','新增多种支付方式',0,0,0,'2026-06-06 11:22:52','2026-06-06 11:22:52');
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
  `real_name` varchar(50) NOT NULL,
  `id_card` varchar(18) NOT NULL,
  `id_card_front` varchar(255) DEFAULT NULL,
  `id_card_back` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reject_reason` varchar(255) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_requests`
--

LOCK TABLES `auth_requests` WRITE;
/*!40000 ALTER TABLE `auth_requests` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `balance_logs`
--

LOCK TABLES `balance_logs` WRITE;
/*!40000 ALTER TABLE `balance_logs` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nodes`
--

LOCK TABLES `nodes` WRITE;
/*!40000 ALTER TABLE `nodes` DISABLE KEYS */;
INSERT INTO `nodes` VALUES
(1,'洛杉矶节点1','pve','https://pve1.example.com:8006','root@pam','','洛杉矶','vmbr1','vmbr2','10.0.1.0/24','2001:db8::/64','online',0,0,0,NULL,0,NULL,22,'root',NULL,NULL,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(2,'香港节点1','incus','https://incus1.example.com:8443','admin','','香港','vmbr1','vmbr2','10.0.2.0/24','2001:db9::/64','online',0,0,0,NULL,0,NULL,22,'root',NULL,NULL,'2026-06-06 11:22:52','2026-06-06 11:22:52');
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
  `product_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `node_id` int(11) NOT NULL,
  `cycle` enum('monthly','quarterly','yearly') NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('pending','paid','completed','cancelled','refunded') DEFAULT 'pending',
  `payment_method` varchar(20) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(1,1,'ORD17807466768593A00E722',2,4,1,'monthly',1,10.00,'pending',NULL,NULL,'2026-06-06 11:51:16','2026-06-06 11:51:16');
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
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `plans_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES
(1,1,'入门型',1,1024,20,10,1000,20.00,55.00,199.00,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(2,1,'标准型',2,2048,40,20,2000,45.00,120.00,399.00,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(3,1,'高级型',4,4096,80,50,5000,89.00,240.00,799.00,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(4,2,'轻量型',1,512,10,5,500,10.00,27.00,99.00,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(5,2,'专业型',2,2048,30,10,1000,30.00,80.00,299.00,'2026-06-06 11:22:52','2026-06-06 11:22:52');
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
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `port_forwards_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `port_forwards_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `port_forwards`
--

LOCK TABLES `port_forwards` WRITE;
/*!40000 ALTER TABLE `port_forwards` DISABLE KEYS */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(1,'KVM云主机','kvm','KVM完全虚拟化，性能强劲，支持Windows和Linux全系列系统','完全虚拟化\n性能强劲\n支持Windows\n支持Linux\n独立IP\nIPv6支持\nDDoS防护','1-16','512-32768','10-500',20.00,500.00,'online',1,'2026-06-06 11:22:52','2026-06-06 11:22:52'),
(2,'LXD容器','lxc','LXD容器化技术，轻量高效，适合开发测试环境','容器化技术\n轻量高效\n秒级启动\n低资源占用\n适合开发测试\n支持快照','1-8','256-16384','5-200',10.00,200.00,'online',2,'2026-06-06 11:22:52','2026-06-06 11:22:52');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recharges`
--

LOCK TABLES `recharges` WRITE;
/*!40000 ALTER TABLE `recharges` DISABLE KEYS */;
INSERT INTO `recharges` VALUES
(1,1,1.00,'wechat','RCH17807465334013E3D5C08','pending','2026-06-06 11:48:53','2026-06-06 11:48:53'),
(2,1,1.00,'qqpay','RCH1780746543012DB6F0920','pending','2026-06-06 11:49:03','2026-06-06 11:49:03');
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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `services_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(5,1,1,'jhvhjk',1,NULL,'2026-06-06 11:54:21','2026-06-06 11:54:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES
(1,1,'technical','就尽管吩咐哈哈','closed','normal','2026-06-06 11:50:29','2026-06-06 11:54:24');
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
  `identity_verified` tinyint(1) DEFAULT 0,
  `real_name` varchar(50) DEFAULT NULL,
  `id_card` varchar(18) DEFAULT NULL,
  `auth_status` enum('none','pending','approved','rejected') DEFAULT 'none',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','admin@ypvps.com','$2a$10$XZKXkjyWYi6YCIj1k5WYE.Ojz8Mz9SDpOTzwjiyFgSazVKJQZOZx2',NULL,NULL,'admin',1000.00,'active',1,1,NULL,NULL,'none','2026-06-06 11:22:52','2026-06-07 01:22:24'),
(2,'testuser','qdmz@vip.qq.com','$2a$10$3uKD9t.j8K.TyRR3gr7K3uumM.2BZo6dPDuY94RU0K5Us6DXJ5N96',NULL,NULL,'user',100.00,'active',1,0,NULL,NULL,'none','2026-06-06 11:22:52','2026-06-07 01:22:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES
(1,'V58D5C38B95064F3E',10.00,0,NULL,NULL,'2026-07-06 11:25:55','2026-06-06 11:25:55','2026-06-06 11:25:55');
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

-- Dump completed on 2026-06-07  9:25:51
