package com.intermobi.land.dto;

import tools.jackson.databind.JsonNode;
import java.math.BigDecimal;

public record LandResponseDTO(
        Long id,
        BigDecimal price,
        String description,
        String contact,
        JsonNode geometry
) {}