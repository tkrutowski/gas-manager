export interface Address {
  id: number;
  commune: string;
  city: string;
  street: string;
  zip: string;
  coordinates: GeographicalCoordinates;
}

export interface GeographicalCoordinates {
  id: number;
  latitude: string;
  longitude: string;
}
