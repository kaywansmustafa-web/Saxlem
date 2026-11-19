import { describe, expect, it } from "vitest";
import { parseMapPin } from "@/domain/map-pin";

describe("map pin from what an owner pastes", () => {
  it("reads plain coordinates", () => {
    expect(parseMapPin("36.8669, 42.9886")).toEqual({
      latitude: 36.8669,
      longitude: 42.9886,
    });
    expect(parseMapPin("36.8669 42.9886")).toEqual({
      latitude: 36.8669,
      longitude: 42.9886,
    });
  });
  it("reads Google Maps links", () => {
    expect(
      parseMapPin(
        "https://www.google.com/maps/place/Clinic/@36.8671,42.9883,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d36.86695!4d42.98862",
      ),
    ).toEqual({ latitude: 36.86695, longitude: 42.98862 });
    expect(
      parseMapPin("https://www.google.com/maps/@36.8671,42.9883,17z"),
    ).toEqual({ latitude: 36.8671, longitude: 42.9883 });
    expect(
      parseMapPin("https://maps.google.com/?q=36.8671,42.9883"),
    ).toEqual({ latitude: 36.8671, longitude: 42.9883 });
  });
  it("refuses links without a position and impossible numbers", () => {
    expect(parseMapPin("https://maps.app.goo.gl/abc123")).toBeNull();
    expect(parseMapPin("95, 42")).toBeNull();
    expect(parseMapPin("0, 0")).toBeNull();
    expect(parseMapPin("")).toBeNull();
  });
});
