package com.intermobi.land.controller;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.intermobi.land.domain.Land;
import com.intermobi.land.dto.LandRequestDTO;
import com.intermobi.land.service.LandService;
import com.intermobi.shared.geo.GeoJsonConverter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LandControllerTest {

    @Mock
    private LandService landService;

    @Mock
    private GeoJsonConverter geoJsonConverter;

    @InjectMocks
    private LandController landController;

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

    private JsonNode createGeoJson() {
        ObjectMapper objectMapper = new ObjectMapper();

        return objectMapper.createObjectNode()
                .put("type", "Polygon");
    }

    private Land createLand() {
        return new Land(
                new BigDecimal("100000.00"),
                "Test land",
                "83999999999",
                createPolygon()
        );
    }

    @Test
    void shouldRegisterLand() {
        LandRequestDTO request = new LandRequestDTO(
                new BigDecimal("100000.00"),
                "Test land",
                "83999999999",
                createGeoJson()
        );

        Polygon polygon = createPolygon();
        Land savedLand = createLand();

        JsonNode responseGeometry = createGeoJson();

        when(geoJsonConverter.toPolygon(request.geometry()))
                .thenReturn(polygon);

        when(landService.registerLand(any(Land.class)))
                .thenReturn(savedLand);

        when(geoJsonConverter.toGeoJson(savedLand.getGeometry()))
                .thenReturn(responseGeometry);

        ResponseEntity<?> response = landController.registerLand(request);

        assertEquals(201, response.getStatusCode().value());
        assertNotNull(response.getBody());

        verify(geoJsonConverter)
                .toPolygon(request.geometry());

        verify(landService)
                .registerLand(any(Land.class));

        verify(geoJsonConverter)
                .toGeoJson(savedLand.getGeometry());
    }

    @Test
    void shouldSearchLands() {
        JsonNode requestGeometry = createGeoJson();

        Polygon polygon = createPolygon();
        Land land = createLand();

        JsonNode responseGeometry = createGeoJson();

        when(geoJsonConverter.toPolygon(requestGeometry))
                .thenReturn(polygon);

        when(landService.searchLands(polygon))
                .thenReturn(List.of(land));

        when(geoJsonConverter.toGeoJson(land.getGeometry()))
                .thenReturn(responseGeometry);

        ResponseEntity<?> response = landController.searchLands(requestGeometry);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());

        verify(geoJsonConverter)
                .toPolygon(requestGeometry);

        verify(landService)
                .searchLands(polygon);

        verify(geoJsonConverter)
                .toGeoJson(land.getGeometry());
    }

    @Test
    void shouldReturnLandById() {
        Long id = 1L;
        Land land = createLand();

        JsonNode responseGeometry = createGeoJson();

        when(landService.getLandById(id))
                .thenReturn(land);

        when(geoJsonConverter.toGeoJson(land.getGeometry()))
                .thenReturn(responseGeometry);

        ResponseEntity<?> response = landController.getLand(id);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());

        verify(landService)
                .getLandById(id);

        verify(geoJsonConverter)
                .toGeoJson(land.getGeometry());
    }
}