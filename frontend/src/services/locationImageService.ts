// Location-Aware & Role-Aware Background Image Selection Engine
// Returns curated landmark & atmospheric imagery based on GPS coordinates, city, state, role, and condition.

export interface LocationVisualConfig {
  imageUrl: string;
  locationLabel: string;
  landmarkName: string;
  photographerCredit?: string;
}

// Curated high-resolution landmark & atmospheric imagery for Indian cities
export const INDIAN_LANDMARKS: Record<string, { landmark: string; url: string }> = {
  // Delhi NCR (India Gate & Rajpath)
  delhi: {
    landmark: 'India Gate, New Delhi',
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
  },
  'new delhi': {
    landmark: 'India Gate, New Delhi',
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
  },
  ncr: {
    landmark: 'India Gate, New Delhi',
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
  },
  gurugram: {
    landmark: 'Cyber City & Skyline, Gurugram',
    url: 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?auto=format&fit=crop&w=1600&q=80',
  },
  noida: {
    landmark: 'Noida Cityscape',
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
  },

  // Maharashtra (Mumbai Gateway of India / Marine Drive / Pune Shaniwar Wada)
  mumbai: {
    landmark: 'Gateway of India & Marine Drive, Mumbai',
    url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1600&q=80',
  },
  bombay: {
    landmark: 'Gateway of India, Mumbai',
    url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1600&q=80',
  },
  thane: {
    landmark: 'Thane & Mumbai Metropolitan',
    url: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1600&q=80',
  },
  kalyan: {
    landmark: 'Shivaji Chowk Clock Tower, Kalyan',
    url: '/assets/kalyan-clock-tower.png',
  },
  'kalyan-dombivli': {
    landmark: 'Shivaji Chowk Clock Tower, Kalyan-Dombivli',
    url: '/assets/kalyan-clock-tower.png',
  },
  'kalyan dombivli': {
    landmark: 'Shivaji Chowk Clock Tower, Kalyan-Dombivli',
    url: '/assets/kalyan-clock-tower.png',
  },
  dombivli: {
    landmark: 'Shivaji Chowk Clock Tower, Kalyan-Dombivli',
    url: '/assets/kalyan-clock-tower.png',
  },
  pune: {
    landmark: 'Shaniwar Wada & Pune Skyline',
    url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=80',
  },
  nashik: {
    landmark: 'Godavari Ghats & Trimbakeshwar, Nashik',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
  },
  nagpur: {
    landmark: 'Zero Mile & Deekshabhoomi, Nagpur',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
  },
  aurangabad: {
    landmark: 'Bibi Ka Maqbara & Ajanta, Chhatrapati Sambhajinagar',
    url: 'https://images.unsplash.com/photo-1590766940554-634a7ed41450?auto=format&fit=crop&w=1600&q=80',
  },
  sambhajinagar: {
    landmark: 'Bibi Ka Maqbara, Chhatrapati Sambhajinagar',
    url: 'https://images.unsplash.com/photo-1590766940554-634a7ed41450?auto=format&fit=crop&w=1600&q=80',
  },

  // Karnataka (Bengaluru Vidhana Soudha / Mysore Palace)
  bengaluru: {
    landmark: 'Vidhana Soudha & Cubbon Park, Bengaluru',
    url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1600&q=80',
  },
  bangalore: {
    landmark: 'Vidhana Soudha, Bengaluru',
    url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1600&q=80',
  },
  mysore: {
    landmark: 'Mysore Palace, Mysuru',
    url: 'https://images.unsplash.com/photo-1600100397608-f010f445b9b2?auto=format&fit=crop&w=1600&q=80',
  },
  mysuru: {
    landmark: 'Mysore Palace, Mysuru',
    url: 'https://images.unsplash.com/photo-1600100397608-f010f445b9b2?auto=format&fit=crop&w=1600&q=80',
  },

  // West Bengal (Kolkata Howrah Bridge / Victoria Memorial)
  kolkata: {
    landmark: 'Howrah Bridge & Victoria Memorial, Kolkata',
    url: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1600&q=80',
  },
  calcutta: {
    landmark: 'Howrah Bridge, Kolkata',
    url: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1600&q=80',
  },

  // Tamil Nadu (Chennai Central & Marina Beach)
  chennai: {
    landmark: 'Marina Beach & Chennai Central',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
  },
  madras: {
    landmark: 'Marina Beach, Chennai',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
  },
  coimbatore: {
    landmark: 'Adiyogi & Western Ghats, Coimbatore',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
  },
  madurai: {
    landmark: 'Meenakshi Amman Temple, Madurai',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
  },

  // Telangana & Andhra Pradesh (Hyderabad Charminar / Visakhapatnam)
  hyderabad: {
    landmark: 'Charminar & Hussain Sagar, Hyderabad',
    url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1600&q=80',
  },
  secunderabad: {
    landmark: 'Charminar, Hyderabad',
    url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1600&q=80',
  },
  visakhapatnam: {
    landmark: 'RK Beach & Dolphin Nose, Vizag',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
  },
  vizag: {
    landmark: 'RK Beach, Visakhapatnam',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
  },

  // Gujarat (Ahmedabad Atal Bridge / Sabarmati Riverfront / Surat)
  ahmedabad: {
    landmark: 'Atal Pedestrian Bridge & Sabarmati, Ahmedabad',
    url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1600&q=80',
  },
  surat: {
    landmark: 'Tapi Riverfront & Diamond City, Surat',
    url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1600&q=80',
  },
  vadodara: {
    landmark: 'Laxmi Vilas Palace, Vadodara',
    url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1600&q=80',
  },

  // Rajasthan (Jaipur Hawa Mahal / Udaipur City Palace / Jodhpur)
  jaipur: {
    landmark: 'Hawa Mahal & Amber Fort, Jaipur',
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80',
  },
  udaipur: {
    landmark: 'Lake Pichola & City Palace, Udaipur',
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80',
  },
  jodhpur: {
    landmark: 'Mehrangarh Fort, Jodhpur',
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80',
  },

  // Uttar Pradesh (Lucknow Rumi Darwaza / Varanasi Ghats / Agra Taj Mahal)
  lucknow: {
    landmark: 'Rumi Darwaza & Bara Imambara, Lucknow',
    url: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=1600&q=80',
  },
  varanasi: {
    landmark: 'Ganga Ghats & Kashi Vishwanath, Varanasi',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
  },
  banaras: {
    landmark: 'Ganga Ghats, Varanasi',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
  },
  agra: {
    landmark: 'Taj Mahal, Agra',
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=80',
  },
  kanpur: {
    landmark: 'Ganga Barrage & Kanpur Skyline',
    url: 'https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=1600&q=80',
  },
  prayagraj: {
    landmark: 'Triveni Sangam, Prayagraj',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
  },
  allahabad: {
    landmark: 'Triveni Sangam, Prayagraj',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
  },

  // Kerala (Kochi Chinese Nets / Alleppey Backwaters / Thiruvananthapuram)
  kochi: {
    landmark: 'Chinese Fishing Nets & Marine Drive, Kochi',
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
  },
  cochin: {
    landmark: 'Chinese Fishing Nets, Kochi',
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
  },
  thiruvananthapuram: {
    landmark: 'Kovalam & Padmanabhaswamy, Thiruvananthapuram',
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
  },
  trivandrum: {
    landmark: 'Kovalam, Thiruvananthapuram',
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
  },
  kerala: {
    landmark: 'Kerala Backwaters & Coconut Groves',
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
  },

  // Goa (Coastal Beaches)
  goa: {
    landmark: 'Goa Coastal Coastline & Beaches',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80',
  },
  panaji: {
    landmark: 'Panaji Church & Mandovi River, Goa',
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80',
  },

  // Punjab, Haryana & Chandigarh
  chandigarh: {
    landmark: 'Sukhna Lake & Capitol Complex, Chandigarh',
    url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1600&q=80',
  },
  amritsar: {
    landmark: 'Golden Temple, Amritsar',
    url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1600&q=80',
  },
  ludhiana: {
    landmark: 'Punjab Countryside & Greenfields',
    url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80',
  },

  // Madhya Pradesh (Indore / Bhopal)
  indore: {
    landmark: 'Rajwada Palace, Indore',
    url: 'https://images.unsplash.com/photo-1628178129598-1e47e8756303?auto=format&fit=crop&w=1600&q=80',
  },
  bhopal: {
    landmark: 'Upper Lake & VIP Road, Bhopal',
    url: 'https://images.unsplash.com/photo-1628178129598-1e47e8756303?auto=format&fit=crop&w=1600&q=80',
  },

  // Bihar & Jharkhand
  patna: {
    landmark: 'Golghar & Ganga Riverfront, Patna',
    url: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1600&q=80',
  },
  ranchi: {
    landmark: 'Dassam Falls & Chota Nagpur Plateau, Ranchi',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
  },

  // Odisha (Bhubaneswar / Puri)
  bhubaneswar: {
    landmark: 'Lingaraj Temple & Smart City, Bhubaneswar',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1600&q=80',
  },
  puri: {
    landmark: 'Jagannath Temple & Puri Sea Beach',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
  },

  // Jammu & Kashmir / Himachal / Uttarakhand
  srinagar: {
    landmark: 'Dal Lake & Shikara, Srinagar, Kashmir',
    url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1600&q=80',
  },
  kashmir: {
    landmark: 'Dal Lake, Kashmir',
    url: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1600&q=80',
  },
  shimla: {
    landmark: 'The Ridge & Mall Road, Shimla',
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
  },
  manali: {
    landmark: 'Himalayan Valleys & Solang, Manali',
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
  },
  dehradun: {
    landmark: 'Doon Valley & Mussoorie Foothills',
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
  },
  rishikesh: {
    landmark: 'Lakshman Jhula & Holy Ganga, Rishikesh',
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
  },

  // Northeast (Guwahati / Shillong / Sikkim)
  guwahati: {
    landmark: 'Brahmaputra River & Kamakhya, Guwahati',
    url: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&w=1600&q=80',
  },
  assam: {
    landmark: 'Assam Tea Gardens & Brahmaputra',
    url: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&w=1600&q=80',
  },
  shillong: {
    landmark: 'Umiam Lake & Scotland of the East, Shillong',
    url: 'https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?auto=format&fit=crop&w=1600&q=80',
  },
  gangtok: {
    landmark: 'Kanchenjunga View & Monasteries, Gangtok',
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
  },
};

// Default high-resolution backdrop (India Gate, New Delhi)
const DEFAULT_INDIA_LANDMARK = {
  landmark: 'India Gate, New Delhi',
  url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1600&q=80',
};

/**
 * Resolves the iconic landmark image based on user's GPS / selected location string.
 */
export const getLandmarkForLocation = (locationStr: string): { landmark: string; url: string } => {
  if (!locationStr) return DEFAULT_INDIA_LANDMARK;
  const normalized = locationStr.toLowerCase().replace(/[,\-_\.]/g, ' ');

  // Look for direct key match
  for (const [key, value] of Object.entries(INDIAN_LANDMARKS)) {
    if (normalized.includes(key)) {
      return value;
    }
  }

  // Fallback to default
  return DEFAULT_INDIA_LANDMARK;
};

export const getHeroBackgroundImage = (role: string, locationStr: string): string => {
  return getLandmarkForLocation(locationStr).url;
};
