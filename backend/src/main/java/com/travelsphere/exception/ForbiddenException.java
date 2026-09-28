package com.travelsphere.exception;

/**
 * Thrown when an authenticated user attempts to access or modify a resource
 * that they do not have authorization or ownership rights to (HTTP 403 Forbidden).
 */
public class ForbiddenException extends RuntimeException {

    private final String errorCode;

    public ForbiddenException(String message) {
        super(message);
        this.errorCode = "ACCESS_DENIED";
    }

    public ForbiddenException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
