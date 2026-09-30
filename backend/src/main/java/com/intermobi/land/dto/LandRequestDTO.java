package com.intermobi.land.dto;

import tools.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record LandRequestDTO(
        @NotNull @Positive BigDecimal price,
        @NotBlank String description,
        @NotBlank String contact,
        @NotNull JsonNode geometry
) {}