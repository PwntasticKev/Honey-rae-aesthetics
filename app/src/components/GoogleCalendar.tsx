"use client";

import { useState, useEffect } from "react";
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
} from "date-fns";
import {
  googleCalendarService,
  type GoogleCalendarEvent,
  type GoogleCalendar,
} from "@/lib/googleCalendarService";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function GoogleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"day" | "week" | "month" | "all">("month");
  const [apiKeysConfigured, setApiKeysConfigured] = useState(true);

  // Convex mutations
  const saveProvider = useMutation(api.googleCalendarProviders.saveProvider);
  const disconnectProvider = useMutation(
    api.googleCalendarProviders.disconnect,
  );

  // Initialize Google Calendar service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await googleCalendarService.initialize();

        // Check if API keys are configured
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
          setApiKeysConfigured(false);
          setIsInitializing(false);
          return;
        }

        const authenticated = await googleCalendarService.isAuthenticated();
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

  // Reload events when calendar selection changes
  useEffect(() => {
    if (isAuthenticated && calendars.length > 0) {
      loadEvents();
    }
  }, [calendars.map((cal) => cal.isSelected).join(",")]); // This will trigger when any calendar selection changes

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await googleCalendarService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        console.log("✅ Authentication successful, loading calendars...");

        // Load calendars first
        await loadCalendars();

        // Wait a moment for state to update, then load events
        setTimeout(async () => {
          console.log("📋 Calendars loaded, now loading events...");
          await loadEvents();
        }, 100);

        // Save the first calendar to the database
        if (calendars.length > 0) {
          const primaryCalendar = calendars[0];
          const accessToken = localStorage.getItem(
            "google_calendar_access_token",
          );

          if (accessToken) {
            try {
              await saveProvider({
                orgId: "demo-org-id" as any, // TODO: Get from context
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
    googleCalendarService.logout();
    setIsAuthenticated(false);
    setEvents([]);
    setCalendars([]);

    // TODO: Disconnect from database when we have the provider ID
    // For now, just log that we're logged out
    console.log("✅ Google Calendar logged out");
  };

  const loadCalendars = async () => {
    try {
      console.log("📋 Loading calendars...");
      const calendarList = await googleCalendarService.getCalendars();
      console.log("📋 Calendars loaded:", calendarList.length);
      console.log(
        "📋 Calendar details:",
        calendarList.map((cal) => ({
          id: cal.id,
          name: cal.name,
          isSelected: cal.isSelected,
        })),
      );
      setCalendars(calendarList);
    } catch (error) {
      console.error("Failed to load calendars:", error);
    }
  };

  const loadEvents = async () => {
    try {
      setIsLoadingEvents(true);
      console.log("🔄 Loading events...");
      console.log("📅 Current date:", currentDate);
      console.log("📊 View:", view);
      console.log("📋 Calendars:", calendars.length);
      console.log("✅ Authenticated:", isAuthenticated);
      console.log(
        "📋 Selected calendars:",
        calendars.filter((cal) => cal.isSelected).map((cal) => cal.name),
      );

      if (!isAuthenticated || calendars.length === 0) {
        console.log("❌ Not authenticated or no calendars");
        return;
      }

      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      console.log("📅 Date range:", startDate, "to", endDate);

      // Use the new method to get events from multiple calendars
      const allEvents =
        await googleCalendarService.getEventsFromMultipleCalendars(
          calendars,
          startDate,
          endDate,
        );

      console.log("📅 Loaded events:", allEvents.length);
      console.log(
        "📅 Event details:",
        allEvents.map((event) => ({
          title: event.title,
          start: event.start,
          end: event.end,
          calendarName: event.calendarName,
        })),
      );
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
    console.log(
      `📅 Events for ${format(date, "yyyy-MM-dd")}:`,
      dayEvents.length,
      dayEvents.map((e) => e.title),
    );
    return dayEvents;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1),
    );
  };

  // Generate calendar days for current month
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

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

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Required Environment Variables:
              </h4>
              <div className="space-y-1 text-xs font-mono">
                <div>NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id</div>
                <div>NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key</div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p className="mb-2">To get these keys:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a new project or select existing</li>
                <li>Enable Google Calendar API</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>Add the keys to your .env.local file</li>
              </ol>
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
                  // In day view, also refresh events for today
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
            <Button
              variant="outline"
              onClick={() => {
                console.log("🔍 Debug: Current state");
                console.log("Events:", events.length);
                console.log("Calendars:", calendars);
                console.log("Authenticated:", isAuthenticated);
                loadEvents();
              }}
              size="sm"
              className="text-xs"
            >
              Debug
            </Button>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                onClick={() => navigateMonth("prev")}
                size="sm"
                data-testid="prev-month"
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
                data-testid="next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleGoogleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Calendar */}
        <div className="flex-1 p-6">
          {/* Search Bar */}
          <div className="mb-6">
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
                        className={`min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 ${
                          isCurrentMonth ? "bg-white" : "bg-gray-50"
                        } ${isCurrentDay ? "bg-blue-50" : ""}`}
                        onClick={() => {
                          setCurrentDate(day);
                          setView("day");
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-sm ${
                              isCurrentMonth ? "text-gray-900" : "text-gray-400"
                            } ${isCurrentDay ? "font-bold" : ""}`}
                          >
                            {format(day, "d")}
                          </span>
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

                <div className="grid grid-cols-7 gap-4">
                  {eachDayOfInterval({
                    start: startOfWeek(currentDate),
                    end: endOfWeek(currentDate),
                  }).map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentDay = isToday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`p-3 border rounded-lg ${
                          isCurrentDay
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="mb-2">
                          <div
                            className={`text-sm font-medium ${
                              isCurrentDay ? "text-blue-900" : "text-gray-900"
                            }`}
                          >
                            {format(day, "EEE")}
                          </div>
                          <div
                            className={`text-lg ${
                              isCurrentDay
                                ? "text-blue-900 font-bold"
                                : "text-gray-700"
                            }`}
                          >
                            {format(day, "d")}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate cursor-pointer hover:bg-blue-200"
                              title={event.title}
                            >
                              {format(event.start, "h:mm")} {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "day" && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {format(currentDate, "EEEE, MMMM d, yyyy")}
                  </h3>
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
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Calendar List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Calendars
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCalendars()}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="space-y-2">
                {calendars.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No calendars found
                  </div>
                ) : (
                  calendars.map((calendar) => (
                    <div
                      key={calendar.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        checked={calendar.isSelected}
                        onCheckedChange={() => toggleCalendar(calendar.id)}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: calendar.color }}
                      ></div>
                      <span className="text-sm text-gray-700 flex-1 truncate">
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {events
                  .filter((event) => event.start > new Date())
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-2 h-2 rounded-full mt-2"
                          style={{
                            backgroundColor: event.calendarColor,
                          }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {format(event.start, "MMM d, h:mm a")}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
