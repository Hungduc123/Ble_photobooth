import { advertising } from "./advertising";

export interface TypePeripheral {
  advertising: advertising;
  id: string;
  name: string;
  rssi: number;
  connected: boolean;
}
