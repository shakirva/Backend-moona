-- ============================================================================
-- Script: add_user_addresses_geo.sql
-- Purpose: Adds geolocation and full address support to the `user_addresses` table
-- Columns Added:
--   latitude      DECIMAL(10,7)  - Precise latitude (range -90 to 90)
--   longitude     DECIMAL(10,7)  - Precise longitude (range -180 to 180)
--   full_address  VARCHAR(500)   - Human readable combined address from map picker
-- Notes:
--   1. Adjust precision (DECIMAL(p,s)) if you need different scale. 6–7 decimal places
--      give sub‑meter accuracy which is fine for delivery.
--   2. Run this ONLY once. If columns already exist you will get an error; remove the
--      corresponding ALTER statements manually in that case.
--   3. Optional indexes included to speed up lookups by shopify_id + created_at and
--      potential geospatial range queries on latitude/longitude.
--   4. Application code now sends these fields in POST /api/user/address/save and
--      /api/user/update-address. Ensure this migration is applied before deploying.
-- ============================================================================

-- === Add new columns (place after existing `status` for logical grouping) ===
ALTER TABLE user_addresses
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER status,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude,
  ADD COLUMN full_address VARCHAR(500) NULL AFTER longitude;

-- === (Optional) Composite index to speed filtering by user and recency ===
ALTER TABLE user_addresses
  ADD INDEX idx_user_addresses_shopify_created (shopify_id, created_at);

-- === (Optional) Basic index on coordinates for range bounding box searches ===
ALTER TABLE user_addresses
  ADD INDEX idx_user_addresses_lat_lon (latitude, longitude);

-- === Verification Queries (run after migration) ===
-- DESCRIBE user_addresses;                      -- Check new columns
-- SELECT latitude, longitude FROM user_addresses LIMIT 5;  -- Sample values

-- === Rollback (manual) ===
-- ALTER TABLE user_addresses
--   DROP COLUMN full_address,
--   DROP COLUMN longitude,
--   DROP COLUMN latitude;
-- DROP INDEX idx_user_addresses_lat_lon ON user_addresses;
-- DROP INDEX idx_user_addresses_shopify_created ON user_addresses;

-- ============================================================================
-- End of script
-- ============================================================================
