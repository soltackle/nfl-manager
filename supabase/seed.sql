DO $$
DECLARE
  pos player_position;
  pos_count int;
  idx int;
  ovr int;
  val int;
  positions player_position[] := ARRAY['QB'::player_position, 'RB'::player_position, 'WR'::player_position, 'TE'::player_position, 'OL'::player_position, 'DE'::player_position, 'LB'::player_position, 'CB'::player_position, 'S'::player_position];
  counts int[] := ARRAY[24, 48, 72, 24, 48, 24, 24, 24, 12];
  i int;
BEGIN
  FOR i IN 1..array_length(positions, 1) LOOP
    pos := positions[i];
    pos_count := counts[i];
    FOR idx IN 1..pos_count LOOP
      -- Normal distribution approx using central limit theorem (sum of 3 uniforms)
      ovr := 55 + floor(random()*10 + random()*10 + random()*10);
      IF ovr > 85 THEN ovr := 85; END IF;
      IF ovr < 55 THEN ovr := 55; END IF;
      
      -- Value increases exponentially with overall
      val := (ovr - 50) * (ovr - 50) * 200 + floor(random() * 5000);
      
      INSERT INTO players (name, position, overall, value)
      VALUES ('Player ' || pos || ' ' || idx, pos, ovr, val);
    END LOOP;
  END LOOP;
END;
$$;
