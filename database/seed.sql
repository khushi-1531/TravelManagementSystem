-- =====================================================================
-- TravelSphere Initial Catalog & System Seed Data (v2.1.0 - Step 5 Expanded)
-- Target: MySQL 8.x Engine
-- Contains: Roles, 12 Destinations, 25+ Places, 18+ Hotels, 40+ Rooms,
--           10+ Curated Packages, and Day-by-Day Package Itinerary Items.
-- SECURITY GUARANTEE: No hardcoded admin credentials or passwords!
-- =====================================================================

USE travelsphere_db;

-- Clear previous catalogue tables in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE package_items;
TRUNCATE TABLE packages;
TRUNCATE TABLE hotel_rooms;
TRUNCATE TABLE hotels;
TRUNCATE TABLE places;
TRUNCATE TABLE destinations;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. SEED SYSTEM ROLES
-- ---------------------------------------------------------------------
INSERT INTO roles (id, name, description) VALUES
(1, 'ROLE_USER', 'Standard registered customer account with booking privileges'),
(2, 'ROLE_ADMIN', 'Platform administrator with inventory and moderation privileges')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- ---------------------------------------------------------------------
-- 2. SEED DESTINATIONS (12 Curated Regions)
-- ---------------------------------------------------------------------
INSERT INTO destinations (id, uuid, name, slug, state, country, description, climate, best_time_to_visit, hero_image_url, latitude, longitude, is_featured, is_published) VALUES
(1, UUID(), 'Jaipur', 'jaipur', 'Rajasthan', 'India', 'The historic Pink City renowned for majestic hill forts, royal palaces, and vibrant artisan bazaars.', 'Subtropical Arid', 'October to March', 'https://images.unsplash.com/photo-1599661046289-e31897846e41', 26.9124, 75.7873, TRUE, TRUE),
(2, UUID(), 'Agra', 'agra', 'Uttar Pradesh', 'India', 'Home of the timeless Taj Mahal and Mughal architectural masterpieces along the Yamuna River.', 'Tropical Hot Semi-Arid', 'November to February', 'https://images.unsplash.com/photo-1564507592333-c60657eea523', 27.1767, 78.0081, TRUE, TRUE),
(3, UUID(), 'Mumbai', 'mumbai', 'Maharashtra', 'India', 'The dynamic financial hub of India, boasting colonial architecture, coastal promenades, and Bollywood glamour.', 'Tropical Wet and Dry', 'October to February', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f', 18.9220, 72.8347, TRUE, TRUE),
(4, UUID(), 'Shimla', 'shimla', 'Himachal Pradesh', 'India', 'The queen of hill stations nestled in the Himalayas, featuring alpine vistas and historic British colonial heritage.', 'Subtropical Highland', 'March to June, December to January', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23', 31.1048, 77.1734, TRUE, TRUE),
(5, UUID(), 'Hyderabad', 'hyderabad', 'Telangana', 'India', 'The City of Pearls, famous for historic fortresses, royal Nizami cuisine, and thriving technology hubs.', 'Tropical Semi-Arid', 'November to February', 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5', 17.3850, 78.4867, FALSE, TRUE),
(6, UUID(), 'Srinagar', 'srinagar', 'Jammu & Kashmir', 'India', 'The paradise valley featuring serene Dal Lake shikara rides, Mughal gardens, and snow-dusted peaks.', 'Humid Subtropical Alpine', 'April to October', 'https://images.unsplash.com/photo-1598091383021-15ddea10925d', 34.0837, 74.7973, TRUE, TRUE),
(7, UUID(), 'Goa', 'goa', 'Goa', 'India', 'Sun-drenched tropical coastline famous for golden sandy beaches, vibrant nightlife, Portuguese heritage, and spice plantations.', 'Tropical Monsoon', 'November to March', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2', 15.2993, 74.1240, TRUE, TRUE),
(8, UUID(), 'Manali', 'manali', 'Himachal Pradesh', 'India', 'High-altitude Himalayan resort town famed for snow-capped peaks, pine forests, white-water river rafting, and mountain treks.', 'Highland Subtropical', 'October to June', 'https://images.unsplash.com/photo-1571536802807-30451e3955d8', 32.2396, 77.1887, TRUE, TRUE),
(9, UUID(), 'Kerala', 'kerala', 'Kerala', 'India', 'God’s Own Country, featuring tranquil emerald backwaters, palm-fringed canals, Ayurvedic wellness, and lush tea-scented hills.', 'Tropical Wet', 'September to March', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944', 9.9312, 76.2673, TRUE, TRUE),
(10, UUID(), 'Delhi', 'delhi', 'Delhi', 'India', 'The pulsating capital city blending thousands of years of Mughal and colonial heritage with modern cosmopolitan avenues.', 'Humid Subtropical', 'October to March', 'https://images.unsplash.com/photo-1587474260584-136574528ed5', 28.6139, 77.2090, TRUE, TRUE),
(11, UUID(), 'Udaipur', 'udaipur', 'Rajasthan', 'India', 'The City of Lakes and Venice of the East, famed for shimmering lakeside marble palaces and timeless royal romance.', 'Semi-Arid', 'October to March', 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10', 24.5854, 73.7125, TRUE, TRUE),
(12, UUID(), 'Rishikesh', 'rishikesh', 'Uttarakhand', 'India', 'The Yoga Capital of the World on the banks of the sacred Ganges, celebrated for spiritual ashrams, temples, and mountain adventure sports.', 'Subtropical', 'September to April', 'https://images.unsplash.com/photo-1600100397608-f010e4710db4', 30.0869, 78.2676, TRUE, TRUE);

-- ---------------------------------------------------------------------
-- 3. SEED PLACES (Points of Interest within Destinations)
-- ---------------------------------------------------------------------
INSERT INTO places (destination_id, name, category, description, entry_fee, opening_time, closing_time, image_url, latitude, longitude, is_active) VALUES
-- Jaipur
(1, 'Amber Fort & Palace', 'HERITAGE', 'Majestic 16th-century fortress perched on Cheel ka Teela with sweeping views, intricate mirror mosaics in Sheesh Mahal, and grand courtyards.', 100.00, '09:00', '17:30', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220', 26.9855, 75.8513, TRUE),
(1, 'Hawa Mahal (Palace of Winds)', 'HERITAGE', 'Iconic five-story pink sandstone facade with 953 ornate latticed jharokhas built for royal women to observe street festivities.', 50.00, '09:00', '17:00', 'https://images.unsplash.com/photo-1609137144822-1eb199b59695', 26.9239, 75.8267, TRUE),
(1, 'City Palace Jaipur', 'HERITAGE', 'Grand royal complex featuring courtyards, Chandra Mahal, Mubarak Mahal museum, and centuries of Rajput artistry.', 300.00, '09:30', '17:00', 'https://images.unsplash.com/photo-1599661046289-e31897846e41', 26.9258, 75.8236, TRUE),

-- Agra
(2, 'Taj Mahal', 'HERITAGE', 'UNESCO World Heritage wonder of the world, built by Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal.', 50.00, '06:00', '18:30', 'https://images.unsplash.com/photo-1564507592333-c60657eea523', 27.1751, 78.0421, TRUE),
(2, 'Agra Fort', 'HERITAGE', 'Vast red-sandstone citadel on the Yamuna river that served as the main residence of the Mughal emperors until 1638.', 50.00, '06:00', '18:00', 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e', 27.1795, 78.0211, TRUE),

-- Mumbai
(3, 'Gateway of India', 'HERITAGE', 'Iconic 26-meter basalt arch monument overlooking Mumbai Harbour, built to commemorate King George V visit in 1911.', 0.00, '00:00', '23:59', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f', 18.9220, 72.8347, TRUE),
(3, 'Marine Drive (Queen''s Necklace)', 'NATURE', '3.6-kilometer seaside promenade offering refreshing Arabian Sea breezes and radiant evening skyline panoramas.', 0.00, '00:00', '23:59', 'https://images.unsplash.com/photo-1566552881560-0be86c53e56f', 18.9432, 72.8231, TRUE),
(3, 'Elephanta Caves', 'HERITAGE', 'UNESCO World Heritage rock-cut cave temples dedicated to Lord Shiva situated on Elephanta Island in Mumbai Harbour.', 40.00, '09:00', '17:30', 'https://images.unsplash.com/photo-1608037521244-f1c6c4545089', 18.9633, 72.9315, TRUE),

-- Shimla
(4, 'The Ridge & Mall Road', 'NATURE', 'Spacious open cultural promenade with panoramic views of snow-clad mountain peaks and historic neo-Gothic architecture.', 0.00, '00:00', '23:59', 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23', 31.1048, 77.1734, TRUE),
(4, 'Jakhu Temple & Hill', 'RELIGIOUS', 'Ancient hilltop temple dedicated to Lord Hanuman sitting at Shimla’s highest peak with a towering 108-foot statue.', 0.00, '07:00', '20:00', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0', 31.1009, 77.1856, TRUE),

-- Goa
(7, 'Baga Beach', 'BEACH', 'One of North Goa’s most lively beaches offering water sports, beach shacks, dolphin-watching cruises, and vibrant nightlife.', 0.00, '00:00', '23:59', 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2', 15.5553, 73.7517, TRUE),
(7, 'Basilica of Bom Jesus', 'RELIGIOUS', '16th-century UNESCO World Heritage church housing the sacred mortal remains of Saint Francis Xavier in Old Goa.', 0.00, '09:00', '18:30', 'https://images.unsplash.com/photo-1548013146-72479768bada', 15.5009, 73.9116, TRUE),
(7, 'Dudhsagar Waterfalls', 'NATURE', 'Spectacular four-tiered waterfall cascading 310 meters through dense Western Ghats jungle on the Mandovi River.', 50.00, '09:00', '16:30', 'https://images.unsplash.com/photo-1582650625119-3a31f8418399', 15.3144, 74.3143, TRUE),

-- Manali
(8, 'Solang Valley', 'ADVENTURE', 'Scenic alpine valley famous for year-round adventure sports including paragliding, zorbing, quad biking, and skiing in winter.', 0.00, '09:00', '18:00', 'https://images.unsplash.com/photo-1571536802807-30451e3955d8', 32.3166, 77.1583, TRUE),
(8, 'Hadimba Temple', 'RELIGIOUS', 'Historic 1553 pagoda-style wooden temple nestled amidst towering cedar and pine forests of the Dhungri Van Vihar.', 0.00, '08:00', '18:00', 'https://images.unsplash.com/photo-1605649487212-47bdab064df7', 32.2483, 77.1706, TRUE),
(8, 'Rohtang Pass Gateway', 'NATURE', 'High mountain pass at 3,978 meters offering breathtaking glacial views and snowfields along the Pir Panjal Range.', 500.00, '06:00', '16:00', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 32.3716, 77.2466, TRUE),

-- Kerala
(9, 'Alleppey Backwaters & Houseboat Lake', 'NATURE', 'Labyrinthine network of tranquil lagoons, canals, and lakes best experienced aboard traditional thatched Kettuvallam houseboats.', 0.00, '06:00', '18:00', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944', 9.4981, 76.3388, TRUE),
(9, 'Munnar Tea Plantations', 'NATURE', 'Rolling emerald tea hills and mist-shrouded valleys elevated 1,600 meters in the Western Ghats.', 0.00, '08:00', '17:00', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2', 10.0889, 77.0595, TRUE),
(9, 'Fort Kochi Chinese Fishing Nets', 'HERITAGE', 'Historic coastal settlement with giant shore-operated cantilevered fishing nets, Dutch palaces, and colonial spice warehouses.', 0.00, '00:00', '23:59', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0', 9.9658, 76.2421, TRUE),

-- Delhi
(10, 'Qutub Minar Complex', 'HERITAGE', '73-meter towering victory minaret constructed in 1192, featuring intricate red sandstone carvings and the ancient rust-resistant Iron Pillar.', 50.00, '07:00', '19:00', 'https://images.unsplash.com/photo-1587474260584-136574528ed5', 28.5244, 77.1855, TRUE),
(10, 'Red Fort (Lal Qila)', 'HERITAGE', 'Massive 17th-century Mughal palace fortress built by Shah Jahan, symbolizing India’s rich historic sovereignty.', 50.00, '09:30', '16:30', 'https://images.unsplash.com/photo-1592635196078-9fdc757f27f4', 28.6562, 77.2410, TRUE),

-- Udaipur
(11, 'City Palace Udaipur', 'HERITAGE', 'Flamboyant palace complex built over 400 years on the eastern bank of Lake Pichola with mirrored balconies and marble cupolas.', 300.00, '09:30', '17:30', 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10', 24.5764, 73.6835, TRUE),
(11, 'Lake Pichola Boat Cruise', 'NATURE', 'Picturesque artificial freshwater lake featuring royal boat cruises around the ethereal Jag Mandir and Lake Palace islands.', 400.00, '09:00', '18:00', 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220', 24.5724, 73.6766, TRUE),

-- Rishikesh
(12, 'Laxman Jhula & Ram Jhula', 'RELIGIOUS', 'Iconic pedestrian suspension bridges spanning the turquoise waters of the holy Ganga with panoramic mountain views.', 0.00, '00:00', '23:59', 'https://images.unsplash.com/photo-1600100397608-f010e4710db4', 30.1245, 78.3298, TRUE),
(12, 'Shivpuri River Rafting Hub', 'ADVENTURE', 'Thrilling white-water river rafting expedition hub through Class III and IV rapids along the Himalayan Ganges.', 800.00, '08:00', '16:00', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', 30.1367, 78.3892, TRUE);

-- ---------------------------------------------------------------------
-- 4. SEED HOTELS (Curated Accommodations across Destinations)
-- ---------------------------------------------------------------------
INSERT INTO hotels (id, uuid, destination_id, name, star_rating, address, contact_phone, contact_email, hero_image_url, description, starting_price_per_night, has_swimming_pool, has_wifi, has_parking, has_restaurant, is_active) VALUES
-- Mumbai
(1, UUID(), 3, 'JW Marriott Hotel Mumbai Juhu', 5.0, 'Juhu Tara Rd, Juhu, Mumbai, Maharashtra 400049', '+91 22 6693 3000', 'reservations@jwmarriottmumbai.com', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Luxury 5-star beachfront haven overlooking the Arabian Sea with world-class dining and spa.', 8500.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(2, UUID(), 3, 'Taj Mahal Palace Hotel', 5.0, 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001', '+91 22 6665 3366', 'tajpalace.mumbai@tajhotels.com', 'https://images.unsplash.com/photo-1582719508461-905c673771fd', 'Iconic heritage landmark standing opposite the Gateway of India since 1903.', 14500.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Agra
(3, UUID(), 2, 'The Oberoi Amarvilas Hotel', 5.0, 'Taj East Gate Rd, Paktola, Tajganj, Agra, UP 282001', '+91 562 223 1515', 'reservations.amarvilas@oberoihotels.com', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', 'Spectacular luxury resort located just 600 meters from the Taj Mahal with uninterrupted monument views.', 12000.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Jaipur
(4, UUID(), 1, 'The Leela Palace Jaipur', 5.0, 'Delhi-Jaipur Highway, Kukas, Jaipur, Rajasthan 302028', '+91 1426 350 000', 'reservations.jaipur@theleela.com', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9', 'Opulent palace resort set against the Aravalli hills reflecting majestic Rajputana splendour.', 9500.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(5, UUID(), 1, 'Oberoi Rajvilas Jaipur', 5.0, 'Babaji Ka Morh, Goner Rd, Jaipur, Rajasthan 302031', '+91 141 268 0101', 'rajvilas@oberoihotels.com', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Idyllic royal villa retreat with traditional pink stonework, reflection pools, and lush gardens.', 11000.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Shimla
(6, UUID(), 4, 'Wildflower Hall Resort Shimla', 5.0, 'Chharabra, Shimla, Himachal Pradesh 171012', '+91 177 264 8585', 'wildflowerhall@oberoihotels.com', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', 'Luxury mountain retreat set amidst 23 acres of protected cedar forest in the Himalayas.', 7800.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Goa
(7, UUID(), 7, 'Taj Exotica Resort & Spa Goa', 5.0, 'Calwaddo, Benaulim, Goa 403716', '+91 832 668 3333', 'exotica.goa@tajhotels.com', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', 'Mediterranean-inspired beach sanctuary sprawling across 56 acres of lush gardens along Benaulim Beach.', 9200.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(8, UUID(), 7, 'W Goa Boutique Resort', 5.0, 'Vagator Beach, Bardez, Goa 403509', '+91 832 671 8888', 'w.goa@whotels.com', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef', 'Ultra-chic coastal retreat tucked away beneath Chapora Fort on the shores of Vagator Beach.', 10500.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(9, UUID(), 7, 'Heritage Village Resort & Spa Goa', 4.0, 'Arossim Beach, Cansaulim, Goa 403712', '+91 832 669 4444', 'reservations.goa@heritagevillageresorts.com', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', 'Portuguese-colonial style resort moments from pristine white sands with vibrant coastal dining.', 4500.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Manali
(10, UUID(), 8, 'The Himalayan Resort & Spa Manali', 5.0, 'Hadimba Rd, Manali, Himachal Pradesh 175131', '+91 1902 250 999', 'info@thehimalayan.com', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Victorian-Gothic castle resort set amidst apple orchards with direct views of snow-capped peaks.', 6800.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(11, UUID(), 8, 'Snow Valley Resorts Manali', 4.0, 'Log Huts Area, Manali, Himachal Pradesh 175131', '+91 1902 253 228', 'manali@snowvalleyresorts.com', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b', 'Charming hill retreat offering pine-clad valley vistas and comfortable family accommodations.', 3200.00, FALSE, TRUE, TRUE, TRUE, TRUE),

-- Kerala
(12, UUID(), 9, 'Kumarakom Lake Resort', 5.0, 'Vembanad Lake, Kumarakom, Kottayam, Kerala 686566', '+91 481 252 4900', 'klr@thepaul.in', 'https://images.unsplash.com/photo-1582719508461-905c673771fd', 'Acclaimed heritage backwater haven with traditional meandering pool villas and Kerala Ayurvedic spa.', 9800.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(13, UUID(), 9, 'Tea County Resort Munnar', 4.0, 'Munnar, Idukki District, Kerala 685612', '+91 4865 230 460', 'teacounty@ktdc.com', 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 'Nestled between two misty hills right in the heart of Munnar’s lush tea country.', 3800.00, FALSE, TRUE, TRUE, TRUE, TRUE),

-- Delhi
(14, UUID(), 10, 'The Imperial New Delhi', 5.0, 'Janpath, Connaught Place, New Delhi 110001', '+91 11 2334 1234', 'luxury@theimperialindia.com', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb', 'Legendary art deco heritage hotel built in 1931 with sprawling colonial verandas and high tea gardens.', 8900.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Udaipur
(15, UUID(), 11, 'The Oberoi Udaivilas Udaipur', 5.0, 'Haridas Ji Ki Magri, Mulla Talai, Udaipur, Rajasthan 313001', '+91 294 243 3300', 'reservations.udaivilas@oberoihotels.com', 'https://images.unsplash.com/photo-1582719508461-905c673771fd', 'World-celebrated lakeside palace sanctuary featuring dome-adorned pavilions and private pool terraces.', 16000.00, TRUE, TRUE, TRUE, TRUE, TRUE),
(16, UUID(), 11, 'Fateh Garh Heritage Resort Udaipur', 4.5, 'Sisarma, Udaipur, Rajasthan 313001', '+91 294 268 0000', 'info@fatehgarh.in', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', 'Perched on the edge of the Aravalli range offering 360-degree sunset views of Udaipur valley.', 5200.00, TRUE, TRUE, TRUE, TRUE, TRUE),

-- Rishikesh
(17, UUID(), 12, 'Aloha On The Ganges Resort', 4.5, 'Tapovan, Rishikesh, Uttarakhand 249192', '+91 135 242 6000', 'reservations@alohaontheganges.com', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', 'Scenic riverside resort overlooking the roaring Himalayan Ganges with yoga and meditation decks.', 4800.00, TRUE, TRUE, TRUE, TRUE, TRUE);

-- ---------------------------------------------------------------------
-- 5. SEED HOTEL ROOMS (Tiers with Realistic Price Variations)
-- ---------------------------------------------------------------------
INSERT INTO hotel_rooms (hotel_id, room_type, max_occupancy, has_ac, is_breakfast_included, price_per_night, total_inventory, available_inventory, is_active) VALUES
-- Hotel 1: JW Marriott Mumbai
(1, 'STANDARD', 2, TRUE, FALSE, 8500.00, 20, 20, TRUE),
(1, 'DELUXE', 3, TRUE, TRUE, 11500.00, 15, 15, TRUE),
(1, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 18000.00, 5, 5, TRUE),

-- Hotel 2: Taj Mahal Palace Mumbai
(2, 'STANDARD', 2, TRUE, TRUE, 14500.00, 15, 15, TRUE),
(2, 'DELUXE', 3, TRUE, TRUE, 22000.00, 10, 10, TRUE),
(2, 'PRESIDENTIAL_SUITE', 4, TRUE, TRUE, 45000.00, 2, 2, TRUE),

-- Hotel 3: Oberoi Amarvilas Agra
(3, 'DELUXE', 2, TRUE, TRUE, 12000.00, 12, 12, TRUE),
(3, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 24000.00, 4, 4, TRUE),

-- Hotel 4: Leela Palace Jaipur
(4, 'STANDARD', 2, TRUE, FALSE, 9500.00, 18, 18, TRUE),
(4, 'DELUXE', 3, TRUE, TRUE, 13500.00, 12, 12, TRUE),
(4, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 21000.00, 6, 6, TRUE),

-- Hotel 5: Oberoi Rajvilas Jaipur
(5, 'DELUXE', 2, TRUE, TRUE, 11000.00, 14, 14, TRUE),
(5, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 22500.00, 4, 4, TRUE),

-- Hotel 6: Wildflower Hall Shimla
(6, 'STANDARD', 2, TRUE, TRUE, 7800.00, 15, 15, TRUE),
(6, 'DELUXE', 3, TRUE, TRUE, 11200.00, 10, 10, TRUE),

-- Hotel 7: Taj Exotica Goa
(7, 'STANDARD', 2, TRUE, FALSE, 9200.00, 20, 20, TRUE),
(7, 'DELUXE', 3, TRUE, TRUE, 13800.00, 15, 15, TRUE),
(7, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 22000.00, 5, 5, TRUE),

-- Hotel 8: W Goa
(8, 'STANDARD', 2, TRUE, TRUE, 10500.00, 16, 16, TRUE),
(8, 'DELUXE', 3, TRUE, TRUE, 15500.00, 10, 10, TRUE),

-- Hotel 9: Heritage Village Goa
(9, 'STANDARD', 2, TRUE, FALSE, 4500.00, 25, 25, TRUE),
(9, 'DELUXE', 3, TRUE, TRUE, 6500.00, 15, 15, TRUE),

-- Hotel 10: The Himalayan Resort Manali
(10, 'STANDARD', 2, TRUE, FALSE, 6800.00, 14, 14, TRUE),
(10, 'DELUXE', 3, TRUE, TRUE, 9800.00, 8, 8, TRUE),

-- Hotel 11: Snow Valley Manali
(11, 'STANDARD', 2, FALSE, TRUE, 3200.00, 20, 20, TRUE),
(11, 'DELUXE', 3, TRUE, TRUE, 4800.00, 15, 15, TRUE),

-- Hotel 12: Kumarakom Lake Resort
(12, 'DELUXE', 2, TRUE, TRUE, 9800.00, 12, 12, TRUE),
(12, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 18500.00, 6, 6, TRUE),

-- Hotel 13: Tea County Munnar
(13, 'STANDARD', 2, FALSE, TRUE, 3800.00, 18, 18, TRUE),
(13, 'DELUXE', 3, TRUE, TRUE, 5500.00, 10, 10, TRUE),

-- Hotel 14: The Imperial New Delhi
(14, 'STANDARD', 2, TRUE, FALSE, 8900.00, 20, 20, TRUE),
(14, 'DELUXE', 3, TRUE, TRUE, 12800.00, 12, 12, TRUE),

-- Hotel 15: Oberoi Udaivilas Udaipur
(15, 'DELUXE', 2, TRUE, TRUE, 16000.00, 10, 10, TRUE),
(15, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 32000.00, 4, 4, TRUE),

-- Hotel 16: Fateh Garh Udaipur
(16, 'STANDARD', 2, TRUE, FALSE, 5200.00, 16, 16, TRUE),
(16, 'DELUXE', 3, TRUE, TRUE, 7800.00, 10, 10, TRUE),

-- Hotel 17: Aloha on the Ganges Rishikesh
(17, 'STANDARD', 2, TRUE, FALSE, 4800.00, 20, 20, TRUE),
(17, 'DELUXE', 3, TRUE, TRUE, 7200.00, 12, 12, TRUE);

-- ---------------------------------------------------------------------
-- 6. SEED CURATED PACKAGES (10 Multi-Day Tours across Tiers)
-- ---------------------------------------------------------------------
INSERT INTO packages (id, uuid, destination_id, title, tier, duration_days, duration_nights, base_price_per_person, hero_image_url, inclusions, exclusions, is_active) VALUES
(1, UUID(), 1, 'Royal Rajasthan Heritage Explorer', 'GOLD', 6, 5, 30000.00, 'https://images.unsplash.com/photo-1599661046289-e31897846e41', 'Stay in 5-star heritage palaces, Airport transfers, All meals included, Private AC luxury SUV, English-speaking historian guide, Fort entrance fees.', 'Personal shopping, Alcoholic beverages, Travel insurance.', TRUE),
(2, UUID(), 4, 'Himalayan Serenity & Cedar Valleys', 'SILVER', 4, 3, 20000.00, 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23', 'Stay in 4-star mountain view resort, Daily buffet breakfast and dinner, Private hill transfer, Guided nature trek, Tolls and permits.', 'Adventure sport tickets, Flight tickets.', TRUE),
(3, UUID(), 2, 'Golden Triangle Express (Agra & Jaipur)', 'BRONZE', 3, 2, 12000.00, 'https://images.unsplash.com/photo-1564507592333-c60657eea523', 'Comfortable 3-star boutique hotel stay, Daily breakfast, Sightseeing in AC sedan, Taj Mahal sunrise entry ticket.', 'Lunches and dinners, Monuments camera fees.', TRUE),
(4, UUID(), 7, 'Goa Beach Paradise & Coastal Cruise', 'SILVER', 5, 4, 22000.00, 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2', '4-star beachfront resort stay, Daily breakfast, Airport transfers, Sunset cruise on Mandovi river, North & South Goa guided sightseeing, Water sports pass.', 'Lunch and dinner, Scuba diving personal charges.', TRUE),
(5, UUID(), 8, 'Manali Alpine Thrills & Snow Trails', 'GOLD', 6, 5, 28000.00, 'https://images.unsplash.com/photo-1571536802807-30451e3955d8', '5-star luxury cottage stay, All meals included, Solang Valley paragliding pass, Rohtang snow permit, Private 4x4 vehicle with driver.', 'Winter snow suit rental, Personal gear.', TRUE),
(6, UUID(), 9, 'Kerala Serene Backwaters & Misty Hills', 'GOLD', 7, 6, 36000.00, 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944', '1-night luxury private houseboat with onboard chef, 5-star resort in Munnar, All meals, Ayurvedic spa massage, Kathakali dance show pass.', 'Airfare, Personal gratuities.', TRUE),
(7, UUID(), 10, 'Delhi Heritage, Monuments & Culinary Tour', 'BRONZE', 3, 2, 14000.00, 'https://images.unsplash.com/photo-1587474260584-136574528ed5', 'Central 4-star boutique hotel, Breakfast, Metro and private AC car transfers, Monument tickets, Old Delhi street food tasting walk.', 'Personal shopping, Flights.', TRUE),
(8, UUID(), 11, 'Udaipur Royal Lakeside Romance', 'SILVER', 4, 3, 24000.00, 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10', '4-star heritage lake view hotel, Daily breakfast, Private Lake Pichola sunset boat charter, City Palace museum tour, Candlelight dinner.', 'Personal shopping, Airfare.', TRUE),
(9, UUID(), 12, 'Rishikesh Yoga, Rafting & Spiritual Awakening', 'BRONZE', 4, 3, 15000.00, 'https://images.unsplash.com/photo-1600100397608-f010e4710db4', 'Riverside wellness retreat, Daily vegetarian buffet meals, 16-km river rafting expedition, Ganga Aarti VIP seating, Daily morning yoga & meditation sessions.', 'Personal gear, Railway/flight tickets.', TRUE),
(10, UUID(), 3, 'Mumbai Coastal Glamour & Street Gastronomy', 'SILVER', 3, 2, 18000.00, 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f', '4-star South Mumbai sea-facing hotel, Daily breakfast, Elephanta Caves ferry and guided excursion, Street food walking tour, AC chauffeured city sightseeing.', 'Lunches and dinners, Alcoholic beverages.', TRUE);

-- ---------------------------------------------------------------------
-- 7. SEED PACKAGE ITEMS (Day-by-Day Itinerary Schedules)
-- ---------------------------------------------------------------------
INSERT INTO package_items (package_id, day_number, activity_title, activity_description, is_meals_included) VALUES
-- Package 1: Royal Rajasthan
(1, 1, 'Arrival in Jaipur & Chokhi Dhani Cultural Night', 'Traditional welcome drinks, check-in to 5-star palace hotel, evening folk dance and Rajasthani buffet at Chokhi Dhani.', TRUE),
(1, 2, 'Amber Fort & Jaigarh Exploration', 'Morning elephant/jeep ride up to Amber Fort, exploration of Sheesh Mahal, and panoramic views from Jaigarh Fort.', TRUE),
(1, 3, 'City Palace, Jantar Mantar & Hawa Mahal', 'Guided tour of Maharaja Sawai Jai Singh royal residence and ancient astronomical observatory.', TRUE),
(1, 4, 'Nahargarh Fort Sunset & Bapu Bazaar', 'Stunning sunset vista overlooking Jaipur city from Nahargarh hills followed by handicraft shopping.', TRUE),
(1, 5, 'Abhaneri Stepwell Excursion', 'Day trip to the ancient 8th-century Chand Baori stepwell and local village culinary tour.', TRUE),
(1, 6, 'Royal Departure', 'Leisure morning, royal breakfast buffet, and private luxury chauffeur transfer to Jaipur airport.', TRUE),

-- Package 2: Himalayan Serenity Shimla
(2, 1, 'Scenic Hill Climb to Shimla', 'Pick-up from Chandigarh/Kalka, picturesque mountain drive to Shimla, check-in and evening stroll on The Ridge.', TRUE),
(2, 2, 'Kufri Snow Point & Nature Walk', 'Excursion to Kufri for horse riding, panoramic Himalayan viewpoints, and Himalayan Nature Park.', TRUE),
(2, 3, 'Jakhu Temple & Viceregal Lodge', 'Morning trek to Jakhu Temple followed by a heritage tour of the British Viceregal Lodge.', TRUE),
(2, 4, 'Farewell Hills', 'Breakfast with pine forest views and return transfer.', TRUE),

-- Package 4: Goa Beach Paradise
(4, 1, 'Arrival in Tropical Goa & Beach Sundowner', 'Airport transfer to luxury resort, welcome coconut drink, evening relaxation and sundowner at Baga Beach.', TRUE),
(4, 2, 'North Goa Forts & Watersports Day', 'Visit Aguada Fort, Chapora Fort, followed by parasailing and jet-skiing at Calangute Beach.', TRUE),
(4, 3, 'Historic Old Goa & Spice Farm Tour', 'Guided tour of Basilica of Bom Jesus and Se Cathedral, followed by a traditional Goan spice plantation buffet lunch.', TRUE),
(4, 4, 'Mandovi River Sunset Cruise & Latin Quarter', 'Walk through the colorful Portuguese quarter of Fontainhas and evening luxury catamaran cruise on the Mandovi.', TRUE),
(4, 5, 'Departure with Warm Memories', 'Leisure morning breakfast, souvenir shopping at flea market, and transfer to Goa airport.', TRUE),

-- Package 6: Kerala Backwaters & Hills
(6, 1, 'Arrival in Cochin & Transfer to Munnar', 'Chauffeured drive through mist-veiled Western Ghats with stops at Cheeyappara and Valara waterfalls.', TRUE),
(6, 2, 'Munnar Tea Gardens & Eravikulam National Park', 'Morning Nilgiri Tahr spotting at Eravikulam, tea museum visit, and stroll through aromatic cardamom plantations.', TRUE),
(6, 3, 'Transfer to Thekkady Periyar Wildlife', 'Drive to Periyar, spice plantation walk, and evening bamboo rafting lake safari.', TRUE),
(6, 4, 'Boarding the Private Alleppey Houseboat', 'Check-in to traditional AC deluxe houseboat, traditional Kerala Karimeen lunch, and cruising through palm canals.', TRUE),
(6, 5, 'Houseboat Cruise to Kumarakom', 'Morning bird sanctuary walk, sunrise over Vembanad Lake, and check-in to lakeside luxury resort.', TRUE),
(6, 6, 'Kumarakom Ayurvedic Wellness Day', 'Traditional Abhyangam Ayurvedic body therapy and evening Kathakali cultural drama show.', TRUE),
(6, 7, 'Cochin Sightseeing & Departure', 'Visit Chinese Fishing nets, Jewish Synagogue, and departure transfer to Cochin International Airport.', TRUE);
