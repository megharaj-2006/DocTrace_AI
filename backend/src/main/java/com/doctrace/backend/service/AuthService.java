package com.doctrace.backend.service;

import com.doctrace.backend.dto.request.LoginRequest;
import com.doctrace.backend.dto.request.RegisterRequest;
import com.doctrace.backend.dto.response.AuthResponse;
import com.doctrace.backend.dto.response.UserResponse;
import com.doctrace.backend.entity.Role;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.exception.DuplicateResourceException;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.repository.UserRepository;
import com.doctrace.backend.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles user registration and login.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EntityMapper entityMapper;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       EntityMapper entityMapper,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.entityMapper = entityMapper;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("User", "email", request.email());
        }

        User user = new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.fullName(),
                Role.USER
        );
        user = userRepository.save(user);

        log.info("User registered: {}", user.getEmail());
        auditLogService.log(user, "USER_REGISTERED", "User",
                user.getId().toString(), "New user registered");

        String token = jwtTokenProvider.generateToken(
                user.getEmail(), "ROLE_" + user.getRole().name());
        UserResponse userResponse = entityMapper.toUserResponse(user);

        return new AuthResponse(token, userResponse);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(), request.password()));

        String token = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(); // guaranteed to exist after successful auth
        UserResponse userResponse = entityMapper.toUserResponse(user);

        log.info("User logged in: {}", user.getEmail());

        return new AuthResponse(token, userResponse);
    }
}
