"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Smartphone, Tag, FileText } from "lucide-react";

const templateSchema = z.object({
	name: z.string().min(1, "Template name is required"),
	type: z.enum(["sms", "email"]),
	subject: z.string().optional(),
	content: z.string().min(1, "Content is required"),
	mergeTags: z.array(z.string()),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface MessageTemplateFormProps {
	onSubmit: (data: TemplateFormData) => void;
	onCancel: () => void;
	initialData?: Partial<TemplateFormData>;
}

export function MessageTemplateForm({ onSubmit, onCancel, initialData }: MessageTemplateFormProps) {
	const [selectedType, setSelectedType] = useState(initialData?.type || "sms");
	const [mergeTags, setMergeTags] = useState<string[]>(initialData?.mergeTags || []);
	const [newTag, setNewTag] = useState("");

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
		setValue,
	} = useForm<TemplateFormData>({
		resolver: zodResolver(templateSchema),
		defaultValues: {
			name: initialData?.name || "",
			type: initialData?.type || "sms",
			subject: initialData?.subject || "",
			content: initialData?.content || "",
			mergeTags: initialData?.mergeTags || [],
		},
	});

	const content = watch("content");

	const availableTags = [
		"{{first_name}}",
		"{{last_name}}",
		"{{full_name}}",
		"{{email}}",
		"{{phone}}",
		"{{appointment_date}}",
		"{{appointment_time}}",
		"{{appointment_type}}",
		"{{provider}}",
		"{{clinic_name}}",
	];

	const addTag = (tag: string) => {
		if (!mergeTags.includes(tag)) {
			const newTags = [...mergeTags, tag];
			setMergeTags(newTags);
			setValue("mergeTags", newTags);
		}
	};

	const removeTag = (tagToRemove: string) => {
		const newTags = mergeTags.filter(tag => tag !== tagToRemove);
		setMergeTags(newTags);
		setValue("mergeTags", newTags);
	};

	const addCustomTag = () => {
		if (newTag.trim() && !mergeTags.includes(newTag.trim())) {
			const tag = newTag.trim().startsWith("{{") && newTag.trim().endsWith("}}") 
				? newTag.trim() 
				: `{{${newTag.trim()}}}`;
			addTag(tag);
			setNewTag("");
		}
	};

	const handleFormSubmit = (data: TemplateFormData) => {
		onSubmit({
			...data,
			mergeTags,
		});
	};

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Basic Information */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Template Information</h3>
					
					<div>
						<label className="block text-sm font-medium text-gray-700">
							Template Name *
						</label>
						<input
							type="text"
							{...register("name")}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="e.g., Appointment Reminder"
						/>
						{errors.name && (
							<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Message Type *
						</label>
						<div className="mt-1 flex space-x-4">
							<label className="flex items-center">
								<input
									type="radio"
									value="sms"
									checked={selectedType === "sms"}
									onChange={(e) => {
										setSelectedType(e.target.value as "sms" | "email");
										setValue("type", e.target.value as "sms" | "email");
									}}
									className="mr-2"
								/>
								<Smartphone className="h-4 w-4 mr-1 text-gray-400" />
								SMS
							</label>
							<label className="flex items-center">
								<input
									type="radio"
									value="email"
									checked={selectedType === "email"}
									onChange={(e) => {
										setSelectedType(e.target.value as "sms" | "email");
										setValue("type", e.target.value as "sms" | "email");
									}}
									className="mr-2"
								/>
								<Mail className="h-4 w-4 mr-1 text-gray-400" />
								Email
							</label>
						</div>
					</div>

					{selectedType === "email" && (
						<div>
							<label className="block text-sm font-medium text-gray-700">
								Subject Line
							</label>
							<input
								type="text"
								{...register("subject")}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								placeholder="e.g., Your appointment reminder"
							/>
						</div>
					)}
				</div>

				{/* Merge Tags */}
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Merge Tags</h3>
					<p className="text-sm text-gray-600">
						Add dynamic content that will be replaced with actual client data.
					</p>
					
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Available Tags
						</label>
						<div className="grid grid-cols-2 gap-2">
							{availableTags.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => addTag(tag)}
									className="text-left px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									{tag}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700">
							Custom Tag
						</label>
						<div className="mt-1 flex space-x-2">
							<input
								type="text"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
								className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
								placeholder="Enter custom tag name"
							/>
							<Button type="button" onClick={addCustomTag} variant="outline">
								Add
							</Button>
						</div>
					</div>

					{mergeTags.length > 0 && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Selected Tags
							</label>
							<div className="flex flex-wrap gap-2">
								{mergeTags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
									>
										<Tag className="h-3 w-3 mr-1" />
										{tag}
										<button
											type="button"
											onClick={() => removeTag(tag)}
											className="ml-1 text-blue-600 hover:text-blue-800"
										>
											×
										</button>
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-gray-900">Message Content</h3>
				<div>
					<label className="block text-sm font-medium text-gray-700">
						Content *
					</label>
					<div className="mt-1 relative">
						<FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
						<textarea
							{...register("content")}
							rows={6}
							className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder={selectedType === "sms" 
								? "Hi {{first_name}}, this is a reminder for your appointment tomorrow at {{appointment_time}}..."
								: "Dear {{first_name}},\n\nWe hope you're enjoying the results of your recent treatment..."
							}
						/>
					</div>
					{errors.content && (
						<p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
					)}
					{selectedType === "sms" && (
						<p className="mt-1 text-sm text-gray-500">
							Character count: {content.length} (SMS limit: 160 characters)
						</p>
					)}
				</div>
			</div>

			{/* Preview */}
			{content && (
				<div className="space-y-4">
					<h3 className="text-lg font-medium text-gray-900">Preview</h3>
					<div className="bg-gray-50 rounded-lg p-4">
						{selectedType === "email" && (
							<div className="mb-2">
								<strong>Subject:</strong> {watch("subject") || "No subject"}
							</div>
						)}
						<div className="whitespace-pre-wrap text-sm">
							{content}
						</div>
					</div>
				</div>
			)}

			{/* Form Actions */}
			<div className="flex justify-end space-x-3 pt-6 border-t">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit">
					{initialData ? "Update Template" : "Create Template"}
				</Button>
			</div>
		</form>
	);
} 