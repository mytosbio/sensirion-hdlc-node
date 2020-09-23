import { parseSignedIntegerBytes } from "./data-utilities";

describe("DataUtilities", () => {
    describe("parseSignedIntegerBytes()", () => {
        test("should parse a large positive number", () => {
            const bytes = [0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0x83, 0xb4];
            const value = parseSignedIntegerBytes(bytes);
            expect(value).toEqual(164788);
        });
        test("should parse a negative number", () => {
            const bytes = [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x30];
            const value = parseSignedIntegerBytes(bytes);
            expect(value).toEqual(-208);
        });
    });
});
