package com.example.inter_mobi;

import org.springframework.boot.SpringApplication;

public class TestInterMobiApplication {

	public static void main(String[] args) {
		SpringApplication.from(InterMobiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
