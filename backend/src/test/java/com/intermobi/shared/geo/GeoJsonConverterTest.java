package com.intermobi.shared.geo;

import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;

class GeoJsonConverterTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final GeoJsonConverter geoJsonConverter =
            new GeoJsonConverter(objectMapper);

    private Polygon createPolygon() {
        GeometryFactory geometryFactory = new GeometryFactory();

        return geometryFactory.createPolygon(new Coordinate[]{
                new Coordinate(0, 0),
                new Coordinate(0, 1),
                new Coordinate(1, 1),
                new Coordinate(1, 0),
                new Coordinate(0, 0)
        });
    }

    @Test
    void shouldConvertGeoJsonToPolygon() throws Exception {
        JsonNode geoJson = objectMapper.readTree("""
            {
                "type": "Polygon",
                "coordinates": [
                    [
                        [0, 0],
                        [0, 1],
                        [1, 1],
                        [1, 0],
                        [0, 0]
                    ]
                ]
            }
            """);

        Polygon polygon = geoJsonConverter.toPolygon(geoJson);

        assertNotNull(polygon);
        assertEquals("Polygon", polygon.getGeometryType());
        assertTrue(polygon.isValid());
    }

    @Test
    void shouldConvertPolygonToGeoJson() {
        Polygon polygon = createPolygon();

        JsonNode geoJson = geoJsonConverter.toGeoJson(polygon);

        assertNotNull(geoJson);
        assertEquals("Polygon", geoJson.get("type").asText());
        assertNotNull(geoJson.get("coordinates"));
    }

    @Test
    void shouldThrowExceptionWhenGeoJsonIsMalformed() throws Exception {
        JsonNode geoJson = objectMapper.readTree("""
            {
                "type": "Polygon",
                "coordinates": [
                    [
                        [0, 0],
                        [0, 1],
                        [1, 1]
                    ]
                ]
            }
            """);

        assertThrows(
                InvalidGeometryException.class,
                () -> geoJsonConverter.toPolygon(geoJson)
        );
    }

    @Test
    void shouldThrowExceptionWhenGeometryIsNotPolygon() throws Exception {
        JsonNode geoJson = objectMapper.readTree("""
            {
                "type": "Point",
                "coordinates": [0, 0]
            }
            """);

        InvalidGeometryException exception = assertThrows(
                InvalidGeometryException.class,
                () -> geoJsonConverter.toPolygon(geoJson)
        );

        assertEquals(
                "Geometry must be of type Polygon",
                exception.getMessage()
        );
    }
}