"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { 
	Search, 
	Plus, 
	Edit, 
	Trash2, 
	Copy,
	MessageSquare,
	Mail,
	Smartphone,
	Tag
} from "lucide-react";

interface TemplateListProps {
	orgId: any;
	type: "sms" | "email";
	onAddTemplate: () => void;
	onEditTemplate: (templateId: string) => void;
	onDeleteTemplate: (templateId: string) => void;
}

export function TemplateList({ orgId, type, onAddTemplate, onEditTemplate, onDeleteTemplate }: TemplateListProps) {
	const [searchTerm, setSearchTerm] = useState("");

	const templates = useQuery(api.messageTemplates.getByType, { orgId, type }) || [];

	const filteredTemplates = templates.filter(template => {
		return !searchTerm || 
			template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			template.content.toLowerCase().includes(searchTerm.toLowerCase());
	});

	const getTypeIcon = () => {
		return type === "sms" ? <Smartphone className="h-4 w-4" /> : <Mail className="h-4 w-4" />;
	};

	const getTypeColor = () => {
		return type === "sms" 
			? "bg-blue-100 text-blue-800" 
			: "bg-purple-100 text-purple-800";
	};

	const getTypeLabel = () => {
		return type === "sms" ? "SMS" : "Email";
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
				<div className="flex items-center space-x-3">
					<div className={`p-2 rounded-lg ${getTypeColor()}`}>
						{getTypeIcon()}
					</div>
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							{getTypeLabel()} Templates
						</h2>
						<p className="text-sm text-gray-500">
							Manage your {type.toLowerCase()} message templates
						</p>
					</div>
				</div>
				
				<Button onClick={onAddTemplate} className="flex items-center space-x-2">
					<Plus className="h-4 w-4" />
					<span>Create {getTypeLabel()} Template</span>
				</Button>
			</div>

			{/* Search */}
			<div className="max-w-md">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<input
						type="text"
						placeholder={`Search ${type.toLowerCase()} templates...`}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
			</div>

			{/* Template Count */}
			<div className="text-sm text-gray-600">
				{filteredTemplates.length} of {templates.length} templates
			</div>

			{/* Template List */}
			<div className="bg-white rounded-lg shadow overflow-hidden">
				{filteredTemplates.length === 0 ? (
					<div className="p-8 text-center">
						<div className="text-gray-400 mb-4">
							{templates.length === 0 ? (
								<>
									<MessageSquare className="h-12 w-12 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No {type.toLowerCase()} templates
									</h3>
									<p className="text-gray-500 mb-4">
										Create your first {type.toLowerCase()} template to streamline your messaging.
									</p>
									<Button onClick={onAddTemplate}>
										Create {getTypeLabel()} Template
									</Button>
								</>
							) : (
								<>
									<Search className="h-12 w-12 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No templates found
									</h3>
									<p className="text-gray-500">
										Try adjusting your search criteria.
									</p>
								</>
							)}
						</div>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Template
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Content Preview
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Merge Tags
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredTemplates.map((template) => (
									<tr key={template._id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div>
												<div className="text-sm font-medium text-gray-900">
													{template.name}
												</div>
												{template.subject && (
													<div className="text-sm text-gray-500">
														Subject: {template.subject}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-900 max-w-xs truncate">
												{template.content}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="flex flex-wrap gap-1">
												{template.mergeTags && template.mergeTags.slice(0, 3).map((tag, index) => (
													<span
														key={index}
														className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
													>
														<Tag className="h-3 w-3 mr-1" />
														{tag}
													</span>
												))}
												{template.mergeTags && template.mergeTags.length > 3 && (
													<span className="text-xs text-gray-500">
														+{template.mergeTags.length - 3} more
													</span>
												)}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<div className="flex justify-end space-x-2">
												<button
													onClick={() => onEditTemplate(template._id)}
													className="text-blue-600 hover:text-blue-900"
													title="Edit template"
												>
													<Edit className="h-4 w-4" />
												</button>
												<button
													onClick={() => onEditTemplate(template._id)}
													className="text-gray-600 hover:text-gray-900"
													title="Duplicate template"
												>
													<Copy className="h-4 w-4" />
												</button>
												<button
													onClick={() => onDeleteTemplate(template._id)}
													className="text-red-600 hover:text-red-900"
													title="Delete template"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
} 