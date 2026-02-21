// Maps every country to one of the 4 region tiers used for premium pricing.
// Fixed-price countries: India (INDIA), Gulf states (GULF_RICH), USA/UK/Australia + developed (WEST_TIER2)
// All others: POOR_TIER4

export type RegionTier = "INDIA" | "GULF_RICH" | "WEST_TIER2" | "POOR_TIER4";

const INDIA_COUNTRIES = ["India"];

const GULF_RICH_COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Egypt",
];

const WEST_TIER2_COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "South Korea", "Italy", "Spain",
  "Netherlands", "Switzerland", "Sweden", "Norway", "Denmark",
  "Finland", "Belgium", "Austria", "Ireland", "New Zealand",
  "Singapore", "Israel", "Luxembourg", "Iceland", "Portugal",
  "Russia",
];

// Build a lookup map
const regionMap = new Map<string, RegionTier>();
INDIA_COUNTRIES.forEach(c => regionMap.set(c, "INDIA"));
GULF_RICH_COUNTRIES.forEach(c => regionMap.set(c, "GULF_RICH"));
WEST_TIER2_COUNTRIES.forEach(c => regionMap.set(c, "WEST_TIER2"));

export function getRegionForCountry(country: string): RegionTier {
  return regionMap.get(country) || "POOR_TIER4";
}

// Comprehensive country → cities data
export const locationData: Record<string, string[]> = {
  // INDIA
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Chandigarh", "Kochi", "Bhopal", "Indore"],

  // GULF_RICH
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  "Qatar": ["Doha", "Al Wakrah", "Al Khor"],
  "Kuwait": ["Kuwait City", "Hawalli", "Salmiya"],
  "Bahrain": ["Manama", "Riffa", "Muharraq"],
  "Oman": ["Muscat", "Salalah", "Sohar"],

  // WEST_TIER2
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "San Francisco", "Miami", "Seattle", "Boston", "Denver"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Edinburgh", "Glasgow", "Bristol"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Florence"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  "Switzerland": ["Zurich", "Geneva", "Basel", "Bern"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö"],
  "Norway": ["Oslo", "Bergen", "Trondheim"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense"],
  "Finland": ["Helsinki", "Tampere", "Turku"],
  "Belgium": ["Brussels", "Antwerp", "Ghent"],
  "Austria": ["Vienna", "Salzburg", "Graz"],
  "Ireland": ["Dublin", "Cork", "Galway"],
  "New Zealand": ["Auckland", "Wellington", "Christchurch"],
  "Singapore": ["Singapore"],
  "Israel": ["Tel Aviv", "Jerusalem", "Haifa"],
  "Luxembourg": ["Luxembourg City"],
  "Iceland": ["Reykjavik"],
  "Portugal": ["Lisbon", "Porto", "Faro"],

  // POOR_TIER4 — developing / emerging countries
  "Pakistan": ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"],
  "Bangladesh": ["Dhaka", "Chittagong", "Sylhet", "Rajshahi"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa"],
  "Egypt": ["Cairo", "Alexandria", "Giza", "Luxor"],
  "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Cancún"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "Philippines": ["Manila", "Cebu", "Davao", "Quezon City"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket"],
  "Malaysia": ["Kuala Lumpur", "Penang", "Johor Bahru"],
  "Sri Lanka": ["Colombo", "Kandy", "Galle"],
  "Nepal": ["Kathmandu", "Pokhara", "Lalitpur"],
  "Myanmar": ["Yangon", "Mandalay", "Naypyidaw"],
  "Cambodia": ["Phnom Penh", "Siem Reap"],
  "Afghanistan": ["Kabul", "Herat", "Mazar-i-Sharif"],
  "Iraq": ["Baghdad", "Erbil", "Basra"],
  "Iran": ["Tehran", "Isfahan", "Shiraz", "Tabriz"],
  "Jordan": ["Amman", "Zarqa", "Irbid"],
  "Lebanon": ["Beirut", "Tripoli", "Sidon"],
  "Palestine": ["Gaza", "Ramallah", "Nablus"],
  "Syria": ["Damascus", "Aleppo", "Homs"],
  "Yemen": ["Sana'a", "Aden", "Taiz"],
  "Morocco": ["Casablanca", "Marrakech", "Rabat", "Fez"],
  "Tunisia": ["Tunis", "Sfax", "Sousse"],
  "Algeria": ["Algiers", "Oran", "Constantine"],
  "Libya": ["Tripoli", "Benghazi", "Misrata"],
  "Sudan": ["Khartoum", "Omdurman", "Port Sudan"],
  "Ethiopia": ["Addis Ababa", "Dire Dawa", "Mekelle"],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu"],
  "Tanzania": ["Dar es Salaam", "Dodoma", "Zanzibar"],
  "Uganda": ["Kampala", "Entebbe", "Gulu"],
  "Ghana": ["Accra", "Kumasi", "Tamale"],
  "Cameroon": ["Douala", "Yaoundé", "Bamenda"],
  "Senegal": ["Dakar", "Saint-Louis", "Thiès"],
  "Ivory Coast": ["Abidjan", "Yamoussoukro", "Bouaké"],
  "Madagascar": ["Antananarivo", "Toamasina"],
  "Mozambique": ["Maputo", "Beira", "Nampula"],
  "Zimbabwe": ["Harare", "Bulawayo", "Mutare"],
  "Zambia": ["Lusaka", "Kitwe", "Ndola"],
  "Angola": ["Luanda", "Huambo", "Lobito"],
  "DR Congo": ["Kinshasa", "Lubumbashi", "Goma"],
  "Rwanda": ["Kigali", "Butare", "Gisenyi"],
  "Somalia": ["Mogadishu", "Hargeisa"],
  "Mali": ["Bamako", "Timbuktu"],
  "Niger": ["Niamey", "Zinder"],
  "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso"],
  "Chad": ["N'Djamena", "Moundou"],
  "Benin": ["Cotonou", "Porto-Novo"],
  "Togo": ["Lomé", "Sokodé"],
  "Sierra Leone": ["Freetown", "Bo"],
  "Liberia": ["Monrovia"],
  "Guinea": ["Conakry"],
  "Malawi": ["Lilongwe", "Blantyre"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario"],
  "Chile": ["Santiago", "Valparaíso", "Concepción"],
  "Peru": ["Lima", "Cusco", "Arequipa"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca"],
  "Bolivia": ["La Paz", "Santa Cruz", "Cochabamba"],
  "Paraguay": ["Asunción", "Ciudad del Este"],
  "Uruguay": ["Montevideo", "Punta del Este"],
  "Guatemala": ["Guatemala City", "Antigua"],
  "Honduras": ["Tegucigalpa", "San Pedro Sula"],
  "El Salvador": ["San Salvador", "Santa Ana"],
  "Nicaragua": ["Managua", "León"],
  "Costa Rica": ["San José", "Limón"],
  "Panama": ["Panama City", "Colón"],
  "Cuba": ["Havana", "Santiago de Cuba"],
  "Dominican Republic": ["Santo Domingo", "Santiago"],
  "Haiti": ["Port-au-Prince", "Cap-Haïtien"],
  "Jamaica": ["Kingston", "Montego Bay"],
  "Trinidad and Tobago": ["Port of Spain", "San Fernando"],
  "Mongolia": ["Ulaanbaatar", "Erdenet"],
  "Uzbekistan": ["Tashkent", "Samarkand", "Bukhara"],
  "Kazakhstan": ["Almaty", "Astana", "Shymkent"],
  "Turkmenistan": ["Ashgabat"],
  "Tajikistan": ["Dushanbe"],
  "Kyrgyzstan": ["Bishkek", "Osh"],
  "Georgia": ["Tbilisi", "Batumi"],
  "Armenia": ["Yerevan", "Gyumri"],
  "Azerbaijan": ["Baku", "Ganja"],
  "Ukraine": ["Kyiv", "Lviv", "Odessa", "Kharkiv"],
  "Poland": ["Warsaw", "Kraków", "Gdańsk", "Wrocław"],
  "Czech Republic": ["Prague", "Brno", "Ostrava"],
  "Romania": ["Bucharest", "Cluj-Napoca", "Timișoara"],
  "Hungary": ["Budapest", "Debrecen", "Szeged"],
  "Greece": ["Athens", "Thessaloniki", "Heraklion"],
  "Bulgaria": ["Sofia", "Plovdiv", "Varna"],
  "Serbia": ["Belgrade", "Novi Sad", "Niš"],
  "Croatia": ["Zagreb", "Split", "Dubrovnik"],
  "Bosnia and Herzegovina": ["Sarajevo", "Banja Luka"],
  "Albania": ["Tirana", "Durrës"],
  "North Macedonia": ["Skopje", "Ohrid"],
  "Montenegro": ["Podgorica", "Budva"],
  "Kosovo": ["Pristina", "Prizren"],
  "Moldova": ["Chișinău"],
  "Belarus": ["Minsk", "Gomel"],
  "Lithuania": ["Vilnius", "Kaunas"],
  "Latvia": ["Riga", "Daugavpils"],
  "Estonia": ["Tallinn", "Tartu"],
  "Slovakia": ["Bratislava", "Košice"],
  "Slovenia": ["Ljubljana", "Maribor"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Kazan"],
  "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu"],
  "Taiwan": ["Taipei", "Kaohsiung", "Taichung"],
  "Hong Kong": ["Hong Kong"],
  "Macau": ["Macau"],
  "Laos": ["Vientiane", "Luang Prabang"],
  "Brunei": ["Bandar Seri Begawan"],
  "Timor-Leste": ["Dili"],
  "Papua New Guinea": ["Port Moresby"],
  "Fiji": ["Suva", "Nadi"],
  "Maldives": ["Malé"],
  "Bhutan": ["Thimphu"],
};

// Priority countries shown at top of selector
export const priorityCountries = ["India"];

// Build sorted country list with priority countries first
export const allCountries = [
  ...priorityCountries,
  ...Object.keys(locationData).filter(c => !priorityCountries.includes(c)).sort(),
];
