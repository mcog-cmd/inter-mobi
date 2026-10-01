import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import OlMap from "ol/Map";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

import MapComponent from "./Map";
import { registerLand, searchLands, getLandById } from "../services/landService";

jest.mock("ol/Map", () => {
    class MockMap {
        constructor(options) {
            this.options = options;
            this.handlers = {};
            this.updateSize = jest.fn();
            this.setTarget = jest.fn();
            this.addInteraction = jest.fn();
            this.removeInteraction = jest.fn();
            this.on = jest.fn((type, handler) => {
                this.handlers[type] = handler;
            });
            this.un = jest.fn();
            this.forEachFeatureAtPixel = jest.fn();
            MockMap.instances.push(this);
        }
    }
    MockMap.instances = [];
    return { __esModule: true, default: MockMap };
});

jest.mock("ol/View", () => ({
    __esModule: true,
    default: class MockView {
        constructor(options) {
            this.options = options;
        }
    }
}));

jest.mock("ol/layer/Tile", () => ({
    __esModule: true,
    default: class MockTileLayer {
        constructor(options) {
            this.options = options;
        }
    }
}));

jest.mock("ol/source/OSM", () => ({
    __esModule: true,
    default: class MockOSM {}
}));

jest.mock("ol/layer/Vector", () => {
    class MockVectorLayer {
        constructor(options) {
            this.options = options;
            MockVectorLayer.instances.push(this);
        }
    }
    MockVectorLayer.instances = [];
    return { __esModule: true, default: MockVectorLayer };
});

jest.mock("ol/source/Vector", () => {
    class MockVectorSource {
        constructor() {
            this.features = [];
            this.addFeature = jest.fn((feature) => {
                this.features.push(feature);
            });
            this.removeFeature = jest.fn();
            this.getFeatures = jest.fn(() => this.features);
            this.clear = jest.fn(() => {
                this.features = [];
            });
            MockVectorSource.instances.push(this);
        }
    }
    MockVectorSource.instances = [];
    return { __esModule: true, default: MockVectorSource };
});

jest.mock("ol/interaction/Draw", () => {
    class MockDraw {
        constructor(options) {
            this.options = options;
            this.handlers = {};
            this.on = jest.fn((type, handler) => {
                this.handlers[type] = handler;
            });
            MockDraw.instances.push(this);
        }
    }
    MockDraw.instances = [];
    return { __esModule: true, default: MockDraw };
});

jest.mock("ol/format/GeoJSON", () => {
    class MockFeature {
        constructor(properties, geometry) {
            this.props = { ...properties };
            this.geometry = geometry;
        }
        get(key) {
            return this.props[key];
        }
        setProperties(properties) {
            Object.assign(this.props, properties);
        }
    }

    class MockGeoJSON {
        readFeature(object) {
            return new MockFeature(object.properties, object.geometry);
        }
        writeFeatureObject() {
            return {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]]
                }
            };
        }
        writeGeometryObject(geometry) {
            return { type: "Polygon", coordinates: [], source: geometry };
        }
    }

    return { __esModule: true, default: MockGeoJSON };
});

jest.mock("ol/geom/Polygon", () => ({
    __esModule: true,
    fromCircle: (geometry, sides) => ({ circle: geometry, sides })
}));

/* ------------------------------------------------------------------ */
/* Mocks do modal e do service                                         */
/* ------------------------------------------------------------------ */

jest.mock("./LandFormModal", () => {
    const { createElement } = require("react");

    return {
        __esModule: true,
        default: ({ onSubmit, onClose, error }) =>
            createElement(
                "div",
                { "data-testid": "modal" },
                error ? createElement("span", { "data-testid": "modal-error" }, error) : null,
                createElement(
                    "button",
                    {
                        onClick: () =>
                            onSubmit({
                                price: "100",
                                description: "Terreno",
                                contact: "a@b.com"
                            })
                    },
                    "mock-submit"
                ),
                createElement("button", { onClick: onClose }, "mock-close")
            )
    };
});

jest.mock("../services/landService", () => ({
    registerLand: jest.fn(),
    searchLands: jest.fn(),
    getLandById: jest.fn()
}));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getMap = () => OlMap.instances[0];
const getLandSource = () => VectorSource.instances[0];
const getSearchSource = () => VectorSource.instances[1];
const getLandLayer = () => VectorLayer.instances[0];
const lastDraw = () => Draw.instances[Draw.instances.length - 1];
const clickTool = (name) => fireEvent.click(screen.getByRole("button", { name }));
const circleEvent = () => ({ feature: { getGeometry: () => ({}) } });

const landA = {
    id: 1,
    price: 500,
    description: "Terreno A",
    contact: "a@mail.com",
    geometry: JSON.stringify({ type: "Polygon", coordinates: [[[0, 0], [1, 1], [0, 1], [0, 0]]] })
};

const landB = {
    id: 2,
    price: 900,
    description: "",
    contact: "b@mail.com",
    geometry: { type: "Polygon", coordinates: [[[2, 2], [3, 3], [2, 3], [2, 2]]] }
};

const searchRegion = async (lands) => {
    searchLands.mockResolvedValue(lands);
    clickTool("Circle");

    await act(async () => {
        await lastDraw().handlers.drawend(circleEvent());
    });
};

/* ------------------------------------------------------------------ */
/* Testes                                                              */
/* ------------------------------------------------------------------ */

describe("MapComponent", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        OlMap.instances.length = 0;
        Draw.instances.length = 0;
        VectorSource.instances.length = 0;
        VectorLayer.instances.length = 0;

        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("map lifecycle and toolbar", () => {
        it("creates the map on mount and detaches it on unmount", () => {
            const { unmount } = render(<MapComponent />);

            expect(OlMap.instances).toHaveLength(1);
            expect(getMap().updateSize).toHaveBeenCalled();
            expect(getMap().options.layers).toHaveLength(3);
            expect(getMap().addInteraction).not.toHaveBeenCalled();

            unmount();

            expect(getMap().setTarget).toHaveBeenCalledWith(undefined);
        });

        it("renders the toolbar and no info panel initially", () => {
            render(<MapComponent />);

            expect(screen.getByRole("button", { name: "Polygon" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Circle" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
            expect(document.querySelector(".info-panel")).toBeNull();
            expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });

        it.each(["Polygon", "Circle", "Select"])(
            "toggles the %s tool active class",
            (name) => {
                render(<MapComponent />);
                const button = screen.getByRole("button", { name });

                expect(button).toHaveClass("tool-button");
                expect(button).not.toHaveClass("active");

                fireEvent.click(button);
                expect(button).toHaveClass("active");

                fireEvent.click(button);
                expect(button).not.toHaveClass("active");
            }
        );

        it("removes the previous interaction when the tool changes", () => {
            render(<MapComponent />);

            clickTool("Polygon");
            const polygonDraw = lastDraw();

            clickTool("Circle");

            expect(getMap().removeInteraction).toHaveBeenCalledWith(polygonDraw);
            expect(lastDraw()).not.toBe(polygonDraw);
        });

        it("removes the interaction when the active tool is toggled off", () => {
            render(<MapComponent />);

            clickTool("Polygon");
            const draw = lastDraw();
            clickTool("Polygon");

            expect(getMap().removeInteraction).toHaveBeenCalledWith(draw);
        });
    });

    describe("polygon tool (register land)", () => {
        const drawPolygon = () => {
            clickTool("Polygon");
            const draw = lastDraw();
            const feature = { setProperties: jest.fn() };

            act(() => {
                draw.handlers.drawend({ feature });
            });

            return { draw, feature };
        };

        it("creates a polygon Draw on the land source", () => {
            render(<MapComponent />);
            clickTool("Polygon");

            const draw = lastDraw();

            expect(draw.options.type).toBe("Polygon");
            expect(draw.options.source).toBe(getLandSource());
            expect(getMap().addInteraction).toHaveBeenCalledWith(draw);
        });

        it("opens the modal after drawing a polygon", () => {
            render(<MapComponent />);
            drawPolygon();

            expect(screen.getByTestId("modal")).toBeInTheDocument();
            expect(screen.queryByTestId("modal-error")).not.toBeInTheDocument();
        });

        it("registers the land and updates the drawn feature", async () => {
            registerLand.mockResolvedValue({
                id: 10,
                price: "100",
                description: "Terreno",
                contact: "a@b.com"
            });
            render(<MapComponent />);
            const { feature } = drawPolygon();

            fireEvent.click(screen.getByText("mock-submit"));

            await waitFor(() =>
                expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
            );

            expect(registerLand).toHaveBeenCalledWith({
                price: "100",
                description: "Terreno",
                contact: "a@b.com",
                geometry: {
                    type: "Polygon",
                    coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]]
                }
            });
            expect(feature.setProperties).toHaveBeenCalledWith({
                id: 10,
                price: "100",
                description: "Terreno",
                contact: "a@b.com"
            });
        });

        it("handles a submit when there is no pending feature anymore", async () => {
            registerLand.mockResolvedValue({
                id: 10,
                price: "100",
                description: "Terreno",
                contact: "a@b.com"
            });
            render(<MapComponent />);
            const { feature } = drawPolygon();

            // dois submits seguidos: o segundo encontra pendingFeatureRef nulo
            fireEvent.click(screen.getByText("mock-submit"));
            fireEvent.click(screen.getByText("mock-submit"));

            await waitFor(() =>
                expect(screen.queryByTestId("modal")).not.toBeInTheDocument()
            );

            expect(registerLand).toHaveBeenCalledTimes(2);
            expect(feature.setProperties).toHaveBeenCalledTimes(1);
        });

        it("shows the error in the modal when registering fails", async () => {
            registerLand.mockRejectedValue(new Error("Invalid geometry"));
            render(<MapComponent />);
            drawPolygon();

            fireEvent.click(screen.getByText("mock-submit"));

            expect(await screen.findByTestId("modal-error")).toHaveTextContent(
                "Invalid geometry"
            );
            expect(screen.getByTestId("modal")).toBeInTheDocument();
            expect(console.error).toHaveBeenCalledWith(
                "Error registering land:",
                expect.any(Error)
            );
        });

        it("removes the pending feature and closes the modal on cancel", () => {
            render(<MapComponent />);
            const { feature } = drawPolygon();

            fireEvent.click(screen.getByText("mock-close"));

            expect(getLandSource().removeFeature).toHaveBeenCalledWith(feature);
            expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
        });

        it("clears the previous error when a new polygon is drawn", async () => {
            registerLand.mockRejectedValue(new Error("Boom"));
            render(<MapComponent />);
            const { draw } = drawPolygon();

            fireEvent.click(screen.getByText("mock-submit"));
            await screen.findByTestId("modal-error");

            act(() => {
                draw.handlers.drawend({ feature: { setProperties: jest.fn() } });
            });

            expect(screen.queryByTestId("modal-error")).not.toBeInTheDocument();
        });
    });

    describe("circle tool (search lands)", () => {
        it("creates a circle Draw on the search source", () => {
            render(<MapComponent />);
            clickTool("Circle");

            const draw = lastDraw();

            expect(draw.options.type).toBe("Circle");
            expect(draw.options.source).toBe(getSearchSource());
            expect(getMap().addInteraction).toHaveBeenCalledWith(draw);
        });

        it("searches lands, adds them to the map and lists them", async () => {
            render(<MapComponent />);
            await searchRegion([landA, landB]);

            expect(searchLands).toHaveBeenCalledWith(
                expect.objectContaining({ type: "Polygon" })
            );
            expect(getLandSource().addFeature).toHaveBeenCalledTimes(2);

            // geometria em string é parseada, objeto é usado direto
            expect(getLandSource().features[0].geometry).toEqual(JSON.parse(landA.geometry));
            expect(getLandSource().features[1].geometry).toEqual(landB.geometry);

            expect(screen.getByText("2 lands in region")).toBeInTheDocument();
            expect(screen.getByText("Terreno A")).toBeInTheDocument();
            expect(screen.getByText("Land 2")).toBeInTheDocument();
        });

        it("reuses features already present on the map", async () => {
            render(<MapComponent />);
            await searchRegion([landA, landB]);

            searchLands.mockResolvedValue([landA]);
            await act(async () => {
                await lastDraw().handlers.drawend(circleEvent());
            });

            expect(getLandSource().addFeature).toHaveBeenCalledTimes(2);
            expect(screen.getByText("1 lands in region")).toBeInTheDocument();
        });

        it("logs an error when the search fails", async () => {
            searchLands.mockRejectedValue(new Error("Failed to search lands"));
            render(<MapComponent />);
            clickTool("Circle");

            await act(async () => {
                await lastDraw().handlers.drawend(circleEvent());
            });

            expect(console.error).toHaveBeenCalledWith(
                "Error searching lands:",
                expect.any(Error)
            );
            expect(document.querySelector(".info-panel")).toBeNull();
        });

        it("clears previous results when a new circle starts", async () => {
            render(<MapComponent />);
            await searchRegion([landA, landB]);
            expect(screen.getByText("2 lands in region")).toBeInTheDocument();

            act(() => {
                lastDraw().handlers.drawstart();
            });

            expect(getSearchSource().clear).toHaveBeenCalled();
            expect(screen.queryByText("2 lands in region")).not.toBeInTheDocument();
        });

        it("loads land details when an item of the list is clicked", async () => {
            getLandById.mockResolvedValue(landA);
            render(<MapComponent />);
            await searchRegion([landA, landB]);

            fireEvent.click(screen.getByText("Terreno A"));

            expect(await screen.findByText("Details")).toBeInTheDocument();
            expect(getLandById).toHaveBeenCalledWith(1);
            expect(screen.getByText("Price: 500")).toBeInTheDocument();
            expect(screen.getByText("Description: Terreno A")).toBeInTheDocument();
            expect(screen.getByText("Contact: a@mail.com")).toBeInTheDocument();
        });

        it("logs an error when loading land details fails", async () => {
            getLandById.mockRejectedValue(new Error("Failed to get land"));
            render(<MapComponent />);
            await searchRegion([landA, landB]);

            fireEvent.click(screen.getByText("Terreno A"));

            await waitFor(() =>
                expect(console.error).toHaveBeenCalledWith(
                    "Error loading land:",
                    expect.any(Error)
                )
            );
            expect(screen.queryByText("Details")).not.toBeInTheDocument();
        });
    });

    describe("select tool", () => {
        const clickMap = (feature) => {
            getMap().forEachFeatureAtPixel.mockImplementation((pixel, callback, options) => {
                expect(options.layerFilter(getLandLayer())).toBe(true);
                expect(options.layerFilter({})).toBe(false);
                return callback(feature);
            });

            act(() => {
                getMap().handlers.singleclick({ pixel: [10, 20] });
            });
        };

        it("registers the singleclick handler and unregisters it on tool change", () => {
            render(<MapComponent />);

            clickTool("Select");
            const handler = getMap().handlers.singleclick;

            expect(getMap().on).toHaveBeenCalledWith("singleclick", handler);

            clickTool("Select");

            expect(getMap().un).toHaveBeenCalledWith("singleclick", handler);
        });

        it("loads details of the clicked feature when there is no region filter", async () => {
            getLandById.mockResolvedValue(landA);
            render(<MapComponent />);
            clickTool("Select");

            clickMap({ get: () => 1 });

            expect(await screen.findByText("Details")).toBeInTheDocument();
            expect(getLandById).toHaveBeenCalledWith(1);
            expect(screen.getByText("Price: 500")).toBeInTheDocument();
        });

        it("clears the selection when clicking on an empty area", async () => {
            getLandById.mockResolvedValue(landA);
            render(<MapComponent />);
            clickTool("Select");

            clickMap({ get: () => 1 });
            await screen.findByText("Details");

            getMap().forEachFeatureAtPixel.mockReturnValue(undefined);
            act(() => {
                getMap().handlers.singleclick({ pixel: [0, 0] });
            });

            expect(screen.queryByText("Details")).not.toBeInTheDocument();
        });

        it("ignores features outside of the searched region", async () => {
            render(<MapComponent />);
            await searchRegion([landA, landB]);
            clickTool("Select");

            clickMap({ get: () => 99 });

            expect(getLandById).not.toHaveBeenCalled();
        });

        it("loads features that are inside of the searched region", async () => {
            getLandById.mockResolvedValue(landA);
            render(<MapComponent />);
            await searchRegion([landA, landB]);
            clickTool("Select");

            clickMap(getLandSource().features[0]);

            expect(await screen.findByText("Details")).toBeInTheDocument();
            expect(getLandById).toHaveBeenCalledWith(1);
        });
    });
});