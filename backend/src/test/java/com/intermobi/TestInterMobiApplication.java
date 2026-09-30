package com.intermobi;

import org.springframework.boot.SpringApplication;

public class TestInterMobiApplication {

	public static void main(String[] args) {
		SpringApplication.from(com.intermobi.InterMobiApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
