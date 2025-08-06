"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Folder,
  Play,
  Pause,
  BarChart3,
  Users,
  MessageSquare,
  Mail,
  GitBranch,
  Calendar,
  Tag,
  FileText,
  Clock,
  Settings,
  Zap,
  Target,
  Shield,
  Database,
} from "lucide-react";

export function WorkflowSystemSummary() {
  const implementedFeatures = [
    {
      category: "🗂️ Directory Management",
      icon: Folder,
      features: [
        "Multi-level nested directories",
        "Drag-and-drop workflow organization",
        "Directory-based workflow filtering",
        "Visual folder hierarchy",
        "Circular reference prevention",
      ],
    },
    {
      category: "⚙️ Enhanced Workflows",
      icon: Settings,
      features: [
        "Advanced status filtering (active/inactive/draft/archived)",
        "Play/pause controls with catchup logic",
        "Duplicate prevention (30-day configurable)",
        "Enhanced conditional operators (14 types)",
        "Node comments for team collaboration",
      ],
    },
    {
      category: "🎯 Appointment Triggers",
      icon: Target,
      features: [
        "Auto-detect appointment completion (5-10 min delay)",
        "Smart appointment type mapping (case-insensitive)",
        "Multiple workflow triggers per appointment",
        "Duplicate enrollment prevention",
        "Calendar integration monitoring",
      ],
    },
    {
      category: "📊 Execution Tracking",
      icon: BarChart3,
      features: [
        "Detailed step-by-step execution logs",
        "Success/failure rate tracking",
        "Execution time monitoring",
        "Client enrollment history",
        "Real-time status updates",
      ],
    },
    {
      category: "👥 Enrollment Management",
      icon: Users,
      features: [
        "Active/paused/completed status tracking",
        "Enrollment reason logging",
        "Client-specific workflow progress",
        "Pause/resume with time calculation",
        "Enrollment statistics dashboard",
      ],
    },
    {
      category: "📧 Template Integration",
      icon: MessageSquare,
      features: [
        "Inline template creation",
        "SMS/Email template selection",
        "Merge tag support (12 common tags)",
        "Template preview with sample data",
        "Quick-insert merge tag buttons",
      ],
    },
    {
      category: "🔧 Advanced Node Types",
      icon: Zap,
      features: [
        "Enhanced conditional logic (AND/OR)",
        "Multiple condition support",
        "Date/time comparisons",
        "Tag-based conditions",
        "Custom field conditions",
      ],
    },
    {
      category: "🛡️ Database Schema",
      icon: Database,
      features: [
        "Workflow directories table",
        "Enrollment tracking table",
        "Execution logs table",
        "Appointment triggers table",
        "Enhanced workflow fields",
      ],
    },
  ];

  const appointmentMappings = [
    {
      pattern: "Morpheus8",
      trigger: "morpheus8",
      color: "bg-purple-100 text-purple-800",
    },
    {
      pattern: "Botox/Toxins",
      trigger: "toxins",
      color: "bg-green-100 text-green-800",
    },
    {
      pattern: "Filler",
      trigger: "filler",
      color: "bg-blue-100 text-blue-800",
    },
    {
      pattern: "Consultation",
      trigger: "consultation",
      color: "bg-orange-100 text-orange-800",
    },
  ];

  const conditionalOperators = [
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "greater_than_or_equal",
    "less_than_or_equal",
    "is_empty",
    "is_not_empty",
    "date_before",
    "date_after",
    "days_ago",
    "has_tag",
    "not_has_tag",
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚀 Enhanced Workflow System
        </h1>
        <p className="text-lg text-gray-600">
          Complete implementation with directories, automation, and advanced
          tracking
        </p>
        <div className="flex justify-center mt-4">
          <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
            <CheckCircle className="h-5 w-5 mr-2" />
            All Features Implemented
          </Badge>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {implementedFeatures.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Icon className="h-5 w-5 mr-2 text-blue-600" />
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Appointment Trigger Mappings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Appointment Trigger Mappings
          </CardTitle>
          <CardDescription>
            Smart appointment type detection with case-insensitive partial
            matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {appointmentMappings.map((mapping, index) => (
              <div key={index} className="text-center">
                <Badge className={`${mapping.color} mb-2`}>
                  {mapping.pattern}
                </Badge>
                <div className="text-xs text-gray-500">→ {mapping.trigger}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conditional Operators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="h-5 w-5 mr-2 text-yellow-600" />
            Enhanced Conditional Operators
          </CardTitle>
          <CardDescription>
            14 advanced operators for complex workflow logic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {conditionalOperators.map((operator, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {operator.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-indigo-600" />
            Database Schema Enhancements
          </CardTitle>
          <CardDescription>
            New tables and enhanced fields for comprehensive workflow management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">New Tables</h4>
              <ul className="text-sm space-y-1">
                <li>• workflowDirectories</li>
                <li>• workflowEnrollments</li>
                <li>• executionLogs</li>
                <li>• appointmentTriggers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Enhanced Fields</h4>
              <ul className="text-sm space-y-1">
                <li>• Node comments</li>
                <li>• Status tracking</li>
                <li>• Execution statistics</li>
                <li>• Duplicate prevention</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Zap className="h-6 w-6 mr-2 text-blue-600" />
            Key Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">Robust Automation</h4>
              <p className="text-sm text-gray-600">
                Automatic appointment detection with duplicate prevention and
                error handling
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">Complete Visibility</h4>
              <p className="text-sm text-gray-600">
                Detailed execution logs, enrollment tracking, and performance
                metrics
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">Team Collaboration</h4>
              <p className="text-sm text-gray-600">
                Node comments, organized directories, and role-based permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
