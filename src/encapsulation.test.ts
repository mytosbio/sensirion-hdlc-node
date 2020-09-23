import {
    __flipBit,
    __calculateChecksum,
    encodeFrame,
    decodeFrame,
} from "./encapsulation";

describe("Encapsulation", () => {
    describe("flipBit()", () => {
        test.each([
            [0b101, 0b111, 1],
            [0b101, 0b001, 2],
            [0x7e, 0x5e, 5],
            [0x7d, 0x5d, 5],
            [0x11, 0x31, 5],
            [0x13, 0x33, 5],
        ])(
            "should escape %s to become %s by flipping bit %s",
            (byte: number, escaped: number, bit: number) => {
                expect(__flipBit(byte, bit)).toEqual(escaped);
            },
        );
    });
    describe("calculateChecksum()", () => {
        test("should calculate checksum from zero length data", () => {
            const checksum = __calculateChecksum([0x00, 0xd3, 0x00, 0x00]);
            expect(checksum).toEqual(0x2c);
        });
        test("should calculate checksum from extensive data", () => {
            const checksum = __calculateChecksum([
                0x00,
                0xd0,
                0x00,
                0x13,
                0x52,
                0x53,
                0x34,
                0x38,
                0x35,
                0x20,
                0x53,
                0x65,
                0x6e,
                0x73,
                0x6f,
                0x72,
                0x20,
                0x43,
                0x61,
                0x62,
                0x6c,
                0x65,
                0x00,
            ]);
            expect(checksum).toEqual(0x45);
        });
    });
    describe("encodeFrame()", () => {
        test("should add start, checksum and end", () => {
            const data = [0x00, 0x24, 0x01, 0x03];
            const expected = [0x7e, 0x00, 0x24, 0x01, 0x03, 0xd7, 0x7e];
            expect(encodeFrame(data)).toEqual(expected);
        });
        test("should add start, checksum and end complex", () => {
            const data = [0x00, 0x33, 0x04, 0x00, 0xfa, 0x36, 0x08];
            expect(encodeFrame(data)).toEqual([
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
            const data = [0x11, 0x33, 0x04, 0x00, 0xfa, 0x36, 0x08];
            expect(encodeFrame(data)).toEqual([
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
            const data = [0x00, 0x33, 0x04, 0x00, 0x13, 0x36, 0x08];
            expect(encodeFrame(data)).toEqual([
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
    describe("decodeFrame()", () => {
        test("should decode frame for get device info and verify checksum", () => {
            const received = [
                0x7e,
                0x00,
                0xd0,
                0x00,
                0x7d,
                0x33,
                0x52,
                0x53,
                0x34,
                0x38,
                0x35,
                0x20,
                0x53,
                0x65,
                0x6e,
                0x73,
                0x6f,
                0x72,
                0x20,
                0x43,
                0x61,
                0x62,
                0x6c,
                0x65,
                0x00,
                0x45,
                0x7e,
            ];
            expect(decodeFrame(received)).toEqual([
                0x00,
                0xd0,
                0x00,
                0x13,
                0x52,
                0x53,
                0x34,
                0x38,
                0x35,
                0x20,
                0x53,
                0x65,
                0x6e,
                0x73,
                0x6f,
                0x72,
                0x20,
                0x43,
                0x61,
                0x62,
                0x6c,
                0x65,
                0x00,
            ]);
        });
        test("should decode frame for get last measurement and verify checksum", () => {
            const received = [
                0x7e,
                0x00,
                0x35,
                0x00,
                0x02,
                0xff,
                0xc6,
                0x03,
                0x7e,
            ];
            expect(decodeFrame(received)).toEqual([
                0x00,
                0x35,
                0x00,
                0x02,
                0xff,
                0xc6,
            ]);
        });
        test("should decode frame with start and stop characters", () => {
            const received = [0x7e, 0x00, 0xd0, 0x00, 0x7d, 0x33, 0x1c, 0x7e];
            expect(decodeFrame(received)).toEqual([0x00, 0xd0, 0x00, 0x13]);
        });
        test("should decode frame with a start but no stop character", () => {
            const received = [0x7e, 0x00, 0xd0, 0x00, 0x7d, 0x33, 0x1c];
            expect(decodeFrame(received)).toEqual([0x00, 0xd0, 0x00, 0x13]);
        });
        test("should decode frame with no start or stop characters", () => {
            const received = [0x00, 0xd0, 0x00, 0x7d, 0x33, 0x1c];
            expect(decodeFrame(received)).toEqual([0x00, 0xd0, 0x00, 0x13]);
        });
    });
});
