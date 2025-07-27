"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { 
	Plus, 
	Tag,
	Smartphone,
	Mail
} from "lucide-react";

const templateSchema = z.object({
	name: z.string().min(1, "Name is required"),
	content: z.string().min(1, "Content is required"),
	subject: z.string().optional(),
	type: z.enum(["sms", "email"]),
	mergeTags: z.array(z.string()),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateFormProps {
	onSubmit: (data: TemplateFormData) => void;
	onCancel: () => void;
	initialData?: any;
	type: "sms" | "email";
}

const availableMergeTags = [
	"{{first_name}}",
	"{{last_name}}",
	"{{full_name}}",
	"{{email}}",
	"{{phone}}",
	"{{appointment_date}}",
	"{{appointment_time}}",
	"{{provider_name}}",
	"{{clinic_name}}",
	"{{treatment_type}}",
];

export function TemplateForm({ onSubmit, onCancel, initialData, type }: TemplateFormProps) {
	const [mergeTags, setMergeTags] = useState<string[]>(initialData?.mergeTags || []);
	const [showMergeTagDropdown, setShowMergeTagDropdown] = useState(false);

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
			content: initialData?.content || "",
			subject: initialData?.subject || "",
			type: type,
			mergeTags: initialData?.mergeTags || [],
		},
	});

	const addMergeTag = (tag: string) => {
		if (!mergeTags.includes(tag)) {
			const newTags = [...mergeTags, tag];
			setMergeTags(newTags);
			setValue("mergeTags", newTags);
		}
		setShowMergeTagDropdown(false);
	};

	const removeMergeTag = (tagToRemove: string) => {
		const newTags = mergeTags.filter(tag => tag !== tagToRemove);
		setMergeTags(newTags);
		setValue("mergeTags", newTags);
	};

	const insertMergeTag = (tag: string) => {
		const content = watch("content");
		const cursorPosition = (document.querySelector('textarea[name="content"]') as HTMLTextAreaElement)?.selectionStart || content.length;
		const newContent = content.slice(0, cursorPosition) + tag + content.slice(cursorPosition);
		setValue("content", newContent);
	};

	const getTypeIcon = () => {
		return type === "sms" ? <Smartphone className="h-4 w-4" /> : <Mail className="h-4 w-4" />;
	};

	const getTypeLabel = () => {
		return type === "sms" ? "SMS" : "Email";
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Template Information */}
			<div className="space-y-4">
				<div className="flex items-center space-x-3">
					<div className={`p-2 rounded-lg ${type === "sms" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
						{getTypeIcon()}
					</div>
					<h3 className="text-lg font-medium text-gray-900">
						{getTypeLabel()} Template Information
					</h3>
				</div>
				
				<div>
					<label className="block text-sm font-medium text-gray-700">Template Name</label>
					<input
						{...register("name")}
						type="text"
						className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder={`Enter ${type.toLowerCase()} template name`}
					/>
					{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
				</div>

				{type === "email" && (
					<div>
						<label className="block text-sm font-medium text-gray-700">Subject Line</label>
						<input
							{...register("subject")}
							type="text"
							className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Enter email subject"
						/>
					</div>
				)}

				<div>
					<label className="block text-sm font-medium text-gray-700">Content</label>
					<div className="mt-1 relative">
						<textarea
							{...register("content")}
							rows={type === "sms" ? 4 : 8}
							className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder={`Enter your ${type.toLowerCase()} message content...`}
						/>
						<div className="absolute top-2 right-2">
							<div className="relative">
								<button
									type="button"
									onClick={() => setShowMergeTagDropdown(!showMergeTagDropdown)}
									className="p-1 text-gray-400 hover:text-gray-600"
									title="Insert merge tag"
								>
									<Tag className="h-4 w-4" />
								</button>
								
								{showMergeTagDropdown && (
									<div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
										<div className="p-2">
											<p className="text-xs text-gray-500 mb-2">Available merge tags:</p>
											<div className="space-y-1">
												{availableMergeTags.map((tag) => (
													<button
														key={tag}
														type="button"
														onClick={() => insertMergeTag(tag)}
														className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
													>
														{tag}
													</button>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
					{errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
					
					{type === "sms" && (
						<p className="mt-1 text-xs text-gray-500">
							Character count: {watch("content")?.length || 0}/160
						</p>
					)}
				</div>
			</div>

			{/* Merge Tags */}
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-medium text-gray-900">Merge Tags</h3>
					<Button
						type="button"
						onClick={() => setShowMergeTagDropdown(!showMergeTagDropdown)}
						className="flex items-center space-x-2"
					>
						<Plus className="h-4 w-4" />
						<span>Add Tag</span>
					</Button>
				</div>

				{mergeTags.length === 0 ? (
					<div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
						<Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
						<p className="text-sm text-gray-500">No merge tags added</p>
						<p className="text-xs text-gray-400">Add merge tags to personalize your messages</p>
					</div>
				) : (
					<div className="flex flex-wrap gap-2">
						{mergeTags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
							>
								<Tag className="h-3 w-3 mr-1" />
								{tag}
								<button
									type="button"
									onClick={() => removeMergeTag(tag)}
									className="ml-2 text-blue-600 hover:text-blue-800"
								>
									×
								</button>
							</span>
						))}
					</div>
				)}

				{showMergeTagDropdown && (
					<div className="bg-gray-50 border border-gray-200 rounded-md p-4">
						<p className="text-sm font-medium text-gray-700 mb-3">Available merge tags:</p>
						<div className="grid grid-cols-2 gap-2">
							{availableMergeTags.map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => addMergeTag(tag)}
									disabled={mergeTags.includes(tag)}
									className={`text-left px-3 py-2 text-sm rounded border ${
										mergeTags.includes(tag)
											? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
											: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
									}`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Preview */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-gray-900">Preview</h3>
				<div className="bg-gray-50 border border-gray-200 rounded-md p-4">
					{type === "email" && watch("subject") && (
						<div className="mb-3">
							<p className="text-sm font-medium text-gray-700">Subject:</p>
							<p className="text-sm text-gray-900">{watch("subject")}</p>
						</div>
					)}
					<div>
						<p className="text-sm font-medium text-gray-700">Content:</p>
						<div className="mt-1 p-3 bg-white border border-gray-200 rounded text-sm text-gray-900 whitespace-pre-wrap">
							{watch("content") || "No content yet"}
						</div>
					</div>
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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