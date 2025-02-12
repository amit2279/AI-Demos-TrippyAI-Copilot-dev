import React from 'react';
import { DollarSign, ShoppingBag, Utensils, Bus, Ticket, Shield } from 'lucide-react';
import { BudgetSummary } from '../../types/itinerary';

interface BudgetBreakdownProps {
  summary: BudgetSummary;
}

export function BudgetBreakdown({ summary }: BudgetBreakdownProps) {
  const categories = [
    {
      name: 'Attractions',
      amount: summary.categoryBreakdown.attractions,
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Food & Dining',
      amount: summary.categoryBreakdown.foodAndDining,
      icon: Utensils,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Transportation',
      amount: summary.categoryBreakdown.transportation,
      icon: Bus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Shopping & Misc',
      amount: summary.categoryBreakdown.shoppingAndMisc,
      icon: ShoppingBag,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      name: 'Buffer',
      amount: summary.categoryBreakdown.buffer,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Total Budget */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <DollarSign size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-600">Total Budget</p>
            <p className="text-xl font-bold text-green-700">
              {summary.totalEstimatedBudget}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-4">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <div
              key={category.name}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                  <Icon size={20} className={category.color} />
                </div>
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <span className="font-semibold text-gray-900">{category.amount}</span>
            </div>
          );
        })}
      </div>

      {/* Budget Note */}
      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <p>
          This budget is an estimate based on average costs. Actual expenses may vary
          depending on your choices and local conditions.
        </p>
      </div>
    </div>
  );
}