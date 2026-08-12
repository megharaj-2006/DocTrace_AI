package com.doctrace.backend.repository;

import com.doctrace.backend.entity.Role;
import com.doctrace.backend.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindUserByEmail() {
        // given
        User user = new User("test@example.com", "hashedpass", "Test User", Role.USER);
        userRepository.saveAndFlush(user);

        // when
        Optional<User> found = userRepository.findByEmail(user.getEmail());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo(user.getFullName());
    }

    @Test
    void shouldReturnTrueWhenEmailExists() {
        // given
        User user = new User("exists@example.com", "hash", "Name", Role.INVESTIGATOR);
        userRepository.saveAndFlush(user);

        // when
        boolean exists = userRepository.existsByEmail("exists@example.com");

        // then
        assertThat(exists).isTrue();
    }

    @Test
    void shouldReturnFalseWhenEmailDoesNotExist() {
        // when
        boolean exists = userRepository.existsByEmail("nonexistent@example.com");

        // then
        assertThat(exists).isFalse();
    }
}
