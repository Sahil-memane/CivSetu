// Local authority/department data for different issue types
// This will be replaced with backend data later

export interface Authority {
  id: string;
  name: string;
  shortName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  categories: string[]; // Issue categories this authority handles
  slaHours: number; // Expected resolution time in hours
}

export interface IssueCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  authorityId: string;
  priority: "low" | "medium" | "high" | "critical";
}

export const authorities: Authority[] = [
  {
    id: "auth-roads",
    name: "Roads & Infrastructure Department",
    shortName: "RID",
    description: "Handles road maintenance, potholes, footpaths, and bridges",
    contactEmail: "roads@municipal.gov",
    contactPhone: "+91-1800-XXX-0001",
    categories: ["potholes", "road-damage", "footpath", "bridges"],
    slaHours: 72,
  },
  {
    id: "auth-water",
    name: "Water Supply & Sewage Department",
    shortName: "WSSD",
    description: "Manages water supply, leakages, drainage, and sewage issues",
    contactEmail: "water@municipal.gov",
    contactPhone: "+91-1800-XXX-0002",
    categories: ["water-leakage", "drainage", "sewage", "water-supply"],
    slaHours: 24,
  },
  {
    id: "auth-electricity",
    name: "Electrical & Street Lighting Department",
    shortName: "ESLD",
    description: "Manages street lights, electrical hazards, and power issues",
    contactEmail: "electricity@municipal.gov",
    contactPhone: "+91-1800-XXX-0003",
    categories: ["streetlight", "electrical-hazard", "power-outage"],
    slaHours: 48,
  },
  {
    id: "auth-sanitation",
    name: "Sanitation & Waste Management",
    shortName: "SWM",
    description: "Handles garbage collection, waste disposal, and cleanliness",
    contactEmail: "sanitation@municipal.gov",
    contactPhone: "+91-1800-XXX-0004",
    categories: ["garbage", "waste-disposal", "public-cleanliness"],
    slaHours: 24,
  },
  {
    id: "auth-parks",
    name: "Parks & Recreation Department",
    shortName: "PRD",
    description: "Manages public parks, playgrounds, and recreational facilities",
    contactEmail: "parks@municipal.gov",
    contactPhone: "+91-1800-XXX-0005",
    categories: ["parks", "playground", "public-amenities"],
    slaHours: 96,
  },
  {
    id: "auth-traffic",
    name: "Traffic & Transport Department",
    shortName: "TTD",
    description: "Handles traffic signals, signage, and road safety",
    contactEmail: "traffic@municipal.gov",
    contactPhone: "+91-1800-XXX-0006",
    categories: ["traffic-signal", "road-signage", "parking"],
    slaHours: 48,
  },
  {
    id: "auth-building",
    name: "Building & Construction Department",
    shortName: "BCD",
    description: "Manages building safety, illegal constructions, and permits",
    contactEmail: "building@municipal.gov",
    contactPhone: "+91-1800-XXX-0007",
    categories: ["building-safety", "illegal-construction", "encroachment"],
    slaHours: 120,
  },
  {
    id: "auth-health",
    name: "Public Health Department",
    shortName: "PHD",
    description: "Handles public health hazards, disease prevention, and medical facilities",
    contactEmail: "health@municipal.gov",
    contactPhone: "+91-1800-XXX-0008",
    categories: ["health-hazard", "mosquito-breeding", "food-safety"],
    slaHours: 12,
  },
];

export const issueCategories: IssueCategory[] = [
  // Roads & Infrastructure
  { id: "potholes", name: "Potholes", icon: "🕳️", description: "Road potholes and surface damage", authorityId: "auth-roads", priority: "high" },
  { id: "road-damage", name: "Road Damage", icon: "🛣️", description: "Cracks, erosion, or structural damage", authorityId: "auth-roads", priority: "medium" },
  { id: "footpath", name: "Footpath Issues", icon: "🚶", description: "Broken or missing footpaths", authorityId: "auth-roads", priority: "medium" },
  { id: "bridges", name: "Bridge Problems", icon: "🌉", description: "Bridge damage or safety concerns", authorityId: "auth-roads", priority: "critical" },
  
  // Water & Sewage
  { id: "water-leakage", name: "Water Leakage", icon: "💧", description: "Pipe leaks and water wastage", authorityId: "auth-water", priority: "high" },
  { id: "drainage", name: "Drainage Blockage", icon: "🚿", description: "Blocked drains and flooding", authorityId: "auth-water", priority: "high" },
  { id: "sewage", name: "Sewage Overflow", icon: "🚽", description: "Sewage problems and overflow", authorityId: "auth-water", priority: "critical" },
  { id: "water-supply", name: "Water Supply Issues", icon: "🚰", description: "No water or low pressure", authorityId: "auth-water", priority: "high" },
  
  // Electricity
  { id: "streetlight", name: "Street Light", icon: "💡", description: "Non-functional street lights", authorityId: "auth-electricity", priority: "medium" },
  { id: "electrical-hazard", name: "Electrical Hazard", icon: "⚡", description: "Exposed wires or dangerous equipment", authorityId: "auth-electricity", priority: "critical" },
  { id: "power-outage", name: "Power Outage", icon: "🔌", description: "Area-wide power failures", authorityId: "auth-electricity", priority: "high" },
  
  // Sanitation
  { id: "garbage", name: "Garbage Overflow", icon: "🗑️", description: "Overflowing garbage bins", authorityId: "auth-sanitation", priority: "high" },
  { id: "waste-disposal", name: "Illegal Dumping", icon: "♻️", description: "Illegal waste dumping sites", authorityId: "auth-sanitation", priority: "medium" },
  { id: "public-cleanliness", name: "Public Cleanliness", icon: "🧹", description: "Dirty public areas", authorityId: "auth-sanitation", priority: "low" },
  
  // Parks
  { id: "parks", name: "Park Maintenance", icon: "🌳", description: "Park facilities needing repair", authorityId: "auth-parks", priority: "low" },
  { id: "playground", name: "Playground Safety", icon: "🎢", description: "Damaged playground equipment", authorityId: "auth-parks", priority: "medium" },
  { id: "public-amenities", name: "Public Amenities", icon: "🏛️", description: "Damaged public facilities", authorityId: "auth-parks", priority: "low" },
  
  // Traffic
  { id: "traffic-signal", name: "Traffic Signal", icon: "🚦", description: "Faulty traffic signals", authorityId: "auth-traffic", priority: "critical" },
  { id: "road-signage", name: "Road Signage", icon: "🪧", description: "Missing or damaged signs", authorityId: "auth-traffic", priority: "medium" },
  { id: "parking", name: "Parking Issues", icon: "🅿️", description: "Illegal parking or blocked areas", authorityId: "auth-traffic", priority: "low" },
  
  // Building
  { id: "building-safety", name: "Building Safety", icon: "🏗️", description: "Unsafe building conditions", authorityId: "auth-building", priority: "critical" },
  { id: "illegal-construction", name: "Illegal Construction", icon: "🚧", description: "Unauthorized construction", authorityId: "auth-building", priority: "medium" },
  { id: "encroachment", name: "Encroachment", icon: "🏠", description: "Public space encroachment", authorityId: "auth-building", priority: "medium" },
  
  // Health
  { id: "health-hazard", name: "Health Hazard", icon: "☣️", description: "Public health risks", authorityId: "auth-health", priority: "critical" },
  { id: "mosquito-breeding", name: "Mosquito Breeding", icon: "🦟", description: "Stagnant water and breeding sites", authorityId: "auth-health", priority: "high" },
  { id: "food-safety", name: "Food Safety", icon: "🍽️", description: "Unhygienic food establishments", authorityId: "auth-health", priority: "high" },
];

// Helper functions
export const getAuthorityById = (id: string): Authority | undefined => {
  return authorities.find(a => a.id === id);
};

export const getAuthorityForCategory = (categoryId: string): Authority | undefined => {
  const category = issueCategories.find(c => c.id === categoryId);
  if (category) {
    return authorities.find(a => a.id === category.authorityId);
  }
  return undefined;
};

export const getCategoriesByAuthority = (authorityId: string): IssueCategory[] => {
  return issueCategories.filter(c => c.authorityId === authorityId);
};

export const getCategoryById = (id: string): IssueCategory | undefined => {
  return issueCategories.find(c => c.id === id);
};
