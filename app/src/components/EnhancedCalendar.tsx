"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Plus,
  Settings,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  PlusCircle,
  LogIn,
  LogOut,
  Loader2,
  AlertCircle,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
} from "date-fns";
import {
  simpleGoogleCalendarService,
  type GoogleCalendarEvent,
  type GoogleCalendar,
} from "@/lib/simpleGoogleCalendarService";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppointmentForm } from "./AppointmentForm";

interface EnhancedCalendarProps {
  orgId: string;
  clients: any[];
}

export function EnhancedCalendar({ orgId, clients }: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"day" | "week" | "month" | "all">("month");
  const [apiKeysConfigured, setApiKeysConfigured] = useState(true);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Convex mutations
  const saveProvider = useMutation(api.googleCalendarProviders.saveProvider);
  const disconnectProvider = useMutation(
    api.googleCalendarProviders.disconnect,
  );

  // Load selected calendar from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCalendar = localStorage.getItem("selected_calendar");
      if (savedCalendar) {
        try {
          const parsed = JSON.parse(savedCalendar);
          setCurrentDate(new Date(parsed.date));
          setView(parsed.view);
        } catch (error) {
          console.error("Failed to parse saved calendar:", error);
        }
      }
    }
  }, []);

  // Save calendar state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "selected_calendar",
        JSON.stringify({
          date: currentDate.toISOString(),
          view: view,
        }),
      );
    }
  }, [currentDate, view]);

  // Load selected calendars from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCalendars = localStorage.getItem("selected_calendars");
      if (savedCalendars) {
        try {
          const selectedCalendarIds = JSON.parse(savedCalendars);
          setCalendars((prev) =>
            prev.map((cal) => ({
              ...cal,
              isSelected: selectedCalendarIds.includes(cal.id),
            })),
          );
        } catch (error) {
          console.error("Failed to parse saved calendars:", error);
        }
      }
    }
  }, []);

  // Save selected calendars to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && calendars.length > 0) {
      const selectedCalendarIds = calendars
        .filter((cal) => cal.isSelected)
        .map((cal) => cal.id);
      localStorage.setItem(
        "selected_calendars",
        JSON.stringify(selectedCalendarIds),
      );
    }
  }, [calendars]);

  // Initialize Google Calendar service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await simpleGoogleCalendarService.initialize();

        // Check if API keys are configured
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
          setApiKeysConfigured(false);
          setIsInitializing(false);
          return;
        }

        const authenticated =
          await simpleGoogleCalendarService.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          await loadCalendars();
          await loadEvents();
        }
      } catch (error) {
        console.error("Failed to initialize Google Calendar service:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeService();
  }, []);

  // Load calendars when authenticated
  useEffect(() => {
    if (isAuthenticated && calendars.length === 0) {
      console.log("🔄 Auto-loading calendars after authentication...");
      loadCalendars();
    }
  }, [isAuthenticated]);

  // Load events when calendars, date, or view changes
  useEffect(() => {
    if (isAuthenticated && calendars.length > 0) {
      loadEvents();
    }
  }, [currentDate, calendars, view]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await simpleGoogleCalendarService.isAuthenticated();
      if (success) {
        setIsAuthenticated(true);
        console.log("✅ Authentication successful, loading calendars...");

        await loadCalendars();
        setTimeout(async () => {
          console.log("📋 Calendars loaded, now loading events...");
          await loadEvents();
        }, 100);

        if (calendars.length > 0) {
          const primaryCalendar = calendars[0];
          const accessToken = localStorage.getItem(
            "google_calendar_access_token",
          );

          if (accessToken) {
            try {
              await saveProvider({
                orgId: orgId as any,
                name: primaryCalendar.name,
                email: primaryCalendar.email || "",
                color: primaryCalendar.color,
                accessToken,
                googleCalendarId: primaryCalendar.id,
              });
              console.log("✅ Google Calendar provider saved to database");
            } catch (error) {
              console.error("Failed to save provider to database:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    simpleGoogleCalendarService.logout();
    setIsAuthenticated(false);
    setEvents([]);
    setCalendars([]);
    console.log("✅ Google Calendar logged out");
  };

  const loadCalendars = async () => {
    try {
      console.log("📋 Loading calendars...");
      const calendarList = await simpleGoogleCalendarService.getCalendars();
      console.log("📋 Calendars loaded:", calendarList.length);
      setCalendars(calendarList);
    } catch (error) {
      console.error("Failed to load calendars:", error);
    }
  };

  const loadEvents = async () => {
    try {
      setIsLoadingEvents(true);
      console.log("🔄 Loading events...");

      if (!isAuthenticated || calendars.length === 0) {
        console.log("❌ Not authenticated or no calendars");
        return;
      }

      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      const allEvents =
        await simpleGoogleCalendarService.getEventsFromMultipleCalendars(
          calendars,
          startDate,
          endDate,
        );

      console.log("📅 Loaded events:", allEvents.length);
      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    setCalendars((prev) =>
      prev.map((cal) =>
        cal.id === calendarId ? { ...cal, isSelected: !cal.isSelected } : cal,
      ),
    );
  };

  const getEventsForDay = (date: Date) => {
    const dayEvents = events.filter((event) => isSameDay(event.start, date));
    return dayEvents;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
    );
  };

  const navigateDay = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "next" ? addDays(prev, 1) : subDays(prev, 1),
    );
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setCurrentDate(day);
    setView("day");
  };

  const handleBackToMonth = () => {
    setView("month");
  };

  const handleAppointmentCreated = () => {
    setShowAppointmentForm(false);
    loadEvents();
  };

  const handleDisconnectCalendar = async (calendarId: string) => {
    try {
      // Remove from calendars list
      setCalendars((prev) => prev.filter((cal) => cal.id !== calendarId));

      // Remove events from this calendar
      setEvents((prev) =>
        prev.filter((event) => event.calendarId !== calendarId),
      );

      // Update localStorage
      const selectedCalendarIds = calendars
        .filter((cal) => cal.id !== calendarId && cal.isSelected)
        .map((cal) => cal.id);
      localStorage.setItem(
        "selected_calendars",
        JSON.stringify(selectedCalendarIds),
      );

      console.log(`Calendar ${calendarId} disconnected`);
    } catch (error) {
      console.error("Failed to disconnect calendar:", error);
    }
  };

  // Generate calendar days for current month
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Get upcoming events (next 7 days)
  const upcomingEvents = events
    .filter((event) => event.start > new Date())
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 5);

  // Show loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Initializing calendar...</p>
        </div>
      </div>
    );
  }

  // Show API keys not configured message
  if (!apiKeysConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Google Calendar Setup Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              To use Google Calendar integration, you need to configure Google
              API keys in your environment.
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="outline"
            >
              Reload After Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Connect Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-blue-800">
                  View all your appointments in one place
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <span className="text-sm text-green-800">
                  Real-time sync with Google Calendar
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-sm text-purple-800">
                  Manage multiple calendars
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              {isLoading ? "Connecting..." : "Connect Google Calendar"}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              We'll only access your calendar data to display appointments. You
              can disconnect at any time.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={view === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("day")}
                className="h-8"
              >
                Day
              </Button>
              <Button
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("week")}
                className="h-8"
              >
                Week
              </Button>
              <Button
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setView("month")}
                className="h-8"
              >
                Month
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentDate(new Date());
                if (view === "day") {
                  setTimeout(() => loadEvents(), 100);
                }
              }}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={loadEvents}
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <div className="flex items-center space-x-1">
              {view === "day" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigateDay("prev")}
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 px-2">
                    {format(currentDate, "MMM d, yyyy")}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => navigateDay("next")}
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigateMonth("prev")}
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-gray-700 px-2">
                    {format(currentDate, "MMMM yyyy")}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => navigateMonth("next")}
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Calendar */}
        <div className="flex-1 p-4 pl-2">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-lg border shadow-sm">
            {isLoadingEvents && (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading calendar events...</p>
              </div>
            )}

            {!isLoadingEvents && view === "month" && (
              <>
                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div key={day} className="bg-gray-50 p-3 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {day}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {monthDays.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth =
                      day.getMonth() === currentDate.getMonth();
                    const isCurrentDay = isToday(day);

                    return (
                      <div
                        key={index}
                        className={`min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isCurrentMonth ? "bg-white" : "bg-gray-50"
                        } ${isCurrentDay ? "bg-blue-50" : ""}`}
                        onClick={() => handleDayClick(day)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm ${
                              isCurrentMonth ? "text-gray-900" : "text-gray-400"
                            } ${isCurrentDay ? "font-bold text-blue-600" : ""}`}
                          >
                            {format(day, "d")}
                          </span>
                          {isCurrentDay && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                          {dayEvents.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {dayEvents.length}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate cursor-pointer hover:bg-blue-200"
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Time slot lines */}
                        <div className="mt-2 space-y-px">
                          {Array.from({ length: 8 }, (_, i) => (
                            <div key={i} className="h-px bg-gray-100"></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {view === "week" && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Week of {format(startOfWeek(currentDate), "MMM d")} -{" "}
                    {format(endOfWeek(currentDate), "MMM d, yyyy")}
                  </h3>
                </div>

                <div className="grid grid-cols-8 gap-1 bg-gray-200 p-1 rounded-lg">
                  {/* Time column header */}
                  <div className="p-2 bg-gray-50 rounded text-xs font-medium text-gray-500 text-center">
                    Time
                  </div>

                  {/* Day headers */}
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate),
                    end: endOfWeek(currentDate),
                  }).map((day) => (
                    <div
                      key={day.toISOString()}
                      className="p-2 bg-gray-50 rounded text-center"
                    >
                      <div className="text-xs font-medium text-gray-500">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={`text-lg font-semibold ${isToday(day) ? "text-blue-600" : "text-gray-900"}`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}

                  {/* Time slots */}
                  {Array.from({ length: 24 }, (_, hour) => (
                    <React.Fragment key={`time-${hour}`}>
                      <div className="p-1 bg-gray-50 text-xs text-gray-500 text-right pr-2 border-r border-gray-200">
                        {format(new Date().setHours(hour, 0, 0, 0), "h a")}
                      </div>
                      {eachDayOfInterval({
                        start: startOfWeek(currentDate),
                        end: endOfWeek(currentDate),
                      }).map((day) => {
                        const dayEvents = getEventsForDay(day);
                        const hourEvents = dayEvents.filter(
                          (event) => event.start.getHours() === hour,
                        );

                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className="p-1 bg-white min-h-[60px] relative border-r border-gray-200"
                          >
                            {hourEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`absolute left-1 right-1 p-2 rounded text-xs cursor-pointer ${
                                  event.calendarColor || "bg-blue-500"
                                } text-white shadow-sm hover:shadow-md transition-shadow`}
                                style={{
                                  top: `${(event.start.getMinutes() / 60) * 60}px`,
                                  height: `${Math.max(30, ((event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60)) * 60)}px`,
                                }}
                                title={event.title}
                              >
                                <div className="font-medium truncate">
                                  {event.title}
                                </div>
                                <div className="text-xs opacity-90">
                                  {format(event.start, "h:mm a")} -{" "}
                                  {format(event.end, "h:mm a")}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {view === "day" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackToMonth}
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Calendar
                    </Button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {format(currentDate, "EEEE, MMMM d, yyyy")}
                    </h3>
                  </div>
                  <Button
                    onClick={() => setShowAppointmentForm(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </div>

                <div className="space-y-2">
                  {(() => {
                    const dayEvents = getEventsForDay(currentDate);
                    if (dayEvents.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No events scheduled for today</p>
                        </div>
                      );
                    }

                    return dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {event.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {format(event.start, "h:mm a")} -{" "}
                              {format(event.end, "h:mm a")}
                            </p>
                            {event.location && (
                              <p className="text-sm text-gray-500 mt-1">
                                📍 {event.location}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: event.calendarColor }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-56 bg-white border-l border-gray-200 p-4">
          <div className="space-y-4">
            {/* Calendar List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Calendars
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCalendars()}
                  className="text-xs h-6"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-1">
                {calendars.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No calendars found
                  </div>
                ) : (
                  calendars.map((calendar) => (
                    <div
                      key={calendar.id}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleCalendar(calendar.id)}
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        <Checkbox
                          checked={calendar.isSelected}
                          onCheckedChange={() => toggleCalendar(calendar.id)}
                          className="h-4 w-4"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      ></div>
                      <span className="text-xs text-gray-700 flex-1 truncate">
                        {calendar.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {
                          events.filter((e) => e.calendarId === calendar.id)
                            .length
                        }
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Upcoming Events
              </h3>
              <div className="space-y-2">
                {upcomingEvents.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No upcoming events
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start space-x-2">
                        <div
                          className="w-1 h-1 rounded-full mt-1"
                          style={{ backgroundColor: event.calendarColor }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {format(event.start, "MMM d, h:mm a")}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-2 w-2 mr-1" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Form Sidebar */}
      {showAppointmentForm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">New Appointment</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAppointmentForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <AppointmentForm
                  orgId={orgId}
                  clients={clients}
                  onSuccess={handleAppointmentCreated}
                  onCancel={() => setShowAppointmentForm(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
