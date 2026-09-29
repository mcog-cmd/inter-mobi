package com.inter_mobi.land.service;

import com.inter_mobi.land.domain.Land;
import com.inter_mobi.land.repository.LandRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LandService {

    private final LandRepository landRepository;

    public LandService(LandRepository landRepository) {
        this.landRepository = landRepository;
    }

    public List<Land> listarTodos() {
        return landRepository.findAll();
    }

    public Optional<Land> buscarPorId(Long id) {
        return landRepository.findById(id);
    }

    public Land salvar(Land land) {
        return landRepository.save(land);
    }

    public void deletar(Long id) {
        landRepository.deleteById(id);
    }
}
