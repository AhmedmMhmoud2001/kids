import { ShoppingCart, Users, DollarSign, TrendingUp, Package, Eye, ArrowUpRight, ArrowDownRight, ShoppingBag, Star } from 'lucide-react';

const StatCard = ({ title, value, change, changeType, icon: Icon, trend, color = '#5DA5F9' }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        <div className="mt-3 flex items-center gap-1.5">
          {changeType === 'positive' ? (
            <ArrowUpRight className="w-4 h-4" style={{ color }} />
          ) : (
            <ArrowDownRight className="w-4 h-4" style={{ color: '#FF6B91' }} />
          )}
          <span className="text-sm font-semibold" style={{ color: changeType === 'positive' ? color : '#FF6B91' }}>
            {change}
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      </div>
      <div className="p-4 rounded-2xl" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
    </div>
    <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${trend}%`, backgroundColor: color }} />
    </div>
  </div>
);

const Dashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: '$12,450', change: '+12.5%', changeType: 'positive', icon: DollarSign, trend: 75, color: '#5DA5F9' },
    { title: 'Total Orders', value: '156', change: '+8.2%', changeType: 'positive', icon: ShoppingCart, trend: 60, color: '#34D399' },
    { title: 'Active Customers', value: '2,340', change: '+3.1%', changeType: 'positive', icon: Users, trend: 45, color: '#FF6B91' },
    { title: 'Conversion Rate', value: '3.2%', change: '-2.4%', changeType: 'negative', icon: TrendingUp, trend: 30, color: '#FBBF24' },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'John Doe', amount: '$125.00', status: 'Processing', date: 'Today, 10:30 AM' },
    { id: '#ORD-002', customer: 'Jane Smith', amount: '$89.99', status: 'Shipped', date: 'Today, 09:15 AM' },
    { id: '#ORD-003', customer: 'Mike Johnson', amount: '$234.50', status: 'Delivered', date: 'Yesterday' },
    { id: '#ORD-004', customer: 'Sarah Wilson', amount: '$67.00', status: 'Processing', date: 'Yesterday' },
    { id: '#ORD-005', customer: 'Emma Davis', amount: '$156.00', status: 'Delivered', date: 'Yesterday' },
  ];

  const topProducts = [
    { name: 'Kids Summer Dress', sales: 45, revenue: '$2,250', trend: 'up' },
    { name: 'Baby Cotton Onesie', sales: 38, revenue: '$1,140', trend: 'up' },
    { name: 'Children Sneakers', sales: 32, revenue: '$1,920', trend: 'down' },
    { name: 'Kids Backpack', sales: 28, revenue: '$840', trend: 'up' },
  ];

  const statusColors = {
    Processing: { bg: 'rgba(93, 165, 249, 0.15)', text: '#5DA5F9' },
    Shipped: { bg: 'rgba(251, 191, 36, 0.15)', text: '#FBBF24' },
    Delivered: { bg: 'rgba(52, 211, 153, 0.15)', text: '#34D399' },
  };

  return (
    <div className="p-4 lg:p-8 bg-[#F9FAFB] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Hero/Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Orders - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-500">Latest customer orders</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-[#5DA5F9] bg-[#5DA5F9]/10 rounded-lg hover:bg-[#5DA5F9]/20 transition-colors">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{order.customer}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-gray-900">{order.amount}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: statusColors[order.status].bg, color: statusColors[order.status].text }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products - 1 column */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
              <p className="text-sm text-gray-500">Best selling items</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5DA5F9]/20 to-[#FF6B91]/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{product.revenue}</p>
                  <div className="flex items-center justify-end gap-1">
                    {product.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Inventory & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Overview</h3>
            <p className="text-sm text-gray-500">Stock status summary</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-100">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">In Stock</p>
                  <p className="text-xs text-gray-500">Products available</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">245</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 border border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-yellow-100">
                  <Eye className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Low Stock</p>
                  <p className="text-xs text-gray-500">Need restocking</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">18</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-100">
                  <ShoppingBag className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Out of Stock</p>
                  <p className="text-xs text-gray-500">Unavailable</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600">5</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">Frequently used actions</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#5DA5F9] hover:bg-[#5DA5F9]/5 transition-all group">
                <div className="p-3 rounded-xl bg-[#5DA5F9]/10 group-hover:bg-[#5DA5F9]/20 transition-colors">
                  <Package className="w-6 h-6 text-[#5DA5F9]" />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-700">Add Product</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FF6B91] hover:bg-[#FF6B91]/5 transition-all group">
                <div className="p-3 rounded-xl bg-[#FF6B91]/10 group-hover:bg-[#FF6B91]/20 transition-colors">
                  <ShoppingCart className="w-6 h-6 text-[#FF6B91]" />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-700">New Order</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#34D399] hover:bg-[#34D399]/5 transition-all group">
                <div className="p-3 rounded-xl bg-[#34D399]/10 group-hover:bg-[#34D399]/20 transition-colors">
                  <Users className="w-6 h-6 text-[#34D399]" />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-700">Add Customer</span>
              </button>
              <button className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FBBF24] hover:bg-[#FBBF24]/5 transition-all group">
                <div className="p-3 rounded-xl bg-[#FBBF24]/10 group-hover:bg-[#FBBF24]/20 transition-colors">
                  <Star className="w-6 h-6 text-[#FBBF24]" />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-700">Add Review</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;