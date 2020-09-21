import { encode } from "./encapsulation";

describe("Encapsulation", () => {
    describe("encode()", () => {
        test("should return a buffer", () => {
            const encoded = encode(Buffer.from([]));
            expect(encoded).toEqual(expect.any(Buffer));
        });
    });
});
