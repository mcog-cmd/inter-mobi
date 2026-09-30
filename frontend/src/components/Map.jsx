import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

const MapComponent = () => {
    const mapElement = useRef(null);

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
            const geometry = event.feature.getGeometry();
            console.log(geometry)
        })


        return () => {
            map.setTarget(undefined);
        };
    }, []);

    return <div ref={mapElement} className="map" />;
}

export default MapComponent;