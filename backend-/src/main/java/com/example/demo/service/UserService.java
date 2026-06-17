package com.example.demo.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "Email already exists";
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setCourse(request.getCourse());

        User savedUser = userRepository.save(user);

        String userId = "CC" + (1000 + savedUser.getId());
        savedUser.setUserId(userId);

        userRepository.save(savedUser);

        return "Registered successfully. Your User ID is: " + userId;
    }

    public LoginResponse login(LoginRequest request) {

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            return null;
        }

        User user = userOptional.get();

        if (!user.getPassword().equals(request.getPassword())) {
            return null;
        }

        LoginResponse response = new LoginResponse();
        response.setMessage("Login Successful");
        response.setUserId(user.getUserId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setCourse(user.getCourse());

        return response;
    }

    public LoginResponse getProfile(String userId) {

        Optional<User> userOptional = userRepository.findByUserId(userId);

        if (userOptional.isEmpty()) {
            return null;
        }

        User user = userOptional.get();

        LoginResponse response = new LoginResponse();
        response.setMessage("Profile Details");
        response.setUserId(user.getUserId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setCourse(user.getCourse());

        return response;
    }

    public String updateProfile(String userId, UpdateProfileRequest request) {

        Optional<User> userOptional = userRepository.findByUserId(userId);

        if (userOptional.isEmpty()) {
            return "User not found";
        }

        User user = userOptional.get();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setCourse(request.getCourse());

        userRepository.save(user);

        return "Profile updated successfully";
    }

    public List<String> getCourses() {
        return Arrays.asList(
                "Java Full Stack",
                "Python Development",
                "Data Science",
                "Machine Learning",
                "Cloud Computing"
        );
    }

    public String changePassword(ChangePasswordRequest request) {

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            return "User not found";
        }

        User user = userOptional.get();

        if (!user.getPassword().equals(request.getOldPassword())) {
            return "Old password is incorrect";
        }

        user.setPassword(request.getNewPassword());
        userRepository.save(user);

        return "Password changed successfully";
    }
}