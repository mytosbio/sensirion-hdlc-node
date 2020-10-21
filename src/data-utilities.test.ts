import { parseStringBytes, parseSignedIntegerBytes } from "./data-utilities";

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
    describe("parseStringBytes()", () => {
        test("should parse sensor cable name", () => {
            const string = parseStringBytes([
                82,
                83,
                52,
                56,
                53,
                32,
                83,
                101,
                110,
                115,
                111,
                114,
                32,
                67,
                97,
                98,
                108,
                101,
                0,
            ]);
            expect(string).toEqual("RS485 Sensor Cable");
        });
    });
});
