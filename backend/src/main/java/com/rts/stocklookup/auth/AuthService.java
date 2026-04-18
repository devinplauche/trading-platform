package com.rts.stocklookup.auth;

import com.rts.stocklookup.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();

        AppUser existingUser = userRepository.findByUsername(normalizedUsername).orElse(null);
        if (existingUser != null) {
            if (passwordEncoder.matches(request.password(), existingUser.getPasswordHash())) {
                return new AuthDtos.AuthResponse(jwtService.generateToken(existingUser.getUsername()));
            }

            throw new IllegalArgumentException("Username is already in use");
        }

        AppUser saved = userRepository.save(new AppUser(
                normalizedUsername,
                passwordEncoder.encode(request.password())
        ));

        return new AuthDtos.AuthResponse(jwtService.generateToken(saved.getUsername()));
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedUsername, request.password())
        );

        return new AuthDtos.AuthResponse(jwtService.generateToken(normalizedUsername));
    }
}
