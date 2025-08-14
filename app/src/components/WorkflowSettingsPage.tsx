"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Copy, Info } from "lucide-react";

interface WorkflowVariable {
  key: string;
  value: string;
  description?: string;
}

interface WorkflowVariables {
  business_name?: string;
  business_phone?: string;
  business_email?: string;
  business_address?: string;
  booking_link?: string;
  google_review_link?: string;
  website_url?: string;
  instagram_link?: string;
  facebook_link?: string;
  custom_variables?: WorkflowVariable[];
}

export function WorkflowSettingsPage({ orgId }: { orgId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState<WorkflowVariables>({});
  const [newVariable, setNewVariable] = useState<WorkflowVariable>({
    key: "",
    value: "",
    description: "",
  });

  // Mock data for now - replace with actual Convex query
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // Mock loading delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Mock default data
        setVariables({
          business_name: "Honey Rae Aesthetics",
          business_phone: "(555) 123-4567",
          business_email: "info@honeyraeaesthetics.com",
          business_address: "123 Beauty St, Clinic City, ST 12345",
          booking_link: "https://book.honeyraeaesthetics.com",
          google_review_link: "https://g.page/r/YourBusinessReviewLink",
          website_url: "https://honeyraeaesthetics.com",
          instagram_link: "https://instagram.com/honeyraeaesthetics",
          facebook_link: "https://facebook.com/honeyraeaesthetics",
          custom_variables: [
            {
              key: "cancellation_policy",
              value: "24 hours advance notice required",
              description: "Your cancellation policy text",
            },
            {
              key: "emergency_contact",
              value: "(555) 999-HELP",
              description: "Emergency contact number",
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [orgId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock save delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Here you would call the Convex mutation
      console.log("Saving workflow variables:", variables);
      
      toast({
        title: "Settings Saved",
        description: "Workflow variables have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVariableChange = (key: keyof WorkflowVariables, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addCustomVariable = () => {
    if (!newVariable.key || !newVariable.value) {
      toast({
        title: "Error",
        description: "Please enter both key and value for the custom variable.",
        variant: "destructive",
      });
      return;
    }

    const customVariables = variables.custom_variables || [];
    
    // Check if key already exists
    if (customVariables.some(v => v.key === newVariable.key)) {
      toast({
        title: "Error",
        description: "A variable with this key already exists.",
        variant: "destructive",
      });
      return;
    }

    setVariables((prev) => ({
      ...prev,
      custom_variables: [...customVariables, { ...newVariable }],
    }));

    setNewVariable({ key: "", value: "", description: "" });
    
    toast({
      title: "Variable Added",
      description: `Custom variable {{${newVariable.key}}} has been added.`,
    });
  };

  const removeCustomVariable = (keyToRemove: string) => {
    const customVariables = variables.custom_variables || [];
    setVariables((prev) => ({
      ...prev,
      custom_variables: customVariables.filter(v => v.key !== keyToRemove),
    }));
    
    toast({
      title: "Variable Removed",
      description: `Custom variable {{${keyToRemove}}} has been removed.`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${text} copied to clipboard.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Variables</h1>
          <p className="text-gray-600">Configure variables used in your workflow messages</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="custom">Custom Variables</TabsTrigger>
          <TabsTrigger value="reference">Variable Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Basic business details used in your workflow messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={variables.business_name || ""}
                    onChange={(e) => handleVariableChange("business_name", e.target.value)}
                    placeholder="Your Business Name"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in: {{business_name}}</p>
                </div>
                <div>
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    value={variables.business_phone || ""}
                    onChange={(e) => handleVariableChange("business_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in: {{business_phone}}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="business_email">Business Email</Label>
                <Input
                  id="business_email"
                  type="email"
                  value={variables.business_email || ""}
                  onChange={(e) => handleVariableChange("business_email", e.target.value)}
                  placeholder="info@yourbusiness.com"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: {{business_email}}</p>
              </div>
              
              <div>
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  value={variables.business_address || ""}
                  onChange={(e) => handleVariableChange("business_address", e.target.value)}
                  placeholder="123 Main St, City, State 12345"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Used in: {{business_address}}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Important Links</CardTitle>
              <CardDescription>
                URLs and links used in your workflow messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="booking_link">Online Booking Link</Label>
                  <Input
                    id="booking_link"
                    value={variables.booking_link || ""}
                    onChange={(e) => handleVariableChange("booking_link", e.target.value)}
                    placeholder="https://book.yourbusiness.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in: {{booking_link}}</p>
                </div>
                <div>
                  <Label htmlFor="google_review_link">Google Review Link</Label>
                  <Input
                    id="google_review_link"
                    value={variables.google_review_link || ""}
                    onChange={(e) => handleVariableChange("google_review_link", e.target.value)}
                    placeholder="https://g.page/r/YourBusinessReviewLink"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in: {{google_review_link}}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={variables.website_url || ""}
                    onChange={(e) => handleVariableChange("website_url", e.target.value)}
                    placeholder="https://yourbusiness.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in: {{website_url}}</p>
                </div>
                <div>
                  <Label htmlFor="instagram_link">Instagram Link</Label>
                  <Input
                    id="instagram_link"
                    value={variables.instagram_link || ""}
                    onChange={(e) => handleVariableChange("instagram_link", e.target.value)}
                    placeholder="https://instagram.com/yourbusiness"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used in: {{instagram_link}}</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="facebook_link">Facebook Link</Label>
                <Input
                  id="facebook_link"
                  value={variables.facebook_link || ""}
                  onChange={(e) => handleVariableChange("facebook_link", e.target.value)}
                  placeholder="https://facebook.com/yourbusiness"
                />
                <p className="text-xs text-gray-500 mt-1">Used in: {{facebook_link}}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Variables</CardTitle>
              <CardDescription>
                Create your own custom variables for use in workflow messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add new variable form */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Add New Variable</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="new_var_key">Variable Key</Label>
                    <Input
                      id="new_var_key"
                      value={newVariable.key}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="my_variable"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_var_value">Value</Label>
                    <Input
                      id="new_var_value"
                      value={newVariable.value}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Variable value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_var_desc">Description (optional)</Label>
                    <Input
                      id="new_var_desc"
                      value={newVariable.description}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What this variable is for"
                    />
                  </div>
                </div>
                <Button onClick={addCustomVariable} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variable
                </Button>
              </div>

              {/* Existing custom variables */}
              <div className="space-y-3">
                {variables.custom_variables?.map((variable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="font-mono">
                          {"{{" + variable.key + "}}"}
                        </Badge>
                        <span className="font-medium">{variable.value}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      {variable.description && (
                        <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomVariable(variable.key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {(!variables.custom_variables || variables.custom_variables.length === 0) && (
                  <div className="text-center py-6 text-gray-500">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No custom variables created yet.</p>
                    <p className="text-sm">Add your first custom variable above.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reference" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Variables</CardTitle>
                <CardDescription>Variables related to client information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { key: "{{first_name}}", desc: "Client's first name" },
                    { key: "{{last_name}}", desc: "Client's last name" },
                    { key: "{{client_name}}", desc: "Client's full name" },
                    { key: "{{email}}", desc: "Client's email address" },
                    { key: "{{phone}}", desc: "Client's phone number" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.key}
                        </Badge>
                        <span className="ml-2 text-gray-600">{item.desc}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.key)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment Variables</CardTitle>
                <CardDescription>Variables related to appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { key: "{{appointment_date}}", desc: "Appointment date" },
                    { key: "{{appointment_time}}", desc: "Appointment time" },
                    { key: "{{appointment_type}}", desc: "Type of appointment" },
                    { key: "{{provider}}", desc: "Provider/staff member" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.key}
                        </Badge>
                        <span className="ml-2 text-gray-600">{item.desc}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.key)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Variables</CardTitle>
                <CardDescription>Variables from your business settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { key: "{{business_name}}", desc: "Your business name" },
                    { key: "{{business_phone}}", desc: "Your business phone" },
                    { key: "{{google_review_link}}", desc: "Google review link" },
                    { key: "{{booking_link}}", desc: "Online booking link" },
                    { key: "{{website_url}}", desc: "Your website URL" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.key}
                        </Badge>
                        <span className="ml-2 text-gray-600">{item.desc}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.key)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Variables</CardTitle>
                <CardDescription>Your custom variables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {variables.custom_variables?.map((variable) => (
                    <div key={variable.key} className="flex items-center justify-between text-sm">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {"{{" + variable.key + "}}"}
                        </Badge>
                        <span className="ml-2 text-gray-600">{variable.description}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`{{${variable.key}}}`)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">No custom variables created yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}