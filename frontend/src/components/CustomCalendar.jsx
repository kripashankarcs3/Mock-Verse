import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CustomCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2021, 3, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2021, 3, 5));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const grid = [];
    for (let i = startingDay - 1; i >= 0; i--) grid.push({ val: daysInPrevMonth - i, currentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) grid.push({ val: i, currentMonth: true });
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) grid.push({ val: i, currentMonth: false });
    return grid;
  }, [year, month]);

  const isSelected = (day, isCurrentMonth) =>
    isCurrentMonth &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  return (
    <div className="p-3 rounded-2xl shadow-xl w-full max-w-[280px] border border-gray-200 bg-white text-slate-900 dark:bg-[#24303F] dark:text-slate-100 dark:border-[#313D4A]">

      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-gray-100 rounded-full text-slate-400"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex gap-1">
          <div className="px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-slate-800 font-bold text-[10px] dark:bg-[#1A222C] dark:border-[#313D4A] dark:text-slate-100">
            {monthNames[month]} <ChevronDown size={8} className="inline text-blue-500" />
          </div>
          <div className="px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-slate-800 font-bold text-[10px] dark:bg-[#1A222C] dark:border-[#313D4A] dark:text-slate-100">
            {year} <ChevronDown size={8} className="inline text-blue-500" />
          </div>
        </div>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-gray-100 rounded-full text-slate-400"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <div key={day} className="text-center text-[9px] font-bold text-slate-400 dark:text-slate-300 py-0.5 uppercase">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {calendarGrid.map((day, i) => (
          <div
            key={i}
            onClick={() => day.currentMonth && setSelectedDate(new Date(year, month, day.val))}
            className={`h-6 w-full flex items-center justify-center rounded-md text-[10px] font-bold cursor-pointer transition-all ${
              isSelected(day.val, day.currentMonth)
                ? "bg-blue-600 text-white shadow-md"
                : !day.currentMonth
                ? "text-slate-200 dark:text-slate-600"
                : "text-slate-700 hover:bg-gray-50 dark:hover:bg-[#313D4A] dark:text-slate-300"
            }`}
          >
            {day.val}
          </div>
        ))}
      </div>
    </div>
  );
}
