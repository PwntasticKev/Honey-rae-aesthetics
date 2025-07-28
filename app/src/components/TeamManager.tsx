"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
	Users, 
	UserPlus, 
	Search, 
	Filter,
	Edit,
	Trash2,
	Shield,
	Mail,
	Phone
} from "lucide-react";

interface TeamManagerProps {
	orgId: string;
}

export function TeamManager({ orgId }: TeamManagerProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [showAddForm, setShowAddForm] = useState(false);

	const handleAddTeamMember = () => {
		// In a real app, this would open a form or modal
		console.log("Adding team member for org:", orgId);
		alert("Add Team Member functionality would open a form here");
	};

	// Mock data
	const teamMembers = [
		{
			_id: "1",
			fullName: "Dr. Sarah Rae",
			email: "sarah@honeyrae.com",
			role: "admin",
			status: "active",
			phone: "+15551234567",
			avatar: "/avatar.jpg",
			joinedAt: Date.now() - 86400000 * 365,
			lastActive: Date.now() - 3600000
		},
		{
			_id: "2",
			fullName: "Emily Johnson",
			email: "emily@honeyrae.com",
			role: "manager",
			status: "active",
			phone: "+15559876543",
			avatar: "",
			joinedAt: Date.now() - 86400000 * 180,
			lastActive: Date.now() - 7200000
		},
		{
			_id: "3",
			fullName: "Michael Chen",
			email: "michael@honeyrae.com",
			role: "staff",
			status: "active",
			phone: "+15555555555",
			avatar: "",
			joinedAt: Date.now() - 86400000 * 90,
			lastActive: Date.now() - 86400000
		}
	];

	const filteredMembers = teamMembers.filter(member => {
		const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			member.email.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesRole = roleFilter === "all" || member.role === roleFilter;
		
		return matchesSearch && matchesRole;
	});

	const getRoleColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800";
			case "manager":
				return "bg-blue-100 text-blue-800";
			case "staff":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getRoleLabel = (role: string) => {
		switch (role) {
			case "admin":
				return "Admin";
			case "manager":
				return "Manager";
			case "staff":
				return "Staff";
			default:
				return role;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "inactive":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold gradient-text">Team</h2>
					<p className="text-muted-foreground">
						Manage your team members and their roles
					</p>
				</div>
				<Button onClick={handleAddTeamMember} className="bg-gradient-to-r from-pink-500 to-purple-600">
					<UserPlus className="w-4 h-4 mr-2" />
					Add Team Member
				</Button>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search team members..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<select
								value={roleFilter}
								onChange={(e) => setRoleFilter(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-2 text-sm"
							>
								<option value="all">All Roles</option>
								<option value="admin">Admin</option>
								<option value="manager">Manager</option>
								<option value="staff">Staff</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Team Members List */}
			<div className="space-y-4">
				{filteredMembers.map((member) => (
					<Card key={member._id} className="hover:shadow-md transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<Avatar className="w-12 h-12">
										<AvatarImage src={member.avatar} />
										<AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
											{member.fullName.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<CardTitle className="text-lg">{member.fullName}</CardTitle>
										<CardDescription>
											{member.email} • {member.phone}
										</CardDescription>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Badge className={getRoleColor(member.role)}>
										<Shield className="h-3 w-3 mr-1" />
										{getRoleLabel(member.role)}
									</Badge>
									<Badge className={getStatusColor(member.status)}>
										{member.status}
									</Badge>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="font-medium text-gray-900">Joined</p>
									<p className="text-gray-600">{new Date(member.joinedAt).toLocaleDateString()}</p>
								</div>
								<div>
									<p className="font-medium text-gray-900">Last Active</p>
									<p className="text-gray-600">{new Date(member.lastActive).toLocaleDateString()}</p>
								</div>
							</div>
							
							<div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
								<Button variant="outline" size="sm">
									<Mail className="h-4 w-4 mr-1" />
									Message
								</Button>
								<Button variant="outline" size="sm">
									<Edit className="h-4 w-4 mr-1" />
									Edit
								</Button>
								<Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
									<Trash2 className="h-4 w-4 mr-1" />
									Remove
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Empty State */}
			{filteredMembers.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
						<p className="text-gray-600 mb-4">
							{searchTerm || roleFilter !== "all" 
								? "Try adjusting your search or filters"
								: "Get started by adding your first team member"
							}
						</p>
						<Button className="bg-gradient-to-r from-pink-500 to-purple-600">
							<UserPlus className="w-4 h-4 mr-2" />
							Add Team Member
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
} 