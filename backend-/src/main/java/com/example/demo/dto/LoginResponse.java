package com.example.demo.dto;

public class LoginResponse {

    private String message;
    private String userId;
    private String name;
    private String email;
    private String course;

    public LoginResponse() {
    }

    public String getMessage() {
        return message;
    }

	public void setMessage(String message) {
        this.message = message;
    }

	public String getUserId() {
        return userId;
    }

	public void setUserId(String userId) {
        this.userId = userId;
    }

	public String getName() {
        return name;
    }

	public void setName(String name) {
        this.name = name;
    }

	public String getEmail() {
        return email;
    }

	public void setEmail(String email) {
        this.email = email;
    }

	public String getCourse() {
        return course;
    }

	public void setCourse(String course) {
        this.course = course;
    }
}