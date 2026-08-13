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

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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

    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public User updateRole(Long userId, String roleName) {
        User user = findById(userId);
        user.setRole(com.doctrace.backend.entity.Role.valueOf(roleName));
        return userRepository.save(user);
    }
}
