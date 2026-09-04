package com.warehouse;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class InventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventoryApplication.class, args);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedUser(userRepository, passwordEncoder, "Admin", "admin@example.com", "password123", "ADMIN");
            seedUser(userRepository, passwordEncoder, "Manager", "manager@example.com", "password123", "MANAGER");
            seedUser(userRepository, passwordEncoder, "Staff", "staff@example.com", "password123", "STAFF");
        };
    }

    private void seedUser(UserRepository repo, PasswordEncoder encoder, String name, String email, String rawPassword, String role) {
        if (!repo.existsByEmail(email)) {
            User user = new User(
                    name,
                    email,
                    encoder.encode(rawPassword),
                    role,
                    "ACTIVE"
            );
            repo.save(user);
        }
    }
}
