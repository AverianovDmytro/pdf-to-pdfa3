package com.vcapelcin.pdf2zugferd.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class XmlValidationService {

    private final ResourceLoader resourceLoader;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationError {
        private int line;
        private int column;
        private String location;
        private String message;
        private String type; // ERROR, FATAL, WARNING
    }

    public XmlValidationService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public List<ValidationError> validateXmlDetailed(byte[] xmlBytes, String profile) {
        List<ValidationError> errors = new ArrayList<>();
        try {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            
            // Map profile to XSD if needed, currently we use the same XSD for all
            // but in the future we could have different ones
            String xsdPath = "classpath:xsd/zugferd22/factur-x.xsd";
            Resource resource = resourceLoader.getResource(xsdPath);
            
            try (InputStream xsdStream = resource.getInputStream()) {
                Schema schema = factory.newSchema(new StreamSource(xsdStream));
                Validator validator = schema.newValidator();
                
                validator.setErrorHandler(new ErrorHandler() {
                    @Override
                    public void warning(SAXParseException exception) {
                        errors.add(mapToError(exception, "WARNING"));
                    }

                    @Override
                    public void error(SAXParseException exception) {
                        errors.add(mapToError(exception, "ERROR"));
                    }

                    @Override
                    public void fatalError(SAXParseException exception) {
                        errors.add(mapToError(exception, "FATAL"));
                    }
                });
                
                validator.validate(new StreamSource(new ByteArrayInputStream(xmlBytes)));
            }
        } catch (SAXException | IOException e) {
            log.error("XML Validation service error: {}", e.getMessage());
            if (errors.isEmpty()) {
                errors.add(ValidationError.builder()
                        .message(e.getMessage())
                        .type("ERROR")
                        .build());
            }
        }
        return errors;
    }

    public List<ValidationError> validateXmlDetailed(byte[] xmlBytes) {
        return validateXmlDetailed(xmlBytes, "BASIC");
    }

    private ValidationError mapToError(SAXParseException e, String type) {
        return ValidationError.builder()
                .line(e.getLineNumber())
                .column(e.getColumnNumber())
                .message(e.getMessage())
                .type(type)
                .build();
    }

    public List<String> validateXml(byte[] xmlBytes, String profile) {
        List<ValidationError> detailedErrors = validateXmlDetailed(xmlBytes, profile);
        List<String> errors = new ArrayList<>();
        for (ValidationError err : detailedErrors) {
            errors.add(String.format("[%s] Line: %d, Col: %d: %s", 
                    err.getType(), err.getLine(), err.getColumn(), err.getMessage()));
        }
        return errors;
    }

    public List<String> validateXml(byte[] xmlBytes) {
        return validateXml(xmlBytes, "BASIC");
    }
}
