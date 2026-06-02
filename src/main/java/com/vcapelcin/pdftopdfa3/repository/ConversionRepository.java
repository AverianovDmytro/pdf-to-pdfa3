package com.vcapelcin.pdftopdfa3.repository;

import com.vcapelcin.pdftopdfa3.model.Conversion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ConversionRepository extends JpaRepository<Conversion, UUID> {
}
