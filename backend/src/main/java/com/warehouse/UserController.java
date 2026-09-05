package com.warehouse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ADMIN ONLY: User Management
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getStatus(), u.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(users);
    }

    // ADMIN ONLY: Toggle / Update User Status
    @PatchMapping("/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equalsIgnoreCase("ACTIVE") && !newStatus.equalsIgnoreCase("INACTIVE"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status must be ACTIVE or INACTIVE"));
        }

        return userRepository.findById(id).map(user -> {
            user.setStatus(newStatus.toUpperCase());
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "message", "User status updated successfully",
                    "userId", user.getId(),
                    "status", user.getStatus()
            ));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found")));
    }

    // ADMIN & MANAGER: Module Endpoint
    @GetMapping("/reports/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> getReportsSummary() {
        return ResponseEntity.ok(Map.of(
                "module", "REPORTS",
                "accessLevel", "MANAGEMENT",
                "status", "ACTIVE"
        ));
    }

    // ADMIN, MANAGER & STAFF: Operational Module Endpoint
    @GetMapping("/inventory/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<?> getInventorySummary() {
        return ResponseEntity.ok(Map.of(
                "module", "INVENTORY",
                "accessLevel", "OPERATIONAL",
                "status", "ACTIVE"
        ));
    }

    // Colocated DTO record
    public record UserResponse(Long id, String name, String email, String role, String status, LocalDateTime createdAt) {}
}
