import { __escapeByte, encode } from "./encapsulation";

describe("Encapsulation", () => {
    describe("escapeByte()", () => {
        test.each([
            [0x7e, 0x5e],
            [0x7d, 0x5d],
            [0x11, 0x31],
            [0x13, 0x33],
        ])("should escape %s to become %s", (byte: number, escaped: number) => {
            expect(__escapeByte(byte)).toEqual(escaped);
        });
    });
    describe("encode()", () => {
        test("should add start and end bytes", () => {
            const data = [0x00, 0x24, 0x01, 0x03, 0xd7];
            const expected = [0x7e, 0x00, 0x24, 0x01, 0x03, 0xd7, 0x7e];
            expect(encode(data)).toEqual(expected);
        });
        test("should add start and end bytes complex", () => {
            const data = [0x00, 0x33, 0x04, 0x00, 0xfa, 0x36, 0x08, 0x90];
            expect(encode(data)).toEqual([
                0x7e,
                0x00,
                0x33,
                0x04,
                0x00,
                0xfa,
                0x36,
                0x08,
                0x90,
                0x7e,
            ]);
        });
        test("should escape special characters", () => {
            const data = [0x11, 0x33, 0x04, 0x00, 0xfa, 0x36, 0x08, 0x7f];
            expect(encode(data)).toEqual([
                0x7e,
                0x7d,
                0x31,
                0x33,
                0x04,
                0x00,
                0xfa,
                0x36,
                0x08,
                0x7f,
                0x7e,
            ]);
        });
        test("should escape special characters", () => {
            const data = [0x00, 0x33, 0x04, 0x00, 0x13, 0x36, 0x08, 0x77];
            expect(encode(data)).toEqual([
                0x7e,
                0x00,
                0x33,
                0x04,
                0x00,
                0x7d,
                0x33,
                0x36,
                0x08,
                0x77,
                0x7e,
            ]);
        });
    });
});
