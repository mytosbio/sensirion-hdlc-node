import * as src from "../src";

describe("Exported members", () => {
    test.each([["FlowMeter"], ["RetryConnection"], ["SerialPort"]])(
        "should export %s",
        className => {
            expect(src).toHaveProperty(className);
        },
    );
});
