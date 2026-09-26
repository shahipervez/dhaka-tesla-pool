import { describe, expect, it } from "vitest";
import { RideStatus } from '../enums.js';
import { assertRideTransition } from "../domain/lifecycle.js";

describe("ride lifecycle", () => {
  it("allows the happy path", () => {
    expect(() => assertRideTransition(RideStatus.MATCHED, RideStatus.ACCEPTED)).not.toThrow();
    expect(() => assertRideTransition(RideStatus.DRIVER_ARRIVED, RideStatus.STARTED)).not.toThrow();
  });

  it("rejects jumping from matched straight to completed", () => {
    expect(() => assertRideTransition(RideStatus.MATCHED, RideStatus.COMPLETED)).toThrow(
      /Invalid ride transition/
    );
  });

  it("rejects cancellation after a trip has started", () => {
    expect(() => assertRideTransition(RideStatus.STARTED, RideStatus.CANCELLED)).toThrow();
  });
});
