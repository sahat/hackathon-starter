--
-- Licensed to the Apache Software Foundation (ASF) under one
-- or more contributor license agreements.  See the NOTICE file
-- distributed with this work for additional information
-- regarding copyright ownership.  The ASF licenses this file
-- to you under the Apache License, Version 2.0 (the
-- "License"); you may not use this file except in compliance
-- with the License.  You may obtain a copy of the License at
--
--   http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.
--

--
-- Table of connection groups. Each connection group has a name.
--

CREATE TABLE `guacamole_connection_group` (

  `connection_group_id`   int(11)      NOT NULL AUTO_INCREMENT,
  `parent_id`             int(11),
  `connection_group_name` varchar(128) NOT NULL,
  `type`                  enum('ORGANIZATIONAL',
                               'BALANCING') NOT NULL DEFAULT 'ORGANIZATIONAL',

  -- Concurrency limits
  `max_connections`          int(11),
  `max_connections_per_user` int(11),
  `enable_session_affinity`  boolean NOT NULL DEFAULT 0,

  PRIMARY KEY (`connection_group_id`),
  UNIQUE KEY `connection_group_name_parent` (`connection_group_name`, `parent_id`),

  CONSTRAINT `guacamole_connection_group_ibfk_1`
    FOREIGN KEY (`parent_id`)
    REFERENCES `guacamole_connection_group` (`connection_group_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of connections. Each connection has a name, protocol, and
-- associated set of parameters.
-- A connection may belong to a connection group.
--

CREATE TABLE `guacamole_connection` (

  `connection_id`       int(11)      NOT NULL AUTO_INCREMENT,
  `connection_name`     varchar(128) NOT NULL,
  `parent_id`           int(11),
  `protocol`            varchar(32)  NOT NULL,
  
  -- Guacamole proxy (guacd) overrides
  `proxy_port`              integer,
  `proxy_hostname`          varchar(512),
  `proxy_encryption_method` enum('NONE', 'SSL'),

  -- Concurrency limits
  `max_connections`          int(11),
  `max_connections_per_user` int(11),
  
  -- Load-balancing behavior
  `connection_weight`        int(11),
  `failover_only`            boolean NOT NULL DEFAULT 0,

  PRIMARY KEY (`connection_id`),
  UNIQUE KEY `connection_name_parent` (`connection_name`, `parent_id`),

  CONSTRAINT `guacamole_connection_ibfk_1`
    FOREIGN KEY (`parent_id`)
    REFERENCES `guacamole_connection_group` (`connection_group_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of base entities which may each be either a user or user group. Other
-- tables which represent qualities shared by both users and groups will point
-- to guacamole_entity, while tables which represent qualities specific to
-- users or groups will point to guacamole_user or guacamole_user_group.
--

CREATE TABLE `guacamole_entity` (

  `entity_id`     int(11)            NOT NULL AUTO_INCREMENT,
  `name`          varchar(128)       NOT NULL,
  `type`          enum('USER',
                       'USER_GROUP') NOT NULL,

  PRIMARY KEY (`entity_id`),
  UNIQUE KEY `guacamole_entity_name_scope` (`type`, `name`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of users. Each user has a unique username and a hashed password
-- with corresponding salt. Although the authentication system will always set
-- salted passwords, other systems may set unsalted passwords by simply not
-- providing the salt.
--

CREATE TABLE `guacamole_user` (

  `user_id`       int(11)      NOT NULL AUTO_INCREMENT,
  `entity_id`     int(11)      NOT NULL,

  -- Optionally-salted password
  `password_hash` binary(32)   NOT NULL,
  `password_salt` binary(32),
  `password_date` datetime     NOT NULL,

  -- Account disabled/expired status
  `disabled`      boolean      NOT NULL DEFAULT 0,
  `expired`       boolean      NOT NULL DEFAULT 0,

  -- Time-based access restriction
  `access_window_start`    TIME,
  `access_window_end`      TIME,

  -- Date-based access restriction
  `valid_from`  DATE,
  `valid_until` DATE,

  -- Timezone used for all date/time comparisons and interpretation
  `timezone` VARCHAR(64),

  -- Profile information
  `full_name`           VARCHAR(256),
  `email_address`       VARCHAR(256),
  `organization`        VARCHAR(256),
  `organizational_role` VARCHAR(256),

  PRIMARY KEY (`user_id`),

  UNIQUE KEY `guacamole_user_single_entity` (`entity_id`),

  CONSTRAINT `guacamole_user_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of user groups. Each user group may have an arbitrary set of member
-- users and member groups, with those members inheriting the permissions
-- granted to that group.
--

CREATE TABLE `guacamole_user_group` (

  `user_group_id` int(11)      NOT NULL AUTO_INCREMENT,
  `entity_id`     int(11)      NOT NULL,

  -- Group disabled status
  `disabled`      boolean      NOT NULL DEFAULT 0,

  PRIMARY KEY (`user_group_id`),

  UNIQUE KEY `guacamole_user_group_single_entity` (`entity_id`),

  CONSTRAINT `guacamole_user_group_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of users which are members of given user groups.
--

CREATE TABLE `guacamole_user_group_member` (

  `user_group_id`    int(11)     NOT NULL,
  `member_entity_id` int(11)     NOT NULL,

  PRIMARY KEY (`user_group_id`, `member_entity_id`),

  -- Parent must be a user group
  CONSTRAINT `guacamole_user_group_member_parent_id`
    FOREIGN KEY (`user_group_id`)
    REFERENCES `guacamole_user_group` (`user_group_id`) ON DELETE CASCADE,

  -- Member may be either a user or a user group (any entity)
  CONSTRAINT `guacamole_user_group_member_entity_id`
    FOREIGN KEY (`member_entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of sharing profiles. Each sharing profile has a name, associated set
-- of parameters, and a primary connection. The primary connection is the
-- connection that the sharing profile shares, and the parameters dictate the
-- restrictions/features which apply to the user joining the connection via the
-- sharing profile.
--

CREATE TABLE guacamole_sharing_profile (

  `sharing_profile_id`    int(11)      NOT NULL AUTO_INCREMENT,
  `sharing_profile_name`  varchar(128) NOT NULL,
  `primary_connection_id` int(11)      NOT NULL,

  PRIMARY KEY (`sharing_profile_id`),
  UNIQUE KEY `sharing_profile_name_primary` (sharing_profile_name, primary_connection_id),

  CONSTRAINT `guacamole_sharing_profile_ibfk_1`
    FOREIGN KEY (`primary_connection_id`)
    REFERENCES `guacamole_connection` (`connection_id`)
    ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of connection parameters. Each parameter is simply a name/value pair
-- associated with a connection.
--

CREATE TABLE `guacamole_connection_parameter` (

  `connection_id`   int(11)       NOT NULL,
  `parameter_name`  varchar(128)  NOT NULL,
  `parameter_value` varchar(4096) NOT NULL,

  PRIMARY KEY (`connection_id`,`parameter_name`),

  CONSTRAINT `guacamole_connection_parameter_ibfk_1`
    FOREIGN KEY (`connection_id`)
    REFERENCES `guacamole_connection` (`connection_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of sharing profile parameters. Each parameter is simply
-- name/value pair associated with a sharing profile. These parameters dictate
-- the restrictions/features which apply to the user joining the associated
-- connection via the sharing profile.
--

CREATE TABLE guacamole_sharing_profile_parameter (

  `sharing_profile_id` integer       NOT NULL,
  `parameter_name`     varchar(128)  NOT NULL,
  `parameter_value`    varchar(4096) NOT NULL,

  PRIMARY KEY (`sharing_profile_id`, `parameter_name`),

  CONSTRAINT `guacamole_sharing_profile_parameter_ibfk_1`
    FOREIGN KEY (`sharing_profile_id`)
    REFERENCES `guacamole_sharing_profile` (`sharing_profile_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of arbitrary user attributes. Each attribute is simply a name/value
-- pair associated with a user. Arbitrary attributes are defined by other
-- extensions. Attributes defined by this extension will be mapped to
-- properly-typed columns of a specific table.
--

CREATE TABLE guacamole_user_attribute (

  `user_id`         int(11)       NOT NULL,
  `attribute_name`  varchar(128)  NOT NULL,
  `attribute_value` varchar(4096) NOT NULL,

  PRIMARY KEY (user_id, attribute_name),
  KEY `user_id` (`user_id`),

  CONSTRAINT guacamole_user_attribute_ibfk_1
    FOREIGN KEY (user_id)
    REFERENCES guacamole_user (user_id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of arbitrary user group attributes. Each attribute is simply a
-- name/value pair associated with a user group. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_user_group_attribute (

  `user_group_id`   int(11)       NOT NULL,
  `attribute_name`  varchar(128)  NOT NULL,
  `attribute_value` varchar(4096) NOT NULL,

  PRIMARY KEY (`user_group_id`, `attribute_name`),
  KEY `user_group_id` (`user_group_id`),

  CONSTRAINT `guacamole_user_group_attribute_ibfk_1`
    FOREIGN KEY (`user_group_id`)
    REFERENCES `guacamole_user_group` (`user_group_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of arbitrary connection attributes. Each attribute is simply a
-- name/value pair associated with a connection. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_connection_attribute (

  `connection_id`   int(11)       NOT NULL,
  `attribute_name`  varchar(128)  NOT NULL,
  `attribute_value` varchar(4096) NOT NULL,

  PRIMARY KEY (connection_id, attribute_name),
  KEY `connection_id` (`connection_id`),

  CONSTRAINT guacamole_connection_attribute_ibfk_1
    FOREIGN KEY (connection_id)
    REFERENCES guacamole_connection (connection_id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of arbitrary connection group attributes. Each attribute is simply a
-- name/value pair associated with a connection group. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_connection_group_attribute (

  `connection_group_id` int(11)       NOT NULL,
  `attribute_name`      varchar(128)  NOT NULL,
  `attribute_value`     varchar(4096) NOT NULL,

  PRIMARY KEY (connection_group_id, attribute_name),
  KEY `connection_group_id` (`connection_group_id`),

  CONSTRAINT guacamole_connection_group_attribute_ibfk_1
    FOREIGN KEY (connection_group_id)
    REFERENCES guacamole_connection_group (connection_group_id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of arbitrary sharing profile attributes. Each attribute is simply a
-- name/value pair associated with a sharing profile. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_sharing_profile_attribute (

  `sharing_profile_id` int(11)       NOT NULL,
  `attribute_name`     varchar(128)  NOT NULL,
  `attribute_value`    varchar(4096) NOT NULL,

  PRIMARY KEY (sharing_profile_id, attribute_name),
  KEY `sharing_profile_id` (`sharing_profile_id`),

  CONSTRAINT guacamole_sharing_profile_attribute_ibfk_1
    FOREIGN KEY (sharing_profile_id)
    REFERENCES guacamole_sharing_profile (sharing_profile_id) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of connection permissions. Each connection permission grants a user or
-- user group specific access to a connection.
--

CREATE TABLE `guacamole_connection_permission` (

  `entity_id`     int(11) NOT NULL,
  `connection_id` int(11) NOT NULL,
  `permission`    enum('READ',
                       'UPDATE',
                       'DELETE',
                       'ADMINISTER') NOT NULL,

  PRIMARY KEY (`entity_id`,`connection_id`,`permission`),

  CONSTRAINT `guacamole_connection_permission_ibfk_1`
    FOREIGN KEY (`connection_id`)
    REFERENCES `guacamole_connection` (`connection_id`) ON DELETE CASCADE,

  CONSTRAINT `guacamole_connection_permission_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of connection group permissions. Each group permission grants a user
-- or user group specific access to a connection group.
--

CREATE TABLE `guacamole_connection_group_permission` (

  `entity_id`           int(11) NOT NULL,
  `connection_group_id` int(11) NOT NULL,
  `permission`          enum('READ',
                             'UPDATE',
                             'DELETE',
                             'ADMINISTER') NOT NULL,

  PRIMARY KEY (`entity_id`,`connection_group_id`,`permission`),

  CONSTRAINT `guacamole_connection_group_permission_ibfk_1`
    FOREIGN KEY (`connection_group_id`)
    REFERENCES `guacamole_connection_group` (`connection_group_id`) ON DELETE CASCADE,

  CONSTRAINT `guacamole_connection_group_permission_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of sharing profile permissions. Each sharing profile permission grants
-- a user or user group specific access to a sharing profile.
--

CREATE TABLE guacamole_sharing_profile_permission (

  `entity_id`          integer NOT NULL,
  `sharing_profile_id` integer NOT NULL,
  `permission`         enum('READ',
                            'UPDATE',
                            'DELETE',
                            'ADMINISTER') NOT NULL,

  PRIMARY KEY (`entity_id`, `sharing_profile_id`, `permission`),

  CONSTRAINT `guacamole_sharing_profile_permission_ibfk_1`
    FOREIGN KEY (`sharing_profile_id`)
    REFERENCES `guacamole_sharing_profile` (`sharing_profile_id`) ON DELETE CASCADE,

  CONSTRAINT `guacamole_sharing_profile_permission_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of system permissions. Each system permission grants a user or user
-- group a system-level privilege of some kind.
--

CREATE TABLE `guacamole_system_permission` (

  `entity_id`  int(11) NOT NULL,
  `permission` enum('CREATE_CONNECTION',
                    'CREATE_CONNECTION_GROUP',
                    'CREATE_SHARING_PROFILE',
                    'CREATE_USER',
                    'CREATE_USER_GROUP',
                    'ADMINISTER') NOT NULL,

  PRIMARY KEY (`entity_id`,`permission`),

  CONSTRAINT `guacamole_system_permission_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of user permissions. Each user permission grants a user or user group
-- access to another user (the "affected" user) for a specific type of
-- operation.
--

CREATE TABLE `guacamole_user_permission` (

  `entity_id`        int(11) NOT NULL,
  `affected_user_id` int(11) NOT NULL,
  `permission`       enum('READ',
                          'UPDATE',
                          'DELETE',
                          'ADMINISTER') NOT NULL,

  PRIMARY KEY (`entity_id`,`affected_user_id`,`permission`),

  CONSTRAINT `guacamole_user_permission_ibfk_1`
    FOREIGN KEY (`affected_user_id`)
    REFERENCES `guacamole_user` (`user_id`) ON DELETE CASCADE,

  CONSTRAINT `guacamole_user_permission_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of user group permissions. Each user group permission grants a user
-- or user group access to a another user group (the "affected" user group) for
-- a specific type of operation.
--

CREATE TABLE `guacamole_user_group_permission` (

  `entity_id`              int(11) NOT NULL,
  `affected_user_group_id` int(11) NOT NULL,
  `permission`             enum('READ',
                                'UPDATE',
                                'DELETE',
                                'ADMINISTER') NOT NULL,

  PRIMARY KEY (`entity_id`, `affected_user_group_id`, `permission`),

  CONSTRAINT `guacamole_user_group_permission_affected_user_group`
    FOREIGN KEY (`affected_user_group_id`)
    REFERENCES `guacamole_user_group` (`user_group_id`) ON DELETE CASCADE,

  CONSTRAINT `guacamole_user_group_permission_entity`
    FOREIGN KEY (`entity_id`)
    REFERENCES `guacamole_entity` (`entity_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Table of connection history records. Each record defines a specific user's
-- session, including the connection used, the start time, and the end time
-- (if any).
--

CREATE TABLE `guacamole_connection_history` (

  `history_id`           int(11)      NOT NULL AUTO_INCREMENT,
  `user_id`              int(11)      DEFAULT NULL,
  `username`             varchar(128) NOT NULL,
  `remote_host`          varchar(256) DEFAULT NULL,
  `connection_id`        int(11)      DEFAULT NULL,
  `connection_name`      varchar(128) NOT NULL,
  `sharing_profile_id`   int(11)      DEFAULT NULL,
  `sharing_profile_name` varchar(128) DEFAULT NULL,
  `start_date`           datetime     NOT NULL,
  `end_date`             datetime     DEFAULT NULL,

  PRIMARY KEY (`history_id`),
  KEY `user_id` (`user_id`),
  KEY `connection_id` (`connection_id`),
  KEY `sharing_profile_id` (`sharing_profile_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  KEY `connection_start_date` (`connection_id`, `start_date`),

  CONSTRAINT `guacamole_connection_history_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `guacamole_user` (`user_id`) ON DELETE SET NULL,

  CONSTRAINT `guacamole_connection_history_ibfk_2`
    FOREIGN KEY (`connection_id`)
    REFERENCES `guacamole_connection` (`connection_id`) ON DELETE SET NULL,

  CONSTRAINT `guacamole_connection_history_ibfk_3`
    FOREIGN KEY (`sharing_profile_id`)
    REFERENCES `guacamole_sharing_profile` (`sharing_profile_id`) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- User login/logout history
--

CREATE TABLE guacamole_user_history (

  `history_id`           int(11)      NOT NULL AUTO_INCREMENT,
  `user_id`              int(11)      DEFAULT NULL,
  `username`             varchar(128) NOT NULL,
  `remote_host`          varchar(256) DEFAULT NULL,
  `start_date`           datetime     NOT NULL,
  `end_date`             datetime     DEFAULT NULL,

  PRIMARY KEY (history_id),
  KEY `user_id` (`user_id`),
  KEY `start_date` (`start_date`),
  KEY `end_date` (`end_date`),
  KEY `user_start_date` (`user_id`, `start_date`),

  CONSTRAINT guacamole_user_history_ibfk_1
    FOREIGN KEY (user_id)
    REFERENCES guacamole_user (user_id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- User password history
--

CREATE TABLE guacamole_user_password_history (

  `password_history_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id`             int(11) NOT NULL,

  -- Salted password
  `password_hash` binary(32) NOT NULL,
  `password_salt` binary(32),
  `password_date` datetime   NOT NULL,

  PRIMARY KEY (`password_history_id`),
  KEY `user_id` (`user_id`),

  CONSTRAINT `guacamole_user_password_history_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `guacamole_user` (`user_id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8;
--
-- Licensed to the Apache Software Foundation (ASF) under one
-- or more contributor license agreements.  See the NOTICE file
-- distributed with this work for additional information
-- regarding copyright ownership.  The ASF licenses this file
-- to you under the Apache License, Version 2.0 (the
-- "License"); you may not use this file except in compliance
-- with the License.  You may obtain a copy of the License at
--
--   http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing,
-- software distributed under the License is distributed on an
-- "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
-- KIND, either express or implied.  See the License for the
-- specific language governing permissions and limitations
-- under the License.
--

-- Create default user "guacadmin" with password "guacadmin"
INSERT INTO guacamole_entity (name, type) VALUES ('guacadmin', 'USER');
INSERT INTO guacamole_user (entity_id, password_hash, password_salt, password_date)
SELECT
    entity_id,
    x'CA458A7D494E3BE824F5E1E175A1556C0F8EEF2C2D7DF3633BEC4A29C4411960',  -- 'guacadmin'
    x'FE24ADC5E11E2B25288D1704ABE67A79E342ECC26064CE69C5B3177795A82264',
    NOW()
FROM guacamole_entity WHERE name = 'guacadmin';

-- Grant this user all system permissions
INSERT INTO guacamole_system_permission (entity_id, permission)
SELECT entity_id, permission
FROM (
          SELECT 'guacadmin'  AS username, 'CREATE_CONNECTION'       AS permission
    UNION SELECT 'guacadmin'  AS username, 'CREATE_CONNECTION_GROUP' AS permission
    UNION SELECT 'guacadmin'  AS username, 'CREATE_SHARING_PROFILE'  AS permission
    UNION SELECT 'guacadmin'  AS username, 'CREATE_USER'             AS permission
    UNION SELECT 'guacadmin'  AS username, 'CREATE_USER_GROUP'       AS permission
    UNION SELECT 'guacadmin'  AS username, 'ADMINISTER'              AS permission
) permissions
JOIN guacamole_entity ON permissions.username = guacamole_entity.name AND guacamole_entity.type = 'USER';

-- Grant admin permission to read/update/administer self
INSERT INTO guacamole_user_permission (entity_id, affected_user_id, permission)
SELECT guacamole_entity.entity_id, guacamole_user.user_id, permission
FROM (
          SELECT 'guacadmin' AS username, 'guacadmin' AS affected_username, 'READ'       AS permission
    UNION SELECT 'guacadmin' AS username, 'guacadmin' AS affected_username, 'UPDATE'     AS permission
    UNION SELECT 'guacadmin' AS username, 'guacadmin' AS affected_username, 'ADMINISTER' AS permission
) permissions
JOIN guacamole_entity          ON permissions.username = guacamole_entity.name AND guacamole_entity.type = 'USER'
JOIN guacamole_entity affected ON permissions.affected_username = affected.name AND guacamole_entity.type = 'USER'
JOIN guacamole_user            ON guacamole_user.entity_id = affected.entity_id;
