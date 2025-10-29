-- =========================
-- 1. Admins Table
-- =========================
create table public.admins (
    id serial primary key,
    name varchar(255) not null,
    email varchar(255) unique not null,
    password varchar(255) not null,
    created_at timestamp default now()
);

-- =========================
-- 2. Products Table
-- =========================
create table public.products (
    id serial primary key,
    name varchar(255) not null,
    rfid_tag varchar(255) unique not null,
    price numeric(10,2) not null,
    weight numeric(10,2) not null,
    stock_quantity int not null default 0,
    photo_url text,
    created_at timestamp default now()
);

-- =========================
-- 3. Carts Table
-- =========================
create table public.carts (
    id serial primary key,
    status varchar(10) check (status in ('active','inactive')) default 'inactive',
    total_weight numeric(10,2) default 0,
    created_at timestamp default now(),
    updated_at timestamp default now()
);

-- =========================
-- 4. CartItems Table
-- =========================
create table public.cart_items (
    id serial primary key,
    cart_id int references public.carts(id) on delete cascade,
    product_id int references public.products(id) on delete restrict,
    quantity int not null default 1,
    item_weight numeric(10,2) not null,
    added_at timestamp default now()
);

-- =========================
-- 5. Transactions Table
-- =========================
create table public.transactions (
    id serial primary key,
    cart_id int references public.carts(id) on delete restrict,
    email varchar(255),
    total_amount numeric(10,2) not null,
    total_weight numeric(10,2) not null,
    payment_method varchar(20) check (payment_method in ('card','UPI','cash')) not null,
    status varchar(20) check (status in ('completed','failed','pending')) not null default 'pending',
    transaction_time timestamp default now()
);

-- =========================
-- Enable Row Level Security
-- =========================
alter table public.admins enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.transactions enable row level security;

-- =========================
-- RLS Policies (Public read for products, restricted write)
-- =========================

-- Products: Anyone can read, only admins can modify (we'll handle admin auth separately)
create policy "Anyone can view products"
on public.products for select
using (true);

create policy "Service role can manage products"
on public.products for all
using (auth.role() = 'service_role');

-- Carts: Anyone can read and create
create policy "Anyone can view carts"
on public.carts for select
using (true);

create policy "Anyone can create carts"
on public.carts for insert
with check (true);

create policy "Anyone can update carts"
on public.carts for update
using (true);

-- Cart Items: Anyone can manage
create policy "Anyone can view cart items"
on public.cart_items for select
using (true);

create policy "Anyone can manage cart items"
on public.cart_items for all
using (true);

-- Transactions: Anyone can read and create
create policy "Anyone can view transactions"
on public.transactions for select
using (true);

create policy "Anyone can create transactions"
on public.transactions for insert
with check (true);

-- Admins: Only service role can access
create policy "Service role can manage admins"
on public.admins for all
using (auth.role() = 'service_role');

-- =========================
-- Enable Realtime for Carts and Cart Items
-- =========================
alter table public.carts replica identity full;
alter publication supabase_realtime add table public.carts;

alter table public.cart_items replica identity full;
alter publication supabase_realtime add table public.cart_items;

-- =========================
-- Sample Data
-- =========================
insert into public.admins (name, email, password) values 
('Admin User', 'admin@store.com', 'admin123');

insert into public.products (name, rfid_tag, price, weight, stock_quantity, photo_url) values 
('Milk 1L', 'RFID001', 2.99, 1.05, 50, null),
('Bread Loaf', 'RFID002', 1.99, 0.45, 100, null),
('Orange Juice 500ml', 'RFID003', 3.49, 0.55, 75, null),
('Butter 250g', 'RFID004', 4.99, 0.25, 60, null),
('Eggs (12 pack)', 'RFID005', 5.99, 0.72, 80, null);