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
} from "date-fns";
import {
  googleCalendarService,
  type GoogleCalendarEvent,
  type GoogleCalendar,
} from "@/lib/googleCalendarService";

export function GoogleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"day" | "week" | "month" | "all">("month");

  // Initialize Google Calendar service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await googleCalendarService.initialize();
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

  // Load events when calendars or date changes
  useEffect(() => {
    if (isAuthenticated && calendars.length > 0) {
      loadEvents();
    }
  }, [currentDate, calendars]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const success = await googleCalendarService.authenticate();
      if (success) {
        setIsAuthenticated(true);
        await loadCalendars();
        await loadEvents();
      }
    } catch (error) {
      console.error("Google login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = () => {
    googleCalendarService.logout();
    setIsAuthenticated(false);
    setCalendars([]);
    setEvents([]);
  };

  const loadCalendars = async () => {
    try {
      const calendars = await googleCalendarService.getCalendars();
      setCalendars(calendars);
    } catch (error) {
      console.error("Failed to load calendars:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const timeMin = startOfMonth(currentDate);
      const timeMax = endOfMonth(currentDate);
      const allEvents: GoogleCalendarEvent[] = [];

      for (const calendar of calendars) {
        if (calendar.isSelected) {
          const calendarEvents = await googleCalendarService.getEvents(
            calendar.id,
            timeMin,
            timeMax,
          );
          allEvents.push(...calendarEvents);
        }
      }

      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    setCalendars((prev) =>
      prev.map((cal) =>
        cal.id === calendarId ? { ...cal, isSelected: !cal.isSelected } : cal,
      ),
    );
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const calendarSelected = calendars.find(
      (cal) => cal.id === event.calendarId,
    )?.isSelected;
    return matchesSearch && calendarSelected;
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter((event) => isSameDay(event.start, date));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1),
    );
  };

  // Show loading state while initializing
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

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Connect Google Calendar
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Sync your appointments and manage your schedule seamlessly
            </p>
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
              onClick={() => setCurrentDate(new Date())}
              size="sm"
            >
              Today
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

          {/* Month View */}
          <div className="bg-white rounded-lg border shadow-sm">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-gray-50 p-3 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth =
                  day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[120px] bg-white p-2 hover:bg-gray-50 transition-colors ${
                      !isCurrentMonth ? "bg-gray-50" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday(day)
                          ? "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          : isCurrentMonth
                            ? "text-gray-900"
                            : "text-gray-400"
                      }`}
                    >
                      {format(day, "d")}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded cursor-pointer truncate hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: event.calendarColor + "20",
                            color: event.calendarColor,
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          {/* Mini Calendar */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {format(currentDate, "MMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div key={day} className="text-center text-gray-500 p-1">
                    {day}
                  </div>
                ))}
                {monthDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`text-center p-1 cursor-pointer rounded hover:bg-gray-100 transition-colors ${
                      isToday(day)
                        ? "bg-blue-600 text-white"
                        : day.getMonth() === currentDate.getMonth()
                          ? "text-gray-900"
                          : "text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calendar Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Calendars</h3>
              <Badge variant="secondary" className="text-xs">
                {calendars.filter((cal) => cal.isSelected).length} active
              </Badge>
            </div>

            <div className="space-y-3">
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={calendar.isSelected}
                    onCheckedChange={() => toggleCalendar(calendar.id)}
                  />
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {calendar.name}
                  </span>
                </div>
              ))}
            </div>

            {calendars.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No calendars found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
