-- schema.sql
-- Postgres DB Schema (tables, constraints, triggers) - No Data

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- FUNCTIONS
CREATE FUNCTION public.set_updated_at_blogs() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.set_updated_at_event_regs() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.set_updated_at_events() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.trg_pkg_delete_update_event_array() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (OLD.package_type = 'event') THEN
    UPDATE events
      SET packages_ids = array_remove(packages_ids, OLD.id)
    WHERE id = OLD.event_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE FUNCTION public.trg_pkg_insert_update_event_array() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.package_type = 'event') THEN
    UPDATE events
      SET packages_ids = array_append(packages_ids, NEW.id)
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$;

-- TABLES

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username character varying(50) NOT NULL UNIQUE,
    email character varying(255) NOT NULL UNIQUE,
    password_hash text,
    oauth_provider character varying(20) DEFAULT 'local' NOT NULL CHECK (oauth_provider IN ('local', 'google', 'github', 'apple', 'other')),
    oauth_provider_id character varying(255),
    last_login_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(10) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
    role character varying(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin'))
);

CREATE TABLE public.admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type character varying(100) NOT NULL,
    description text,
    logged_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    name character varying(150) NOT NULL,
    email character varying(255) NOT NULL,
    country_code character varying(5) NOT NULL,
    phone_number character varying(15) NOT NULL,
    subject character varying(255),
    message text NOT NULL,
    status character varying(10) DEFAULT 'unread' NOT NULL CHECK (status IN ('unread', 'read', 'resolved')),
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    submitted_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.password_resets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reset_token uuid NOT NULL UNIQUE,
    is_used boolean DEFAULT false NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.newsletter_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email character varying(255) NOT NULL UNIQUE,
    subscribed_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    unsubscribe_token uuid
);

CREATE TABLE public.blogs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    title character varying(255),
    slug character varying(255) UNIQUE,
    summary text,
    content text,
    media_cid character varying(255),
    status character varying(10) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    views_count integer DEFAULT 0 NOT NULL,
    published_at timestamp,
    deleted_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_publish_fields CHECK (
        (status <> 'published') OR (title IS NOT NULL AND slug IS NOT NULL AND content IS NOT NULL)
    )
);

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    title character varying(255),
    slug character varying(255) UNIQUE,
    description text,
    location character varying(255),
    start_time timestamp,
    end_time timestamp,
    registration_deadline timestamp,
    packages_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    payment_required boolean DEFAULT false NOT NULL,
    status character varying(15) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    published_at timestamp,
    cancelled_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp,
    CONSTRAINT chk_publish_event CHECK (
        (status <> 'published') OR (title IS NOT NULL AND slug IS NOT NULL AND start_time IS NOT NULL AND location IS NOT NULL)
    )
);

CREATE TABLE public.packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    duration_days integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    package_type character varying(15) DEFAULT 'subscription' NOT NULL CHECK (package_type IN ('subscription', 'event')),
    event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
    capacity integer,
    package_registration_deadline timestamp,
    deactivated_at timestamp,
    CONSTRAINT chk_event_package CHECK (
        (package_type = 'subscription' AND event_id IS NULL)
        OR (package_type = 'event' AND event_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_packages_slug_unique ON public.packages (slug);
CREATE UNIQUE INDEX idx_packages_event_slug ON public.packages (event_id, slug) WHERE (event_id IS NOT NULL);

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    payment_gateway character varying(50) DEFAULT 'razorpay' NOT NULL,
    payment_id character varying(255) NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR' NOT NULL,
    payment_status character varying(10) NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    purchased_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    access_expires_at timestamp,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.event_registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    attendee_name character varying(150),
    attendee_email character varying(255) NOT NULL,
    phone_number character varying(15),
    package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    status character varying(15) DEFAULT 'registered' NOT NULL CHECK (status IN ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
    registered_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    cancelled_at timestamp,
    waitlist_position integer,
    registration_token uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- MATERIALIZED VIEW
CREATE MATERIALIZED VIEW public.package_capacity_status AS
 SELECT p.id AS package_id,
    p.capacity,
    count(er.*) FILTER (WHERE ((er.status)::text = 'registered'::text)) AS registered_count,
    (p.capacity - count(er.*) FILTER (WHERE ((er.status)::text = 'registered'::text))) AS seats_remaining
   FROM (public.packages p
     LEFT JOIN public.event_registrations er ON ((er.package_id = p.id)))
  WHERE ((p.package_type)::text = 'event'::text)
  GROUP BY p.id, p.capacity
  WITH NO DATA;

-- TRIGGERS
CREATE TRIGGER trg_set_updated_at_blogs BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_blogs();
CREATE TRIGGER trg_set_updated_at_events BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_events();
CREATE TRIGGER trg_set_updated_at_event_regs BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_event_regs();
CREATE TRIGGER trg_packages_after_insert AFTER INSERT ON public.packages FOR EACH ROW EXECUTE FUNCTION public.trg_pkg_insert_update_event_array();
CREATE TRIGGER trg_packages_after_delete AFTER DELETE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.trg_pkg_delete_update_event_array();

-- Indexes: You can add the remaining indexes as per the original schema if needed.
