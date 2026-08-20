package com.doctrace.backend.config;

import com.doctrace.backend.entity.Role;
import com.doctrace.backend.entity.User;
import com.doctrace.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Seed or promote admin@doctrace.ai
        userRepository.findByEmail("admin@doctrace.ai").ifPresentOrElse(
                admin -> {
                    admin.setRole(Role.ADMIN);
                    admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
                    userRepository.save(admin);
                    log.info("Ensured admin@doctrace.ai has ROLE_ADMIN and active credentials");
                },
                () -> {
                    User admin = new User(
                            "admin@doctrace.ai",
                            passwordEncoder.encode("Admin@123"),
                            "System Administrator",
                            Role.ADMIN
                    );
                    userRepository.save(admin);
                    log.info("Bootstrapped initial System Administrator account: admin@doctrace.ai");
                }
        );

        // 2. Seed or promote investigator@doctrace.ai
        userRepository.findByEmail("investigator@doctrace.ai").ifPresentOrElse(
                investigator -> {
                    investigator.setRole(Role.INVESTIGATOR);
                    investigator.setPasswordHash(passwordEncoder.encode("Investigator@123"));
                    userRepository.save(investigator);
                    log.info("Ensured investigator@doctrace.ai has ROLE_INVESTIGATOR and active credentials");
                },
                () -> {
                    User investigator = new User(
                            "investigator@doctrace.ai",
                            passwordEncoder.encode("Investigator@123"),
                            "Lead Investigator",
                            Role.INVESTIGATOR
                    );
                    userRepository.save(investigator);
                    log.info("Bootstrapped initial Lead Investigator account: investigator@doctrace.ai");
                }
        );

        // 3. Promote demo.investigator@doctrace.ai if exists
        userRepository.findByEmail("demo.investigator@doctrace.ai").ifPresent(
                demo -> {
                    if (demo.getRole() != Role.INVESTIGATOR && demo.getRole() != Role.ADMIN) {
                        demo.setRole(Role.INVESTIGATOR);
                        userRepository.save(demo);
                        log.info("Promoted demo.investigator@doctrace.ai to ROLE_INVESTIGATOR");
                    }
                }
        );
    }
}
