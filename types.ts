// A virtual representation of Firestore's Geopoint
export interface Geopoint {
  latitude: number;
  longitude: number;
}

// A virtual representation of Firestore's Timestamp
export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface ImageInfo {
  url: string;
  caption: string;
  file?: File; // For local preview before upload
}

export interface Attributes {
  targetAudience: string[];
  recommendedSeasons: string[];
  withKids: string;
  withPets: string;
  parkingDifficulty: string;
  admissionFee: string;
}

export interface CategorySpecificInfo {
  signatureMenu?: string;
  priceRange?: string;
  difficulty?: string;
}

export interface Comment {
  type: string;
  content: string;
}

export interface LinkedSpot {
  link_type: string;
  place_id: string;
  place_name: string;
}

export interface PublicInfo {
    operating_hours?: string;
    phone_number?: string;
    website_url?: string;
}

export interface Place {
  place_id: string;
  place_name: string;
  creator_id?: string;
  status: 'draft' | 'published' | 'rejected' | 'stub';
  categories?: string[];
  address?: string;
  region?: string;
  location?: Geopoint;
  images?: ImageInfo[];
  attributes?: Attributes;
  category_specific_info?: CategorySpecificInfo;
  expert_tip_raw?: string;
  expert_tip_final?: string;
  comments?: Comment[];
  linked_spots?: LinkedSpot[];
  created_at?: Timestamp;
  updated_at?: Timestamp;
  public_info?: PublicInfo;
  tags?: string[];
}

export interface InitialFormData {
    categories: string[];
    spotName: string;
}