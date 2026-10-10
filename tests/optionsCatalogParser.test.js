import test from "node:test";
import assert from "node:assert/strict";
import { createOptionDefinitionsMap, localizeCatalogValue, parseOptionsCatalog } from "../shared/options/optionsCatalogParser.js";

test("parses nested options", () => {
  const catalog = { currentVersion: "1.2.3", data: [{ categoryId: "youtube", categoryDesktopGroups: [{ groupId: "feed", options: [{ id: "hide-feed", styles: ["#contents { display: none; }"], childOnOptions: [{ id: "hide-child", styles: ["#child { display: none; }"] }] }] }] }] };
  const parsed = parseOptionsCatalog(catalog);
  assert.equal(parsed.currentVersion, "1.2.3");
  assert.equal(parsed.desktopOptions.length, 2);
  const definitions = createOptionDefinitionsMap(catalog);
  assert.deepEqual([...definitions.get("hide-child").parentOptionIds], ["hide-feed"]);
});

test("uses localized value and English fallback", () => {
  assert.equal(localizeCatalogValue({ en: "Hide", da: "Skjul" }, "da"), "Skjul");
  assert.equal(localizeCatalogValue({ en: "Hide" }, "de"), "Hide");
});
