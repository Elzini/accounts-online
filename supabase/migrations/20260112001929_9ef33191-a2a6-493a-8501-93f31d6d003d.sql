-- Add validation constraints for data integrity

-- Customers table constraints
ALTER TABLE customers 
  ADD CONSTRAINT customer_name_length CHECK (length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT customer_phone_length CHECK (length(phone) BETWEEN 5 AND 30),
  ADD CONSTRAINT customer_id_number_length CHECK (id_number IS NULL OR length(id_number) <= 50),
  ADD CONSTRAINT customer_address_length CHECK (address IS NULL OR length(address) <= 500),
  ADD CONSTRAINT customer_registration_number_length CHECK (registration_number IS NULL OR length(registration_number) <= 50);

-- Suppliers table constraints
ALTER TABLE suppliers 
  ADD CONSTRAINT supplier_name_length CHECK (length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT supplier_phone_length CHECK (length(phone) BETWEEN 5 AND 30),
  ADD CONSTRAINT supplier_id_number_length CHECK (id_number IS NULL OR length(id_number) <= 50),
  ADD CONSTRAINT supplier_address_length CHECK (address IS NULL OR length(address) <= 500),
  ADD CONSTRAINT supplier_registration_number_length CHECK (registration_number IS NULL OR length(registration_number) <= 50),
  ADD CONSTRAINT supplier_notes_length CHECK (notes IS NULL OR length(notes) <= 1000);

-- Cars table constraints
ALTER TABLE cars
  ADD CONSTRAINT car_name_length CHECK (length(name) BETWEEN 1 AND 200),
  ADD CONSTRAINT car_model_length CHECK (model IS NULL OR length(model) <= 100),
  ADD CONSTRAINT car_color_length CHECK (color IS NULL OR length(color) <= 50),
  ADD CONSTRAINT car_chassis_number_length CHECK (length(chassis_number) BETWEEN 1 AND 50),
  ADD CONSTRAINT positive_purchase_price CHECK (purchase_price > 0),
  ADD CONSTRAINT valid_car_status CHECK (status IN ('available', 'sold'));

-- Sales table constraints
ALTER TABLE sales
  ADD CONSTRAINT positive_sale_price CHECK (sale_price > 0),
  ADD CONSTRAINT non_negative_commission CHECK (commission IS NULL OR commission >= 0),
  ADD CONSTRAINT non_negative_expenses CHECK (other_expenses IS NULL OR other_expenses >= 0),
  ADD CONSTRAINT seller_name_length CHECK (seller_name IS NULL OR length(seller_name) <= 200);

-- Profiles table constraints
ALTER TABLE profiles
  ADD CONSTRAINT profile_username_length CHECK (length(username) BETWEEN 1 AND 100);

-- App settings table constraints
ALTER TABLE app_settings
  ADD CONSTRAINT settings_key_length CHECK (length(key) BETWEEN 1 AND 100),
  ADD CONSTRAINT settings_value_length CHECK (value IS NULL OR length(value) <= 5000);