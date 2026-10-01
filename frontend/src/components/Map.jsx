import { useEffect, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromCircle } from "ol/geom/Polygon";

import LandFormModal from "./LandFormModal";
import { registerLand, searchLands, getLandById } from "../services/landService";

const geoJsonFormat = new GeoJSON();

const MapComponent = () => {
    const mapElement = useRef(null);
    const mapRef = useRef(null);
    const landSourceRef = useRef(null);
    const landLayerRef = useRef(null);
    const searchSourceRef = useRef(null);
    const interactionRef = useRef(null);
    const pendingFeatureRef = useRef(null);
    const regionFeaturesRef = useRef([]);

    const [geometry, setGeometry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [tool, setTool] = useState("none");
    const [regionFeatures, setRegionFeatures] = useState([]);
    const [selectedLand, setSelectedLand] = useState(null);

    useEffect(() => {
        const landSource = new VectorSource();
        const landLayer = new VectorLayer({ source: landSource });

        const searchSource = new VectorSource();
        const searchLayer = new VectorLayer({ source: searchSource });

        const map = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                landLayer,
                searchLayer
            ],
            view: new View({
                center: [0, 0],
                zoom: 2
            })
        });

        mapRef.current = map;
        landSourceRef.current = landSource;
        landLayerRef.current = landLayer;
        searchSourceRef.current = searchSource;

        map.updateSize();

        return () => {
            map.setTarget(undefined);
        };
    }, []);

    const loadLandDetails = async (id) => {
        try {
            const land = await getLandById(id);
            setSelectedLand(land);
        } catch (error) {
            console.error("Error loading land:", error);
        }
    };

    const addLandsToMap = (lands) => {
        const landSource = landSourceRef.current;

        return lands.map((land) => {
            const existing = landSource
                .getFeatures()
                .find((feature) => feature.get("id") === land.id);

            if (existing) {
                return existing;
            }

            const parsedGeometry =
                typeof land.geometry === "string"
                    ? JSON.parse(land.geometry)
                    : land.geometry;

            const feature = geoJsonFormat.readFeature(
                {
                    type: "Feature",
                    geometry: parsedGeometry,
                    properties: {
                        id: land.id,
                        price: land.price,
                        description: land.description,
                        contact: land.contact
                    }
                },
                {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:3857"
                }
            );

            landSource.addFeature(feature);
            return feature;
        });
    };

    useEffect(() => {
        const map = mapRef.current;

        if (interactionRef.current) {
            map.removeInteraction(interactionRef.current);
            interactionRef.current = null;
        }

        if (tool === "polygon") {
            const draw = new Draw({
                source: landSourceRef.current,
                type: "Polygon"
            });

            draw.on("drawend", (event) => {
                const geoJson = geoJsonFormat.writeFeatureObject(
                    event.feature,
                    {
                        featureProjection: "EPSG:3857",
                        dataProjection: "EPSG:4326"
                    }
                );

                pendingFeatureRef.current = event.feature;
                setGeometry(geoJson.geometry);
                setSubmitError(null);
                setShowModal(true);
            });

            map.addInteraction(draw);
            interactionRef.current = draw;
        }

        if (tool === "circle") {
            const searchDraw = new Draw({
                source: searchSourceRef.current,
                type: "Circle"
            });

            searchDraw.on("drawstart", () => {
                searchSourceRef.current.clear();
                regionFeaturesRef.current = [];
                setRegionFeatures([]);
                setSelectedLand(null);
            });

            searchDraw.on("drawend", async (event) => {
                const circlePolygon = fromCircle(event.feature.getGeometry(), 64);

                const searchGeometry = geoJsonFormat.writeGeometryObject(
                    circlePolygon,
                    {
                        featureProjection: "EPSG:3857",
                        dataProjection: "EPSG:4326"
                    }
                );

                try {
                    const lands = await searchLands(searchGeometry);
                    const features = addLandsToMap(lands);

                    regionFeaturesRef.current = features;
                    setRegionFeatures(features);
                } catch (error) {
                    console.error("Error searching lands:", error);
                }
            });

            map.addInteraction(searchDraw);
            interactionRef.current = searchDraw;
        }

        if (tool === "select") {
            const handleClick = (event) => {
                const feature = map.forEachFeatureAtPixel(
                    event.pixel,
                    (found) => found,
                    { layerFilter: (layer) => layer === landLayerRef.current }
                );

                if (!feature) {
                    setSelectedLand(null);
                    return;
                }

                const region = regionFeaturesRef.current;

                if (region.length > 0 && !region.includes(feature)) {
                    return;
                }

                loadLandDetails(feature.get("id"));
            };

            map.on("singleclick", handleClick);

            return () => {
                map.un("singleclick", handleClick);
            };
        }
    }, [tool]);

    const handleSubmitLand = async (landData) => {
        const request = {
            price: landData.price,
            description: landData.description,
            contact: landData.contact,
            geometry: geometry
        };

        setSubmitError(null);

        try {
            const savedLand = await registerLand(request);
            console.log("Land registered:", savedLand);

            if (pendingFeatureRef.current) {
                pendingFeatureRef.current.setProperties({
                    id: savedLand.id,
                    price: savedLand.price,
                    description: savedLand.description,
                    contact: savedLand.contact
                });
                pendingFeatureRef.current = null;
            }

            setShowModal(false);
        } catch (error) {
            console.error("Error registering land:", error);
            setSubmitError(error.message);
        }
    };

    const handleCloseModal = () => {
        if (pendingFeatureRef.current) {
            landSourceRef.current.removeFeature(pendingFeatureRef.current);
            pendingFeatureRef.current = null;
        }

        setSubmitError(null);
        setShowModal(false);
    };

    const toggleTool = (name) => {
        setTool((current) => (current === name ? "none" : name));
    };

    return (
        <div className="map-wrapper">
            <div ref={mapElement} className="map" />

            <div className="toolbar">
                <button
                    className={tool === "polygon" ? "tool-button active" : "tool-button"}
                    onClick={() => toggleTool("polygon")}
                >
                    Polygon
                </button>
                <button
                    className={tool === "circle" ? "tool-button active" : "tool-button"}
                    onClick={() => toggleTool("circle")}
                >
                    Circle
                </button>
                <button
                    className={tool === "select" ? "tool-button active" : "tool-button"}
                    onClick={() => toggleTool("select")}
                >
                    Select
                </button>
            </div>

            {(regionFeatures.length > 0 || selectedLand) && (
                <div className="info-panel">
                    {regionFeatures.length > 0 && (
                        <>
                            <strong>{regionFeatures.length} lands in region</strong>
                            <ul>
                                {regionFeatures.map((feature) => (
                                    <li
                                        key={feature.get("id")}
                                        onClick={() => loadLandDetails(feature.get("id"))}
                                    >
                                        {feature.get("description") || `Land ${feature.get("id")}`}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}

                    {selectedLand && (
                        <div>
                            <strong>Details</strong>
                            <p>Price: {selectedLand.price}</p>
                            <p>Description: {selectedLand.description}</p>
                            <p>Contact: {selectedLand.contact}</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <LandFormModal
                    onSubmit={handleSubmitLand}
                    onClose={handleCloseModal}
                    error={submitError}
                />
            )}
        </div>
    );
};

export default MapComponent;