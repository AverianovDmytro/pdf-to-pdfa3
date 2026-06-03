package com.vcapelcin.pdftopdfa3.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "conversions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Conversion extends BaseEntityUUID {

    @Column(nullable = false)
    private String filename;

    @Column(name = "original_size")
    private Long originalSize;

    @Column(name = "converted_size")
    private Long convertedSize;

    @Column(length = 50)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "target_filename")
    private String targetFilename;

    @Column(name = "xml_filename")
    private String xmlFilename;

    @Column(name = "xml_size")
    private Long xmlSize;
}
