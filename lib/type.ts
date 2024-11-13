interface Item {
  item: string;
  price_eur: number;
  date: Date;
}

export interface ResponseMessage {
  date: string;
  items: Item[];
}
