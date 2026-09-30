package com.intermobi.shared.geo;

import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class GeoJsonConverter {

    private final ObjectMapper objectMapper;

    public GeoJsonConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public Polygon toPolygon(JsonNode geoJson) {
        try {
            GeoJsonReader reader = new GeoJsonReader();
            var geometry = reader.read(geoJson.toString());
            if (!(geometry instanceof Polygon polygon)) {
                throw new InvalidGeometryException("Geometry must be of type Polygon");
            }
            return polygon;
        } catch (ParseException e) {
            throw new InvalidGeometryException("Malformed GeoJSON geometry", e);
        }
    }

    public JsonNode toGeoJson(Polygon polygon) {
        GeoJsonWriter writer = new GeoJsonWriter();
        String json = writer.write(polygon);
        return objectMapper.readTree(json);
    }
}