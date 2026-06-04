package com.vcapelcin.pdf2zugferd.repository;

import com.vcapelcin.pdf2zugferd.model.Conversion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ConversionRepository extends JpaRepository<Conversion, UUID> {
}
