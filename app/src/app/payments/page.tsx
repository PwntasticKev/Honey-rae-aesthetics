"use client";

import { useState, useEffect } from "react";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import {
  Menu,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Refund,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  clientName: string;
  appointmentTitle?: string;
  createdAt: string;
  paymentMethod?: string;
  refundAmount?: number;
}

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTransactions([
        {
          id: "pi_1234567890",
          amount: 15000,
          currency: "usd",
          status: "succeeded",
          clientName: "Sarah Johnson",
          appointmentTitle: "Facial Treatment",
          createdAt: "2025-10-14T10:30:00Z",
          paymentMethod: "card",
        },
        {
          id: "pi_0987654321",
          amount: 8500,
          currency: "usd",
          status: "pending",
          clientName: "Michael Chen",
          appointmentTitle: "Consultation",
          createdAt: "2025-10-14T09:15:00Z",
          paymentMethod: "card",
        },
        {
          id: "pi_1122334455",
          amount: 25000,
          currency: "usd",
          status: "succeeded",
          clientName: "Emma Williams",
          appointmentTitle: "Botox Treatment",
          createdAt: "2025-10-13T14:20:00Z",
          paymentMethod: "card",
        },
        {
          id: "pi_5566778899",
          amount: 12000,
          currency: "usd",
          status: "refunded",
          clientName: "David Brown",
          appointmentTitle: "Laser Treatment",
          createdAt: "2025-10-12T11:45:00Z",
          paymentMethod: "card",
          refundAmount: 12000,
        },
        {
          id: "pi_9988776655",
          amount: 5000,
          currency: "usd",
          status: "failed",
          clientName: "Lisa Anderson",
          appointmentTitle: "Consultation",
          createdAt: "2025-10-11T16:30:00Z",
          paymentMethod: "card",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.appointmentTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalRevenue = transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalRefunds = transactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + (t.refundAmount || t.amount), 0);
  
  const pendingPayments = transactions.filter(t => t.status === 'pending').length;
  const failedPayments = transactions.filter(t => t.status === 'failed').length;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <Refund className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded";
    switch (status) {
      case 'succeeded':
        return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>
          {getStatusIcon(status)} Succeeded
        </Badge>;
      case 'pending':
        return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          {getStatusIcon(status)} Pending
        </Badge>;
      case 'failed':
        return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>
          {getStatusIcon(status)} Failed
        </Badge>;
      case 'refunded':
        return <Badge className={`${baseClasses} bg-orange-100 text-orange-800`}>
          {getStatusIcon(status)} Refunded
        </Badge>;
      default:
        return <Badge className={`${baseClasses} bg-gray-100 text-gray-800`}>
          {getStatusIcon(status)} Unknown
        </Badge>;
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-white">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col lg:ml-48">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between pl-0 pr-6 h-16">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Payments</h1>
                  <p className="text-sm text-gray-600">Manage transactions and billing</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Payment
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 section-padding">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <p className="text-xs text-green-600">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Refunds
                  </CardTitle>
                  <Refund className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {formatCurrency(totalRefunds)}
                  </div>
                  <p className="text-xs text-orange-600">
                    {((totalRefunds / totalRevenue) * 100).toFixed(1)}% of revenue
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Pending Payments
                  </CardTitle>
                  <Clock className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {pendingPayments}
                  </div>
                  <p className="text-xs text-yellow-600">
                    Awaiting processing
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Failed Payments
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-black">
                    {failedPayments}
                  </div>
                  <p className="text-xs text-red-600">
                    Require attention
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="succeeded">Succeeded</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <Button variant="outline" className="border-gray-300">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" className="border-gray-300">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transactions found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex-center h-32">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                            Transaction
                          </th>
                          <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                            Client
                          </th>
                          <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                            Amount
                          </th>
                          <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                            Status
                          </th>
                          <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                            Date
                          </th>
                          <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 border-b border-gray-100">
                              <div>
                                <div className="font-medium text-black">
                                  {transaction.appointmentTitle || "Direct Payment"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {transaction.id}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-100">
                              <div className="font-medium text-black">
                                {transaction.clientName}
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-100">
                              <div className="font-medium text-black">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </div>
                              {transaction.refundAmount && (
                                <div className="text-sm text-orange-600">
                                  Refunded: {formatCurrency(transaction.refundAmount, transaction.currency)}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-100">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="px-4 py-3 border-b border-gray-100">
                              <div className="text-sm text-gray-900">
                                {formatDate(transaction.createdAt)}
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b border-gray-100">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-300"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {transaction.status === 'succeeded' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-orange-600 hover:bg-orange-50"
                                  >
                                    <Refund className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredTransactions.length === 0 && (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No transactions found</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}