
-- Seed test data for DateInIndia (fixed version)
DO $$
DECLARE
  u1 UUID := gen_random_uuid();
  u2 UUID := gen_random_uuid();
  u3 UUID := gen_random_uuid();
  u4 UUID := gen_random_uuid();
  u5 UUID := gen_random_uuid();
  u6 UUID := gen_random_uuid();
  u7 UUID := gen_random_uuid();
  u8 UUID := gen_random_uuid();
  u9 UUID := gen_random_uuid();
  u10 UUID := gen_random_uuid();
  u11 UUID := gen_random_uuid();
  u12 UUID := gen_random_uuid();
  u13 UUID := gen_random_uuid();
  u14 UUID := gen_random_uuid();
  u15 UUID := gen_random_uuid();
  m1_id UUID;
  m2_id UUID;
BEGIN

INSERT INTO users (id, phone, name, date_of_birth, gender, looking_for, city, state, bio, occupation, education, religion, height_cm, smoking, drinking, interests, relationship_goal, trust_score, phone_verified, aadhaar_verified, selfie_verified, onboarding_complete, is_premium, profile_complete_pct, last_active_at) VALUES
(u1,  '9000000001', 'Priya Sharma',    '1996-03-15', 'woman', 'men',      'Mumbai',    'Maharashtra', 'Software engineer who loves hiking and cooking. Looking for someone genuine who can make me laugh.', 'Software Engineer',      'postgraduate', 'Hindu',    165, 'never',     'socially',  ARRAY['Tech','Hiking','Cooking','Travel','Yoga'],                  'serious',    85, true, true,  true,  true, true,  95, NOW() - INTERVAL '5 minutes'),
(u2,  '9000000002', 'Rahul Verma',     '1993-07-22', 'man',   'women',    'Delhi',     'Delhi',       'Architect by day, amateur chef by night. I believe in slow mornings and deep conversations.',        'Architect',              'postgraduate', 'Hindu',    178, 'never',     'never',     ARRAY['Architecture','Cooking','Photography','Travel','Chess'],     'marriage',   72, true, true,  false, true, false, 88, NOW() - INTERVAL '2 hours'),
(u3,  '9000000003', 'Ananya Patel',    '1997-11-08', 'woman', 'men',      'Bangalore', 'Karnataka',   'UX designer passionate about creating meaningful experiences. Dog mom. Loves indie music.',           'UX Designer',            'graduate',     'Hindu',    162, 'never',     'socially',  ARRAY['Design','Music','Dogs','Art','Cycling'],                    'serious',    91, true, true,  true,  true, true,  97, NOW() - INTERVAL '10 minutes'),
(u4,  '9000000004', 'Arjun Nair',      '1994-05-30', 'man',   'women',    'Kochi',     'Kerala',      'Marine biologist exploring the oceans. Passionate about conservation and good food.',                 'Marine Biologist',       'phd',          'Hindu',    175, 'never',     'socially',  ARRAY['Ocean','Cooking','Travel','Reading','Fitness'],             'serious',    68, true, true,  false, true, false, 82, NOW() - INTERVAL '1 day'),
(u5,  '9000000005', 'Sneha Reddy',     '1995-09-12', 'woman', 'men',      'Hyderabad', 'Telangana',   'Pediatric doctor saving tiny humans. Weekend traveler, bookworm, and terrible at cooking.',           'Doctor',                 'postgraduate', 'Hindu',    158, 'never',     'never',     ARRAY['Medicine','Reading','Travel','Photography','Yoga'],         'marriage',   88, true, true,  true,  true, false, 90, NOW() - INTERVAL '30 minutes'),
(u6,  '9000000006', 'Karan Mehta',     '1992-02-14', 'man',   'women',    'Mumbai',    'Maharashtra', 'Investment banker who thinks work-life balance is real. Weekend mountaineer.',                        'Investment Banker',      'postgraduate', 'Hindu',    182, 'never',     'socially',  ARRAY['Finance','Mountaineering','Cricket','Travel','Meditation'], 'serious',    60, true, false, false, true, false, 75, NOW() - INTERVAL '3 hours'),
(u7,  '9000000007', 'Divya Iyer',      '1998-06-25', 'woman', 'men',      'Chennai',   'Tamil Nadu',  'Carnatic musician and classical dancer. PhD student in linguistics. Bibliophile.',                    'PhD Student',            'postgraduate', 'Hindu',    160, 'never',     'never',     ARRAY['Music','Dance','Reading','Languages','Spirituality'],       'marriage',   78, true, true,  false, true, false, 87, NOW() - INTERVAL '4 hours'),
(u8,  '9000000008', 'Vikram Singh',    '1991-12-03', 'man',   'women',    'Pune',      'Maharashtra', 'Startup founder, failed chef, successful dog trainer. Life is too short for bad coffee.',             'Entrepreneur',           'graduate',     'Sikh',     180, 'socially',  'socially',  ARRAY['Entrepreneurship','Cooking','Dogs','Technology','Fitness'], 'serious',    55, true, false, false, true, false, 70, NOW() - INTERVAL '6 hours'),
(u9,  '9000000009', 'Meera Krishnan',  '1996-08-18', 'woman', 'men',      'Bangalore', 'Karnataka',   'Product manager at a fintech. Coffee addict, amateur marathoner, and sunset chaser.',                'Product Manager',        'postgraduate', 'Hindu',    163, 'never',     'socially',  ARRAY['Fintech','Running','Coffee','Travel','Photography'],        'serious',    82, true, true,  true,  true, true,  93, NOW() - INTERVAL '20 minutes'),
(u10, '9000000010', 'Rohan Kapoor',    '1993-04-07', 'man',   'women',    'Delhi',     'Delhi',       'Journalist covering South Asia. Avid reader, terrible singer, excellent cook.',                       'Journalist',             'graduate',     'Hindu',    176, 'never',     'socially',  ARRAY['Writing','Cooking','Music','Travel','Reading'],             'serious',    45, true, false, false, true, false, 65, NOW() - INTERVAL '2 days'),
(u11, '9000000011', 'Pooja Gupta',     '1997-01-20', 'woman', 'men',      'Jaipur',    'Rajasthan',   'Fashion designer inspired by India textile heritage. Loves desert sunsets and spicy chai.',           'Fashion Designer',       'graduate',     'Hindu',    161, 'never',     'never',     ARRAY['Fashion','Art','Travel','Cooking','Photography'],           'friendship', 70, true, true,  false, true, false, 80, NOW() - INTERVAL '1 hour'),
(u12, '9000000012', 'Aditya Bose',     '1990-10-15', 'man',   'women',    'Kolkata',   'West Bengal', 'Economist by training, poet by passion. Fish curry is life. Tagore is my spirit animal.',            'Economist',              'phd',          'Hindu',    173, 'never',     'socially',  ARRAY['Economics','Poetry','Music','Reading','Cooking'],           'serious',    58, true, false, false, true, false, 72, NOW() - INTERVAL '5 hours'),
(u13, '9000000013', 'Nisha Agarwal',   '1995-07-04', 'woman', 'men',      'Ahmedabad', 'Gujarat',     'Chartered accountant by profession, home baker by heart. Believer in honest conversations.',          'CA',                     'postgraduate', 'Jain',     157, 'never',     'never',     ARRAY['Baking','Finance','Yoga','Travel','Spirituality'],          'marriage',   93, true, true,  true,  true, true,  98, NOW() - INTERVAL '15 minutes'),
(u14, '9000000014', 'Siddharth Rao',   '1994-03-27', 'man',   'women',    'Hyderabad', 'Telangana',   'Data scientist building AI for healthcare. Table tennis champion. Loves road trips.',                 'Data Scientist',         'postgraduate', 'Hindu',    177, 'never',     'socially',  ARRAY['AI','Technology','Sports','Travel','Fitness'],              'serious',    74, true, true,  false, true, false, 85, NOW() - INTERVAL '45 minutes'),
(u15, '9000000015', 'Kavya Menon',     '1998-12-11', 'woman', 'men',      'Chandigarh','Punjab',      'Civil engineer building sustainable cities. Loves mountains, chai, and honest people.',               'Civil Engineer',         'postgraduate', 'Hindu',    164, 'never',     'never',     ARRAY['Engineering','Hiking','Travel','Cooking','Reading'],        'serious',    79, true, true,  true,  true, false, 89, NOW() - INTERVAL '1 hour');

INSERT INTO verifications (user_id, verification_type, status, provider, verified_at) VALUES
(u1,'phone','approved','sms',NOW()),(u1,'aadhaar','approved','digilocker',NOW()),(u1,'selfie','approved','hyperverge',NOW()),
(u2,'phone','approved','sms',NOW()),(u2,'aadhaar','approved','digilocker',NOW()),
(u3,'phone','approved','sms',NOW()),(u3,'aadhaar','approved','digilocker',NOW()),(u3,'selfie','approved','hyperverge',NOW()),
(u4,'phone','approved','sms',NOW()),(u4,'aadhaar','approved','digilocker',NOW()),
(u5,'phone','approved','sms',NOW()),(u5,'aadhaar','approved','digilocker',NOW()),(u5,'selfie','approved','hyperverge',NOW()),
(u6,'phone','approved','sms',NOW()),
(u7,'phone','approved','sms',NOW()),(u7,'aadhaar','approved','digilocker',NOW()),
(u8,'phone','approved','sms',NOW()),
(u9,'phone','approved','sms',NOW()),(u9,'aadhaar','approved','digilocker',NOW()),(u9,'selfie','approved','hyperverge',NOW()),
(u10,'phone','approved','sms',NOW()),
(u11,'phone','approved','sms',NOW()),(u11,'aadhaar','approved','digilocker',NOW()),
(u12,'phone','approved','sms',NOW()),
(u13,'phone','approved','sms',NOW()),(u13,'aadhaar','approved','digilocker',NOW()),(u13,'selfie','approved','hyperverge',NOW()),
(u14,'phone','approved','sms',NOW()),(u14,'aadhaar','approved','digilocker',NOW()),
(u15,'phone','approved','sms',NOW()),(u15,'aadhaar','approved','digilocker',NOW()),(u15,'selfie','approved','hyperverge',NOW());

INSERT INTO photos (user_id, storage_url, is_primary, ai_approved, display_order) VALUES
(u1,'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',true,true,1),
(u1,'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg',false,true,2),
(u2,'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',true,true,1),
(u2,'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',false,true,2),
(u3,'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',true,true,1),
(u3,'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',false,true,2),
(u4,'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',true,true,1),
(u5,'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',true,true,1),
(u5,'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg',false,true,2),
(u6,'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',true,true,1),
(u7,'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg',true,true,1),
(u8,'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',true,true,1),
(u9,'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg',true,true,1),
(u9,'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',false,true,2),
(u10,'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg',true,true,1),
(u11,'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg',true,true,1),
(u12,'https://images.pexels.com/photos/1124463/pexels-photo-1124463.jpeg',true,true,1),
(u13,'https://images.pexels.com/photos/1898555/pexels-photo-1898555.jpeg',true,true,1),
(u13,'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg',false,true,2),
(u14,'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg',true,true,1),
(u15,'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg',true,true,1);

INSERT INTO subscriptions (user_id, tier, billing_period, amount_paise, status, starts_at, expires_at) VALUES
(u1,'trust','monthly',59600,'active',NOW(),NOW() + INTERVAL '30 days'),
(u3,'standard','monthly',39600,'active',NOW(),NOW() + INTERVAL '30 days'),
(u9,'trust','monthly',59600,'active',NOW(),NOW() + INTERVAL '30 days'),
(u13,'trust','monthly',59600,'active',NOW(),NOW() + INTERVAL '30 days');

INSERT INTO likes (liker_id, liked_id) VALUES
(u2,u1),(u4,u1),(u6,u1),(u8,u3),(u10,u3),(u12,u5),(u14,u5),(u6,u9),
(u2,u9),(u14,u7),(u8,u11),(u10,u13),(u1,u2),(u3,u8),(u5,u14),(u9,u6),
(u7,u14),(u13,u10);

INSERT INTO matches (user_1_id, user_2_id, compatibility_score, icebreakers, is_active) VALUES
(LEAST(u1,u2),GREATEST(u1,u2),82,ARRAY['What brought you to Mumbai?','What is your favorite weekend activity?'],true),
(LEAST(u3,u8),GREATEST(u3,u8),75,ARRAY['Tell me about your startup journey!','What is the best thing you have cooked recently?'],true),
(LEAST(u5,u14),GREATEST(u5,u14),88,ARRAY['Favorite road trip destination?','Table tennis or cricket?'],true),
(LEAST(u6,u9),GREATEST(u6,u9),79,ARRAY['Mountains or beaches?','Favorite coffee order?'],true);

SELECT id INTO m1_id FROM matches WHERE (user_1_id = LEAST(u1,u2) AND user_2_id = GREATEST(u1,u2));
SELECT id INTO m2_id FROM matches WHERE (user_1_id = LEAST(u5,u14) AND user_2_id = GREATEST(u5,u14));

IF m1_id IS NOT NULL THEN
  INSERT INTO messages (match_id, sender_id, content, is_read) VALUES
  (m1_id, u2, 'Hi Priya! Your profile is really interesting. Do you actually hike in Mumbai?', true),
  (m1_id, u1, 'Hey Rahul! Yes, Sanjay Gandhi National Park is amazing for weekend hikes. Have you been?', true),
  (m1_id, u2, 'I have not actually! Would love to explore that sometime. What is your favorite trail there?', false);
END IF;

IF m2_id IS NOT NULL THEN
  INSERT INTO messages (match_id, sender_id, content, is_read) VALUES
  (m2_id, u14, 'Hi Sneha! A doctor and a data scientist - we probably both work too hard.', true),
  (m2_id, u5, 'Haha that is very true! At least you get weekends for road trips. I am on call half the time.', true),
  (m2_id, u14, 'Worth it though! Where was your last road trip?', true),
  (m2_id, u5, 'Coorg last month! Absolutely beautiful. Have you done any south India drives?', false);
END IF;

INSERT INTO transparency_reports (report_month, total_messages_scanned, fake_profiles_removed, scam_accounts_banned, harassment_warnings, reports_assisted_law, avg_resolution_hours, new_users, aadhaar_verified_count, published_at) VALUES
('2026-05-01',48291,23,12,89,2,18.5,1247,892,NOW() - INTERVAL '25 days'),
('2026-04-01',41882,18,9,74,1,21.2,1089,778,NOW() - INTERVAL '55 days'),
('2026-03-01',35641,31,14,92,3,16.8,956,641,NOW() - INTERVAL '85 days')
ON CONFLICT (report_month) DO NOTHING;

END $$;
