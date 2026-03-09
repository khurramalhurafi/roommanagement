-- EAMS Fix Script for Neon.tech
-- Run this in Neon SQL Editor to fix missing columns and reload rooms + employees

-- Step 1: Fix rooms table - add any missing columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS porta_cabin_id INTEGER REFERENCES porta_cabins(id);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS building TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS qr_hash TEXT;

-- Make qr_hash unique if not already (may error if nulls exist, safe to ignore)
UPDATE rooms SET qr_hash = gen_random_uuid()::text WHERE qr_hash IS NULL;

-- Step 2: Fix employees table - add any missing columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES rooms(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Step 3: Clear rooms and employees (employees first due to FK)
TRUNCATE employees RESTART IDENTITY CASCADE;
TRUNCATE rooms RESTART IDENTITY CASCADE;

-- Step 4: Insert all 47 rooms
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (1, 'F-5', 6, 'Barracks F-5', 'ROOM 5', 2, 'available', '1dcc17e5e2c1cf16776a0f41a6292652');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (2, 'G-1', 7, 'Barracks G-1', 'ROOM 2', 2, 'available', '81143ce566e296fd32679ab8cfa4d410');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (3, 'G-2', 7, 'Barracks G-2', 'ROOM 2', 2, 'available', 'dbe56ee5e2a85dcc971c0c3e1c441517');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (4, 'G-3', 7, 'Barracks G-3', 'ROOM 3', 2, 'available', 'f624c8f14f333c79838c4ef91708d2c3');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (5, 'G-4', 7, 'Barracks G-4', 'ROOM 4', 2, 'available', '09fe1a301f80e87088e4cba0d495dadb');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (6, 'H-1', 8, 'Barracks H-1', 'ROOM 1', 1, 'available', '5f51ae24464f6496897b1fce6b3c7f23');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (7, 'H-2', 8, 'Barracks H-2', 'ROOM 2', 2, 'available', 'bc4ce3f5afd146a274c25ecd2651b4c5');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (8, 'H-3', 8, 'Barracks H-3', 'ROOM 2', 2, 'available', '45c0bc02863c6603004991478c371076');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (9, 'H-4', 8, 'Barracks H-4', 'ROOM 2', 2, 'available', '72d8e01b3f29bc81c37ee33a62df01f4');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (10, 'I-2', 9, 'Barracks i-2', 'ROOM 2', 2, 'available', 'e92aa46f48c54d55a56e114765caa902');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (11, 'I-3', 9, 'Barracks i-3', 'ROOM 2', 2, 'available', '8f1c239061add3cad9fe0a7fc7003f5c');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (12, 'I-4', 9, 'Barracks i-4', 'ROOM 2', 2, 'available', '921b4524501c87090be4605ac238132e');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (13, 'J-1', 10, 'Barracks J-1', 'ROOM 3', 3, 'available', '9bce1f255c198429e159fcc02cb521cf');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (14, 'J-2', 10, 'Barracks J-2', 'ROOM 3', 3, 'available', '20ebbe21d94fa4d0479484b58ce581d4');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (15, 'J-3', 10, 'Barracks J-3', 'ROOM 2', 2, 'available', '6b45ee3908c2f4a7e7a0e784616957f4');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (16, 'J-5', 10, 'Barracks J-5', 'ROOM 2', 2, 'available', 'b5d5dc11c070eb928cd567c035cadc68');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (17, 'J-4', 10, 'Barracks J-4', 'ROOM 2', 2, 'available', '417768ccd03f2962c0057f7587cebac1');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (18, 'K-1', 11, 'Barracks K-1', 'ROOM 3', 3, 'available', 'e7fdab5de7843f63112e9537559fc84e');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (19, 'K-2', 11, 'Barracks K-2', 'ROOM 2', 3, 'available', 'ac49d622156f549671ef3a2e193a4d5c');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (20, 'A-1', 1, 'Barracks  A -1', 'Room  1', 1, 'available', 'c6976a822f5794198ba94e0f192e04b3');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (21, 'A-2', 1, 'Building A -2', 'Room 2', 2, 'available', 'cc464ca3a4a8ecfa3cb72ae52d74e2f5');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (22, 'B-1', 2, 'Building B -1', 'Room 2', 2, 'available', '96334cbbbcd73a44b08f90c839046b5b');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (23, 'B-2', 2, 'Barracks B-2', 'Room 2', 2, 'available', '30258c0ec8e88d0587589640accb4ac5');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (24, 'B-3', 2, 'Barracks B-3', 'Room 1', 2, 'available', '101e95e23e5519f8d908f205acf6b9e1');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (25, 'B-4', 2, 'Barracks B-4', 'Room 3', 3, 'available', '0361f431d0e3c6f39cfc8e7791434420');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (26, 'B-5', 2, 'Barracks B-5', 'Room 2', 2, 'available', 'b97a7f11b915d2e45186b786616f4b04');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (27, 'C-1', 3, 'Barracks C-1', 'Room 1', 1, 'available', 'd6d81a4c97fc664a5459d62d1111faa8');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (28, 'K-3', 11, 'Barracks K-3', 'ROOM 3', 3, 'available', '31981d4b4d44b4f2a078cd3129c4dd29');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (29, 'K-4', 11, 'Barracks K-4', 'ROOM 3', 3, 'available', 'd6aa07bc5dd609138d7240c1791618b6');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (30, 'D-1', 4, 'Barracks D-1', 'Room 2', 2, 'available', '46488b7267c1811e4a517e3efb7630e4');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (31, 'D-2', 4, 'Barracks D-2', 'Room 2', 2, 'available', '98bd3e478a382b5551dfb8fdeeb27928');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (32, 'D-3', 4, 'Barracks D-3', 'Room 2', 2, 'available', '644947f528ace6c97de2d0f96dea313c');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (33, 'D-4', 4, 'Barracks D-4', 'Room 2', 2, 'available', 'cd3713d20e7af878b4e2e964ce36d087');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (34, 'D-5', 4, 'Barracks D-5', 'Room 2', 3, 'available', '2ca0e416b253f698ba28403361a4633e');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (35, 'E-4', 5, 'Barracks E-4', 'ROOM 2', 3, 'available', 'e8e84a56c2625e9a216236c4cf78cc4b');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (36, 'E-5', 5, 'Barracks E-5', 'ROOM 2', 2, 'available', 'db4ad130846b6af9d115f88f3c6676c9');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (37, 'F-1', 6, 'Barracks F-1', 'ROOM 2', 2, 'available', '2aee986095d1a16a114929496bef2c33');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (38, 'F-2', 6, 'Barracks F-2', 'ROOM 2', 2, 'available', 'c461fa8a59757b8740cc54dd3301dfbb');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (39, 'F-4', 6, 'Barracks F-4', 'ROOM 2', 2, 'available', 'f8165055c2fd06a173218d69a5bb33fd');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (40, 'L-1', 12, 'Barracks L-1', 'ROOM 2', 2, 'available', '58393e68f1a776590a81ce353aed4ea3');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (41, 'L-2', 12, 'Barracks L-2', 'ROOM 2', 2, 'available', '45248241c30251a9272c64a7c8bfc610');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (42, 'L-3', 12, 'Barracks L-3', 'ROOM 3', 3, 'available', 'c2bd94c6ec079dae6f5a9404c7c23468');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (43, 'L-4', 12, 'Barracks L-4', 'ROOM 2', 2, 'available', '72618b5cb4bb8ee587b179779d8e3ad7');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (44, 'M-1', 13, 'Barracks M-1', 'ROOM 3', 3, 'available', '61c7a19c828458844d9fdaa6dd94f080');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (45, 'M-2', 13, 'Barracks M-2', 'ROOM 2', 2, 'available', 'e331be5a819897a0c143c67409f8e2ba');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (46, 'K-5', 11, 'Barracks K-5', 'ROOM 5', 5, 'available', 'cfe41e7d2a7e73930759ea281b5e1212');
INSERT INTO rooms (id, room_number, porta_cabin_id, building, floor, capacity, status, qr_hash) VALUES (47, 'I-1', 9, 'Barracks i-1', 'ROOM 2', 2, 'available', 'dd2e4f2739aee7a084862329221723df');

-- Step 5: Insert all 95 employees
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (1, '21537', 'MR. HASHMAT ALI', '2358793343', '0531279183', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (2, '21540', 'MR. ROBELITO MUNDOC', '2358797484', '0577162626', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (3, '21548', 'MR. AHAMED RAZA', '2361010792', '0538204699', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (4, '21563', 'MR.  MONIRUL ISLAM', '2481114045', '0577134645', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (5, '21545', 'MR. MUSTAFA AHMED', '2438358638', '0509375462', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (6, '21566', 'MR. TAHER MAHMOOD', '2472788229', '0550070619', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (7, '21575', 'MR. ANWAR AHMED', '2481113914', '0596013357', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (8, '21579', 'MR. MOMINUR RAHMAN', '2474888472', '572441481', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (9, '21509', 'MR. NASIR AHMED', '2292707136', '0594585756', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (10, '21580', 'MR. NASSER SAUM AB SAAB', '2487266880', '0561928331', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (11, '21583', 'MR. SULAIMAN BHATTI', '2427183583', '0536521018', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (12, '21587', 'MR. SHAFEEQ--ABDULRAHMAN', '2060515331', '0508399024', 'WOOD -Driver', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (13, '21543', 'MR.ADIL ABDULLATIF-MOHAMMAD NADIM', '2009602760', '0577908970', 'WOOD -Driver', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (14, '21544', 'MR.KALEAL ABDOURHMAN ASHRFOUZMAN', '2221326784', '0506580421', 'WOOD -Driver', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (15, '21594', 'MR. GHULAM MOHD', '2380267993', '0545436470', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (16, '21638', 'MR. H M ZAKARIA', '2520088317', '0576882314 - 0572382028', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (17, '21527', 'MR. TAMER AL KAREF', '2347189090', '0537636582', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (18, '21605', 'MR. AJIJUL HAQUE', '2504213576', '0593046925', 'WOOD - Office Worker', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (19, '21568', 'MR. MOAMAR ABDALLA ELGACK', '2404404093', '0595750701', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (20, '21572', 'MR. DELWAR HOSSAIN ( MALEK )', '2472546916', '0594406872', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (21, '21574', 'MR. ABDUR RAHMAN - A. HAI', '2481023709', '0572267109', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (22, '21645', 'MR. AL AMIN JABER HOSSAIN', '2578665701', '0591799212 - 0501344587', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (23, '21642', 'MR. RIYED HOSSEN NOYON MD', '2515733828', '0572443693 - 0571368945', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (24, '21641', 'MR. AMEER KALEAL ABDOURHMAN ASHRFOUZMAN', '2304068949', '0578638378', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (25, '21637', 'MR. SHAHIN MIA', '2521159521', '0576674263 - 0571649849', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (26, '21631', 'MR. SHOHEIL MIAH', '2515569347', '0573182252 - 0537497600', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (27, '21628', 'MR. MD BILLAL HOSSAIN', '2521050084', '0571290547 - 0558435260', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (28, '21625', 'MR. ABDUL SABOOR', '2119992507', '0532510853', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (29, '21611', 'MR. JIHAD RAYDAN ABDEL KHALEQ', '2579056405', '0594626389', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (30, '21609', 'MR. KHANCHAN MIA', '2513778064', '0573072918', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (31, '21607', 'MR. SOMON MIA JOYNAL', '2504560695', '0552542139', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (32, '21604', 'MR. MD ABU RAYHAN', '2504560604', '0537629312', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (33, '21584', 'MR. DABIR KHAN RUPAI KHAN', '2491375123', '0570307740', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (34, '21581', 'MR. MOHAMMED ARIF FAZAL KARIM', '2336837592', '0536521158', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (35, '21553', 'MR. RIDOY MOTALEB', '2475907156', '0576638140', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (36, '21552', 'MR. JAMAL M. BAKRI', '2346057256', '0544795615', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (37, '21551', 'MR. ABDUL NABI', '2326426232', '0552087745', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (38, '21519', 'MR. SAYED SAMIR', '2398352613', '0536674425', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (39, '21542', 'MR. NAGANDAR', '2311030601', '0504202637', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (40, '21528', 'MR. ZUBAIR KHAN', '2358793764', '0551127060', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (41, '21523', 'MR. AMEER AHMED', '2358793426', '0531279427', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (42, '21516', 'MR. MD SIRAZUL ISLAM', '2481024228', '0596489160', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (43, '21504', 'MR. MOHD. TAHER', '2128175045', '0572003413', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (44, '21503', 'MR. MOHD. ARSHAD', '2044178727', '0551493462', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (45, '21636', 'MR. AHMED MOHAMED MOSTAFA SALEH', '2538142759', '0578444130', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (46, '21627', 'MR. HAMADI MOHAMMED AL-SALAIMI', '2513673828', '0571747059', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (47, '21529', 'MR. MUNIR TAWWATI', '2145606113', '0571542975', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (48, '21577', 'MR. SALIM MUNIR', '2339701019', '0572884362', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (49, '21663', 'MR. MUHAMMAD SULTAN ATTA MUHAMMAD', '2539681482', '0553509433', 'WOOD - Electrician', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (50, '21727', 'MR. MUZAMMIL BASHIR BASHIR AHMED', '2582920431', '0530323160', 'WOOD - CNC', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (51, '21531', 'MR. MOHD. RIZWAN', '2358794101', '0572834754', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (52, '21561', 'MR. FRANCISCO JECIEL', '2427183831', '0506749509', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (53, '21570', 'MR. RUBEL OLI UDDIN', '2481114177', '577039525', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (54, '21017', 'MR. WASEEM KHAN', '2401126608', '0596162072', 'WOOD - Warehouse Keeper', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (55, '21724', 'MR. MD SALAM AKANDO', '2578470995', '0535483385', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (56, '21747', 'MR. MUTAHIR ARIF MUHAMMAD ARIF', '2624348500', '0530747912', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (57, '21744', 'MR. MUHAMMAD AKHTAR GHULAM HAIDER', '2429571462', '548603381', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (58, '21743', 'MR. MUHAMMAD MAJID KHAN ABDUL GHAFFAR', '2348943719', '599214608', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (59, '21741', 'MR. RICKY CANDIDATO BELTRAN', '2612215992', '0539892815', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (60, '21739', 'MR. EMAMUL NURUKHAN', '2602098234', '0547190987', 'WOOD - Cleaner', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (61, '21735', 'MR. ABDUL NAIF SAHIBOL - ARIP', '2593364835', '0533128063 - 0560515883', 'WOOD - Office Worker', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (62, '21734', 'MR. MUHAMMAD ZOHAIB MUHAMMAD RIAZ', '2594984151', '0503857544', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (63, '21733', 'MR. MUHAMMAD FAYYAZ REHMAT ALI', '2594984078', '0503859299', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (64, '21732', 'MR. ALI HUSSNAIN MAQSOOD AHMED', '2582718090', '0574927946', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (65, '21730', 'MR. NAIIM ABDULLAH', '2557097553', '0530535100', 'WOOD - Office Worker', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (66, '21726', 'MR. IRFAN UDDIN', '2580022644', '0571374348 - 0571478400', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (67, '21722', 'MR. SHAH ALAM ISTEYAQ AHMAD', '2544455336', '0531078434', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (68, '21721', 'MR. SHAHADAD HOSSAIN', '2521517215', '0551346739', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (69, '21719', 'MR. MD SHAHID ISLAM', '2568645440', '0526864544 - 0531956075', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (70, '21718', 'MR. MD MAMUN KHAN', '2575325432', '0569631818', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (71, '21717', 'MR. JOVITO LISING ALCANTARA', '2577596832', '0550700945 - 0570514285', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (72, '21715', 'MR. MUHAMMAD BILAL ABDUL SATTAR', '2522961370', '0582680338', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (73, '21703', 'MR. FLORANTE GRANETA - PINEDA', '2278381997', '0507686960', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (74, '21702', 'MR. TANJIL HOSSAIN', '2570675757', '0556683181', 'WOOD - Electrician', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (75, '21700', 'MR. MOHAMMAD JAVED', '2554461356', '0555410791', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (76, '21697', 'MR. ADBULLAH ABUL HOSSAIN', '2565631591', '0571563217 - 0551242503', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (77, '21696', 'MR. BELAL AHMED', '2559290883', '0534725813', 'WOOD - CNC', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (78, '21690', 'MR. BALAWAL BASHIR BASHIR AHMAD', '2560039618', '0539655868', 'WOOD - CNC', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (79, '21689', 'MR. JOHNSON ECHAVE DE VERA', '2560533271', '0577309208', 'WOOD - Office Worker', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (80, '21687', 'MR. MAHADIL TAN SAHIDUL', '2539600755', '0535257242', 'WOOD - Office Worker', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (81, '21686', 'MR. MUSTAPHA CHEBIB', '2547810271', '0547585643', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (82, '21646', 'MR. MOHAMMAD SAFIQUL ISLAM', '2521957999', '0572951978 - 0572254657', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (83, '21639', 'MR. MUHAMMAD FURQAN MUHAMMAD AMIN', '2525931156', '0565829703', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (84, '21629', 'MR. MD SIRAJ BISWAS', '2516251747', '0572713162 - 0536150903', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (85, '21610', 'MR. SAMI HASSAN HASSAN HEJRES', '2309040554', '0509139053', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (86, '21588', 'MR. SAGOR MEAH', '2481025415', '0567595691', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (87, '21554', 'MR. AMER A. DAEEM', '2368263220', '537394858', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (88, '21547', 'MR. NISAR BATCHA', '2358794150', '0572346952', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (89, '21530', 'MR. REZAUL MONDOL', '2472357405', '0533933703', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (90, '21515', 'MR. ANWARUL ISLAM', '2481025142', '0567561951', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (91, '21559', 'MR. ABDU MOHD. YUNUS', '2414046439', '566076463', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (92, '21740', 'MR. MOHAMMED IRFAN', '2294728890', '0568173106', 'WOOD - Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (93, '21712', 'MR. ABDULHADI - - DRZAR', '2170753459', '0537086870', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (94, '21648', 'MR. ATIK ALI JAKIR ALI', '2518776576', '0571102196 - 0545213903', 'WOOD -Paint', 'AL-HURAFI', NULL, 'active', NULL);
INSERT INTO employees (id, employee_id_no, name, iqama, mobile, department, company, profile_image, status, room_id) VALUES (95, '21601', 'MR. ADEL GHAZAL SALEEM', '2579056462', '0595365160', 'WOOD', 'AL-HURAFI', NULL, 'active', NULL);

-- Step 6: Reset sequences
SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));
SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees));

-- Step 7: Verify counts
SELECT 'porta_cabins' as table_name, COUNT(*) as count FROM porta_cabins
UNION ALL SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL SELECT 'employees', COUNT(*) FROM employees
UNION ALL SELECT 'users', COUNT(*) FROM users;
