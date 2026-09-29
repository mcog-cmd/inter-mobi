package com.intermobi.land.service;

import com.intermobi.land.domain.Land;
import com.intermobi.land.exception.LandException;
import com.intermobi.land.repository.LandRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LandService {

    private final LandRepository landRepository;

    public LandService(Land land, LandRepository landRepository) {
        this.landRepository = landRepository;
    }

    public Land registerLand(Land land){
        if (landRepository.existsByGeometryIntersects(land.getGeometry())){
            throw new LandException(
                "The land overlaps an area that is already registered."
            );
        } return landRepository.save(land);
    }

    public <List>Land searchLand(Land land){
        return landRepository.searchByGeometryIntersects(land.getGeometry());
    }

    public Optional<Land> findById(Long id) {
        return landRepository.findById(id);
    }

}
