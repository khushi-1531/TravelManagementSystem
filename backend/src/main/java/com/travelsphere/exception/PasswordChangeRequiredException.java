package com.travelsphere.exception;

public class PasswordChangeRequiredException extends RuntimeException {
    public PasswordChangeRequiredException(String message) {
        super(message);
    }
}
