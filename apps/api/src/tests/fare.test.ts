import { describe, expect, it } from "vitest";
import { Area } from '../enums.js';
import { quoteFare } from "../domain/fare.js";

describe("fare model", () => {
  it("calculates Nusrat's Banani to Mohakhali quote in integer poysha", () => {
    const quote = quoteFare(Area.BANANI, Area.MOHAKHALI);
    expect(quote.distanceM).toBe(3000);
    expect(quote.soloFarePoysha).toBe(9500);
    expect(quote.pooledFarePoysha).toBe(8075);
  });

  it("calculates Rafiq's Banani to Gulshan 1 pooled fare", () => {
    const quote = quoteFare(Area.BANANI, Area.GULSHAN_1);
    expect(quote.soloFarePoysha).toBe(8600);
    expect(quote.pooledFarePoysha).toBe(7310);
  });
});
