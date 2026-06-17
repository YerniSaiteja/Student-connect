package com.example.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UpdateProfileRequest;
import com.example.demo.service.UserService;





@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    
    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }

    @GetMapping("/profile/{userId}")
    public LoginResponse getProfile(@PathVariable String userId) {
        return userService.getProfile(userId);
    }

    @PutMapping("/update-profile/{userId}")
    public String updateProfile(
            @PathVariable String userId,
            @RequestBody UpdateProfileRequest request) {

        return userService.updateProfile(userId, request);
    }

    @GetMapping("/courses")
    public List<String> getCourses() {
        return userService.getCourses();
    }

    @PutMapping("/change-password")
    public String changePassword(@RequestBody ChangePasswordRequest request) {
        return userService.changePassword(request);
    }
}