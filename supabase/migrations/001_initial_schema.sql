-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (one per auth user)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  store_name text,
  phone      text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Clients
create table public.clients (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  full_name  text not null,
  phone      text not null,
  wilaya     text not null,
  commune    text not null,
  address    text not null,
  notes      text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Products (optional catalog)
create table public.products (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  sku        text,
  price      numeric(12, 2) not null default 0,
  stock      integer,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Orders
create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  client_id       uuid not null references public.clients(id),
  reference       text not null unique,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','returned')),
  total_amount    numeric(12, 2) not null default 0,
  delivery_fee    numeric(12, 2) not null default 0,
  notes           text,
  tracking_number text,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- Order items
create table public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(12, 2) not null,
  total_price  numeric(12, 2) not null
);

-- Indexes
create index on public.orders (user_id, created_at desc);
create index on public.orders (client_id);
create index on public.clients (user_id);
create index on public.order_items (order_id);

-- Row Level Security
alter table public.profiles   enable row level security;
alter table public.clients    enable row level security;
alter table public.products   enable row level security;
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;

-- Profiles RLS
create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- Clients RLS
create policy "Users manage own clients"
  on public.clients for all
  using (auth.uid() = user_id);

-- Products RLS
create policy "Users manage own products"
  on public.products for all
  using (auth.uid() = user_id);

-- Orders RLS
create policy "Users manage own orders"
  on public.orders for all
  using (auth.uid() = user_id);

-- Order items RLS (via parent order)
create policy "Users manage own order items"
  on public.order_items for all
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, store_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'store_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
