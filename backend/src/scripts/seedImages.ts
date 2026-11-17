// Free stock photos from Unsplash (https://unsplash.com/license), hotlinked as the
// Unsplash API guidelines require. Credits: photographer + photo page per entry.

export interface SeedImage {
  url: string;
  author: string;
  photoUrl: string;
}

export const serviceImages: Record<string, SeedImage> = {
  "Men's Haircut": {
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8YmFyYmVyJTIwc2hvcCUyMGhhaXJjdXR8ZW58MXwwfHx8MTc5NDkzNjQ1MXww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Allef Vinicius',
    photoUrl: 'https://unsplash.com/photos/man-sitting-on-barbers-chair-IvQeAVeJULw',
  },
  "Women's Haircut": {
    url: 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8d29tYW4lMjBoYWlyY3V0JTIwc2Fsb258ZW58MXwwfHx8MTc5NDkzNjQxMHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Lindsay Cash',
    photoUrl:
      'https://unsplash.com/photos/a-woman-getting-her-hair-cut-by-a-hair-stylist-Md_DhaFsnCQ',
  },
  "Kids' Haircut": {
    url: 'https://images.unsplash.com/photo-1561087385-0ef90642f75a?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8N3x8a2lkJTIwaGFpcmN1dHxlbnwxfDB8fHwxNzk0OTM2NDU0fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: '13on',
    photoUrl: 'https://unsplash.com/photos/man-cutting-hair-of-boy--2NujTiGjNQ',
  },
  'Blow-dry & Styling': {
    url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8YmxvbmRlJTIwaGlnaGxpZ2h0cyUyMGhhaXIlMjBzYWxvbnxlbnwxfDB8fHwxNzk0OTM2NDQ2fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Adam Winger',
    photoUrl: 'https://unsplash.com/photos/hairstylist-blow-drying-client-hair-FkAZqQJTbXM',
  },
  'Beard Trim & Shape': {
    url: 'https://images.unsplash.com/photo-1514336937476-a5b961020a5c?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MTB8fGJhcmJlciUyMHNob3AlMjBoYWlyY3V0fGVufDF8MHx8fDE3OTQ5MzY0NTF8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Chris Knight',
    photoUrl: 'https://unsplash.com/photos/person-trimming-mans-hair-vI3m5UnZ0aQ',
  },
  'Classic Hot Towel Shave': {
    url: 'https://images.unsplash.com/photo-1533808232502-bee53575c3af?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8N3x8YmVhcmQlMjB0cmltbWluZ3xlbnwxfDB8fHwxNzk0OTM2NDUxfDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Alex Mihai C',
    photoUrl: 'https://unsplash.com/photos/man-shaving-lying-man-FWgYghZrVqU',
  },
  'Haircut & Beard Combo': {
    url: 'https://images.unsplash.com/photo-1593702288056-7927b442d0fa?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8OXx8YmFyYmVyJTIwc2hvcCUyMGhhaXJjdXR8ZW58MXwwfHx8MTc5NDkzNjQ1MXww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Michael DeMoya',
    photoUrl:
      'https://unsplash.com/photos/man-in-white-dress-shirt-cutting-hair-of-man-in-white-dress-shirt-MUdB4YzDeKA',
  },
  'Global Hair Colour': {
    url: 'https://images.unsplash.com/photo-1586266195531-76cfa365cb43?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8N3x8aGFpciUyMGNvbG9yJTIwZHllJTIwc2Fsb258ZW58MXwwfHx8MTc5NDkzNjQ0NXww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'engin akyurt',
    photoUrl: 'https://unsplash.com/photos/red-haired-woman-with-red-hair-XZvyT2u04i8',
  },
  Highlights: {
    url: 'https://images.unsplash.com/photo-1629397685944-7073f5589754?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Mnx8YmxvbmRlJTIwaGlnaGxpZ2h0cyUyMGhhaXIlMjBzYWxvbnxlbnwxfDB8fHwxNzk0OTM2NDQ2fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Giorgio Trovato',
    photoUrl: 'https://unsplash.com/photos/hairstylist-curling-hair-in-salon-wSpkThmoZQc',
  },
  'Root Touch-up': {
    url: 'https://images.unsplash.com/photo-1707979577466-2d6109c68a45?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8NXx8YmxvbmRlJTIwaGlnaGxpZ2h0cyUyMGhhaXIlMjBzYWxvbnxlbnwxfDB8fHwxNzk0OTM2NDQ2fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Ionela Mat',
    photoUrl:
      'https://unsplash.com/photos/a-woman-getting-her-hair-done-by-a-hair-stylist-qMjrFNDdjpw',
  },
  'Hair Spa': {
    url: 'https://images.unsplash.com/photo-1717160675643-53a7a2ebaa9f?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8M3x8aGFpciUyMGNvbG9yJTIwZHllJTIwc2Fsb258ZW58MXwwfHx8MTc5NDkzNjQ0NXww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'QUENTIN Mahe',
    photoUrl: 'https://unsplash.com/photos/a-woman-getting-her-hair-washed-in-a-salon-JZxYImAay2Y',
  },
  'Keratin Treatment': {
    url: 'https://images.unsplash.com/photo-1780504542350-5078d4080081?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8aGFpciUyMHN0cmFpZ2h0ZW5pbmclMjBzYWxvbnxlbnwxfDB8fHwxNzk0OTM2NDE3fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Amari Shutters',
    photoUrl:
      'https://unsplash.com/photos/hands-straightening-dark-hair-with-a-flat-iron-pP-PLW7x2mA',
  },
  'Basic Cleanup': {
    url: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Mnx8ZmFjaWFsJTIwbWFzc2FnZSUyMHNwYXxlbnwxfDB8fHwxNzk0OTM2NDQ4fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'engin akyurt',
    photoUrl:
      'https://unsplash.com/photos/woman-lying-on-blue-towel-with-white-cream-on-face-g-m8EDc4X6Q',
  },
  'Fruit Facial': {
    url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Mnx8d29tYW4lMjBmYWNpYWwlMjBtYXNrJTIwc3BhfGVufDF8MHx8fDE3OTQ5MzY0NDh8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Rosa Rafael',
    photoUrl:
      'https://unsplash.com/photos/woman-receiving-facial-mask-treatment-at-spa-Pe9IXUuC6QU',
  },
  'Gold Facial': {
    url: 'https://images.unsplash.com/photo-1741934023052-26baf5535088?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8M3x8ZmFjaWFsJTIwbWFzc2FnZSUyMHNwYXxlbnwxfDB8fHwxNzk0OTM2NDQ4fDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Ionela Mat',
    photoUrl:
      'https://unsplash.com/photos/woman-enjoying-a-facial-massage-with-closed-eyes-16mHHrY3PUk',
  },
  'Classic Manicure': {
    url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8cGVkaWN1cmV8ZW58MXwwfHx8MTc5NDkzNjQ1MHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Giorgio Trovato',
    photoUrl:
      'https://unsplash.com/photos/a-woman-getting-her-nails-done-at-a-nail-salon-gb6gtiTZKB8',
  },
  'Spa Pedicure': {
    url: 'https://images.unsplash.com/photo-1664643411326-6c589531be3c?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8M3x8cGVkaWN1cmV8ZW58MXwwfHx8MTc5NDkzNjQ1MHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Konstantin Shmatov',
    photoUrl: 'https://unsplash.com/photos/a-pair-of-feet-with-painted-toenails-WBuwkanEPiM',
  },
  'Party Makeup': {
    url: 'https://images.unsplash.com/photo-1713771295889-eacfced8de80?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8N3x8aGFpciUyMGR5ZSUyMGFwcGxpY2F0aW9ufGVufDF8MHx8fDE3OTQ5MzY0NDZ8MA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Phillippe Mari',
    photoUrl:
      'https://unsplash.com/photos/a-woman-getting-her-makeup-done-by-a-professional-makeup-artist-COw7nliM18A',
  },
  'Bridal Makeup': {
    url: 'https://images.unsplash.com/photo-1684868264466-4c4fcf0a5b37?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Mnx8YnJpZGUlMjBtYWtldXB8ZW58MXwwfHx8MTc5NDkzNjQ1MHww&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'gurpreet singh',
    photoUrl: 'https://unsplash.com/photos/a-woman-in-a-red-and-gold-bridal-outfit-S29gGomXEfU',
  },
  'Groom Package': {
    url: 'https://images.unsplash.com/photo-1445117627052-274425469152?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8Z3Jvb20lMjB3ZWRkaW5nJTIwc3VpdHxlbnwxfDB8fHwxNzk0OTM2NDUyfDA&ixlib=rb-4.1.0&w=800&h=600&fit=crop&q=80&auto=format',
    author: 'Mélanie Villeneuve',
    photoUrl:
      'https://unsplash.com/photos/man-attaching-flower-on-another-mans-lapel-in-a-well-lit-room-70RHiKO9kj8',
  },
};

export const stylistImages: Record<string, SeedImage> = {
  'Arjun Menon': {
    url: 'https://images.unsplash.com/photo-1597480566497-f5f87eb80afc?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8M3x8YmFyYmVyJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8Mnx8fDE3OTQ5MzY0NTR8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'mehdi lamaaffar',
    photoUrl:
      'https://unsplash.com/photos/smiling-man-in-gray-shirt-wearing-black-knit-cap-HrXTT-Xqy7g',
  },
  'Faisal Rahman': {
    url: 'https://images.unsplash.com/photo-1759701546957-0ac6e568bd9a?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Nnx8YmFyYmVyJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8Mnx8fDE3OTQ5MzY0NTR8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Alef Morais',
    photoUrl: 'https://unsplash.com/photos/young-man-with-short-dark-hair-and-mustache-uVGRG-7BFC4',
  },
  'Rahul Krishnan': {
    url: 'https://images.unsplash.com/photo-1608549950158-6d1dc2022ccd?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8OHx8YmFyYmVyJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8Mnx8fDE3OTQ5MzY0NTR8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'nacer eddine',
    photoUrl: 'https://unsplash.com/photos/man-in-green-jacket-smiling-c47DHQFxv8M',
  },
  'Nikhil Das': {
    url: 'https://images.unsplash.com/photo-1752070339136-ee8d6559e698?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8OXx8YmFyYmVyJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8Mnx8fDE3OTQ5MzY0NTR8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Vidak',
    photoUrl: 'https://unsplash.com/photos/smiling-man-poses-in-front-of-a-brick-wall-OQIEbUCjJso',
  },
  'Muhammed Shafi': {
    url: 'https://images.unsplash.com/photo-1603384698993-e5865da085c8?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Nnx8aGFpcnN0eWxpc3QlMjBtYW4lMjBwb3J0cmFpdHxlbnwxfDJ8fHwxNzk0OTM2NDU1fDA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Karsten Winegeart',
    photoUrl: 'https://unsplash.com/photos/man-with-black-hair-and-black-mustache-EZ5ugW5N9ZY',
  },
  'Vishnu Prasad': {
    url: 'https://images.unsplash.com/photo-1558486529-662a5e1d47f2?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8OHx8aGFpcnN0eWxpc3QlMjBtYW4lMjBwb3J0cmFpdHxlbnwxfDJ8fHwxNzk0OTM2NDU1fDA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Yuvraj Singh',
    photoUrl: 'https://unsplash.com/photos/man-wearing-black-crew-neck-shirt-dP3I2rJs9ZM',
  },
  'Ajmal Hussain': {
    url: 'https://images.unsplash.com/photo-1753176184914-67642fc6a9b9?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MTV8fGhhaXJzdHlsaXN0JTIwbWFuJTIwcG9ydHJhaXR8ZW58MXwyfHx8MTc5NDkzNjQ1NXww&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Benoit Vacherie',
    photoUrl: 'https://unsplash.com/photos/a-young-man-poses-for-a-portrait-zz9bnALPH8Q',
  },
  'Sanjay Kumar': {
    url: 'https://images.unsplash.com/photo-1600896903045-3d373014baa3?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Mnx8YmFyYmVyJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8Mnx8fDE3OTQ5MzY0NTR8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'MD Duran',
    photoUrl:
      'https://unsplash.com/photos/man-in-white-button-up-shirt-wearing-gray-knit-cap-6R00V1LgbpI',
  },
  'Anjali Nair': {
    url: 'https://images.unsplash.com/photo-1594140701076-3400bf982497?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8M3x8aW5kaWFuJTIwd29tYW4lMjBiZWF1dGljaWFuJTIwcG9ydHJhaXR8ZW58MXwyfHx8MTc5NDkzNjQyNXww&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Dollar Gill',
    photoUrl: 'https://unsplash.com/photos/woman-in-red-and-gold-sari-6IBPGobA4U8',
  },
  'Shahana Basheer': {
    url: 'https://images.unsplash.com/photo-1772037848780-f4c456155b90?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8N3x8aW5kaWFuJTIwd29tYW4lMjBiZWF1dGljaWFuJTIwcG9ydHJhaXR8ZW58MXwyfHx8MTc5NDkzNjQyNXww&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Pranab Debnath',
    photoUrl: 'https://unsplash.com/photos/a-woman-in-a-green-sari-smiles-outdoors-5lUBET_HypI',
  },
  'Fathima Shirin': {
    url: 'https://images.unsplash.com/photo-1594140700405-f401ff47b29e?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8OHx8aW5kaWFuJTIwd29tYW4lMjBiZWF1dGljaWFuJTIwcG9ydHJhaXR8ZW58MXwyfHx8MTc5NDkzNjQyNXww&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Dollar Gill',
    photoUrl:
      'https://unsplash.com/photos/woman-in-pink-dress-wearing-gold-and-red-beaded-necklace-lfgqyh6R6bE',
  },
  'Sneha Pillai': {
    url: 'https://images.unsplash.com/photo-1657152042407-64b755c7558a?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MXx8YmVhdXRpY2lhbiUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8Mnx8fDE3OTQ5MzY0NTZ8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Alexander Krivitskiy',
    photoUrl: 'https://unsplash.com/photos/a-woman-smiling-for-the-camera-oBmsNPRm1So',
  },
  'Ayisha Nasrin': {
    url: 'https://images.unsplash.com/photo-1612041714878-997e3fe9cd13?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8NXx8YmVhdXRpY2lhbiUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8Mnx8fDE3OTQ5MzY0NTZ8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Alexander Krivitskiy',
    photoUrl: 'https://unsplash.com/photos/woman-with-brown-hair-smiling-FrZ8q9D2ObM',
  },
  'Divya Mohan': {
    url: 'https://images.unsplash.com/photo-1612041719716-8db1f9a7de96?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Nnx8YmVhdXRpY2lhbiUyMHdvbWFuJTIwc21pbGluZyUyMHBvcnRyYWl0fGVufDF8Mnx8fDE3OTQ5MzY0NTZ8MA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Alexander Krivitskiy',
    photoUrl: 'https://unsplash.com/photos/woman-in-white-shirt-with-brown-hair-cPyCRa-yWb4',
  },
  'Reshma Rajan': {
    url: 'https://images.unsplash.com/photo-1710777932534-2a58edf3603d?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8MTF8fGJlYXV0aWNpYW4lMjB3b21hbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfDJ8fHwxNzk0OTM2NDU2fDA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Abenezer Shewaga',
    photoUrl: 'https://unsplash.com/photos/a-woman-with-a-smile-on-her-face-21ckukPU3qA',
  },
  'Haritha Suresh': {
    url: 'https://images.unsplash.com/photo-1644976914567-7fce1957e540?ixid=M3wxMTM2OTk3fDB8MXxzZWFyY2h8Mnx8ZmVtYWxlJTIwaGFpcnN0eWxpc3QlMjBwb3J0cmFpdHxlbnwxfDJ8fHwxNzk0OTM2NDU2fDA&ixlib=rb-4.1.0&w=400&h=400&fit=crop&crop=faces&q=80&auto=format',
    author: 'Alexey Demidov',
    photoUrl:
      'https://unsplash.com/photos/a-woman-in-a-white-shirt-posing-for-a-picture-ULOwPNhbGKA',
  },
};
