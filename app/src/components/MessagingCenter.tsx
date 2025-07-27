"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
	MessageSquare, 
	Send, 
	Phone, 
	Mail, 
	Users, 
	Plus,
	Search,
	Filter
} from "lucide-react";

interface MessagingCenterProps {
	orgId: string;
}

export function MessagingCenter({ orgId }: MessagingCenterProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedChannel, setSelectedChannel] = useState("sms");

	// Mock data
	const messages = [
		{ _id: "1", content: "Welcome message", channel: "sms", status: "sent", recipient: "Sarah Johnson", sentAt: Date.now() - 3600000 },
		{ _id: "2", content: "Follow-up reminder", channel: "email", status: "sent", recipient: "Michael Chen", sentAt: Date.now() - 7200000 },
	];

	const filteredMessages = messages.filter(message => 
		message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
		message.recipient.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold gradient-text">Messaging</h2>
					<p className="text-muted-foreground">
						Send SMS and email messages to your clients
					</p>
				</div>
				<Button className="bg-gradient-to-r from-pink-500 to-purple-600">
					<Plus className="w-4 h-4 mr-2" />
					Send Message
				</Button>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								placeholder="Search messages..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-muted-foreground" />
							<select
								value={selectedChannel}
								onChange={(e) => setSelectedChannel(e.target.value)}
								className="border border-gray-300 rounded-md px-3 py-2 text-sm"
							>
								<option value="all">All Channels</option>
								<option value="sms">SMS</option>
								<option value="email">Email</option>
							</select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Messages List */}
			<div className="space-y-4">
				{filteredMessages.map((message) => (
					<Card key={message._id} className="hover:shadow-md transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className={`w-10 h-10 rounded-full flex items-center justify-center ${
										message.channel === 'sms' ? 'bg-green-500' : 'bg-blue-500'
									}`}>
										{message.channel === 'sms' ? (
											<Phone className="h-5 w-5 text-white" />
										) : (
											<Mail className="h-5 w-5 text-white" />
										)}
									</div>
									<div>
										<CardTitle className="text-lg">{message.recipient}</CardTitle>
										<CardDescription>
											{message.channel.toUpperCase()} • {new Date(message.sentAt).toLocaleString()}
										</CardDescription>
									</div>
								</div>
								<Badge className={message.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
									{message.status}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-gray-700">{message.content}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Empty State */}
			{filteredMessages.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">No messages found</h3>
						<p className="text-gray-600 mb-4">
							{searchTerm 
								? "Try adjusting your search"
								: "Get started by sending your first message"
							}
						</p>
						<Button className="bg-gradient-to-r from-pink-500 to-purple-600">
							<Send className="w-4 h-4 mr-2" />
							Send Message
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
} 