package com.inter_mobi.land.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Polygon;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "land")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Land {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String contact;

    @Column(nullable = false, columnDefinition = "geometry(Polygon,4326)")
    private Polygon geometry;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Land(BigDecimal price, String description, String contact, Polygon geometry) {
        this.price = price;
        this.description = description;
        this.contact = contact;
        this.geometry = geometry;
    }
}