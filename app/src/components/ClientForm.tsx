"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface ClientFormProps {
	onSubmit: (data: any) => void;
	onCancel: () => void;
	initialData?: any;
}

export function ClientForm({ onSubmit, onCancel, initialData }: ClientFormProps) {
	const [formData, setFormData] = useState({
		fullName: initialData?.fullName || "",
		email: initialData?.email || "",
		gender: initialData?.gender || "female",
		dateOfBirth: initialData?.dateOfBirth || "",
		phones: initialData?.phones || [""],
		tags: initialData?.tags || [],
		referralSource: initialData?.referralSource || "",
		clientPortalStatus: initialData?.clientPortalStatus || "active",
		address: initialData?.address || {
			street: "",
			city: "",
			state: "",
			zip: "",
		},
	});

	const [newTag, setNewTag] = useState("");
	const [newPhone, setNewPhone] = useState("");

	const handleInputChange = (field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
	};

	const handleAddressChange = (field: string, value: string) => {
		setFormData(prev => ({
			...prev,
			address: {
				...prev.address,
				[field]: value,
			},
		}));
	};

	const addPhone = () => {
		if (newPhone.trim()) {
			setFormData(prev => ({
				...prev,
				phones: [...prev.phones, newPhone.trim()],
			}));
			setNewPhone("");
		}
	};

	const removePhone = (index: number) => {
		setFormData(prev => ({
			...prev,
			phones: prev.phones.filter((_: string, i: number) => i !== index),
		}));
	};

	const addTag = () => {
		if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
			setFormData(prev => ({
				...prev,
				tags: [...prev.tags, newTag.trim()],
			}));
			setNewTag("");
		}
	};

	const removeTag = (tag: string) => {
		setFormData(prev => ({
			...prev,
			tags: prev.tags.filter((t: string) => t !== tag),
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		// Validate required fields
		if (!formData.fullName.trim()) {
			alert("Full name is required");
			return;
		}
		
		if (formData.phones.length === 0 || !formData.phones[0].trim()) {
			alert("At least one phone number is required");
			return;
		}
		
		// Filter out empty phones
		const cleanData = {
			...formData,
			phones: formData.phones.filter((phone: string) => phone.trim() !== ""),
		};
		
		onSubmit(cleanData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Information */}
			<Card>
				<CardHeader>
					<CardTitle>Basic Information</CardTitle>
					<CardDescription>Enter the client's basic details</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="fullName">Full Name *</Label>
							<Input
								id="fullName"
								value={formData.fullName}
								onChange={(e) => handleInputChange("fullName", e.target.value)}
								placeholder="Enter full name"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => handleInputChange("email", e.target.value)}
								placeholder="Enter email address"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="gender">Gender *</Label>
							<Select
								value={formData.gender}
								onValueChange={(value) => handleInputChange("gender", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select gender" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="female">Female</SelectItem>
									<SelectItem value="male">Male</SelectItem>
									<SelectItem value="other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="dateOfBirth">Date of Birth</Label>
							<Input
								id="dateOfBirth"
								type="date"
								value={formData.dateOfBirth}
								onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Contact Information */}
			<Card>
				<CardHeader>
					<CardTitle>Contact Information</CardTitle>
					<CardDescription>Phone numbers and address</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Phone Numbers</Label>
						{formData.phones.map((phone: string, index: number) => (
							<div key={index} className="flex gap-2">
								<Input
									value={phone}
									onChange={(e) => {
										const newPhones = [...formData.phones];
										newPhones[index] = e.target.value;
										handleInputChange("phones", newPhones);
									}}
									placeholder="Enter phone number"
								/>
								{formData.phones.length > 1 && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => removePhone(index)}
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						))}
						<div className="flex gap-2">
							<Input
								value={newPhone}
								onChange={(e) => setNewPhone(e.target.value)}
								placeholder="Add another phone number"
							/>
							<Button type="button" variant="outline" onClick={addPhone}>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Address</Label>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Input
								value={formData.address.street}
								onChange={(e) => handleAddressChange("street", e.target.value)}
								placeholder="Street address"
							/>
							<Input
								value={formData.address.city}
								onChange={(e) => handleAddressChange("city", e.target.value)}
								placeholder="City"
							/>
							<Input
								value={formData.address.state}
								onChange={(e) => handleAddressChange("state", e.target.value)}
								placeholder="State"
							/>
							<Input
								value={formData.address.zip}
								onChange={(e) => handleAddressChange("zip", e.target.value)}
								placeholder="ZIP code"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Additional Information */}
			<Card>
				<CardHeader>
					<CardTitle>Additional Information</CardTitle>
					<CardDescription>Tags, referral source, and status</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Tags</Label>
						<div className="flex flex-wrap gap-2 mb-2">
							{formData.tags.map((tag: string) => (
								<Badge key={tag} variant="secondary" className="gap-1">
									{tag}
									<button
										type="button"
										onClick={() => removeTag(tag)}
										className="ml-1 hover:text-red-500"
									>
										<X className="h-3 w-3" />
									</button>
								</Badge>
							))}
						</div>
						<div className="flex gap-2">
							<Input
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								placeholder="Add a tag"
							/>
							<Button type="button" variant="outline" onClick={addTag}>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="referralSource">Referral Source</Label>
							<Input
								id="referralSource"
								value={formData.referralSource}
								onChange={(e) => handleInputChange("referralSource", e.target.value)}
								placeholder="How did they find you?"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="clientPortalStatus">Portal Status</Label>
							<Select
								value={formData.clientPortalStatus}
								onValueChange={(value) => handleInputChange("clientPortalStatus", value)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
									<SelectItem value="pending">Pending</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Form Actions */}
			<div className="flex justify-end space-x-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">
					{initialData ? "Update Client" : "Create Client"}
				</Button>
			</div>
		</form>
	);
} 