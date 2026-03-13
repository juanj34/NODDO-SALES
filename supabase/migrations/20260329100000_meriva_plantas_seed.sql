-- Seed plantas (floor plans) for the Meriva project and assign units to them.
-- This creates one planta per residential floor per tower, then positions
-- each unit on its corresponding floor plan in a grid layout.

DO $$
DECLARE
  v_proyecto_id UUID;
  v_torre       RECORD;
  v_piso        INT;
  v_planta_id   UUID;
  v_piso_label  TEXT;
  v_res_floors  INT;
  v_unit        RECORD;
  v_idx         INT;
  v_cols        INT := 4;  -- units per row in the grid
  v_planta_img  TEXT := 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80';
BEGIN
  -- Find Meriva project
  SELECT id INTO v_proyecto_id
    FROM proyectos
   WHERE nombre ILIKE '%meriva%'
   LIMIT 1;

  IF v_proyecto_id IS NULL THEN
    RAISE NOTICE 'Meriva project not found — skipping plantas seed';
    RETURN;
  END IF;

  -- For each tower in the project
  FOR v_torre IN
    SELECT * FROM torres WHERE proyecto_id = v_proyecto_id ORDER BY nombre
  LOOP
    v_res_floors := COALESCE(v_torre.pisos_residenciales, 0);
    IF v_res_floors = 0 THEN CONTINUE; END IF;

    -- Determine first residential piso number (after sótano + PB + podio)
    -- For simplicity, residential floors start at podio+1
    -- But we number plantas starting from 1 to match unit.piso values

    FOR v_piso IN 1..v_res_floors
    LOOP
      v_planta_id := gen_random_uuid();
      v_piso_label := 'P' || v_piso;

      -- Create the planta record
      INSERT INTO fachadas (
        id, proyecto_id, nombre, imagen_url, tipo,
        piso_numero, planta_tipo_nombre, torre_id, orden
      ) VALUES (
        v_planta_id,
        v_proyecto_id,
        v_torre.nombre || ' - ' || v_piso_label,
        v_planta_img,
        'planta',
        v_piso,
        'Planta Tipo',
        v_torre.id,
        v_piso
      );

      -- Position units on this floor plan using planta_id/planta_x/planta_y
      v_idx := 0;
      FOR v_unit IN
        SELECT id
          FROM unidades
         WHERE proyecto_id = v_proyecto_id
           AND torre_id = v_torre.id
           AND piso = v_piso
         ORDER BY identificador
      LOOP
        UPDATE unidades
           SET planta_id = v_planta_id,
               planta_x  = 15 + (v_idx % v_cols) * 22,
               planta_y  = 25 + (v_idx / v_cols) * 28
         WHERE id = v_unit.id;

        v_idx := v_idx + 1;
      END LOOP;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Meriva plantas seed complete';
END $$;
