# Database Schema Document

This document outlines the PostgreSQL database schema for the AI-based startup landing page project. It includes table definitions, column details, relationships, and indexes.

---

## 1. users

**Description:** Stores registered user accounts and authentication details.

| Column                  | Type         | Constraints                                                                                       | Description                                          |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **id**                  | UUID         | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid()                                                | Surrogate primary key                                |
| **username**            | VARCHAR(50)  | NOT NULL, UNIQUE                                                                                  | Unique username                                      |
| **email**               | VARCHAR(255) | NOT NULL, UNIQUE                                                                                  | User’s login email                                   |
| **password\_hash**      | TEXT         | NULLABLE                                                                                          | Bcrypt-hashed password (nullable for OAuth accounts) |
| **oauth\_provider**     | VARCHAR(20)  | NOT NULL, DEFAULT 'local', CHECK (oauth\_provider IN ('local','google','github','apple','other')) | Authentication method                                |
| **oauth\_provider\_id** | VARCHAR(255) | NULLABLE                                                                                          | OAuth provider user ID                               |
| **last\_login\_at**     | TIMESTAMP    | NULLABLE                                                                                          | Timestamp of last login                              |
| **created\_at**         | TIMESTAMP    | NOT NULL, DEFAULT CURRENT\_TIMESTAMP                                                              | Account creation timestamp                           |
| **updated\_at**         | TIMESTAMP    | NOT NULL, DEFAULT CURRENT\_TIMESTAMP                                                              | Last update timestamp                                |
| **status**              | VARCHAR(10)  | NOT NULL, DEFAULT 'active', CHECK (status IN ('active','inactive'))                               | Account status                                       |

**Indexes:**

* Primary key on `id` (automatically indexed).
* Unique index on `username`.
* Unique index on `email`.

---

## 2. packages

**Description:** Defines service packages available for purchase.

| Column             | Type          | Constraints                                        | Description             |
| ------------------ | ------------- | -------------------------------------------------- | ----------------------- |
| **id**             | UUID          | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid() | Surrogate primary key   |
| **name**           | VARCHAR(100)  | NOT NULL                                           | Package name            |
| **slug**           | VARCHAR(100)  | NOT NULL, UNIQUE                                   | SEO-friendly URL slug   |
| **description**    | TEXT          | NULLABLE                                           | Package description     |
| **price**          | DECIMAL(10,2) | NOT NULL                                           | Package price           |
| **duration\_days** | INT           | NOT NULL                                           | Access duration in days |
| **is\_active**     | BOOLEAN       | NOT NULL, DEFAULT TRUE                             | Availability flag       |
| **created\_at**    | TIMESTAMP     | NOT NULL, DEFAULT CURRENT\_TIMESTAMP               | Creation timestamp      |
| **updated\_at**    | TIMESTAMP     | NOT NULL, DEFAULT CURRENT\_TIMESTAMP               | Last update timestamp   |

**Indexes:**

* Primary key on `id` (implicitly indexed).

---

## 3. orders

**Description:** Records purchase transactions.

| Column                  | Type          | Constraints                                                                 | Description                       |
| ----------------------- | ------------- | --------------------------------------------------------------------------- | --------------------------------- |
| **id**                  | UUID          | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid()                          | Surrogate order ID                |
| **user\_id**            | UUID          | NOT NULL, REFERENCES users(id) ON DELETE CASCADE                            | Purchaser (user)                  |
| **package\_id**         | UUID          | NOT NULL, REFERENCES packages(id) ON DELETE RESTRICT                        | Purchased package                 |
| **payment\_gateway**    | VARCHAR(50)   | NOT NULL, DEFAULT 'razorpay'                                                | Payment gateway name              |
| **payment\_id**         | VARCHAR(255)  | NOT NULL                                                                    | External transaction reference ID |
| **amount\_paid**        | DECIMAL(10,2) | NOT NULL                                                                    | Amount charged                    |
| **currency**            | VARCHAR(10)   | NOT NULL, DEFAULT 'INR'                                                     | Currency code                     |
| **payment\_status**     | VARCHAR(10)   | NOT NULL, CHECK (payment\_status IN ('pending','paid','failed','refunded')) | Transaction status                |
| **purchased\_at**       | TIMESTAMP     | NOT NULL, DEFAULT CURRENT\_TIMESTAMP                                        | Purchase timestamp                |
| **access\_expires\_at** | TIMESTAMP     | NULLABLE                                                                    | Subscription expiry date          |
| **updated\_at**         | TIMESTAMP     | NOT NULL, DEFAULT CURRENT\_TIMESTAMP                                        | Last update timestamp             |

**Indexes:**

* Index on `user_id` (`CREATE INDEX idx_orders_user_id ON orders(user_id);`).

---

## 4. contacts

**Description:** Stores inbound Contact Us form submissions; links to users when applicable.

| Column            | Type         | Constraints                                                                | Description                       |
| ----------------- | ------------ | -------------------------------------------------------------------------- | --------------------------------- |
| **id**            | UUID         | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid()                         | Surrogate contact record ID       |
| **user\_id**      | UUID         | NULL, REFERENCES users(id) ON DELETE SET NULL                              | Linked user (if registered)       |
| **name**          | VARCHAR(150) | NOT NULL                                                                   | Sender’s name                     |
| **email**         | VARCHAR(255) | NOT NULL                                                                   | Sender’s email                    |
| **country\_code** | VARCHAR(5)   | NOT NULL                                                                   | E.g. '+1', '+91'                  |
| **phone\_number** | VARCHAR(15)  | NOT NULL                                                                   | Phone number (digits only)        |
| **subject**       | VARCHAR(255) | NULLABLE                                                                   | Message subject                   |
| **message**       | TEXT         | NOT NULL                                                                   | Message body                      |
| **status**        | VARCHAR(10)  | NOT NULL, DEFAULT 'unread', CHECK (status IN ('unread','read','resolved')) | Processing status                 |
| **token**         | UUID         | NOT NULL, DEFAULT gen\_random\_uuid()                                      | One-time link token for follow-up |
| **submitted\_at** | TIMESTAMP    | NOT NULL, DEFAULT CURRENT\_TIMESTAMP                                       | Submission timestamp              |
| **updated\_at**   | TIMESTAMP    | NOT NULL, DEFAULT CURRENT\_TIMESTAMP                                       | Last status update timestamp      |

**Indexes:**

* Index on `email` (`CREATE INDEX idx_contacts_email ON contacts(email);`).

---

## 5. newsletter\_subscriptions

**Description:** Manages email subscriptions with double-opt-in verification.

| Column                 | Type         | Constraints                                        | Description                      |
| ---------------------- | ------------ | -------------------------------------------------- | -------------------------------- |
| **id**                 | UUID         | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid() | Surrogate subscription record ID |
| **email**              | VARCHAR(255) | NOT NULL, UNIQUE                                   | Subscriber’s email address       |
| **subscribed\_at**     | TIMESTAMP    | NOT NULL, DEFAULT CURRENT\_TIMESTAMP               | Opt-in timestamp                 |
| **is\_verified**       | BOOLEAN      | NOT NULL, DEFAULT FALSE                            | Flag for email confirmation      |
| **unsubscribe\_token** | UUID         |                                                    | Token for one-click unsubscribe  |

**Indexes:**

* Index on `unsubscribe_token` (`CREATE INDEX idx_newsletter_unsubscribe_token ON newsletter_subscriptions(unsubscribe_token);`).

---

## 6. admin\_logs

**Description:** Immutable ledger of administrative actions.

| Column           | Type         | Constraints                                        | Description                       |
| ---------------- | ------------ | -------------------------------------------------- | --------------------------------- |
| **id**           | UUID         | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid() | Surrogate log entry ID            |
| **admin\_id**    | UUID         | NOT NULL, REFERENCES users(id) ON DELETE CASCADE   | Acting admin user                 |
| **action\_type** | VARCHAR(100) | NOT NULL                                           | Action code (e.g. 'update\_user') |
| **description**  | TEXT         | NULLABLE                                           | Detailed notes                    |
| **logged\_at**   | TIMESTAMP    | NOT NULL, DEFAULT CURRENT\_TIMESTAMP               | Action timestamp                  |

**Indexes:**

* Index on `admin_id` (`CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);`).

---

## 7. password\_resets

**Description:** Supports password reset requests and token management.

| Column           | Type      | Constraints                                        | Description                       |
| ---------------- | --------- | -------------------------------------------------- | --------------------------------- |
| **id**           | UUID      | PRIMARY KEY, NOT NULL, DEFAULT gen\_random\_uuid() | Surrogate reset request record ID |
| **user\_id**     | UUID      | NOT NULL, REFERENCES users(id) ON DELETE CASCADE   | Associated user                   |
| **reset\_token** | UUID      | NOT NULL, UNIQUE                                   | One-time reset token              |
| **is\_used**     | BOOLEAN   | NOT NULL, DEFAULT FALSE                            | Prevents reuse of token           |
| **expires\_at**  | TIMESTAMP | NOT NULL                                           | Token expiration time             |
| **created\_at**  | TIMESTAMP | NOT NULL, DEFAULT CURRENT\_TIMESTAMP               | Request timestamp                 |

**Indexes:**

* Index on `user_id` (`CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);`).

---

## Relationships

* **orders.user\_id** → **users.id**
* **orders.package\_id** → **packages.id**
* **contacts.user\_id** → **users.id** (nullable)
* **admin\_logs.admin\_id** → **users.id**
* **password\_resets.user\_id** → **users.id**

---