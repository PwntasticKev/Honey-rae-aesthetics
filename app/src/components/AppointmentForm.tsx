"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, User, Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";
// Temporarily disabled Convex
// import { useMutation } from "convex/react";
// import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  orgId: string;
  clients: Array<{
    _id: string;
    fullName: string;
    email?: string;
    phones: string[];
  }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AppointmentForm({
  orgId,
  clients,
  onSuccess,
  onCancel,
}: AppointmentFormProps) {
  const { toast } = useToast();
  // Temporarily disabled Convex mutation
  const createAppointment = async () => {
    return { success: true };
  };

  const [formData, setFormData] = useState({
    clientId: "",
    service: "",
    startDate: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    notes: "",
    location: "",
    provider: "",
  });

  const clientOptions = clients.map((client) => ({
    value: client._id,
    label: client.fullName,
    email: client.email,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.service || !formData.provider) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const startDateTime = new Date(formData.startDate);
      const [startHour, startMinute] = formData.startTime
        .split(":")
        .map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(formData.startDate);
      const [endHour, endMinute] = formData.endTime.split(":").map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const result = await createAppointment({
        orgId: orgId as any,
        clientId: formData.clientId as any,
        service: formData.service,
        startTime: startDateTime.getTime(),
        endTime: endDateTime.getTime(),
        notes: formData.notes,
        location: formData.location,
        provider: formData.provider,
      });

      if (result.success) {
        toast({
          title: "Appointment Created",
          description:
            "The appointment has been created and added to your calendar.",
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to create appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c._id === formData.clientId);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Create New Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Combobox
              options={clientOptions}
              value={formData.clientId}
              onValueChange={(value) =>
                setFormData({ ...formData, clientId: value })
              }
              placeholder="Select a client"
              searchPlaceholder="Search clients..."
              emptyText="No clients found"
              onAddNew={() => {
                // TODO: Implement add new client functionality
                console.log("Add new client clicked");
              }}
            />
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Input
              id="service"
              value={formData.service}
              onChange={(e) =>
                setFormData({ ...formData, service: e.target.value })
              }
              placeholder="e.g., Botox, Filler, Consultation"
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              placeholder="e.g., Dr. Smith, Nurse Johnson"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate
                      ? format(formData.startDate, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, startDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Office address or room number"
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>

          {/* Client Info Display */}
          {selectedClient && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedClient.fullName}</span>
                </div>
                {selectedClient.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {selectedClient.email}
                  </div>
                )}
                {selectedClient.phones[0] && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {selectedClient.phones[0]}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
