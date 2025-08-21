-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: sql203.byetcluster.com
-- Generation Time: Aug 21, 2025 at 07:18 AM
-- Server version: 11.4.7-MariaDB
-- PHP Version: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `if0_39456407_cbt`
--

-- --------------------------------------------------------

--
-- Table structure for table `class_levels`
--

CREATE TABLE `class_levels` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) NOT NULL,
  `level_type` enum('junior','senior') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `option_a` text NOT NULL,
  `option_b` text NOT NULL,
  `option_c` text DEFAULT NULL,
  `option_d` text DEFAULT NULL,
  `correct_answer` enum('A','B','C','D') NOT NULL,
  `subject_id` int(11) NOT NULL,
  `class_level` varchar(10) NOT NULL,
  `term_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `question_type` varchar(20) DEFAULT 'multiple_choice'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_assignments`
--

CREATE TABLE `teacher_assignments` (
  `id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `class_level` varchar(10) NOT NULL,
  `term_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `terms`
--

CREATE TABLE `terms` (
  `id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `display_order` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test_answers`
--

CREATE TABLE `test_answers` (
  `id` int(11) NOT NULL,
  `result_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `selected_answer` enum('A','B','C','D') DEFAULT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test_codes`
--

CREATE TABLE `test_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `subject_id` int(11) NOT NULL,
  `class_level` varchar(10) NOT NULL,
  `term_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `pass_score` int(11) DEFAULT 50,
  `is_active` tinyint(1) DEFAULT 0,
  `is_activated` tinyint(1) DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `activated_at` timestamp NULL DEFAULT NULL,
  `batch_id` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `test_type` varchar(20) DEFAULT 'test',
  `score_per_question` int(11) DEFAULT 1,
  `is_used` tinyint(1) DEFAULT 0,
  `used_at` timestamp NULL DEFAULT NULL,
  `used_by` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `test_results`
--

CREATE TABLE `test_results` (
  `id` int(11) NOT NULL,
  `test_code_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `time_taken` int(11) NOT NULL,
  `submitted_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `reg_number` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `class_level` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `current_term` varchar(20) DEFAULT 'First',
  `current_session` varchar(20) DEFAULT '2024/2025'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `class_levels`
--
ALTER TABLE `class_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `term_id` (`term_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `idx_questions_subject_id` (`subject_id`),
  ADD KEY `idx_questions_subject_class` (`subject_id`,`class_level`),
  ADD KEY `idx_questions_teacher` (`teacher_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `term_id` (`term_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `idx_teacher_assignments_teacher` (`teacher_id`);

--
-- Indexes for table `terms`
--
ALTER TABLE `terms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `test_answers`
--
ALTER TABLE `test_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `result_id` (`result_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `test_codes`
--
ALTER TABLE `test_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `term_id` (`term_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `used_by` (`used_by`),
  ADD KEY `idx_test_codes_active` (`is_active`),
  ADD KEY `idx_test_codes_subject_class` (`subject_id`,`class_level`);

--
-- Indexes for table `test_results`
--
ALTER TABLE `test_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_test_results_student` (`student_id`),
  ADD KEY `idx_test_results_test_code` (`test_code_id`),
  ADD KEY `idx_test_results_date` (`submitted_at`),
  ADD KEY `idx_test_results_submitted_at` (`submitted_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `reg_number` (`reg_number`),
  ADD KEY `idx_users_username` (`username`),
  ADD KEY `idx_users_reg_number` (`reg_number`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_role_active` (`role`,`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `class_levels`
--
ALTER TABLE `class_levels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `teacher_assignments`
--
ALTER TABLE `teacher_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `terms`
--
ALTER TABLE `terms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `test_answers`
--
ALTER TABLE `test_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `test_codes`
--
ALTER TABLE `test_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `test_results`
--
ALTER TABLE `test_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
