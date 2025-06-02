# Database Schema Technical & Functional Documentation

## 1. Introduction
This document describes the complete database schema for the application, incorporating user management, subscription packages, event ticketing, blog publishing, and ancillary features (contacts, newsletters, admin logs, and password resets). It covers each table’s structure, field definitions, indexes, constraints, and inter-table relationships. Functionally, it explains how the schema supports features such as user registration and login, paid/unpaid subscriptions, event ticket sales with per-package capacity and waitlists, blog drafts and publishing, and future expansions like analytics and automated reminders. This technical guide aims to help developers, DBAs, or new team members understand and extend the database.

## 2. Schemas for All Tables & Field Explanations

Below are all tables (both existing and newly introduced), with field definitions, data types, and a brief description of each column’s purpose.

### 2.1. `users`
**Stores:** Registered user accounts and authentication details.
```sql
CREATE TABLE users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username         VARCHAR(50) NOT NULL UNIQUE,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    TEXT        NULL,
  oauth_provider   VARCHAR(20) NOT NULL 
                    DEFAULT 'local' 
                    CHECK (oauth_provider IN ('local','google','github','apple','other')),
  oauth_provider_id VARCHAR(255) NULL,
  last_login_at    TIMESTAMP   NULL,
  created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status           VARCHAR(10) NOT NULL 
                    DEFAULT 'active' 
                    CHECK (status IN ('active','inactive'))
);
```
- **id**: Surrogate primary key (UUID).
- **username**: Unique login name (max 50 chars).
- **email**: Unique email for login/notifications.
- **password_hash**: Bcrypt hash; NULL for OAuth users.
- **oauth_provider**: Indicates authentication method; enforced by a CHECK.
- **oauth_provider_id**: External provider’s user ID (e.g., Google sub).
- **last_login_at**: Updated on each successful login.
- **created_at / updated_at**: Audit timestamps; `updated_at` should be set via trigger or application logic.
- **status**: ‘active’ or ‘inactive’ (soft-disable an account).

### 2.2. `packages`
**Stores:** Both subscription service packages and event ticket packages.
```sql
CREATE TABLE packages (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                         VARCHAR(100) NOT NULL,
  slug                         VARCHAR(100) NOT NULL UNIQUE,
  description                  TEXT        NULL,
  price                        DECIMAL(10,2) NOT NULL,
  duration_days                INT         NOT NULL,
  is_active                    BOOLEAN     NOT NULL DEFAULT TRUE,
  package_type                 VARCHAR(15) NOT NULL 
                               CHECK (package_type IN ('subscription','event'))
                               DEFAULT 'subscription',
  event_id                     UUID        NULL 
                               REFERENCES events(id) ON DELETE CASCADE,
  capacity                     INT         NULL,
  package_registration_deadline TIMESTAMP  NULL,
  created_at                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- **id**: UUID primary key.
- **name / slug / description**: Metadata for display and routing.
- **price**: Amount payable (monetary).
- **duration_days**: Subscription length in days; for event tickets typically set to 0.
- **is_active**: Allows deactivating old or sold-out packages.
- **package_type**: Distinguishes “subscription” vs. “event” packages.
- **event_id**: Nullable. If `package_type = 'event'`, must link to `events.id`.
- **capacity**: Only used by event packages; maximum number of registrations allowed.
- **package_registration_deadline**: If set, users must register for that package by this time; otherwise, event’s `registration_deadline` applies.
- **created_at / updated_at**: Audit timestamps.

- **Additional updation required**: 
```sql
  -- 1. Enforce package_type ↔ event_id consistency
ALTER TABLE packages
  ADD CONSTRAINT chk_package_type_event
    CHECK (
      (package_type = 'subscription' AND event_id IS NULL)
      OR (package_type = 'event' AND event_id IS NOT NULL)
    );

-- 2. Add deactivated_at column (already assumed in model)
ALTER TABLE packages
  ADD COLUMN deactivated_at TIMESTAMP NULL;

-- 3. Index on event_id + is_active for fast lookups
CREATE INDEX idx_packages_event_active
  ON packages(event_id)
  WHERE is_active = TRUE;

-- 4. Index on package_type if you filter often by subscription vs. event
CREATE INDEX idx_packages_type
  ON packages(package_type);

-- 5. Unique index on slug (already assumed)
-- (If not already present)
CREATE UNIQUE INDEX idx_packages_slug_unique
  ON packages(slug);

-- 6. If you want to enforce a composite uniqueness of (event_id, slug):
--    e.g., two events can both have a "VIP" ticket, but a single event cannot.
CREATE UNIQUE INDEX idx_packages_event_slug
  ON packages(event_id, slug)
  WHERE event_id IS NOT NULL;

-- 7. (Optional) Create materialized view for capacity status if needed:
--    (Helps answer “how many seats remain” quickly.)
CREATE MATERIALIZED VIEW package_capacity_status AS
  SELECT
    p.id AS package_id,
    p.capacity,
    COUNT(er.*) FILTER (WHERE er.status = 'registered') AS registered_count,
    (p.capacity - COUNT(er.*) FILTER (WHERE er.status = 'registered')) AS seats_remaining
  FROM packages p
  LEFT JOIN event_registrations er ON er.package_id = p.id
  WHERE p.package_type = 'event' 
  GROUP BY p.id, p.capacity;
```

### 2.3. `orders`
**Stores:** Payment transactions (both subscription purchases and event ticket sales).
```sql
CREATE TABLE orders (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL 
                      REFERENCES users(id) ON DELETE CASCADE,
  package_id         UUID        NOT NULL 
                      REFERENCES packages(id) ON DELETE RESTRICT,
  payment_gateway    VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  payment_id         VARCHAR(255) NOT NULL,
  amount_paid        DECIMAL(10,2) NOT NULL,
  currency           VARCHAR(10) NOT NULL DEFAULT 'INR',
  payment_status     VARCHAR(10) NOT NULL
                     CHECK (payment_status IN ('pending','paid','failed','refunded')),
  purchased_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  access_expires_at  TIMESTAMP   NULL,
  updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- **id**: UUID primary key.
- **user_id**: References the buyer (must exist); cascades on user deletion.
- **package_id**: References the purchased package.
- **payment_gateway / payment_id**: Used for reconciliation and webhooks.
- **amount_paid / currency**: Monetary details.
- **payment_status**: Tracks transaction state; enforced by a CHECK.
- **purchased_at**: Timestamp of transaction.
- **access_expires_at**: For subscription packages, denotes when the subscription ends (NULL for event tickets).
- **updated_at**: Auto-updated on each change.

### 2.4. `contacts`
**Stores:** “Contact Us” form submissions.
```sql
CREATE TABLE contacts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NULL 
                 REFERENCES users(id) ON DELETE SET NULL,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(255) NOT NULL,
  country_code   VARCHAR(5)   NOT NULL,
  phone_number   VARCHAR(15)  NOT NULL,
  subject        VARCHAR(255) NULL,
  message        TEXT        NOT NULL,
  status         VARCHAR(10) NOT NULL 
                 DEFAULT 'unread' 
                 CHECK (status IN ('unread','read','resolved')),
  token          UUID        NOT NULL DEFAULT gen_random_uuid(),
  submitted_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- **id**: UUID primary key.
- **user_id**: Nullable; set if the submitter was logged in.
- **name / email / country_code / phone_number**: Contact info.
- **subject / message**: Core inquiry.
- **status**: Workflow field—‘unread’, ‘read’, or ‘resolved’.
- **token**: Unique one-time link for staff to follow up.
- **submitted_at / updated_at**: Timestamps for submission and last status change.

### 2.5. `newsletter_subscriptions`
**Stores:** Email subscriptions with double-opt-in verification.
```sql
CREATE TABLE newsletter_subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_verified         BOOLEAN     NOT NULL DEFAULT FALSE,
  unsubscribe_token   UUID         NULL,
  verified_at         TIMESTAMP    NULL
);
```
- **id**: UUID primary key.
- **email**: Unique subscriber email.
- **subscribed_at**: Timestamp of initial opt-in.
- **is_verified**: Set to TRUE once user confirms via emailed link.
- **unsubscribe_token**: UUID used in one-click unsubscribe links.
- **verified_at**: Timestamp when email was confirmed (NULL until verified).

### 2.6. `admin_logs`
**Stores:** Immutable ledger of administrative actions.
```sql
CREATE TABLE admin_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID        NOT NULL 
               REFERENCES users(id) ON DELETE CASCADE,
  action_type  VARCHAR(100) NOT NULL,
  description  TEXT        NULL,
  logged_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- **id**: UUID primary key.
- **admin_id**: References the acting administrator; cascades if user is deleted.
- **action_type**: Short code indicating the type of action.
- **description**: Detailed notes or context.
- **logged_at**: Timestamp of the action.

### 2.7. `password_resets`
**Stores:** One-time reset tokens for “Forgot Password” flows.
```sql
CREATE TABLE password_resets (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID      NOT NULL 
                REFERENCES users(id) ON DELETE CASCADE,
  reset_token   UUID      NOT NULL UNIQUE,
  is_used       BOOLEAN   NOT NULL DEFAULT FALSE,
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- **id**: UUID primary key.
- **user_id**: References the affected user; cascades on user deletion.
- **reset_token**: Unique UUID used in reset URLs.
- **is_used**: Prevents re-use of the link once consumed.
- **expires_at**: After this timestamp, the token is invalid.
- **created_at**: Timestamp of request.

### 2.8. `blogs`
**Stores:** Blog posts (drafts or published) with soft deletion, view count, and IPFS-hosted media.
```sql
CREATE TABLE blogs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id      UUID        NOT NULL 
                 REFERENCES users(id) ON DELETE RESTRICT,
  title          VARCHAR(255) NULL,
  slug           VARCHAR(255) UNIQUE,
  summary        TEXT        NULL,
  content        TEXT        NULL,
  media_cid      VARCHAR(255) NULL,
  status         VARCHAR(10) NOT NULL 
                 CHECK (status IN ('draft','published','archived'))
                 DEFAULT 'draft',
  views_count    INT        NOT NULL DEFAULT 0,
  published_at   TIMESTAMP  NULL,
  deleted_at     TIMESTAMP  NULL,
  created_at     TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_publish_fields
    CHECK (
      status <> 'published' 
      OR (title IS NOT NULL 
          AND slug IS NOT NULL 
          AND content IS NOT NULL)
    )
);
```
- **id**: UUID primary key.
- **author_id**: Must reference `users.id`; only admins should populate this.
- **title / slug / summary / content**: Core blog fields; when `status='draft'` they may be NULL; when `status='published'`, CHECK enforces presence.
- **media_cid**: IPFS content identifier; front-end loads video via a gateway.
- **status**: ‘draft’, ‘published’, or ‘archived’.
- **views_count**: Numeric counter incremented on each public view.
- **published_at**: Timestamp when the post was first published.
- **deleted_at**: If non-NULL, the row is considered “archived” and not shown publicly.
- **created_at / updated_at**: Audit timestamps.

### 2.9. `events`
**Stores:** Event definitions (drafts, published, cancelled, completed).
```sql
CREATE TABLE events (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by              UUID        NOT NULL 
                           REFERENCES users(id) ON DELETE RESTRICT,
  title                   VARCHAR(255) NULL,
  slug                    VARCHAR(255) UNIQUE,
  description             TEXT        NULL,
  location                VARCHAR(255) NULL,
  start_time              TIMESTAMP   NULL,
  end_time                TIMESTAMP   NULL,
  registration_deadline   TIMESTAMP   NULL,
  packages_ids            UUID[]      NOT NULL DEFAULT '{}',
  payment_required        BOOLEAN     NOT NULL DEFAULT FALSE,
  status                  VARCHAR(15) NOT NULL 
                             CHECK (status IN ('draft','published','cancelled','completed'))
                             DEFAULT 'draft',
  published_at            TIMESTAMP   NULL,
  cancelled_at            TIMESTAMP   NULL,
  created_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at              TIMESTAMP   NULL,
  CONSTRAINT chk_publish_event
    CHECK (
      status <> 'published' 
      OR (title IS NOT NULL 
          AND slug IS NOT NULL 
          AND start_time IS NOT NULL 
          AND location IS NOT NULL)
    )
);
```
- **id**: UUID primary key.
- **created_by**: Admin user ID who created the event.
- **title / slug / description / location / start_time / end_time / registration_deadline**: Core event fields; CHECK ensures required fields are set before publishing.
- **packages_ids**: Array of ticket package IDs (UUIDs) for convenience, updated via triggers.
- **payment_required**: If TRUE, every registration must involve a paid package.
- **status**: ‘draft’, ‘published’, ‘cancelled’, or ‘completed’.
- **published_at / cancelled_at / deleted_at**: Timestamps for lifecycle steps.
- **created_at / updated_at**: Audit timestamps.

### 2.10. `event_registrations`
**Stores:** Individual registrations for event packages (with per-package capacity & waitlist).
```sql
CREATE TABLE event_registrations (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id           UUID        NOT NULL 
                      REFERENCES events(id) ON DELETE CASCADE,
  user_id            UUID        NULL 
                      REFERENCES users(id) ON DELETE SET NULL,
  attendee_name      VARCHAR(150) NULL,
  attendee_email     VARCHAR(255) NOT NULL,
  phone_number       VARCHAR(15)  NULL,
  package_id         UUID        NOT NULL 
                      REFERENCES packages(id) ON DELETE RESTRICT,
  order_id           UUID        NULL 
                      REFERENCES orders(id) ON DELETE SET NULL,
  status             VARCHAR(15) NOT NULL 
                      CHECK (status IN ('registered','waitlisted','cancelled','attended','no_show'))
                      DEFAULT 'registered',
  registered_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at       TIMESTAMP   NULL,
  waitlist_position  INT         NULL,
  registration_token UUID        NOT NULL DEFAULT gen_random_uuid(),
  created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
- **id**: UUID primary key.
- **event_id**: Parent event; cascades on deletion.
- **user_id**: If a logged-in user registers, store their ID; else NULL.
- **attendee_name / attendee_email**: Necessary contact info; if `user_id` present, you may duplicate for historical accuracy.
- **phone_number**: Optional.
- **package_id**: Specific ticket package; capacity and waitlist logic are per package.
- **order_id**: Linked order record (if paid).
- **status**: Registration lifecycle—‘registered’, ‘waitlisted’, ‘cancelled’, ‘attended’, or ‘no_show’.
- **registered_at / cancelled_at**: Timestamps for registration and cancellation.
- **waitlist_position**: Numeric position if `status='waitlisted'`.
- **registration_token**: UUID for one-click cancellation without login.
- **created_at / updated_at**: Audit timestamps.

## 3. Indexes, Constraints & Foreign-Key Links

### 3.1. `users`
- **PRIMARY KEY (id)** automatically implies a unique index.
- **UNIQUE (username)**
- **UNIQUE (email)**
- **CHECK (oauth_provider IN ('local','google','github','apple','other'))**
- **CHECK (status IN ('active','inactive'))**

### 3.2. `packages`
- **PRIMARY KEY (id)**
- **UNIQUE (slug)**
- **CHECK (package_type IN ('subscription','event'))**
- **FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE**
- **CHECK ((package_type = 'subscription' AND event_id IS NULL) OR (package_type = 'event' AND event_id IS NOT NULL))**

### 3.3. `orders`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE**
- **FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT**
- **CHECK (payment_status IN ('pending','paid','failed','refunded'))**
- **INDEX idx_orders_user_id ON orders(user_id)**

### 3.4. `contacts`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL**
- **CHECK (status IN ('unread','read','resolved'))**
- **INDEX idx_contacts_email ON contacts(email)**

### 3.5. `newsletter_subscriptions`
- **PRIMARY KEY (id)**
- **UNIQUE (email)**
- **INDEX idx_newsletter_unsubscribe_token ON newsletter_subscriptions(unsubscribe_token)**

### 3.6. `admin_logs`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE**
- **INDEX idx_admin_logs_admin_id ON admin_logs(admin_id)**

### 3.7. `password_resets`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE**
- **UNIQUE (reset_token)**
- **INDEX idx_password_resets_user_id ON password_resets(user_id)**

### 3.8. `blogs`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT**
- **UNIQUE (slug)**
- **CHECK (status IN ('draft','published','archived'))**
- **CHECK (status <> 'published' OR (title IS NOT NULL AND slug IS NOT NULL AND content IS NOT NULL))**
- **INDEX idx_blogs_live ON blogs(status, deleted_at)**

### 3.9. `events`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT**
- **UNIQUE (slug)**
- **CHECK (status IN ('draft','published','cancelled','completed'))**
- **CHECK (status <> 'published' OR (title IS NOT NULL AND slug IS NOT NULL AND start_time IS NOT NULL AND location IS NOT NULL))**
- **INDEX idx_events_live ON events(status, deleted_at, start_time)**
- **Triggers:**  
  - `trg_set_updated_at_events` (auto-update `updated_at`)  
  - `trg_pkg_insert_update_event_array`, `trg_pkg_delete_update_event_array` (keep `packages_ids` in sync)

### 3.10. `event_registrations`
- **PRIMARY KEY (id)**
- **FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE**
- **FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL**
- **FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT**
- **FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL**
- **UNIQUE (package_id, attendee_email)**  
- **CHECK (status IN ('registered','waitlisted','cancelled','attended','no_show'))**  
- **INDEX idx_pkg_regs_status ON event_registrations(package_id, status)**  
- **Trigger:** `trg_set_updated_at_event_regs` (auto-update `updated_at`)

## 4. Relationships & Functional Usage

Below is a concise Entity-Relationship (ER) summary. Primary keys (PK) and foreign keys (FK) are indicated as follows:

- PK: primary key  
- FK →: foreign key  

```
users (PK id)
  ├─<orders>.user_id FK → users.id
  ├─<contacts>.user_id FK → users.id
  ├─<admin_logs>.admin_id FK → users.id
  ├─<password_resets>.user_id FK → users.id
  ├─<blogs>.author_id FK → users.id
  └─<events>.created_by FK → users.id

packages (PK id)
  ├─package_type IN { subscription, event }
  ├─event_id FK → events.id (nullable when subscription)
  └─capacity (INT, only used when package_type='event')

orders (PK id)
  ├─user_id FK → users.id
  └─package_id FK → packages.id

contacts (PK id)
  └─user_id FK → users.id (nullable)

newsletter_subscriptions (PK id)

admin_logs (PK id)
  └─admin_id FK → users.id

password_resets (PK id)
  └─user_id FK → users.id

blogs (PK id)
  └─author_id FK → users.id

events (PK id)
  ├─created_by FK → users.id
  └─packages_ids UUID[] (array of package IDs, updated by triggers)

event_registrations (PK id)
  ├─event_id FK → events.id
  ├─user_id FK → users.id (nullable)
  ├─package_id FK → packages.id
  └─order_id FK → orders.id (nullable)
```

### Functional Scenarios

1. **User Buys Event Ticket**  
   - User logs in → backend queries “SELECT * FROM packages WHERE package_type='event' AND event_id=?”.
   - User selects package; backend checks capacity via “SELECT COUNT(*) … WHERE package_id=? AND status='registered'.”  
   - If available, initiate payment; on success, INSERT `orders` + `event_registrations`.  

2. **Event Organizer Reviews Registrations**  
   - Organizer queries “SELECT * FROM event_registrations WHERE event_id = ?”.  
   - They see who is `registered` vs. `waitlisted`.  
   - If capacity expands, run promotion logic for waitlisted rows.  

3. **User Cancels Registration**  
   - User clicks one-time link (identified by `registration_token`); backend updates that row’s `status='cancelled'` and promotes next waitlisted row.  

4. **Admin Archives a Blog Post**  
   - Admin updates “UPDATE blogs SET status='archived', deleted_at=NOW() WHERE id = ?”.  
   - Public queries exclude archived posts.  

5. **Admin Deletes a Package**  
   - DELETE FROM packages WHERE id = ?. Trigger removes it from `events.packages_ids`. Registrations remain historical.

## 5. Future/Planned Features & Helper Notes

### 5.1. Automated Email Reminders & Notifications
- **Fields Available:**  
  - `newsletter_subscriptions.is_verified`, `unsubscribe_token` → For opt-in confirmations and unsubscribe.  
  - `event_registrations.registration_token` → For cancellation links.  
  - `events.published_at`, `registration_deadline` → For scheduling event reminders.  
- **Future:**  
  - Create a `scheduled_emails` table to enqueue reminders.  
  - Add `reminder_sent_at TIMESTAMP` to `event_registrations`.  

### 5.2. Analytics & Reporting
- **Fields Available:**  
  - `blogs.views_count` → For trending metrics.  
  - `event_registrations.status` → For dashboard statistics.  
  - `orders.purchased_at`, `amount_paid` → For revenue tracking.  
- **Future:**  
  - Create an `analytics_events` table to log page views or user actions.  
  - Add `analytics_enabled BOOLEAN` to tables needing monitoring.  

### 5.3. Commenting on Blog Posts
- **Proposed Table:**  
  ```sql
  CREATE TABLE blog_comments (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id      UUID        NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
    user_id      UUID        NULL REFERENCES users(id) ON DELETE SET NULL,
    content      TEXT        NOT NULL,
    status       VARCHAR(10) NOT NULL 
                 CHECK (status IN ('visible','hidden','flagged'))
                 DEFAULT 'visible',
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  ```

### 5.4. Event Custom Registration Questions
- **Schema Change:**  
  ```sql
  ALTER TABLE event_registrations
    ADD COLUMN registration_meta JSONB NULL;
  ```  
- Store ad-hoc fields like `{ "meal_preference":"vegetarian", "company":"Acme" }`.

### 5.5. Role-Based Access Control (RBAC)
- **Proposed Tables:**  
  ```sql
  CREATE TABLE roles (
    id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE
  );

  CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
  );
  ```  
- Allows multiple roles per user for fine-grained permissions.

### 5.6. Multi-Currency & Localization
- **Possible Additions:**  
  1. `currencies(code VARCHAR(10) PRIMARY KEY, symbol VARCHAR(5), exchange_rate_to_inr DECIMAL(10,4))`.  
  2. Add `currency VARCHAR(10)` to `packages` (instead of default ‘INR’).  
  3. Add `language_code VARCHAR(10)` to `blogs` and `events`.

### 5.7. Data Archival & Cleanup
- **Current Soft-Deletes:** `deleted_at` in `blogs` and `events`.  
- **Future:**  
  - Scheduled jobs to move old archived rows to archive tables.  
  - Purge stale `contacts` or expired `password_resets` after a period.

### 5.8. Audit & Versioning
- **Current Audit Fields:** All tables have `created_at` and `updated_at`.  
- **Future:**  
  - Add `version INT` or create history tables, e.g., `blogs_history` to store previous versions on update.

### 5.9. Concurrency & Atomic Capacity Checks
- **Issue:** Two concurrent registrations might overshoot capacity.  
- **Solutions:**  
  - Wrap capacity check + insert in a serializable transaction.  
  - Use `SELECT COUNT(*) ... FOR UPDATE` on a helper row.  

### 5.10. Security & Data Privacy
- Never return `password_hash` in API responses.  
- Store `registration_token` securely and avoid logging it.  
- Use parameterized queries to prevent SQL injection.

**Helper Tips for Developers / DBAs**  
1. **Triggers:** Ensure triggers are created after tables exist, in proper order.  
2. **Naming Conventions:** PKs are `id` (UUID), FKs are `<tablename>_id`, timestamps end with `_at`.  
3. **Soft-Delete:** Always filter by `deleted_at IS NULL` in active queries.  
4. **Arrays in `packages_ids`:** Use \`array_append\` and \`array_remove\` functions or rely on triggers.  
5. **Use of `registration_token`:** Provide one-click cancellation links.  
6. **Referential Integrity:** Be cautious when bulk deleting; foreign keys may cascade.  
7. **Capacity Race Conditions:** Use transactions or database locking for high-traffic events.

---
