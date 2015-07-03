# Dump of table commits
# ------------------------------------------------------------

CREATE TABLE `commits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repo` varchar(16) NOT NULL DEFAULT '',
  `revision` int(9) NOT NULL,
  `committer` int(7) NOT NULL,
  `date` datetime NOT NULL,
  `line_count` int(6) NOT NULL,
  `message` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `repo` (`repo`),
  KEY `commit_to_committer` (`committer`),
  CONSTRAINT `commit_to_committer` FOREIGN KEY (`committer`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `commit_to_repo` FOREIGN KEY (`repo`) REFERENCES `repos` (`repo`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table props
# ------------------------------------------------------------

CREATE TABLE `props` (
  `user_id` int(7) NOT NULL,
  `commit_id` int(11) NOT NULL,
  KEY `prop_to_user` (`user_id`),
  KEY `prop_to_commit` (`commit_id`),
  CONSTRAINT `prop_to_commit` FOREIGN KEY (`commit_id`) REFERENCES `commits` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `prop_to_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table repos
# ------------------------------------------------------------

CREATE TABLE `repos` (
  `repo` varchar(16) NOT NULL DEFAULT '',
  `url` varchar(64) NOT NULL DEFAULT '',
  PRIMARY KEY (`repo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table tickets
# ------------------------------------------------------------

CREATE TABLE `tickets` (
  `ticket` int(7) NOT NULL,
  `commit_id` int(11) NOT NULL,
  UNIQUE KEY `ticket_commit` (`ticket`,`commit_id`),
  KEY `ticket_to_commit` (`commit_id`),
  CONSTRAINT `ticket_to_commit` FOREIGN KEY (`commit_id`) REFERENCES `commits` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table users
# ------------------------------------------------------------

CREATE TABLE `users` (
  `user_id` int(7) NOT NULL AUTO_INCREMENT,
  `username` varchar(60) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;