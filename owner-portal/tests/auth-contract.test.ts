import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loginRequestBody, refreshRequestBody } from "@/domain/auth-requests";

type Schema = { properties: Record<string, unknown>; required?: string[] };
const openapi = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "../backend/openapi/saxlem-api.json"),
    "utf8",
  ),
) as {
  paths: Record<
    string,
    {
      post: {
        requestBody: {
          content: { "application/json": { schema: { $ref: string } } };
        };
      };
    }
  >;
  components: { schemas: Record<string, Schema> };
};
function requestSchema(path: string): Schema {
  const ref =
    openapi.paths[path].post.requestBody.content["application/json"].schema
      .$ref;
  return openapi.components.schemas[ref.split("/").at(-1)!];
}
function expectMatches(body: Record<string, unknown>, schema: Schema) {
  for (const key of Object.keys(body))
    expect(Object.keys(schema.properties)).toContain(key);
  for (const key of schema.required ?? []) expect(body).toHaveProperty(key);
}

describe("owner authentication matches the backend contract", () => {
  it("sends a login body the backend accepts", () => {
    expectMatches(
      loginRequestBody({
        email: "owner@example.invalid",
        password: "x".repeat(12),
        deviceId: "device-1",
        userAgent: "ua",
      }),
      requestSchema("/api/v1/auth/login"),
    );
  });
  it("sends a refresh body the backend accepts", () => {
    expectMatches(
      refreshRequestBody({
        refreshToken: "r".repeat(40),
        deviceId: "device-1",
        userAgent: "ua",
      }),
      requestSchema("/api/v1/auth/refresh"),
    );
  });
  it("caps the user agent at the backend limit", () => {
    expect(
      loginRequestBody({
        email: "a@b.c",
        password: "p",
        deviceId: "d",
        userAgent: "u".repeat(900),
      }).userAgent,
    ).toHaveLength(512);
  });
});
