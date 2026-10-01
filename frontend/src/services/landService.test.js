const loadService = (apiUrl) => {
    let service;

    jest.isolateModules(() => {
        if (apiUrl === undefined) {
            delete process.env.VITE_API_URL;
        } else {
            process.env.VITE_API_URL = apiUrl;
        }

        service = require("./landService");
    });

    return service;
};

const okResponse = (data) => ({
    ok: true,
    json: jest.fn().mockResolvedValue(data)
});

describe("landService", () => {
    const originalFetch = global.fetch;
    const originalEnv = process.env.VITE_API_URL;

    beforeEach(() => {
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;

        if (originalEnv === undefined) {
            delete process.env.VITE_API_URL;
        } else {
            process.env.VITE_API_URL = originalEnv;
        }
    });

    describe("API_URL", () => {
        it("uses /api as default base url", async () => {
            const { getLandById } = loadService(undefined);
            global.fetch.mockResolvedValue(okResponse({}));

            await getLandById(1);

            expect(global.fetch).toHaveBeenCalledWith("/api/lands/1");
        });

        it("uses VITE_API_URL when defined", async () => {
            const { getLandById } = loadService("http://localhost:8080/api");
            global.fetch.mockResolvedValue(okResponse({}));

            await getLandById(1);

            expect(global.fetch).toHaveBeenCalledWith("http://localhost:8080/api/lands/1");
        });
    });

    describe("registerLand", () => {
        const land = {
            price: "100",
            description: "Land",
            contact: "a@b.com",
            geometry: { type: "Polygon", coordinates: [] }
        };

        it("posts the land and returns the saved land", async () => {
            const { registerLand } = loadService(undefined);
            const saved = { id: 1, ...land };
            global.fetch.mockResolvedValue(okResponse(saved));

            const result = await registerLand(land);

            expect(global.fetch).toHaveBeenCalledWith("/api/lands", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(land)
            });
            expect(result).toEqual(saved);
        });

        it("throws the message returned by the API", async () => {
            const { registerLand } = loadService(undefined);
            global.fetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({ message: "Invalid geometry" })
            });

            await expect(registerLand(land)).rejects.toThrow("Invalid geometry");
        });

        it("throws the default message when the body has no message", async () => {
            const { registerLand } = loadService(undefined);
            global.fetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({})
            });

            await expect(registerLand(land)).rejects.toThrow("Failed to register land");
        });

        it("throws the default message when the body is not valid JSON", async () => {
            const { registerLand } = loadService(undefined);
            global.fetch.mockResolvedValue({
                ok: false,
                json: jest.fn().mockRejectedValue(new SyntaxError("bad json"))
            });

            await expect(registerLand(land)).rejects.toThrow("Failed to register land");
        });
    });

    describe("searchLands", () => {
        const geometry = { type: "Polygon", coordinates: [] };

        it("posts the geometry and returns the lands", async () => {
            const { searchLands } = loadService(undefined);
            const lands = [{ id: 1 }, { id: 2 }];
            global.fetch.mockResolvedValue(okResponse(lands));

            const result = await searchLands(geometry);

            expect(global.fetch).toHaveBeenCalledWith("/api/lands/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(geometry)
            });
            expect(result).toEqual(lands);
        });

        it("throws when the response is not ok", async () => {
            const { searchLands } = loadService(undefined);
            global.fetch.mockResolvedValue({ ok: false });

            await expect(searchLands(geometry)).rejects.toThrow("Failed to search lands");
        });
    });

    describe("getLandById", () => {
        it("returns the land", async () => {
            const { getLandById } = loadService(undefined);
            const land = { id: 5, price: "10" };
            global.fetch.mockResolvedValue(okResponse(land));

            const result = await getLandById(5);

            expect(global.fetch).toHaveBeenCalledWith("/api/lands/5");
            expect(result).toEqual(land);
        });

        it("throws when the response is not ok", async () => {
            const { getLandById } = loadService(undefined);
            global.fetch.mockResolvedValue({ ok: false });

            await expect(getLandById(5)).rejects.toThrow("Failed to get land");
        });
    });
});