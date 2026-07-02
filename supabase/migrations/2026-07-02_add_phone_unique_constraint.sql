-- Forward Collective — migration: enforce unique phone per account
--
-- Run this manually in the Supabase SQL editor against the production
-- database. schema.sql only sets `phone text unique` for a fresh install;
-- this applies the same constraint to the already-provisioned `users`
-- table, closing a gap where two different accounts could otherwise
-- share the same phone number with nothing stopping it at the DB level.
--
-- Why this matters: subscribeMember() / ensureMember() key off phone to
-- look up and merge a member's record. Two accounts sharing a phone
-- would make that lookup ambiguous and risk mixing up two customers' data.

-- Step 1 — check for existing duplicates. The ALTER TABLE below will fail
-- if any duplicate non-null phone numbers already exist. If this returns
-- any rows, resolve those accounts manually (merge or clear the phone on
-- the incorrect one) before re-running Step 2.
select phone, count(*) as accounts
from users
where phone is not null
group by phone
having count(*) > 1;

-- Step 2 — once Step 1 returns zero rows, apply the constraint.
-- (NULL phones are unaffected — Postgres treats each NULL as distinct,
-- so members who haven't given a phone number yet are never blocked.)
alter table users
  add constraint users_phone_unique unique (phone);
