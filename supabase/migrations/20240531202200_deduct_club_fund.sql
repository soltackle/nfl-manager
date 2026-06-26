CREATE OR REPLACE FUNCTION deduct_club_fund(p_franchise_id UUID, p_amount INTEGER) RETURNS VOID AS $$ 
BEGIN 
  UPDATE franchises 
  SET club_fund = club_fund - p_amount 
  WHERE id = p_franchise_id AND club_fund >= p_amount; 
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Yetersiz bakiye'; 
  END IF; 
END; 
$$ LANGUAGE plpgsql;
