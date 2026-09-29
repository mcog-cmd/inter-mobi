package com.intermobi.land.repository;

import com.intermobi.land.domain.Land;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LandRepository extends JpaRepository<Land, Long> { }