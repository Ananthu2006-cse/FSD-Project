package com.warehouse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.email() == null || request.password() == null ||
                request.email().isBlank() || request.password().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid email or password."));
        }

        var userOpt = userRepository.findByEmail(request.email().trim().toLowerCase());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid email or password."));
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid email or password."));
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid email or password."));
        }

        String token = jwtService.generateToken(user);
        UserDto userDto = new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(new LoginResponse(token, userDto));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Unauthorized"));
        }

        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(new UserDto(user.getId(), user.getName(), user.getEmail(), user.getRole())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request == null || request.name() == null || request.name().isBlank() ||
                request.email() == null || request.email().isBlank() ||
                request.password() == null || request.password().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Name, email, and password are required."));
        }

        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new MessageResponse("An account with this email already exists."));
        }

        String role = "STAFF";
        if (request.role() != null && !request.role().isBlank()) {
            String requestedRole = request.role().trim().toUpperCase();
            if ("ADMIN".equals(requestedRole) || "MANAGER".equals(requestedRole) || "STAFF".equals(requestedRole)) {
                role = requestedRole;
            }
        }

        User newUser = new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                role,
                "ACTIVE"
        );

        User savedUser = userRepository.save(newUser);
        String token = jwtService.generateToken(savedUser);
        UserDto userDto = new UserDto(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponse(token, userDto));
    }

    // Colocated DTO records to prevent unnecessary file proliferation
    public record LoginRequest(String email, String password) {}
    public record RegisterRequest(String name, String email, String password, String role) {}
    public record UserDto(Long id, String name, String email, String role) {}
    public record LoginResponse(String token, UserDto user) {}
    public record MessageResponse(String message) {}
}
