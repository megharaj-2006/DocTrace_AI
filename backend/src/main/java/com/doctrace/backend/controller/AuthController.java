package com.doctrace.backend.controller;

import com.doctrace.backend.dto.request.LoginRequest;
import com.doctrace.backend.dto.request.RegisterRequest;
import com.doctrace.backend.dto.response.AuthResponse;
import com.doctrace.backend.dto.response.UserResponse;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.service.AuthService;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "Registration, login, and current user")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final EntityMapper entityMapper;

    public AuthController(AuthService authService, UserService userService,
                          EntityMapper entityMapper) {
        this.authService = authService;
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "Register a new user account")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Authenticate and receive a JWT token")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get the currently authenticated user")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        var user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(entityMapper.toUserResponse(user));
    }
}
