package com.doctrace.backend.service;

import com.doctrace.backend.entity.User;
import com.doctrace.backend.exception.ResourceNotFoundException;
import com.doctrace.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * User management operations.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository,
                       org.springframework.security.crypto.password.PasswordEncoder passwordEncoder,
                       AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public User updateProfile(String email, String fullName) {
        User user = findByEmail(email);
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName);
        }
        return userRepository.save(user);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = findByEmail(email);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password does not match.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditLogService.log(user, "PASSWORD_CHANGED", "User", user.getId().toString(), "User updated password");
    }

    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public User updateRole(Long userId, String roleName) {
        User user = findById(userId);
        user.setRole(com.doctrace.backend.entity.Role.valueOf(roleName));
        return userRepository.save(user);
    }
}
