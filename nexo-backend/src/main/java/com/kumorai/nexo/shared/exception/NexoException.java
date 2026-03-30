package com.kumorai.nexo.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class NexoException extends RuntimeException {

    private final HttpStatus status;

    public NexoException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static NexoException notFound(String message) {
        return new NexoException(HttpStatus.NOT_FOUND, message);
    }

    public static NexoException badRequest(String message) {
        return new NexoException(HttpStatus.BAD_REQUEST, message);
    }

    public static NexoException conflict(String message) {
        return new NexoException(HttpStatus.CONFLICT, message);
    }

    public static NexoException forbidden(String message) {
        return new NexoException(HttpStatus.FORBIDDEN, message);
    }
}
