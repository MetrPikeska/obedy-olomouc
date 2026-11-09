export type Restaurant = {
  id: number;
  slug: string;
  name: string;
  amenity: string;
  lat: number;
  lon: number;
  address: string | null;
  cuisine: string | null;
  opening_hours: string | null;
  website: string | null;
  phone: string | null;
  menicka_id: number | null;
};

export type Score = { n_reviews: number; avg_rating: number | null };

export type MenuItem = {
  dish_id: number;
  slug: string;
  name: string;
  category: "soup" | "main" | "dessert";
  price: number | null;
  position: number;
};

export type Dish = {
  id: number;
  slug: string;
  name: string;
  category: "soup" | "main" | "dessert";
  restaurant_id: number;
};

export type Review = {
  id: number;
  dish_id: number;
  dish_name?: string;
  dish_slug?: string;
  rating: number;
  price_paid: number | null;
  portion: number | null;
  comment: string | null;
  review_date: string;
  nickname: string | null;
  photos: string[];
};

/** Lightweight record for the map and list on the home page. */
export type RestaurantPin = Pick<Restaurant, "id" | "slug" | "name" | "amenity" | "lat" | "lon"> & {
  has_menu_today: boolean;
  n_reviews: number;
  avg_rating: number | null;
  cheapest: number | null;
};
