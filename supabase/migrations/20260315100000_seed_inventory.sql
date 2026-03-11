-- Seed inventory data for Alto de Yeguas / Peace Avenue
-- Distributed across Torre Principal (36 units) and Torre B (35 units)

-- Clear existing units for this project
DELETE FROM unidades WHERE proyecto_id = '71b92bd7-cb89-48b2-8ac6-b766ca3011d2';

-- Variables
-- Torre Principal: ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa (15 pisos)
-- Torre B:         b2fea018-493c-4a86-a8c9-57b28c4e10e5 (14 pisos)
-- Studio:          72db43d9-2276-4dac-a7a1-84872292d179
-- 1 Hab:           2bbfaf4e-9789-4036-b582-cddfae67b3ac
-- 2 Hab:           3a04b2f9-fbf4-497f-a468-1ebdbdbc6638
-- 3 Hab:           aa135b23-8d95-4b1a-9366-352ec605e7fc

INSERT INTO unidades (proyecto_id, torre_id, tipologia_id, identificador, piso, area_m2, precio, estado, habitaciones, banos, orientacion, vista, notas, orden) VALUES
-- ============================================================
-- TORRE PRINCIPAL — Studios (Pisos 1-3, 3/floor = 9 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-101', 1, 34, 186000000, 'disponible', 0, 1, 'Norte', 'Interior', NULL, 0),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-102', 1, 35, 189000000, 'vendida', 0, 1, 'Sur', 'Ciudad', NULL, 1),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-103', 1, 33, 192000000, 'disponible', 0, 1, 'Oriente', 'Interior', NULL, 2),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-201', 2, 35, 194000000, 'vendida', 0, 1, 'Occidente', 'Ciudad', NULL, 3),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-202', 2, 36, 197000000, 'disponible', 0, 1, 'Norte', 'Interior', NULL, 4),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-203', 2, 34, 200000000, 'reservada', 0, 1, 'Sur', 'Ciudad', NULL, 5),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-301', 3, 35, 202000000, 'separado', 0, 1, 'Oriente', 'Ciudad', NULL, 6),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-302', 3, 37, 205000000, 'disponible', 0, 1, 'Occidente', 'Interior', NULL, 7),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '72db43d9-2276-4dac-a7a1-84872292d179', 'TP-303', 3, 34, 208000000, 'vendida', 0, 1, 'Norte', 'Ciudad', NULL, 8),

-- ============================================================
-- TORRE PRINCIPAL — 1 Hab (Pisos 3-6, 3/floor = 12 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-304', 3, 52, 305000000, 'disponible', 1, 1, 'Norte', 'Montaña', NULL, 9),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-305', 3, 54, 310000000, 'vendida', 1, 1, 'Sur', 'Ciudad', NULL, 10),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-306', 3, 51, 308000000, 'disponible', 1, 1, 'Oriente', 'Parque', NULL, 11),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-401', 4, 53, 315000000, 'reservada', 1, 1, 'Occidente', 'Interior', NULL, 12),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-402', 4, 55, 320000000, 'disponible', 1, 1, 'Norte', 'Montaña', NULL, 13),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-403', 4, 52, 318000000, 'vendida', 1, 1, 'Sur', 'Ciudad', NULL, 14),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-501', 5, 54, 325000000, 'separado', 1, 1, 'Oriente', 'Parque', NULL, 15),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-502', 5, 51, 322000000, 'disponible', 1, 1, 'Occidente', 'Montaña', NULL, 16),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-503', 5, 53, 328000000, 'vendida', 1, 1, 'Norte', 'Ciudad', NULL, 17),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-601', 6, 55, 332000000, 'disponible', 1, 1, 'Sur', 'Parque', NULL, 18),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-602', 6, 52, 330000000, 'reservada', 1, 1, 'Oriente', 'Montaña', NULL, 19),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TP-603', 6, 54, 335000000, 'vendida', 1, 1, 'Occidente', 'Ciudad', NULL, 20),

-- ============================================================
-- TORRE PRINCIPAL — 2 Hab (Pisos 6-10, 2/floor = 10 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-604', 6, 74, 490000000, 'disponible', 2, 2, 'Norte', 'Montaña', NULL, 21),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-605', 6, 76, 498000000, 'vendida', 2, 2, 'Sur', 'Ciudad', NULL, 22),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-701', 7, 75, 502000000, 'separado', 2, 2, 'Oriente', 'Parque', NULL, 23),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-702', 7, 78, 510000000, 'disponible', 2, 2, 'Occidente', 'Montaña', NULL, 24),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-801', 8, 76, 514000000, 'reservada', 2, 2, 'Norte', 'Ciudad', NULL, 25),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-802', 8, 73, 508000000, 'vendida', 2, 2, 'Sur', 'Parque', NULL, 26),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-901', 9, 77, 522000000, 'disponible', 2, 2, 'Oriente', 'Panorámica', NULL, 27),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-902', 9, 79, 530000000, 'disponible', 2, 2, 'Occidente', 'Montaña', NULL, 28),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-1001', 10, 78, 538000000, 'vendida', 2, 2, 'Norte', 'Panorámica', 'Último piso con vista despejada', 29),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TP-1002', 10, 75, 534000000, 'separado', 2, 2, 'Sur', 'Panorámica', NULL, 30),

-- ============================================================
-- TORRE PRINCIPAL — 3 Hab (Pisos 11-15, 1/floor = 5 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TP-1101', 11, 110, 735000000, 'disponible', 3, 3, 'Norte', 'Montaña', NULL, 31),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TP-1201', 12, 113, 750000000, 'vendida', 3, 3, 'Oriente', 'Panorámica', NULL, 32),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TP-1301', 13, 116, 765000000, 'reservada', 3, 3, 'Sur', 'Panorámica', NULL, 33),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TP-1401', 14, 119, 780000000, 'disponible', 3, 3, 'Occidente', 'Panorámica', NULL, 34),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'ebac7c28-9ca1-4ba0-84ed-e16bb136e0fa', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TP-1501', 15, 122, 795000000, 'separado', 3, 3, 'Norte', 'Panorámica', 'Penthouse — terraza privada de 25 m²', 35),

-- ============================================================
-- TORRE B — Studios (Pisos 1-2, 4/floor = 8 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-101', 1, 34, 187000000, 'disponible', 0, 1, 'Sur', 'Calle', NULL, 36),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-102', 1, 36, 190000000, 'vendida', 0, 1, 'Oriente', 'Interior', NULL, 37),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-103', 1, 35, 192000000, 'disponible', 0, 1, 'Occidente', 'Calle', NULL, 38),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-104', 1, 33, 185000000, 'reservada', 0, 1, 'Norte', 'Interior', NULL, 39),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-201', 2, 35, 195000000, 'vendida', 0, 1, 'Sur', 'Ciudad', NULL, 40),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-202', 2, 37, 198000000, 'disponible', 0, 1, 'Oriente', 'Calle', NULL, 41),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-203', 2, 34, 196000000, 'separado', 0, 1, 'Occidente', 'Interior', NULL, 42),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '72db43d9-2276-4dac-a7a1-84872292d179', 'TB-204', 2, 36, 200000000, 'disponible', 0, 1, 'Norte', 'Ciudad', NULL, 43),

-- ============================================================
-- TORRE B — 1 Hab (Pisos 3-6, 3/floor = 12 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-301', 3, 52, 302000000, 'disponible', 1, 1, 'Oriente', 'Parque', NULL, 44),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-302', 3, 54, 308000000, 'vendida', 1, 1, 'Occidente', 'Ciudad', NULL, 45),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-303', 3, 51, 305000000, 'disponible', 1, 1, 'Norte', 'Montaña', NULL, 46),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-401', 4, 53, 312000000, 'separado', 1, 1, 'Sur', 'Interior', NULL, 47),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-402', 4, 55, 318000000, 'vendida', 1, 1, 'Oriente', 'Parque', NULL, 48),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-403', 4, 52, 315000000, 'disponible', 1, 1, 'Occidente', 'Montaña', NULL, 49),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-501', 5, 54, 322000000, 'reservada', 1, 1, 'Norte', 'Ciudad', NULL, 50),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-502', 5, 51, 320000000, 'disponible', 1, 1, 'Sur', 'Parque', NULL, 51),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-503', 5, 53, 325000000, 'vendida', 1, 1, 'Oriente', 'Montaña', NULL, 52),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-601', 6, 55, 330000000, 'disponible', 1, 1, 'Occidente', 'Ciudad', NULL, 53),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-602', 6, 52, 328000000, 'reservada', 1, 1, 'Norte', 'Parque', NULL, 54),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '2bbfaf4e-9789-4036-b582-cddfae67b3ac', 'TB-603', 6, 54, 332000000, 'vendida', 1, 1, 'Sur', 'Montaña', NULL, 55),

-- ============================================================
-- TORRE B — 2 Hab (Pisos 6-10, 2/floor = 10 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-604', 6, 75, 498000000, 'disponible', 2, 2, 'Oriente', 'Montaña', NULL, 56),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-605', 6, 77, 505000000, 'vendida', 2, 2, 'Occidente', 'Ciudad', NULL, 57),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-701', 7, 74, 508000000, 'reservada', 2, 2, 'Norte', 'Parque', NULL, 58),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-702', 7, 76, 515000000, 'disponible', 2, 2, 'Sur', 'Montaña', NULL, 59),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-801', 8, 78, 520000000, 'separado', 2, 2, 'Oriente', 'Panorámica', NULL, 60),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-802', 8, 75, 518000000, 'vendida', 2, 2, 'Occidente', 'Ciudad', NULL, 61),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-901', 9, 77, 528000000, 'disponible', 2, 2, 'Norte', 'Panorámica', NULL, 62),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-902', 9, 79, 535000000, 'reservada', 2, 2, 'Sur', 'Montaña', NULL, 63),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-1001', 10, 76, 540000000, 'vendida', 2, 2, 'Oriente', 'Panorámica', NULL, 64),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', '3a04b2f9-fbf4-497f-a468-1ebdbdbc6638', 'TB-1002', 10, 74, 536000000, 'disponible', 2, 2, 'Occidente', 'Panorámica', 'Último piso con vista despejada', 65),

-- ============================================================
-- TORRE B — 3 Hab (Pisos 10-14, 1/floor = 5 units)
-- ============================================================
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TB-1003', 10, 112, 715000000, 'disponible', 3, 3, 'Norte', 'Montaña', NULL, 66),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TB-1101', 11, 115, 729000000, 'vendida', 3, 3, 'Oriente', 'Panorámica', NULL, 67),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TB-1201', 12, 118, 743000000, 'reservada', 3, 3, 'Sur', 'Panorámica', NULL, 68),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TB-1301', 13, 114, 757000000, 'disponible', 3, 3, 'Occidente', 'Panorámica', NULL, 69),
('71b92bd7-cb89-48b2-8ac6-b766ca3011d2', 'b2fea018-493c-4a86-a8c9-57b28c4e10e5', 'aa135b23-8d95-4b1a-9366-352ec605e7fc', 'TB-1401', 14, 120, 771000000, 'vendida', 3, 3, 'Norte', 'Panorámica', 'Penthouse — doble altura y terraza', 70);
