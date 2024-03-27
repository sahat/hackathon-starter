-- Adjustments for PostgreSQL compatibility

-- Table of connection groups
CREATE TABLE guacamole_connection_group (
  connection_group_id   SERIAL PRIMARY KEY,
  parent_id             INTEGER,
  connection_group_name VARCHAR(128) NOT NULL,
  type                  VARCHAR(15) NOT NULL DEFAULT 'ORGANIZATIONAL',
  max_connections       INTEGER,
  max_connections_per_user INTEGER,
  enable_session_affinity BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (connection_group_name, parent_id),
  FOREIGN KEY (parent_id)
    REFERENCES guacamole_connection_group (connection_group_id) ON DELETE CASCADE
);

-- Table of connections
CREATE TABLE guacamole_connection (
  connection_id       SERIAL PRIMARY KEY,
  connection_name     VARCHAR(128) NOT NULL,
  parent_id           INTEGER,
  protocol            VARCHAR(32) NOT NULL,
  proxy_port          INTEGER,
  proxy_hostname      VARCHAR(512),
  proxy_encryption_method VARCHAR(3),
  max_connections          INTEGER,
  max_connections_per_user INTEGER,
  connection_weight        INTEGER,
  failover_only            BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (connection_name, parent_id),
  FOREIGN KEY (parent_id)
    REFERENCES guacamole_connection_group (connection_group_id) ON DELETE CASCADE
);

-- Table of base entities
CREATE TABLE guacamole_entity (
  entity_id     SERIAL PRIMARY KEY,
  name          VARCHAR(128) NOT NULL,
  type          VARCHAR(10) NOT NULL,
  UNIQUE (type, name)
);

-- Table of users
CREATE TABLE guacamole_user (
  user_id       SERIAL PRIMARY KEY,
  entity_id     INTEGER NOT NULL,
  password_hash BYTEA NOT NULL,
  password_salt BYTEA,
  password_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  disabled      BOOLEAN NOT NULL DEFAULT FALSE,
  expired       BOOLEAN NOT NULL DEFAULT FALSE,
  access_window_start TIME,
  access_window_end   TIME,
  valid_from    DATE,
  valid_until   DATE,
  timezone      VARCHAR(64),
  full_name     VARCHAR(256),
  email_address VARCHAR(256),
  organization  VARCHAR(256),
  organizational_role VARCHAR(256),
  FOREIGN KEY (entity_id)
    REFERENCES guacamole_entity (entity_id)
    ON DELETE CASCADE,
  UNIQUE (entity_id)
);

-- Example of user and permission initialization for PostgreSQL
-- Create default user "guacadmin" with password "guacadmin"
-- Note: This example uses hardcoded hash and salt for demonstration. 
-- You should generate secure values for production use.

INSERT INTO guacamole_entity (name, type) VALUES ('guacadmin', 'USER');

-- Assuming you have a function to generate password hashes and salts,
-- replace the placeholders with actual calls to such functions.
INSERT INTO guacamole_user (entity_id, password_hash, password_salt, password_date)
SELECT
    entity_id,
    decode('CA458A7D494E3BE824F5E1E175A1556C0F8EEF2C2D7DF3633BEC4A29C4411960', 'hex'),
    decode('FE24ADC5E11E2B25288D1704ABE67A79E342ECC26064CE69C5B3177795A82264', 'hex'),
    NOW()
FROM guacamole_entity WHERE name = 'guacadmin';

-- Additional permissions and data initialization should follow the same pattern,
-- adjusting SQL syntax and data types to be compatible with PostgreSQL.
