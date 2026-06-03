package com.vcapelcin.pdftopdfa3.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
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

    public XmlValidationService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public List<String> validateXml(byte[] xmlBytes) {
        List<String> errors = new ArrayList<>();
        try {
            SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
            Resource resource = resourceLoader.getResource("classpath:xsd/zugferd22/factur-x.xsd");
            
            try (InputStream xsdStream = resource.getInputStream()) {
                Schema schema = factory.newSchema(new StreamSource(xsdStream));
                Validator validator = schema.newValidator();
                
                validator.validate(new StreamSource(new ByteArrayInputStream(xmlBytes)));
            }
        } catch (SAXParseException e) {
            String errorMsg = String.format("Line: %d, Column: %d: %s", 
                    e.getLineNumber(), e.getColumnNumber(), e.getMessage());
            log.error("XML Validation error: {}", errorMsg);
            errors.add(errorMsg);
        } catch (SAXException e) {
            log.error("XML Validation error: {}", e.getMessage());
            errors.add(e.getMessage());
        } catch (IOException e) {
            log.error("Failed to load XSD or read XML: {}", e.getMessage());
            errors.add("Internal error during XML validation: " + e.getMessage());
        }
        return errors;
    }
}
