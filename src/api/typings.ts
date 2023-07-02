export type Item = {
  name: string;
  status: Status;
  uuid: string;
  list?: number;
};

export type ItemForm = Optional<Item, 'uuid'>;

export type LiabilityItem = {
  uuid?: string;
  name: string;
  amount: number;
};

export enum Status {
  IN_LIST = '0',
  IN_CART = '1',
  IN_HISTORY = '2',
}

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
