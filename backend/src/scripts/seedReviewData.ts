// Demo customers and reviews. Each review is backed by a past COMPLETED booking,
// because the app ties every review to a booking.
//
// The 4 highest-rated stylists are the ones the home page "Top Rated Stylists"
// shows: Arjun Menon, Anjali Nair, Ayisha Nasrin, Faisal Rahman.

export interface SeedCustomer {
  name: string;
  email: string;
}

export interface SeedReview {
  customer: string; // customer name
  stylist: string; // stylist name (from seedData.stylists)
  service: string; // service name (must be one the stylist offers)
  daysAgo: number;
  startTime: string; // HH:mm IST
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
}

export const customers: SeedCustomer[] = [
  'Aswin Raj',
  'Meera Varma',
  'Sameer Ali',
  'Nithya Joseph',
  'Akhil Babu',
  'Lakshmi Menon',
  'Irfan Ahmed',
  'Gopika Das',
  'Joel Thomas',
  'Hiba Fathima',
].map((name) => ({
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@customer.salonbook.online`,
}));

export const reviews: SeedReview[] = [
  // Arjun Menon (Kochi) — 5.0 from 5 reviews
  {
    customer: 'Aswin Raj',
    stylist: 'Arjun Menon',
    service: "Men's Haircut",
    daysAgo: 52,
    startTime: '11:00',
    rating: 5,
    comment:
      'Best fade I have had in Kochi. Arjun listens to what you want and gets it right first time.',
  },
  {
    customer: 'Joel Thomas',
    stylist: 'Arjun Menon',
    service: 'Haircut & Beard Combo',
    daysAgo: 38,
    startTime: '16:30',
    rating: 5,
    comment: 'Sharp haircut and a clean beard line-up. Worth every rupee.',
  },
  {
    customer: 'Sameer Ali',
    stylist: 'Arjun Menon',
    service: 'Beard Trim & Shape',
    daysAgo: 25,
    startTime: '12:00',
    rating: 5,
    comment: 'Quick, neat and very professional. My beard has never looked this good.',
  },
  {
    customer: 'Irfan Ahmed',
    stylist: 'Arjun Menon',
    service: 'Classic Hot Towel Shave',
    daysAgo: 14,
    startTime: '10:30',
    rating: 5,
    comment: 'The hot towel shave was so relaxing. Smoothest shave ever.',
  },
  {
    customer: 'Akhil Babu',
    stylist: 'Arjun Menon',
    service: "Men's Haircut",
    daysAgo: 4,
    startTime: '17:00',
    rating: 5,
    comment: 'Booked online, no waiting at all. Great cut as always.',
  },

  // Anjali Nair (Kochi) — 5.0 from 4 reviews
  {
    customer: 'Meera Varma',
    stylist: 'Anjali Nair',
    service: 'Bridal Makeup',
    daysAgo: 47,
    startTime: '10:00',
    rating: 5,
    comment:
      'Anjali did my wedding makeup and it stayed perfect from morning till night. Everyone asked who my artist was!',
  },
  {
    customer: 'Lakshmi Menon',
    stylist: 'Anjali Nair',
    service: 'Party Makeup',
    daysAgo: 30,
    startTime: '15:00',
    rating: 5,
    comment: 'Natural, glowing look exactly like I wanted. Highly recommend.',
  },
  {
    customer: 'Gopika Das',
    stylist: 'Anjali Nair',
    service: 'Gold Facial',
    daysAgo: 18,
    startTime: '11:30',
    rating: 5,
    comment: 'My skin felt amazing for days after the gold facial. Very gentle hands.',
  },
  {
    customer: 'Nithya Joseph',
    stylist: 'Anjali Nair',
    service: 'Classic Manicure',
    daysAgo: 6,
    startTime: '14:00',
    rating: 5,
    comment: 'Clean, careful and the polish lasted two weeks.',
  },

  // Ayisha Nasrin (Tirur) — 4.8 from 5 reviews
  {
    customer: 'Hiba Fathima',
    stylist: 'Ayisha Nasrin',
    service: 'Bridal Makeup',
    daysAgo: 58,
    startTime: '09:30',
    rating: 5,
    comment: 'Beautiful bridal look and she was so calm on a stressful day. Thank you Ayisha!',
  },
  {
    customer: 'Lakshmi Menon',
    stylist: 'Ayisha Nasrin',
    service: 'Fruit Facial',
    daysAgo: 41,
    startTime: '12:30',
    rating: 5,
    comment: 'Lovely facial, very hygienic setup and friendly staff.',
  },
  {
    customer: 'Gopika Das',
    stylist: 'Ayisha Nasrin',
    service: 'Party Makeup',
    daysAgo: 27,
    startTime: '16:00',
    rating: 5,
    comment: 'Got so many compliments at the function. Will book again.',
  },
  {
    customer: 'Meera Varma',
    stylist: 'Ayisha Nasrin',
    service: 'Spa Pedicure',
    daysAgo: 12,
    startTime: '13:00',
    rating: 4,
    comment: 'Very relaxing pedicure. Slight wait at the start but worth it.',
  },
  {
    customer: 'Hiba Fathima',
    stylist: 'Ayisha Nasrin',
    service: 'Basic Cleanup',
    daysAgo: 3,
    startTime: '11:00',
    rating: 5,
    comment: 'Quick cleanup before an event, skin looked fresh instantly.',
  },

  // Faisal Rahman (Kallai) — 4.75 from 4 reviews
  {
    customer: 'Nithya Joseph',
    stylist: 'Faisal Rahman',
    service: 'Highlights',
    daysAgo: 49,
    startTime: '10:00',
    rating: 5,
    comment: 'The highlights look so natural. Faisal really knows colour.',
  },
  {
    customer: 'Sameer Ali',
    stylist: 'Faisal Rahman',
    service: 'Hair Spa',
    daysAgo: 33,
    startTime: '15:30',
    rating: 4,
    comment: 'Relaxing hair spa and a great head massage.',
  },
  {
    customer: 'Lakshmi Menon',
    stylist: 'Faisal Rahman',
    service: 'Keratin Treatment',
    daysAgo: 20,
    startTime: '11:00',
    rating: 5,
    comment: 'No more frizz! Hair is smooth and shiny even after washing.',
  },
  {
    customer: 'Gopika Das',
    stylist: 'Faisal Rahman',
    service: 'Global Hair Colour',
    daysAgo: 9,
    startTime: '12:00',
    rating: 5,
    comment: 'Even colour and he suggested a shade that suits me perfectly.',
  },

  // Others (4.0–4.5)
  {
    customer: 'Akhil Babu',
    stylist: 'Rahul Krishnan',
    service: "Men's Haircut",
    daysAgo: 44,
    startTime: '18:00',
    rating: 5,
    comment: 'Good cut, friendly guy, fair price.',
  },
  {
    customer: 'Joel Thomas',
    stylist: 'Rahul Krishnan',
    service: 'Haircut & Beard Combo',
    daysAgo: 16,
    startTime: '17:30',
    rating: 4,
    comment: 'Nice combo, would like a little more time on the beard next time.',
  },
  {
    customer: 'Irfan Ahmed',
    stylist: 'Muhammed Shafi',
    service: 'Classic Hot Towel Shave',
    daysAgo: 36,
    startTime: '10:00',
    rating: 5,
    comment: 'Old-school barber experience done right.',
  },
  {
    customer: 'Aswin Raj',
    stylist: 'Muhammed Shafi',
    service: 'Beard Trim & Shape',
    daysAgo: 22,
    startTime: '13:30',
    rating: 4,
    comment: 'Clean beard trim, shop was busy but they kept to my slot.',
  },
  {
    customer: 'Sameer Ali',
    stylist: 'Muhammed Shafi',
    service: "Men's Haircut",
    daysAgo: 8,
    startTime: '16:00',
    rating: 4,
    comment: 'Solid haircut. Good value.',
  },
  {
    customer: 'Nithya Joseph',
    stylist: 'Sneha Pillai',
    service: 'Root Touch-up',
    daysAgo: 29,
    startTime: '11:30',
    rating: 4,
    comment: 'Colour matched well, no patches.',
  },
  {
    customer: 'Meera Varma',
    stylist: 'Sneha Pillai',
    service: "Women's Haircut",
    daysAgo: 10,
    startTime: '15:00',
    rating: 4,
    comment: 'Nice layered cut, took a bit longer than expected.',
  },
  {
    customer: 'Hiba Fathima',
    stylist: 'Shahana Basheer',
    service: 'Fruit Facial',
    daysAgo: 24,
    startTime: '14:30',
    rating: 5,
    comment: 'Very soothing facial, skin feels hydrated.',
  },
  {
    customer: 'Gopika Das',
    stylist: 'Shahana Basheer',
    service: 'Classic Manicure',
    daysAgo: 7,
    startTime: '12:00',
    rating: 4,
    comment: 'Neat manicure, would come back.',
  },
];
