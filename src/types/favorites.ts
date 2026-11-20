export type FavoriteBlockType =
  | 'drivers'
  | 'representatives'
  | 'executors'
  | 'activities'
  | 'trips'
  | 'divers'
  | 'guides'
  | 'equipment'
  | 'logistics';

export type FavoriteFolderColor = 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';

export interface PlatformResourceItem {
  id: string;
  blockType: Exclude<FavoriteBlockType, 'activities' | 'equipment' | 'logistics'>;
  name: string;
  roleTitle: string;
  companyOrAffiliation: string;
  city: string;
  zone: string;
  languages: string[];
  rating: number;
  reviewsCount: number;
  completedCount: number;
  availability: 'available' | 'busy' | 'scheduled';
  verified: boolean;
  phone: string;
  specialty: string;
  subType: string;
  priceEGP?: number;
  priceEUR?: number;
  priceUnit?: string;
  badges: string[];
  avatarInitials: string;
}

export interface FavoriteFolder {
  id: string;
  ownerUserId?: string;
  name: string;
  description: string;
  color: FavoriteFolderColor;
  itemIds: string[];
  createdAt: string;
}

export interface UserFavoritesData {
  favoriteActivityIds: string[];
  favoriteResourceIds: string[];
  favoriteEquipmentIds: string[];
  favoriteLogisticsIds: string[];
  folders: FavoriteFolder[];
}
