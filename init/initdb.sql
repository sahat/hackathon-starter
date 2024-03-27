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
-- Connection group types
--

CREATE TYPE guacamole_connection_group_type AS ENUM(
    'ORGANIZATIONAL',
    'BALANCING'
);

--
-- Entity types
--

CREATE TYPE guacamole_entity_type AS ENUM(
    'USER',
    'USER_GROUP'
);

--
-- Object permission types
--

CREATE TYPE guacamole_object_permission_type AS ENUM(
    'READ',
    'UPDATE',
    'DELETE',
    'ADMINISTER'
);

--
-- System permission types
--

CREATE TYPE guacamole_system_permission_type AS ENUM(
    'CREATE_CONNECTION',
    'CREATE_CONNECTION_GROUP',
    'CREATE_SHARING_PROFILE',
    'CREATE_USER',
    'CREATE_USER_GROUP',
    'ADMINISTER'
);

--
-- Guacamole proxy (guacd) encryption methods
--

CREATE TYPE guacamole_proxy_encryption_method AS ENUM(
    'NONE',
    'SSL'
);

--
-- Table of connection groups. Each connection group has a name.
--

CREATE TABLE guacamole_connection_group (

  connection_group_id   serial       NOT NULL,
  parent_id             integer,
  connection_group_name varchar(128) NOT NULL,
  type                  guacamole_connection_group_type
                        NOT NULL DEFAULT 'ORGANIZATIONAL',

  -- Concurrency limits
  max_connections          integer,
  max_connections_per_user integer,
  enable_session_affinity  boolean NOT NULL DEFAULT FALSE,

  PRIMARY KEY (connection_group_id),

  CONSTRAINT connection_group_name_parent
    UNIQUE (connection_group_name, parent_id),

  CONSTRAINT guacamole_connection_group_ibfk_1
    FOREIGN KEY (parent_id)
    REFERENCES guacamole_connection_group (connection_group_id)
    ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_group_parent_id
    ON guacamole_connection_group(parent_id);

--
-- Table of connections. Each connection has a name, protocol, and
-- associated set of parameters.
-- A connection may belong to a connection group.
--

CREATE TABLE guacamole_connection (

  connection_id       serial       NOT NULL,
  connection_name     varchar(128) NOT NULL,
  parent_id           integer,
  protocol            varchar(32)  NOT NULL,
  
  -- Concurrency limits
  max_connections          integer,
  max_connections_per_user integer,

  -- Connection Weight
  connection_weight        integer,
  failover_only            boolean NOT NULL DEFAULT FALSE,

  -- Guacamole proxy (guacd) overrides
  proxy_port              integer,
  proxy_hostname          varchar(512),
  proxy_encryption_method guacamole_proxy_encryption_method,

  PRIMARY KEY (connection_id),

  CONSTRAINT connection_name_parent
    UNIQUE (connection_name, parent_id),

  CONSTRAINT guacamole_connection_ibfk_1
    FOREIGN KEY (parent_id)
    REFERENCES guacamole_connection_group (connection_group_id)
    ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_parent_id
    ON guacamole_connection(parent_id);

--
-- Table of base entities which may each be either a user or user group. Other
-- tables which represent qualities shared by both users and groups will point
-- to guacamole_entity, while tables which represent qualities specific to
-- users or groups will point to guacamole_user or guacamole_user_group.
--

CREATE TABLE guacamole_entity (

  entity_id     serial                  NOT NULL,
  name          varchar(128)            NOT NULL,
  type          guacamole_entity_type   NOT NULL,

  PRIMARY KEY (entity_id),

  CONSTRAINT guacamole_entity_name_scope
    UNIQUE (type, name)

);

--
-- Table of users. Each user has a unique username and a hashed password
-- with corresponding salt. Although the authentication system will always set
-- salted passwords, other systems may set unsalted passwords by simply not
-- providing the salt.
--

CREATE TABLE guacamole_user (

  user_id       serial       NOT NULL,
  entity_id     integer      NOT NULL,

  -- Optionally-salted password
  password_hash bytea        NOT NULL,
  password_salt bytea,
  password_date timestamptz  NOT NULL,

  -- Account disabled/expired status
  disabled      boolean      NOT NULL DEFAULT FALSE,
  expired       boolean      NOT NULL DEFAULT FALSE,

  -- Time-based access restriction
  access_window_start    time,
  access_window_end      time,

  -- Date-based access restriction
  valid_from  date,
  valid_until date,

  -- Timezone used for all date/time comparisons and interpretation
  timezone varchar(64),

  -- Profile information
  full_name           varchar(256),
  email_address       varchar(256),
  organization        varchar(256),
  organizational_role varchar(256),

  PRIMARY KEY (user_id),

  CONSTRAINT guacamole_user_single_entity
    UNIQUE (entity_id),

  CONSTRAINT guacamole_user_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id)
    ON DELETE CASCADE

);

--
-- Table of user groups. Each user group may have an arbitrary set of member
-- users and member groups, with those members inheriting the permissions
-- granted to that group.
--

CREATE TABLE guacamole_user_group (

  user_group_id serial      NOT NULL,
  entity_id     integer     NOT NULL,

  -- Group disabled status
  disabled      boolean     NOT NULL DEFAULT FALSE,

  PRIMARY KEY (user_group_id),

  CONSTRAINT guacamole_user_group_single_entity
    UNIQUE (entity_id),

  CONSTRAINT guacamole_user_group_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id)
    ON DELETE CASCADE

);

--
-- Table of users which are members of given user groups.
--

CREATE TABLE guacamole_user_group_member (

  user_group_id    integer       NOT NULL,
  member_entity_id integer       NOT NULL,

  PRIMARY KEY (user_group_id, member_entity_id),

  -- Parent must be a user group
  CONSTRAINT guacamole_user_group_member_parent
    FOREIGN KEY (user_group_id)
    REFERENCES guacamole_user_group (user_group_id) ON DELETE CASCADE,

  -- Member may be either a user or a user group (any entity)
  CONSTRAINT guacamole_user_group_member_entity
    FOREIGN KEY (member_entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

--
-- Table of sharing profiles. Each sharing profile has a name, associated set
-- of parameters, and a primary connection. The primary connection is the
-- connection that the sharing profile shares, and the parameters dictate the
-- restrictions/features which apply to the user joining the connection via the
-- sharing profile.
--

CREATE TABLE guacamole_sharing_profile (

  sharing_profile_id    serial       NOT NULL,
  sharing_profile_name  varchar(128) NOT NULL,
  primary_connection_id integer      NOT NULL,

  PRIMARY KEY (sharing_profile_id),

  CONSTRAINT sharing_profile_name_primary
    UNIQUE (sharing_profile_name, primary_connection_id),

  CONSTRAINT guacamole_sharing_profile_ibfk_1
    FOREIGN KEY (primary_connection_id)
    REFERENCES guacamole_connection (connection_id)
    ON DELETE CASCADE

);

CREATE INDEX guacamole_sharing_profile_primary_connection_id
    ON guacamole_sharing_profile(primary_connection_id);

--
-- Table of connection parameters. Each parameter is simply a name/value pair
-- associated with a connection.
--

CREATE TABLE guacamole_connection_parameter (

  connection_id   integer       NOT NULL,
  parameter_name  varchar(128)  NOT NULL,
  parameter_value varchar(4096) NOT NULL,

  PRIMARY KEY (connection_id,parameter_name),

  CONSTRAINT guacamole_connection_parameter_ibfk_1
    FOREIGN KEY (connection_id)
    REFERENCES guacamole_connection (connection_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_parameter_connection_id
    ON guacamole_connection_parameter(connection_id);

--
-- Table of sharing profile parameters. Each parameter is simply
-- name/value pair associated with a sharing profile. These parameters dictate
-- the restrictions/features which apply to the user joining the associated
-- connection via the sharing profile.
--

CREATE TABLE guacamole_sharing_profile_parameter (

  sharing_profile_id integer       NOT NULL,
  parameter_name     varchar(128)  NOT NULL,
  parameter_value    varchar(4096) NOT NULL,

  PRIMARY KEY (sharing_profile_id, parameter_name),

  CONSTRAINT guacamole_sharing_profile_parameter_ibfk_1
    FOREIGN KEY (sharing_profile_id)
    REFERENCES guacamole_sharing_profile (sharing_profile_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_sharing_profile_parameter_sharing_profile_id
    ON guacamole_sharing_profile_parameter(sharing_profile_id);

--
-- Table of arbitrary user attributes. Each attribute is simply a name/value
-- pair associated with a user. Arbitrary attributes are defined by other
-- extensions. Attributes defined by this extension will be mapped to
-- properly-typed columns of a specific table.
--

CREATE TABLE guacamole_user_attribute (

  user_id         integer       NOT NULL,
  attribute_name  varchar(128)  NOT NULL,
  attribute_value varchar(4096) NOT NULL,

  PRIMARY KEY (user_id, attribute_name),

  CONSTRAINT guacamole_user_attribute_ibfk_1
    FOREIGN KEY (user_id)
    REFERENCES guacamole_user (user_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_user_attribute_user_id
    ON guacamole_user_attribute(user_id);

--
-- Table of arbitrary user group attributes. Each attribute is simply a
-- name/value pair associated with a user group. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_user_group_attribute (

  user_group_id   integer       NOT NULL,
  attribute_name  varchar(128)  NOT NULL,
  attribute_value varchar(4096) NOT NULL,

  PRIMARY KEY (user_group_id, attribute_name),

  CONSTRAINT guacamole_user_group_attribute_ibfk_1
    FOREIGN KEY (user_group_id)
    REFERENCES guacamole_user_group (user_group_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_user_group_attribute_user_group_id
    ON guacamole_user_group_attribute(user_group_id);

--
-- Table of arbitrary connection attributes. Each attribute is simply a
-- name/value pair associated with a connection. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_connection_attribute (

  connection_id   integer       NOT NULL,
  attribute_name  varchar(128)  NOT NULL,
  attribute_value varchar(4096) NOT NULL,

  PRIMARY KEY (connection_id, attribute_name),

  CONSTRAINT guacamole_connection_attribute_ibfk_1
    FOREIGN KEY (connection_id)
    REFERENCES guacamole_connection (connection_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_attribute_connection_id
    ON guacamole_connection_attribute(connection_id);

--
-- Table of arbitrary connection group attributes. Each attribute is simply a
-- name/value pair associated with a connection group. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_connection_group_attribute (

  connection_group_id integer       NOT NULL,
  attribute_name      varchar(128)  NOT NULL,
  attribute_value     varchar(4096) NOT NULL,

  PRIMARY KEY (connection_group_id, attribute_name),

  CONSTRAINT guacamole_connection_group_attribute_ibfk_1
    FOREIGN KEY (connection_group_id)
    REFERENCES guacamole_connection_group (connection_group_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_group_attribute_connection_group_id
    ON guacamole_connection_group_attribute(connection_group_id);

--
-- Table of arbitrary sharing profile attributes. Each attribute is simply a
-- name/value pair associated with a sharing profile. Arbitrary attributes are
-- defined by other extensions. Attributes defined by this extension will be
-- mapped to properly-typed columns of a specific table.
--

CREATE TABLE guacamole_sharing_profile_attribute (

  sharing_profile_id integer       NOT NULL,
  attribute_name     varchar(128)  NOT NULL,
  attribute_value    varchar(4096) NOT NULL,

  PRIMARY KEY (sharing_profile_id, attribute_name),

  CONSTRAINT guacamole_sharing_profile_attribute_ibfk_1
    FOREIGN KEY (sharing_profile_id)
    REFERENCES guacamole_sharing_profile (sharing_profile_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_sharing_profile_attribute_sharing_profile_id
    ON guacamole_sharing_profile_attribute(sharing_profile_id);

--
-- Table of connection permissions. Each connection permission grants a user or
-- user group specific access to a connection.
--

CREATE TABLE guacamole_connection_permission (

  entity_id     integer NOT NULL,
  connection_id integer NOT NULL,
  permission    guacamole_object_permission_type NOT NULL,

  PRIMARY KEY (entity_id, connection_id, permission),

  CONSTRAINT guacamole_connection_permission_ibfk_1
    FOREIGN KEY (connection_id)
    REFERENCES guacamole_connection (connection_id) ON DELETE CASCADE,

  CONSTRAINT guacamole_connection_permission_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_permission_connection_id
    ON guacamole_connection_permission(connection_id);

CREATE INDEX guacamole_connection_permission_entity_id
    ON guacamole_connection_permission(entity_id);

--
-- Table of connection group permissions. Each group permission grants a user
-- or user group specific access to a connection group.
--

CREATE TABLE guacamole_connection_group_permission (

  entity_id           integer NOT NULL,
  connection_group_id integer NOT NULL,
  permission          guacamole_object_permission_type NOT NULL,

  PRIMARY KEY (entity_id, connection_group_id, permission),

  CONSTRAINT guacamole_connection_group_permission_ibfk_1
    FOREIGN KEY (connection_group_id)
    REFERENCES guacamole_connection_group (connection_group_id) ON DELETE CASCADE,

  CONSTRAINT guacamole_connection_group_permission_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_connection_group_permission_connection_group_id
    ON guacamole_connection_group_permission(connection_group_id);

CREATE INDEX guacamole_connection_group_permission_entity_id
    ON guacamole_connection_group_permission(entity_id);

--
-- Table of sharing profile permissions. Each sharing profile permission grants
-- a user or user group specific access to a sharing profile.
--

CREATE TABLE guacamole_sharing_profile_permission (

  entity_id          integer NOT NULL,
  sharing_profile_id integer NOT NULL,
  permission         guacamole_object_permission_type NOT NULL,

  PRIMARY KEY (entity_id, sharing_profile_id, permission),

  CONSTRAINT guacamole_sharing_profile_permission_ibfk_1
    FOREIGN KEY (sharing_profile_id)
    REFERENCES guacamole_sharing_profile (sharing_profile_id) ON DELETE CASCADE,

  CONSTRAINT guacamole_sharing_profile_permission_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_sharing_profile_permission_sharing_profile_id
    ON guacamole_sharing_profile_permission(sharing_profile_id);

CREATE INDEX guacamole_sharing_profile_permission_entity_id
    ON guacamole_sharing_profile_permission(entity_id);

--
-- Table of system permissions. Each system permission grants a user or user
-- group a system-level privilege of some kind.
--

CREATE TABLE guacamole_system_permission (

  entity_id  integer NOT NULL,
  permission guacamole_system_permission_type NOT NULL,

  PRIMARY KEY (entity_id, permission),

  CONSTRAINT guacamole_system_permission_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_system_permission_entity_id
    ON guacamole_system_permission(entity_id);

--
-- Table of user permissions. Each user permission grants a user or user group
-- access to another user (the "affected" user) for a specific type of
-- operation.
--

CREATE TABLE guacamole_user_permission (

  entity_id        integer NOT NULL,
  affected_user_id integer NOT NULL,
  permission       guacamole_object_permission_type NOT NULL,

  PRIMARY KEY (entity_id, affected_user_id, permission),

  CONSTRAINT guacamole_user_permission_ibfk_1
    FOREIGN KEY (affected_user_id)
    REFERENCES guacamole_user (user_id) ON DELETE CASCADE,

  CONSTRAINT guacamole_user_permission_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_user_permission_affected_user_id
    ON guacamole_user_permission(affected_user_id);

CREATE INDEX guacamole_user_permission_entity_id
    ON guacamole_user_permission(entity_id);

--
-- Table of user group permissions. Each user group permission grants a user
-- or user group access to a another user group (the "affected" user group) for
-- a specific type of operation.
--

CREATE TABLE guacamole_user_group_permission (

  entity_id              integer NOT NULL,
  affected_user_group_id integer NOT NULL,
  permission             guacamole_object_permission_type NOT NULL,

  PRIMARY KEY (entity_id, affected_user_group_id, permission),

  CONSTRAINT guacamole_user_group_permission_affected_user_group
    FOREIGN KEY (affected_user_group_id)
    REFERENCES guacamole_user_group (user_group_id) ON DELETE CASCADE,

  CONSTRAINT guacamole_user_group_permission_entity
    FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_user_group_permission_affected_user_group_id
    ON guacamole_user_group_permission(affected_user_group_id);

CREATE INDEX guacamole_user_group_permission_entity_id
    ON guacamole_user_group_permission(entity_id);

--
-- Table of connection history records. Each record defines a specific user's
-- session, including the connection used, the start time, and the end time
-- (if any).
--

CREATE TABLE guacamole_connection_history (

  history_id           serial       NOT NULL,
  user_id              integer      DEFAULT NULL,
  username             varchar(128) NOT NULL,
  remote_host          varchar(256) DEFAULT NULL,
  connection_id        integer      DEFAULT NULL,
  connection_name      varchar(128) NOT NULL,
  sharing_profile_id   integer      DEFAULT NULL,
  sharing_profile_name varchar(128) DEFAULT NULL,
  start_date           timestamptz  NOT NULL,
  end_date             timestamptz  DEFAULT NULL,

  PRIMARY KEY (history_id),

  CONSTRAINT guacamole_connection_history_ibfk_1
    FOREIGN KEY (user_id)
    REFERENCES guacamole_user (user_id) ON DELETE SET NULL,

  CONSTRAINT guacamole_connection_history_ibfk_2
    FOREIGN KEY (connection_id)
    REFERENCES guacamole_connection (connection_id) ON DELETE SET NULL,

  CONSTRAINT guacamole_connection_history_ibfk_3
    FOREIGN KEY (sharing_profile_id)
    REFERENCES guacamole_sharing_profile (sharing_profile_id) ON DELETE SET NULL

);

CREATE INDEX guacamole_connection_history_user_id
    ON guacamole_connection_history(user_id);

CREATE INDEX guacamole_connection_history_connection_id
    ON guacamole_connection_history(connection_id);

CREATE INDEX guacamole_connection_history_sharing_profile_id
    ON guacamole_connection_history(sharing_profile_id);

CREATE INDEX guacamole_connection_history_start_date
    ON guacamole_connection_history(start_date);

CREATE INDEX guacamole_connection_history_end_date
    ON guacamole_connection_history(end_date);

CREATE INDEX guacamole_connection_history_connection_id_start_date
    ON guacamole_connection_history(connection_id, start_date);

--
-- User login/logout history
--

CREATE TABLE guacamole_user_history (

  history_id           serial       NOT NULL,
  user_id              integer      DEFAULT NULL,
  username             varchar(128) NOT NULL,
  remote_host          varchar(256) DEFAULT NULL,
  start_date           timestamptz  NOT NULL,
  end_date             timestamptz  DEFAULT NULL,

  PRIMARY KEY (history_id),

  CONSTRAINT guacamole_user_history_ibfk_1
    FOREIGN KEY (user_id)
    REFERENCES guacamole_user (user_id) ON DELETE SET NULL

);

CREATE INDEX guacamole_user_history_user_id
    ON guacamole_user_history(user_id);

CREATE INDEX guacamole_user_history_start_date
    ON guacamole_user_history(start_date);

CREATE INDEX guacamole_user_history_end_date
    ON guacamole_user_history(end_date);

CREATE INDEX guacamole_user_history_user_id_start_date
    ON guacamole_user_history(user_id, start_date);

--
-- User password history
--

CREATE TABLE guacamole_user_password_history (

  password_history_id serial  NOT NULL,
  user_id             integer NOT NULL,

  -- Salted password
  password_hash bytea        NOT NULL,
  password_salt bytea,
  password_date timestamptz  NOT NULL,

  PRIMARY KEY (password_history_id),

  CONSTRAINT guacamole_user_password_history_ibfk_1
    FOREIGN KEY (user_id)
    REFERENCES guacamole_user (user_id) ON DELETE CASCADE

);

CREATE INDEX guacamole_user_password_history_user_id
    ON guacamole_user_password_history(user_id);

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
    decode('CA458A7D494E3BE824F5E1E175A1556C0F8EEF2C2D7DF3633BEC4A29C4411960', 'hex'),  -- 'guacadmin'
    decode('FE24ADC5E11E2B25288D1704ABE67A79E342ECC26064CE69C5B3177795A82264', 'hex'),
    CURRENT_TIMESTAMP
FROM guacamole_entity WHERE name = 'guacadmin' AND guacamole_entity.type = 'USER';

-- Grant this user all system permissions
INSERT INTO guacamole_system_permission (entity_id, permission)
SELECT entity_id, permission::guacamole_system_permission_type
FROM (
    VALUES
        ('guacadmin', 'CREATE_CONNECTION'),
        ('guacadmin', 'CREATE_CONNECTION_GROUP'),
        ('guacadmin', 'CREATE_SHARING_PROFILE'),
        ('guacadmin', 'CREATE_USER'),
        ('guacadmin', 'CREATE_USER_GROUP'),
        ('guacadmin', 'ADMINISTER')
) permissions (username, permission)
JOIN guacamole_entity ON permissions.username = guacamole_entity.name AND guacamole_entity.type = 'USER';

-- Grant admin permission to read/update/administer self
INSERT INTO guacamole_user_permission (entity_id, affected_user_id, permission)
SELECT guacamole_entity.entity_id, guacamole_user.user_id, permission::guacamole_object_permission_type
FROM (
    VALUES
        ('guacadmin', 'guacadmin', 'READ'),
        ('guacadmin', 'guacadmin', 'UPDATE'),
        ('guacadmin', 'guacadmin', 'ADMINISTER')
) permissions (username, affected_username, permission)
JOIN guacamole_entity          ON permissions.username = guacamole_entity.name AND guacamole_entity.type = 'USER'
JOIN guacamole_entity affected ON permissions.affected_username = affected.name AND guacamole_entity.type = 'USER'
JOIN guacamole_user            ON guacamole_user.entity_id = affected.entity_id;
