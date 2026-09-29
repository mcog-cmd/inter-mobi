package com.intermobi.land.repository;

import com.intermobi.land.domain.Land;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.locationtech.jts.geom.Polygon;

@Repository
public interface LandRepository extends JpaRepository<Land, Long> {

    /*
    conte quantos terrenos já cadastrados possuem interseção entre a geometria
    deles e a geometria que estou tentando inserir. Se a quantidade for maior
    que 0, retorne true; caso contrário, false.
     */
    @Query("""
        SELECT COUNT(lands) > 0
        FROM Land lands
        WHERE function('ST_Intersects', lands.geometry, :geometry) = true
    """)
    boolean existsByGeometryIntersects(Polygon geometry);

    @Query("""
        SELECT land
        FROM Land land
        WHERE function('ST_Intersects', land.geometry, :geometry) = true
    """)
    <List>Land searchByGeometryIntersects(Polygon geometry);
}