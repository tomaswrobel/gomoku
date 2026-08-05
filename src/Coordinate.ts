import { array } from "./array";
import type { Horizontal } from "./Horizontal";

const VERTICAL = array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
type Vertical = (typeof VERTICAL)[number];

export type Coordinate = `${(typeof Horizontal)[number]}${Vertical}`;
