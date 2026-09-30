import assert from "node:assert/strict";
import test from "node:test";
import { safeInternalPath } from "./navigation";

test("safeInternalPath conserve une destination interne", () => {
  assert.equal(safeInternalPath("/collaborateurs?actif=1"), "/collaborateurs?actif=1");
});

test("safeInternalPath bloque les destinations externes et exécutables", () => {
  assert.equal(safeInternalPath("https://example.com"), "/");
  assert.equal(safeInternalPath("//example.com"), "/");
  assert.equal(safeInternalPath("javascript:alert(1)"), "/");
  assert.equal(safeInternalPath("/\\example.com"), "/");
});
