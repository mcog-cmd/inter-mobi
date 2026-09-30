package com.intermobi.land.service;

import com.intermobi.land.domain.Land;
import com.intermobi.land.exception.LandException;
import com.intermobi.land.repository.LandRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Polygon;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LandServiceTest {

    @Mock
    private LandRepository landRepository;

    @InjectMocks
    private LandService landService;

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

    private Land createLand() {
        return new Land(
                new BigDecimal("100000.00"),
                "Test land",
                "83999999999",
                createPolygon()
        );
    }

    @Test
    void shouldRegisterLandWhenThereIsNoOverlap() {
        Land land = createLand();

        when(landRepository.existsByGeometryIntersects(land.getGeometry()))
                .thenReturn(false);

        when(landRepository.save(land))
                .thenReturn(land);

        Land result = landService.registerLand(land);

        assertSame(land, result);

        verify(landRepository)
                .existsByGeometryIntersects(land.getGeometry());

        verify(landRepository)
                .save(land);
    }

    @Test
    void shouldThrowExceptionWhenLandOverlapsExistingLand() {
        Land land = createLand();

        when(landRepository.existsByGeometryIntersects(land.getGeometry()))
                .thenReturn(true);

        LandException exception = assertThrows(
                LandException.class,
                () -> landService.registerLand(land)
        );

        assertEquals(
                "The land overlaps an area that is already registered.",
                exception.getMessage()
        );

        verify(landRepository)
                .existsByGeometryIntersects(land.getGeometry());

        verify(landRepository, never())
                .save(any(Land.class));
    }

    @Test
    void shouldReturnLandsWhenSearchingByGeometry() {
        Polygon polygon = createPolygon();

        Land land = createLand();

        List<Land> lands = List.of(land);

        when(landRepository.searchByGeometryIntersects(polygon))
                .thenReturn(lands);

        List<Land> result = landService.searchLands(polygon);

        assertEquals(lands, result);

        verify(landRepository)
                .searchByGeometryIntersects(polygon);
    }

    @Test
    void shouldReturnLandWhenIdExists() {
        Long id = 1L;
        Land land = createLand();

        when(landRepository.findById(id))
                .thenReturn(Optional.of(land));

        Land result = landService.getLandById(id);

        assertSame(land, result);

        verify(landRepository)
                .findById(id);
    }

    @Test
    void shouldThrowExceptionWhenLandIdDoesNotExist() {
        Long id = 1L;

        when(landRepository.findById(id))
                .thenReturn(Optional.empty());

        LandException exception = assertThrows(
                LandException.class,
                () -> landService.getLandById(id)
        );

        assertEquals("Land not found", exception.getMessage());

        verify(landRepository)
                .findById(id);
    }
}