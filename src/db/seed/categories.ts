/**
 * Default categories. `parent` refers to another row's key. bucket drives the Needs / Gala / Savings split.
 */
type CategorySeed = { key: string; name: string; icon: string; parent?: string; bucket: 'needs' | 'gala' | 'savings' };

export const CATEGORY_SEED: CategorySeed[] = [
  // Pamasahe
  { key: 'commute', name: 'Pamasahe', icon: 'bus', bucket: 'needs' },
  { key: 'commute_jeep', name: 'Jeep', icon: 'bus', parent: 'commute', bucket: 'needs' },
  { key: 'commute_bus', name: 'Bus', icon: 'bus', parent: 'commute', bucket: 'needs' },
  { key: 'commute_train', name: 'Train', icon: 'train', parent: 'commute', bucket: 'needs' },
  { key: 'commute_tricycle', name: 'Tricycle', icon: 'bicycle', parent: 'commute', bucket: 'needs' },
  { key: 'commute_uv', name: 'UV Express / Van', icon: 'car', parent: 'commute', bucket: 'needs' },
  { key: 'commute_grab', name: 'Grab / MC taxi', icon: 'car', parent: 'commute', bucket: 'needs' },
  // Food
  { key: 'food', name: 'Pagkain', icon: 'restaurant', bucket: 'needs' },
  { key: 'food_meals', name: 'Meals', icon: 'restaurant', parent: 'food', bucket: 'needs' },
  { key: 'food_snacks', name: 'Snacks & coffee', icon: 'cafe', parent: 'food', bucket: 'needs' },
  { key: 'food_groceries', name: 'Groceries', icon: 'cart', parent: 'food', bucket: 'needs' },
  { key: 'food_water', name: 'Drinking water', icon: 'water', parent: 'food', bucket: 'needs' },
  // Rent & bills
  { key: 'bills', name: 'Rent & bills', icon: 'home', bucket: 'needs' },
  { key: 'bills_rent', name: 'Rent', icon: 'home', parent: 'bills', bucket: 'needs' },
  { key: 'bills_electricity', name: 'Electricity', icon: 'flash', parent: 'bills', bucket: 'needs' },
  { key: 'bills_water', name: 'Water', icon: 'water', parent: 'bills', bucket: 'needs' },
  { key: 'bills_wifi', name: 'Wi-Fi', icon: 'wifi', parent: 'bills', bucket: 'needs' },
  { key: 'bills_lpg', name: 'LPG', icon: 'flame', parent: 'bills', bucket: 'needs' },
  { key: 'bills_ambag_bahay', name: 'Ambag sa bahay', icon: 'home', parent: 'bills', bucket: 'needs' },
  // Essentials
  { key: 'essentials', name: 'Essentials', icon: 'basket', bucket: 'needs' },
  { key: 'ess_toiletries', name: 'Toiletries', icon: 'sparkles', parent: 'essentials', bucket: 'needs' },
  { key: 'ess_laundry', name: 'Laundry', icon: 'shirt', parent: 'essentials', bucket: 'needs' },
  { key: 'ess_load', name: 'Load / data', icon: 'phone-portrait', parent: 'essentials', bucket: 'needs' },
  { key: 'ess_health', name: 'Health & medicine', icon: 'medkit', parent: 'essentials', bucket: 'needs' },
  { key: 'ess_grooming', name: 'Grooming', icon: 'cut', parent: 'essentials', bucket: 'needs' },
  { key: 'ess_ojt_req', name: 'OJT requirements', icon: 'document-text', parent: 'essentials', bucket: 'needs' },
  // Gala
  { key: 'gala', name: 'Gala', icon: 'happy', bucket: 'gala' },
  { key: 'gala_outing', name: 'Outings', icon: 'walk', parent: 'gala', bucket: 'gala' },
  { key: 'gala_events', name: 'Gifts & events', icon: 'gift', parent: 'gala', bucket: 'gala' },
  // Savings
  { key: 'savings', name: 'Savings', icon: 'wallet', bucket: 'savings' },
  { key: 'savings_emergency', name: 'Emergency fund', icon: 'shield', parent: 'savings', bucket: 'savings' },
  { key: 'savings_goal', name: 'Savings goal', icon: 'flag', parent: 'savings', bucket: 'savings' },
  // Other
  { key: 'other', name: 'Other', icon: 'ellipsis-horizontal', bucket: 'needs' },
];
