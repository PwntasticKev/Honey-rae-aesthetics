"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

const clientSchema = z.object({
	fullName: z.string().min(1, "Full name is required"),
	gender: z.enum(["male", "female", "other"]),
	dateOfBirth: z.string().optional(),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
	phones: z.array(z.string().min(1, "Phone number is required")).min(1, "At least one phone number is required"),
	referralSource: z.string().optional(),
	address: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string(),
		zip: z.string(),
	}).optional(),
	tags: z.array(z.string()),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
	onSubmit: (data: ClientFormData) => void;
	onCancel: () => void;
	initialData?: Partial<ClientFormData>;
}

export function ClientForm({ onSubmit, onCancel, initialData }: ClientFormProps) {
	const [phones, setPhones] = useState<string[]>(initialData?.phones || [""]);
	const [tags, setTags] = useState<string[]>(initialData?.tags || []);
	const [newTag, setNewTag] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			fullName: initialData?.fullName || "",
			gender: initialData?.gender || "female",
			dateOfBirth: initialData?.dateOfBirth || "",
			email: initialData?.email || "",
			phones: initialData?.phones || [""],
			referralSource: initialData?.referralSource || "",
			address: initialData?.address || { street: "", city: "", state: "", zip: "" },
			tags: initialData?.tags || [],
		},
	});

	const addPhone = () => {
		setPhones([...phones, ""]);
	};

	const removePhone = (index: number) => {
		if (phones.length > 1) {
			setPhones(phones.filter((_, i) => i !== index));
		}
	};

	const updatePhone = (index: number, value: string) => {
		const newPhones = [...phones];
		newPhones[index] = value;
		setPhones(newPhones);
	};

	const addTag = () => {
		if (newTag.trim() && !tags.includes(newTag.trim())) {
			setTags([...tags, newTag.trim()]);
			setNewTag("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter(tag => tag !== tagToRemove));
	};

	const handleFormSubmit = (data: ClientFormData) => {
		onSubmit({
			...data,
			phones: phones.filter(phone => phone.trim() !== ""),
			tags,
		});
	};

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Basic Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
					
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Full Name *
						</label>
						<input
							type="text"
							{...register("fullName")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						{errors.fullName && (
							<p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Gender *
						</label>
						<select
							{...register("gender")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						>
							<option value="female">Female</option>
							<option value="male">Male</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Date of Birth
						</label>
						<input
							type="date"
							{...register("dateOfBirth")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							type="email"
							{...register("email")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
						)}
					</div>
				</div>

				{/* Contact Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
					
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Phone Numbers *
						</label>
						<div className="space-y-2">
							{phones.map((phone, index) => (
								<div key={index} className="flex space-x-2">
									<input
										type="tel"
										value={phone}
										onChange={(e) => updatePhone(index, e.target.value)}
										className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
										placeholder="(555) 123-4567"
									/>
									{phones.length > 1 && (
										<button
											type="button"
											onClick={() => removePhone(index)}
											className="p-2 text-red-600 hover:text-red-800"
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</div>
							))}
							<button
								type="button"
								onClick={addPhone}
								className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
							>
								<Plus className="h-4 w-4" />
								<span>Add Phone Number</span>
							</button>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Referral Source
						</label>
						<input
							type="text"
							{...register("referralSource")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="e.g., Social Media, Referral, Walk-in"
						/>
					</div>
				</div>
			</div>

			{/* Address */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-gray-900">Address (Optional)</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700">Street</label>
						<input
							type="text"
							{...register("address.street")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">City</label>
						<input
							type="text"
							{...register("address.city")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">State</label>
						<input
							type="text"
							{...register("address.state")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700">ZIP Code</label>
						<input
							type="text"
							{...register("address.zip")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>

			{/* Tags */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-gray-900">Tags</h3>
				<div className="space-y-2">
					<div className="flex space-x-2">
						<input
							type="text"
							value={newTag}
							onChange={(e) => setNewTag(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
							className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="Add a tag..."
						/>
						<Button type="button" onClick={addTag} variant="outline">
							Add
						</Button>
					</div>
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{tags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
								>
									{tag}
									<button
										type="button"
										onClick={() => removeTag(tag)}
										className="ml-1 text-blue-600 hover:text-blue-800"
									>
										<X className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex justify-end space-x-3 pt-6 border-t">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">
					Save Client
				</Button>
			</div>
		</form>
	);
} 