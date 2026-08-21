import { assert } from "@juvofy/lib/utils/assert";
import { Horizontal } from "./coordinate/Horizontal";
import { Vertical } from "./coordinate/Vertical";

assert(Horizontal.length === Vertical.length, "Horizontal and Vertical must have the same length");

export const boardSize = Horizontal.length;
