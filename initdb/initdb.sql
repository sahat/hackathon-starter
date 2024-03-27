-- Create default user "guacadmin" with password "guacadmin"
INSERT INTO guacamole_entity (name, type) VALUES ('guacadmin', 'USER');
INSERT INTO guacamole_user (entity_id, password_hash, password_salt, password_date)
SELECT
    entity_id,
    decode('CA458A7D494E3BE824F5E1E175A1556C0F8EEF2C2D7DF3633BEC4A29C4411960', 'hex'),  -- Password hash for 'guacadmin'
    decode('FE24ADC5E11E2B25288D1704ABE67A79E342ECC26064CE69C5B3177795A82264', 'hex'),  -- Salt for 'guacadmin'
    NOW()
FROM guacamole_entity WHERE name = 'guacadmin';

-- Grant this user all system permissions
INSERT INTO guacamole_system_permission (entity_id, permission)
SELECT entity_id, permission
FROM (
          SELECT 'CREATE_CONNECTION'       AS permission
    UNION SELECT 'CREATE_CONNECTION_GROUP' AS permission
    UNION SELECT 'CREATE_SHARING_PROFILE'  AS permission
    UNION SELECT 'CREATE_USER'             AS permission
    UNION SELECT 'CREATE_USER_GROUP'       AS permission
    UNION SELECT 'ADMINISTER'              AS permission
) permissions, guacamole_entity WHERE guacamole_entity.name = 'guacadmin' AND guacamole_entity.type = 'USER';

-- Grant admin permission to read/update/administer self
INSERT INTO guacamole_user_permission (entity_id, affected_user_id, permission)
SELECT guacamole_entity.entity_id, guacamole_user.user_id, permission
FROM (
          SELECT 'READ'       AS permission
    UNION SELECT 'UPDATE'     AS permission
    UNION SELECT 'ADMINISTER' AS permission
) permissions, guacamole_entity, guacamole_user
WHERE guacamole_entity.name = 'guacadmin' AND guacamole_entity.type = 'USER' AND guacamole_user.entity_id = guacamole_entity.entity_id;

