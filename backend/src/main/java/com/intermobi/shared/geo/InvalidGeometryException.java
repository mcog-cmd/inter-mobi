package com.intermobi.shared.geo;

public class InvalidGeometryException extends RuntimeException {

    public InvalidGeometryException(String message) {
        super(message);
    }

    public InvalidGeometryException(String message, Throwable cause) {
        super(message, cause);
    }
}