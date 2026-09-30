import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";

import { useState } from "react";
import LandFormModal from "./LandFormModal";

const MapComponent = () => {
    const mapElement = useRef(null);
    const [geometry, setGeometry] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const vectorSource = new VectorSource();

        const vectorLayer = new VectorLayer({
            source: vectorSource
        });

        const map = new Map({
            target: mapElement.current,
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
                vectorLayer
            ],
            view: new View({
                center: [0, 0],
                zoom: 2
            })
        });

        const draw = new Draw({
            source: vectorSource,
            type: "Polygon"
        });

        map.addInteraction(draw);

        draw.on("drawend", (event) => {
            const geoJson = new GeoJSON().writeFeatureObject(
                event.feature,
                {
                    featureProjection: "EPSG:3857",
                    dataProjection: "EPSG:4326"
                }
            );

            setGeometry(geoJson.geometry);
            setShowModal(true);
        });


        return () => {
            map.setTarget(undefined);
        };
    }, []);

    const handleSubmitLand = async (landData) => {
        const request = {
            price: landData.price,
            description: landData.description,
            contact: landData.contact,
            geometry: geometry
        };

        console.log(request);

        // posteriormente:
        // await fetch(...);

    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <>
            <div ref={mapElement} className="map" />

            {showModal && (
                <LandFormModal
                    onSubmit={handleSubmitLand}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
}

export default MapComponent;