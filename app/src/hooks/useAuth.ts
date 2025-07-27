"use client";

import { useState, useEffect } from "react";

interface User {
	email: string;
	role: string;
}

export function useAuth() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check for existing auth token on mount
		const token = localStorage.getItem("authToken");
		const userEmail = localStorage.getItem("userEmail");
		const userRole = localStorage.getItem("userRole");

		if (token && userEmail && userRole) {
			setUser({
				email: userEmail,
				role: userRole,
			});
		}
		setIsLoading(false);
	}, []);

	const login = (email: string, password: string): Promise<boolean> => {
		return new Promise((resolve) => {
			// Master credentials
			const masterEmail = "admin@honeyrae.com";
			const masterPassword = "master123";

			if (email === masterEmail && password === masterPassword) {
				const user = { email, role: "admin" };
				localStorage.setItem("authToken", "master-token");
				localStorage.setItem("userEmail", email);
				localStorage.setItem("userRole", "admin");
				setUser(user);
				resolve(true);
			} else {
				resolve(false);
			}
		});
	};

	const logout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("userEmail");
		localStorage.removeItem("userRole");
		setUser(null);
		window.location.href = "/login";
	};

	const isAuthenticated = !!user;

	return {
		user,
		isLoading,
		isAuthenticated,
		login,
		logout,
	};
} 