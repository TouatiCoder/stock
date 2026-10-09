import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { CSV_BOM, csvFileName, escapeCsvValue, toCsv, toCsvFile } from "./csv";

describe("escapeCsvValue", () => {
  test("plain values pass through untouched", () => {
    assert.equal(escapeCsvValue("Villa Marina"), "Villa Marina");
    assert.equal(escapeCsvValue(42), "42");
  });

  test("empty, null and undefined become an empty cell", () => {
    assert.equal(escapeCsvValue(""), "");
    assert.equal(escapeCsvValue(null), "");
    assert.equal(escapeCsvValue(undefined), "");
  });

  test("separators and newlines are quoted", () => {
    assert.equal(escapeCsvValue("Casablanca, Maroc"), '"Casablanca, Maroc"');
    assert.equal(escapeCsvValue("a;b"), '"a;b"');
    assert.equal(escapeCsvValue("line1\nline2"), '"line1\nline2"');
  });

  test("inner quotes are doubled, as RFC 4180 requires", () => {
    assert.equal(escapeCsvValue('Société "Al Fath"'), '"Société ""Al Fath"""');
  });

  test("a leading =, +, - or @ is neutralised so Excel does not run it as a formula", () => {
    assert.equal(escapeCsvValue("=1+1"), "'=1+1");
    assert.equal(escapeCsvValue("+33600000000"), "'+33600000000");
    assert.equal(escapeCsvValue("-5"), "'-5");
    assert.equal(escapeCsvValue("@name"), "'@name");
  });
});

describe("toCsv", () => {
  const columns = [
    { header: "Entreprise", value: (row: { name: string; total: number }) => row.name },
    { header: "Total", value: (row: { name: string; total: number }) => row.total },
  ];

  test("writes the header row then one line per row, CRLF separated", () => {
    const csv = toCsv([{ name: "Villa Marina", total: 3 }], columns);
    assert.equal(csv, "Entreprise,Total\r\nVilla Marina,3");
  });

  test("an empty list still produces the header row", () => {
    assert.equal(toCsv([], columns), "Entreprise,Total");
  });

  test("values containing the separator stay in a single cell", () => {
    const csv = toCsv([{ name: "Résidence, Lot A", total: 1 }], columns);
    assert.equal(csv.split("\r\n")[1], '"Résidence, Lot A",1');
  });

  test("the file variant starts with a BOM so Excel reads UTF-8 correctly", () => {
    const file = toCsvFile([{ name: "Société", total: 1 }], columns);
    assert.ok(file.startsWith(CSV_BOM));
    assert.ok(file.includes("Société"));
  });
});

describe("csvFileName", () => {
  test("is prefixed and dated, with no spaces", () => {
    assert.equal(csvFileName("companies", new Date("2026-09-28T10:00:00Z")), "companies-2026-09-28.csv");
    assert.ok(!csvFileName("companies").includes(" "));
  });
});
