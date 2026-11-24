// Fresh data for the live site. Edit freely; the seed upserts by name/email,
// so re-running updates records instead of duplicating them.

export interface SeedCategory {
  name: string;
  description: string;
}

export interface SeedService {
  name: string;
  category: string;
  description: string;
  whatIncluded: string[];
  price: number; // ₹, base price (city branches get CITY_PRICE_MULTIPLIER)
  duration: number; // minutes
}

export interface SeedBranch {
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  city: boolean; // city branches charge a little more
}

export interface SeedStylist {
  name: string;
  email: string;
  phone: string;
  branch: string;
  specialization: string;
  experience: number;
  position: 'JUNIOR' | 'SENIOR' | 'TRAINEE';
  bio: string;
  categories: string[]; // offers every service in these categories
}

export const CITY_PRICE_MULTIPLIER = 1.15;

// Mon–Sat 10:00–19:00 IST, Sunday off (0 = Sunday). Branch default breaks apply.
export const WEEKLY_SHIFT = { startTime: '10:00', endTime: '19:00' };
export const WORKING_DAYS = [1, 2, 3, 4, 5, 6];

export const categories: SeedCategory[] = [
  { name: 'Haircut & Styling', description: 'Cuts, trims and styling for every hair type.' },
  { name: "Men's Grooming", description: 'Beard, shave and grooming services for men.' },
  { name: 'Hair Colouring', description: 'Global colour, highlights and root touch-ups.' },
  { name: 'Hair Treatments', description: 'Spa, keratin and smoothening treatments.' },
  { name: 'Skin Care & Facials', description: 'Cleanups and facials for healthy, glowing skin.' },
  { name: 'Manicure & Pedicure', description: 'Hand and foot care, from classic to spa.' },
  { name: 'Makeup', description: 'Party and event makeup by trained artists.' },
  { name: 'Bridal', description: 'Complete bridal and groom packages.' },
];

export const services: SeedService[] = [
  // Haircut & Styling
  {
    name: "Men's Haircut",
    category: 'Haircut & Styling',
    description: 'Classic or modern cut, finished with a wash and style.',
    whatIncluded: ['Consultation', 'Haircut', 'Hair wash', 'Styling'],
    price: 250,
    duration: 30,
  },
  {
    name: "Women's Haircut",
    category: 'Haircut & Styling',
    description: 'Layers, bobs, fringes and more, tailored to your face shape.',
    whatIncluded: ['Consultation', 'Haircut', 'Hair wash', 'Blow-dry'],
    price: 600,
    duration: 45,
  },
  {
    name: "Kids' Haircut",
    category: 'Haircut & Styling',
    description: 'A quick, friendly haircut for children under 12.',
    whatIncluded: ['Haircut', 'Styling'],
    price: 150,
    duration: 20,
  },
  {
    name: 'Blow-dry & Styling',
    category: 'Haircut & Styling',
    description: 'Smooth blow-dry, curls or waves for any occasion.',
    whatIncluded: ['Hair wash', 'Blow-dry', 'Styling'],
    price: 400,
    duration: 30,
  },
  // Men's Grooming
  {
    name: 'Beard Trim & Shape',
    category: "Men's Grooming",
    description: 'Beard trimmed and shaped with clean lines.',
    whatIncluded: ['Beard trim', 'Line-up', 'Beard oil'],
    price: 150,
    duration: 20,
  },
  {
    name: 'Classic Hot Towel Shave',
    category: "Men's Grooming",
    description: 'Traditional straight-razor shave with hot towels.',
    whatIncluded: ['Hot towel', 'Straight-razor shave', 'Aftershave balm'],
    price: 200,
    duration: 25,
  },
  {
    name: 'Haircut & Beard Combo',
    category: "Men's Grooming",
    description: 'Haircut plus beard trim in one visit.',
    whatIncluded: ['Haircut', 'Beard trim', 'Hair wash', 'Styling'],
    price: 350,
    duration: 45,
  },
  // Hair Colouring
  {
    name: 'Global Hair Colour',
    category: 'Hair Colouring',
    description: 'Even, all-over colour with ammonia-free products.',
    whatIncluded: ['Consultation', 'Colour application', 'Wash', 'Blow-dry'],
    price: 1800,
    duration: 90,
  },
  {
    name: 'Highlights',
    category: 'Hair Colouring',
    description: 'Face-framing or full highlights for dimension.',
    whatIncluded: ['Consultation', 'Highlights', 'Toner', 'Blow-dry'],
    price: 2500,
    duration: 120,
  },
  {
    name: 'Root Touch-up',
    category: 'Hair Colouring',
    description: 'Cover regrowth to match your existing colour.',
    whatIncluded: ['Root colour', 'Wash', 'Blow-dry'],
    price: 900,
    duration: 60,
  },
  // Hair Treatments
  {
    name: 'Hair Spa',
    category: 'Hair Treatments',
    description: 'Deep-conditioning spa with a relaxing head massage.',
    whatIncluded: ['Head massage', 'Hair mask', 'Steam', 'Wash'],
    price: 800,
    duration: 45,
  },
  {
    name: 'Keratin Treatment',
    category: 'Hair Treatments',
    description: 'Frizz control and shine that lasts for months.',
    whatIncluded: ['Consultation', 'Keratin application', 'Ironing', 'Aftercare kit'],
    price: 3500,
    duration: 150,
  },
  // Skin Care & Facials
  {
    name: 'Basic Cleanup',
    category: 'Skin Care & Facials',
    description: 'Cleanse, scrub and mask for fresh skin.',
    whatIncluded: ['Cleansing', 'Scrub', 'Steam', 'Face pack'],
    price: 500,
    duration: 30,
  },
  {
    name: 'Fruit Facial',
    category: 'Skin Care & Facials',
    description: 'Hydrating fruit facial for a natural glow.',
    whatIncluded: ['Cleansing', 'Scrub', 'Massage', 'Fruit pack'],
    price: 900,
    duration: 50,
  },
  {
    name: 'Gold Facial',
    category: 'Skin Care & Facials',
    description: 'Brightening gold facial for special days.',
    whatIncluded: ['Cleansing', 'Scrub', 'Gold massage', 'Gold mask'],
    price: 1500,
    duration: 60,
  },
  // Manicure & Pedicure
  {
    name: 'Classic Manicure',
    category: 'Manicure & Pedicure',
    description: 'Nail shaping, cuticle care and polish.',
    whatIncluded: ['Soak', 'Nail shaping', 'Cuticle care', 'Polish'],
    price: 400,
    duration: 30,
  },
  {
    name: 'Spa Pedicure',
    category: 'Manicure & Pedicure',
    description: 'Relaxing foot soak, scrub, massage and polish.',
    whatIncluded: ['Foot soak', 'Scrub', 'Massage', 'Polish'],
    price: 700,
    duration: 45,
  },
  // Makeup
  {
    name: 'Party Makeup',
    category: 'Makeup',
    description: 'Long-lasting makeup for parties and events.',
    whatIncluded: ['Skin prep', 'Makeup', 'Hairstyling'],
    price: 2000,
    duration: 60,
  },
  // Bridal
  {
    name: 'Bridal Makeup',
    category: 'Bridal',
    description: 'HD bridal makeup with draping and hairstyling.',
    whatIncluded: ['Trial consultation', 'HD makeup', 'Hairstyling', 'Saree draping'],
    price: 12000,
    duration: 180,
  },
  {
    name: 'Groom Package',
    category: 'Bridal',
    description: 'Haircut, beard styling and facial for the groom.',
    whatIncluded: ['Haircut', 'Beard styling', 'Facial', 'Styling'],
    price: 3000,
    duration: 120,
  },
];

// Real branches (Kerala) with the addresses and coordinates from the current site.
export const branches: SeedBranch[] = [
  {
    name: 'Kochi',
    address:
      'Caza Maria, 6/125, Jew Town Road, Mattancherry, Kochi, Ernakulam, Kerala 682002, India',
    phone: '',
    latitude: 9.958114509947913,
    longitude: 76.25953674316406,
    city: true,
  },
  {
    name: 'Kallai',
    address: 'Kallai, Kozhikode, Kerala 673003, India',
    phone: '',
    latitude: 11.235104,
    longitude: 75.7886846,
    city: true,
  },
  {
    name: 'Thondayad',
    address: 'Thondayad Bypass Road, Palazhi, Kozhikode, Kerala 673014, India',
    phone: '',
    latitude: 11.245082438935027,
    longitude: 75.83613395690918,
    city: true,
  },
  {
    name: 'Kinassery',
    address: 'Kinassery, Thiruvannur, Kozhikode, Kerala, India',
    phone: '',
    latitude: 11.2305921,
    longitude: 75.8152331,
    city: false,
  },
  {
    name: 'Tirur',
    address: 'Tirur, Malappuram, Kerala 676101, India',
    phone: '+916784532190',
    latitude: 10.9166828,
    longitude: 75.923986,
    city: false,
  },
  {
    name: 'Kakkanchery',
    address: 'Kakkanchery, Chelembra, Kerala 673634, India',
    phone: '',
    latitude: 11.157392630525486,
    longitude: 75.89364051818848,
    city: false,
  },
  {
    name: 'Balussery',
    address: 'Balussery Mukku, Balussery, Koyilandy, Kozhikode, Kerala 673612, India',
    phone: '',
    latitude: 11.446208967821155,
    longitude: 75.82901000976564,
    city: false,
  },
  {
    name: 'Madavoor',
    address: 'Padanilam - Narikkuni Road, Madavoor, Kerala 673585, India',
    phone: '+917012964450',
    latitude: 11.350291810610935,
    longitude: 75.87656021118164,
    city: false,
  },
];

const HAIR = ['Haircut & Styling', "Men's Grooming"];
const COLOUR = ['Haircut & Styling', 'Hair Colouring', 'Hair Treatments'];
const SKIN = ['Skin Care & Facials', 'Manicure & Pedicure', 'Makeup', 'Bridal'];

// Two stylists per branch. Emails are login IDs on the live site (not real inboxes).
export const stylists: SeedStylist[] = [
  {
    name: 'Arjun Menon',
    branch: 'Kochi',
    specialization: 'Hair & Beard',
    experience: 8,
    position: 'SENIOR',
    categories: HAIR,
    bio: 'Precision fades and classic cuts.',
  },
  {
    name: 'Anjali Nair',
    branch: 'Kochi',
    specialization: 'Bridal & Makeup',
    experience: 7,
    position: 'SENIOR',
    categories: SKIN,
    bio: 'Bridal looks that last all day.',
  },
  {
    name: 'Faisal Rahman',
    branch: 'Kallai',
    specialization: 'Hair Colour',
    experience: 5,
    position: 'SENIOR',
    categories: COLOUR,
    bio: 'Colour, highlights and keratin.',
  },
  {
    name: 'Shahana Basheer',
    branch: 'Kallai',
    specialization: 'Skin & Facials',
    experience: 4,
    position: 'JUNIOR',
    categories: SKIN,
    bio: 'Facials and glowing skin.',
  },
  {
    name: 'Rahul Krishnan',
    branch: 'Thondayad',
    specialization: 'Hair & Beard',
    experience: 6,
    position: 'SENIOR',
    categories: HAIR,
    bio: 'Modern cuts and beard styling.',
  },
  {
    name: 'Fathima Shirin',
    branch: 'Thondayad',
    specialization: 'Skin & Nails',
    experience: 3,
    position: 'JUNIOR',
    categories: SKIN,
    bio: 'Manicures, pedicures and cleanups.',
  },
  {
    name: 'Nikhil Das',
    branch: 'Kinassery',
    specialization: 'Hair & Beard',
    experience: 4,
    position: 'JUNIOR',
    categories: HAIR,
    bio: 'Quick, sharp everyday cuts.',
  },
  {
    name: 'Sneha Pillai',
    branch: 'Kinassery',
    specialization: 'Hair Colour',
    experience: 5,
    position: 'SENIOR',
    categories: COLOUR,
    bio: 'Natural-looking colour.',
  },
  {
    name: 'Muhammed Shafi',
    branch: 'Tirur',
    specialization: 'Hair & Beard',
    experience: 9,
    position: 'SENIOR',
    categories: HAIR,
    bio: 'Hot towel shaves and classic cuts.',
  },
  {
    name: 'Ayisha Nasrin',
    branch: 'Tirur',
    specialization: 'Bridal & Makeup',
    experience: 6,
    position: 'SENIOR',
    categories: SKIN,
    bio: 'Bridal and party makeup.',
  },
  {
    name: 'Vishnu Prasad',
    branch: 'Kakkanchery',
    specialization: 'Hair & Beard',
    experience: 3,
    position: 'JUNIOR',
    categories: HAIR,
    bio: 'Fades and kids’ cuts.',
  },
  {
    name: 'Divya Mohan',
    branch: 'Kakkanchery',
    specialization: 'Hair Treatments',
    experience: 4,
    position: 'JUNIOR',
    categories: COLOUR,
    bio: 'Hair spa and smoothening.',
  },
  {
    name: 'Ajmal Hussain',
    branch: 'Balussery',
    specialization: 'Hair & Beard',
    experience: 5,
    position: 'SENIOR',
    categories: HAIR,
    bio: 'Beard sculpting specialist.',
  },
  {
    name: 'Reshma Rajan',
    branch: 'Balussery',
    specialization: 'Skin & Facials',
    experience: 2,
    position: 'TRAINEE',
    categories: SKIN,
    bio: 'Cleanups and facials.',
  },
  {
    name: 'Sanjay Kumar',
    branch: 'Madavoor',
    specialization: 'Hair & Beard',
    experience: 7,
    position: 'SENIOR',
    categories: HAIR,
    bio: 'Classic and modern men’s cuts.',
  },
  {
    name: 'Haritha Suresh',
    branch: 'Madavoor',
    specialization: 'Hair Colour',
    experience: 3,
    position: 'JUNIOR',
    categories: COLOUR,
    bio: 'Root touch-ups and highlights.',
  },
].map((s, i) => ({
  ...s,
  position: s.position as SeedStylist['position'],
  email: `${s.name.split(' ')[0].toLowerCase()}.${s.branch.toLowerCase()}@stylist.salonbook.online`,
  phone: `+9190000${String(10001 + i).padStart(5, '0')}`,
}));

/** Short descriptions for the "What's included" lines above, keyed by title. */
export const INCLUDED_DESCRIPTIONS: Record<string, string> = {
  Consultation: 'A quick chat about the look you want and what suits your hair and face.',
  'Trial consultation': 'A trial run so you can see and adjust the look before the big day.',
  Haircut: 'A precise cut shaped to your style, length and hair type.',
  'Hair wash': 'A gentle shampoo and conditioner to clean and soften your hair.',
  Wash: 'A refreshing shampoo and rinse before the main treatment.',
  Styling: 'Finished with a style of your choice using light products.',
  Hairstyling: 'A full hairstyle set to last through your event.',
  'Blow-dry': 'Dried and shaped with a round brush for smooth, full hair.',
  Ironing: 'Smoothed with a flat iron for a sleek, polished finish.',
  'Beard trim': 'Your beard trimmed evenly and shaped to your face.',
  'Beard styling': 'Beard lines and length styled to the look you want.',
  'Beard oil': 'A nourishing oil to soften the beard and calm the skin.',
  'Line-up': 'Sharp edges along the hairline and beard for a clean finish.',
  'Straight-razor shave': 'A close, smooth shave with a traditional straight razor.',
  'Hot towel': 'A warm towel to open the pores and relax the skin.',
  'Aftershave balm': 'A soothing balm to calm the skin after shaving.',
  'Head massage': 'A relaxing scalp massage to ease tension and boost circulation.',
  Massage: 'A relaxing massage to ease tension and leave you refreshed.',
  'Hair mask': 'A deep-conditioning mask to restore moisture and shine.',
  Toner: 'Balances the colour and removes unwanted brassy tones.',
  'Root colour': 'Colour applied to the roots to cover regrowth and greys.',
  'Colour application': 'Even, all-over colour applied by a trained colourist.',
  Highlights: 'Lighter strands placed to add brightness and dimension.',
  'Keratin application': 'Keratin treatment applied strand by strand for smooth, frizz-free hair.',
  'Aftercare kit': 'Products and tips to help your treatment last longer at home.',
  Cleansing: 'Removes dirt, oil and makeup to prepare the skin.',
  Steam: 'Gentle steam to open the pores before deep cleaning.',
  Scrub: 'Exfoliates dead skin for a smoother, brighter feel.',
  'Face pack': 'A soothing face pack chosen for your skin type.',
  'Fruit pack': 'A fruit-based pack full of vitamins for a natural glow.',
  Facial: 'A complete facial to cleanse, nourish and refresh the skin.',
  'Gold massage': 'A massage with gold-infused cream for radiant skin.',
  'Gold mask': 'A gold mask that brightens and firms the skin.',
  'Skin prep': 'Cleansing and moisturising so makeup sits smoothly and lasts.',
  Makeup: 'Full makeup matched to your outfit and the occasion.',
  'HD makeup': 'High-definition makeup that looks flawless in photos and video.',
  'Saree draping': 'Your saree draped neatly and pinned to stay in place.',
  Soak: 'A warm soak to soften the skin and nails.',
  'Foot soak': 'A warm, scented foot soak to relax and soften the skin.',
  'Nail shaping': 'Nails trimmed and filed to the shape you like.',
  'Cuticle care': 'Cuticles softened, pushed back and tidied.',
  Polish: 'A neat coat of polish in the colour of your choice.',
};
