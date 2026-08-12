package com.doctrace.backend.controller;

import com.doctrace.backend.dto.response.UserResponse;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.mapper.EntityMapper;
import com.doctrace.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Users", description = "User profile operations")
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final EntityMapper entityMapper;

    public UserController(UserService userService, EntityMapper entityMapper) {
        this.userService = userService;
        this.entityMapper = entityMapper;
    }

    @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        return ResponseEntity.ok(entityMapper.toUserResponse(user));
    }

    @Operation(summary = "Update current user profile")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> updates) {
        User user = userService.updateProfile(
                userDetails.getUsername(),
                updates.get("fullName"));
        return ResponseEntity.ok(entityMapper.toUserResponse(user));
    }

    @Operation(summary = "Get a user by ID")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        return ResponseEntity.ok(entityMapper.toUserResponse(user));
    }
}
