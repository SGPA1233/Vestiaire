import assert from "node:assert/strict";
import test from "node:test";
import { createPasswordToken, hashPasswordToken } from "./password-tokens";

test("les jetons ne sont jamais stockés en clair", () => {
  const { rawToken, tokenHash } = createPasswordToken();
  assert.equal(rawToken.length, 64);
  assert.equal(tokenHash.length, 64);
  assert.notEqual(rawToken, tokenHash);
  assert.equal(hashPasswordToken(rawToken), tokenHash);
});
