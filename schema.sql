-- CivExpander Supabase Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table if not exists users (
  id uuid references auth.users on delete cascade not null primary key,
  company_name text not null,
  business_type text, -- e.g., LLC, C-Corp, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- JURISDICTIONS TABLE
create table if not exists jurisdictions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique, -- e.g. "CA", "NY", "US-FEDERAL"
  country text default 'US' not null
);

-- REQUIREMENTS TABLE
create table if not exists requirements (
  id uuid default uuid_generate_v4() primary key,
  jurisdiction_id uuid references jurisdictions(id) on delete cascade not null,
  name text not null,
  description text,
  urgency text, -- e.g. "Critical", "Moderate", "Standard"
  agency text, -- e.g. "Secretary of State"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMPANY LICENSES TABLE (Used for gap analysis and tracking)
create table if not exists company_licenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  requirement_id uuid references requirements(id) on delete set null,
  document_url text, -- Supabase Storage URL
  status text default 'Missing' not null, -- 'Missing', 'Uploaded', 'Verified', 'Expired'
  issued_date date,
  expiration_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DEADLINES TABLE (Dashboard tracking and alerts)
create table if not exists deadlines (
  id uuid default uuid_generate_v4() primary key,
  company_license_id uuid references company_licenses(id) on delete cascade not null,
  expiration_date date not null,
  notified_60 boolean default false,
  notified_30 boolean default false,
  notified_7 boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies

-- Users
alter table users enable row level security;
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Jurisdictions (Public read access for authenticated users)
alter table jurisdictions enable row level security;
create policy "Anyone can read jurisdictions" on jurisdictions for select using (true);

-- Requirements (Public read access for authenticated users)
alter table requirements enable row level security;
create policy "Anyone can read requirements" on requirements for select using (true);

-- Company Licenses (Private to user)
alter table company_licenses enable row level security;
create policy "Users can view own licenses" on company_licenses for select using (auth.uid() = user_id);
create policy "Users can insert own licenses" on company_licenses for insert with check (auth.uid() = user_id);
create policy "Users can update own licenses" on company_licenses for update using (auth.uid() = user_id);
create policy "Users can delete own licenses" on company_licenses for delete using (auth.uid() = user_id);

-- Deadlines (Private to user via relationship)
alter table deadlines enable row level security;
create policy "Users can view own deadlines" on deadlines for select using (
  exists (select 1 from company_licenses where id = company_license_id and user_id = auth.uid())
);
create policy "Users can insert own deadlines" on deadlines for insert with check (
  exists (select 1 from company_licenses where id = company_license_id and user_id = auth.uid())
);
create policy "Users can update own deadlines" on deadlines for update using (
  exists (select 1 from company_licenses where id = company_license_id and user_id = auth.uid())
);
create policy "Users can delete own deadlines" on deadlines for delete using (
  exists (select 1 from company_licenses where id = company_license_id and user_id = auth.uid())
);

-- Storage bucket for licenses (Assuming a bucket named "licenses")
-- create policy "Users can upload their own licenses" on storage.objects for insert with check ( bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1] );
