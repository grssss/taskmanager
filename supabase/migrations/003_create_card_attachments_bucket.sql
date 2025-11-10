-- Ensure the storage bucket exists for card attachments
do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'card-attachments'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('card-attachments', 'card-attachments', true, null, null);
  end if;
end;
$$;

-- Allow anyone (including unauthenticated users) to read objects from this bucket
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow public read card attachments'
  ) then
    create policy "Allow public read card attachments"
      on storage.objects
      for select
      using (bucket_id = 'card-attachments');
  end if;
end;
$$;

-- Allow authenticated users to upload new files into the bucket
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated uploads to card attachments'
  ) then
    create policy "Allow authenticated uploads to card attachments"
      on storage.objects
      for insert
      with check (
        bucket_id = 'card-attachments'
        and auth.role() = 'authenticated'
      );
  end if;
end;
$$;

-- Allow owners to delete files they uploaded
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow owners delete card attachments'
  ) then
    create policy "Allow owners delete card attachments"
      on storage.objects
      for delete
      using (
        bucket_id = 'card-attachments'
        and auth.uid() = owner
      );
  end if;
end;
$$;
