package com.intermobi.land.controller;

import tools.jackson.databind.JsonNode;
import com.intermobi.land.domain.Land;
import com.intermobi.land.dto.LandRequestDTO;
import com.intermobi.land.dto.LandResponseDTO;
import com.intermobi.land.service.LandService;
import com.intermobi.shared.geo.GeoJsonConverter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Polygon;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lands")
@RequiredArgsConstructor
public class LandController {

    private final LandService landService;
    private final GeoJsonConverter geoJsonConverter;

    @PostMapping
    public ResponseEntity<?> registerLand(@Valid @RequestBody LandRequestDTO request) {

        Polygon polygon = geoJsonConverter.toPolygon(request.geometry());

        Land savedLand = landService.registerLand(
                new Land(
                        request.price(),
                        request.description(),
                        request.contact(),
                        polygon
                )
        );

        LandResponseDTO response = new LandResponseDTO(
                savedLand.getId(),
                savedLand.getPrice(),
                savedLand.getDescription(),
                savedLand.getContact(),
                geoJsonConverter.toGeoJson(savedLand.getGeometry())
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchLands(@RequestBody JsonNode geometry) {

        Polygon polygon = geoJsonConverter.toPolygon(geometry);

        List<Land> searchedLands = landService.searchLands(polygon);

        List<LandResponseDTO> response = searchedLands.stream()
                .map(land -> new LandResponseDTO(
                        land.getId(),
                        land.getPrice(),
                        land.getDescription(),
                        land.getContact(),
                        geoJsonConverter.toGeoJson(land.getGeometry())
                ))
                .toList();

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLand(@PathVariable Long id) {

        Land land = landService.getLandById(id);

        LandResponseDTO response = new LandResponseDTO(
                land.getId(),
                land.getPrice(),
                land.getDescription(),
                land.getContact(),
                geoJsonConverter.toGeoJson(land.getGeometry())
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(response);
    }
}