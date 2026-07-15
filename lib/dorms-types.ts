export type DormRecord = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  lat: number;
  lng: number;
  priceFrom: number | null;
  priceTo: number | null;
  rooms: number | null;
  url: string;
  provider: string;
  note: string;
};
