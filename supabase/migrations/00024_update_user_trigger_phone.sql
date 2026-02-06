-- Update the handle_new_user trigger to also save phone and region_id from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, phone, region_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'region_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
