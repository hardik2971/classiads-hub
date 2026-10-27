// Mirrors the Laravel API resources (the `data` payloads inside the envelope).

export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface User {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar_path?: string | null;
  status: string;
  is_verified: boolean;
  roles?: string[];
  preferred_language?: string | null;
  preferred_currency?: string | null;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  icon_path?: string | null;
  image_path?: string | null;
  type: string;
  ads_count: number;
  children?: Category[];
  custom_fields?: CustomField[];
}

export interface CustomFieldOption {
  id: number;
  label: string;
  value: string;
}
export interface CustomField {
  id: number;
  name: string;
  code: string;
  type: string;
  is_required: boolean;
  is_filterable: boolean;
  options?: CustomFieldOption[];
}

export interface AdImage {
  id: number;
  url: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface AdLocation {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface Ad {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number | null;
  price_display: string | null;
  currency_code: string;
  price_type: string;
  condition?: string | null;
  phone?: string | null;
  video_url?: string | null;
  status: string;
  is_featured: boolean;
  views_count: number;
  favorites_count: number;
  is_favorited?: boolean;
  location?: AdLocation;
  distance_km?: number;
  category?: Category;
  seller?: User;
  images?: AdImage[];
  custom_fields?: { code: string; name: string; type: string; value: unknown }[];
  published_at?: string | null;
  created_at?: string;
}

export interface Slider {
  id: number;
  image_url: string | null;
  title?: string | null;
  link_type: string;
  ad_slug?: string | null;
  category_slug?: string | null;
  external_url?: string | null;
}

export interface FeaturedSection {
  id: number;
  title: string;
  filter_type: string;
  style: string;
  ads: Ad[];
}

export interface HomePayload {
  sliders: Slider[];
  categories: Category[];
  featured_sections: FeaturedSection[];
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string;
  cover_image?: string | null;
  published_at?: string | null;
  category?: { id: number; name: string; slug: string } | null;
  author?: User | null;
}

export interface CmsPage {
  key: string;
  title: string;
  body?: string | null;
}

export interface JobListing {
  id: number;
  title: string;
  slug: string;
  company_name?: string | null;
  description: string;
  employment_type: string;
  salary_display?: string | null;
  city?: string | null;
  status: string;
}

export interface Package {
  id: number;
  name: string;
  description?: string | null;
  final_price: number;
  price_display: string;
  currency_code: string;
  duration_days: number;
  ad_limit: number | null;
  is_unlimited: boolean;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string | null;
  og_image?: string | null;
  json_ld?: Record<string, unknown> | null;
}
